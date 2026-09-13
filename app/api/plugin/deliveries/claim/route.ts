import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVER_RE = /^[a-z0-9_-]{1,32}$/i;
const STUCK_CLAIM_MS = 10 * 60 * 1000;

function authorized(req: Request): boolean {
  const key = process.env.PLUGIN_API_KEY;
  return !!key && req.headers.get("authorization") === `Bearer ${key}`;
}

type OnlinePlayer = { uuid: string; name: string };

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const serverId = typeof body?.serverId === "string" ? body.serverId.trim().toLowerCase() : "";
  if (!SERVER_RE.test(serverId)) {
    return NextResponse.json({ error: "invalid_server_id" }, { status: 400 });
  }

  const players: OnlinePlayer[] = Array.isArray(body?.players)
    ? body.players
        .slice(0, 500)
        .filter((p: unknown): p is OnlinePlayer => {
          const candidate = p as OnlinePlayer;
          return UUID_RE.test(candidate?.uuid) && typeof candidate?.name === "string" && candidate.name.length <= 32;
        })
        .map((p: OnlinePlayer) => ({ uuid: p.uuid.toLowerCase(), name: p.name }))
    : [];

  await prisma.delivery.updateMany({
    where: {
      status: "processing",
      claimedAt: { lt: new Date(Date.now() - STUCK_CLAIM_MS) },
    },
    data: { status: "needs_review", lastError: "Claim exceeded 10 minutes; automatic replay is disabled." },
  });

  if (players.length === 0) return NextResponse.json({ deliveries: [] });

  const uuids = [...new Set(players.map((p) => p.uuid))];
  const names = [...new Set(players.map((p) => p.name))];
  const candidates = await prisma.delivery.findMany({
    where: {
      status: "pending",
      OR: [
        { order: { playerUuid: { in: uuids } } },
        { order: { playerUuid: null, effectiveUsername: { in: names } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { order: { include: { package: true } } },
  });

  const deliveries = [];
  for (const delivery of candidates) {
    const matchedPlayer = delivery.order.playerUuid
      ? players.find((p) => p.uuid === delivery.order.playerUuid!.toLowerCase())
      : players.find((p) => p.name === delivery.order.effectiveUsername);
    if (!matchedPlayer) continue;

    const claimToken = randomUUID();
    const claimed = await prisma.delivery.updateMany({
      where: { id: delivery.id, status: "pending" },
      data: {
        status: "processing",
        claimedAt: new Date(),
        claimedBy: serverId,
        claimToken,
        attempts: { increment: 1 },
        lastError: null,
      },
    });
    if (claimed.count !== 1) continue;

    if (!delivery.order.playerUuid) {
      console.warn(`Legacy name match for delivery ${delivery.id}: ${delivery.order.effectiveUsername}`);
    }
    deliveries.push({
      id: delivery.id,
      claimToken,
      command: delivery.order.playerUuid
        ? delivery.command.replaceAll(delivery.order.effectiveUsername, matchedPlayer.name)
        : delivery.command,
      playerUuid: delivery.order.playerUuid,
      playerName: delivery.order.effectiveUsername,
      packageName: delivery.order.package.name,
      legacyNameMatch: !delivery.order.playerUuid,
    });
  }

  return NextResponse.json({ deliveries });
}
