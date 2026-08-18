import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getLinkByDiscord, issueLinkCode, linkingConfigured } from "@/lib/moonlink";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    return NextResponse.json({ configured: linkingConfigured(), link: await getLinkByDiscord(session.discordId) });
  } catch {
    return NextResponse.json({ error: "linking_unavailable" }, { status: 503 });
  }
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    if (await getLinkByDiscord(session.discordId)) {
      return NextResponse.json({ error: "already_linked" }, { status: 409 });
    }
    const issued = await issueLinkCode(session.discordId);
    return issued
      ? NextResponse.json(issued)
      : NextResponse.json({ error: "linking_unavailable" }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "linking_unavailable" }, { status: 503 });
  }
}
