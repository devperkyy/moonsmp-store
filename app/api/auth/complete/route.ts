import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getSession,
  signSession,
} from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Final onboarding step (SignInGate step 3): records the buyer's chosen
 * platform and ToS acceptance onto their existing, already-verified session.
 * Everything except `platform` is carried forward from the current session —
 * never re-accepted from the request body — and tosAcceptedAt is always a
 * server clock read, never a client-supplied timestamp.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const platform = body?.platform;
  if (platform !== "java" && platform !== "bedrock") {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 });
  }

  const token = await signSession({
    discordId: session.discordId,
    discordUsername: session.discordUsername,
    discordAvatar: session.discordAvatar,
    email: session.email,
    platform,
    tosAcceptedAt: Date.now(),
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
