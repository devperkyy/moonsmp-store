import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getLinkByDiscord, issueLinkCode, linkingConfigured } from "@/lib/moonlink";

export const dynamic = "force-dynamic";

/** Polled by LinkStep while the buyer runs the command in-game. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const link = await getLinkByDiscord(session.discordId);
  return NextResponse.json({ configured: linkingConfigured(), link });
}

/** Issues a fresh 7-digit code into Moon Handler's link_codes table. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (await getLinkByDiscord(session.discordId)) {
    return NextResponse.json({ error: "already_linked" }, { status: 409 });
  }

  const issued = await issueLinkCode(session.discordId);
  if (!issued) {
    return NextResponse.json({ error: "linking_unavailable" }, { status: 503 });
  }
  return NextResponse.json(issued);
}
