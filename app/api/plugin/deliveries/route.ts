import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// If the plugin claims a delivery but never reports back (server crash mid-poll),
// the row is re-offered after this window. At-least-once semantics.
const STALE_CLAIM_MS = 5 * 60 * 1000;
const BATCH_SIZE = 10;

function authorized(req: Request): boolean {
  const key = process.env.PLUGIN_API_KEY;
  return !!key && req.headers.get("authorization") === `Bearer ${key}`;
}

// The Paper plugin polls this to claim pending deliveries.
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);
  const claimed = await prisma.$transaction(async (tx) => {
    const rows = await tx.delivery.findMany({
      where: {
        OR: [
          { status: "pending" },
          { status: "processing", claimedAt: { lt: staleBefore } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });
    if (rows.length > 0) {
      await tx.delivery.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { status: "processing", claimedAt: new Date(), attempts: { increment: 1 } },
      });
    }
    return rows;
  });

  return NextResponse.json({
    deliveries: claimed.map((d) => ({ id: d.id, command: d.command })),
  });
}

// The plugin reports execution results here.
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const results: unknown[] = Array.isArray(body?.results) ? body.results : [];

  for (const raw of results) {
    const r = raw as { id?: unknown; success?: unknown; response?: unknown };
    if (typeof r.id !== "string") continue;
    const success = r.success === true;
    const response = typeof r.response === "string" ? r.response.slice(0, 1000) : null;

    await prisma.delivery
      .update({
        where: { id: r.id },
        data: {
          status: success ? "delivered" : "failed",
          executedAt: new Date(),
          lastError: success ? null : response ?? "Unknown error",
          attemptLogs: { create: { success, response } },
        },
      })
      .catch((err) => console.error(`plugin result for unknown delivery ${r.id}:`, err));
  }

  return NextResponse.json({ ok: true });
}
