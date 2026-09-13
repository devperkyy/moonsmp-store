import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const key = process.env.PLUGIN_API_KEY;
  return !!key && req.headers.get("authorization") === `Bearer ${key}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const claimToken = typeof body?.claimToken === "string" ? body.claimToken : "";
  const serverId = typeof body?.serverId === "string" ? body.serverId.trim().toLowerCase() : "";
  const outcome = body?.outcome;
  const response = typeof body?.response === "string" ? body.response.slice(0, 1000) : null;
  if (!id || !claimToken || !serverId || !["delivered", "failed", "released"].includes(outcome)) {
    return NextResponse.json({ error: "invalid_result" }, { status: 400 });
  }

  if (outcome === "released") {
    const released = await prisma.delivery.updateMany({
      where: { id, status: "processing", claimToken, claimedBy: serverId },
      data: { status: "pending", claimedAt: null, claimedBy: null, claimToken: null, lastError: null },
    });
    return NextResponse.json({ accepted: released.count === 1 });
  }

  const existing = await prisma.delivery.findUnique({ where: { id } });
  if (existing?.status === "delivered" && existing.claimToken === claimToken && outcome === "delivered") {
    return NextResponse.json({ accepted: true, duplicate: true });
  }

  const success = outcome === "delivered";
  const updated = await prisma.delivery.updateMany({
    where: { id, status: "processing", claimToken, claimedBy: serverId },
    data: {
      status: success ? "delivered" : "failed",
      executedAt: new Date(),
      lastError: success ? null : response ?? "Unknown command error",
    },
  });
  if (updated.count === 1) {
    await prisma.deliveryAttempt.create({ data: { deliveryId: id, success, response } });
  }
  return NextResponse.json({ accepted: updated.count === 1 });
}
