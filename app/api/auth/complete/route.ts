import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  const { platform, acceptedTerms } = (await request.json()) as {
    platform?: string;
    acceptedTerms?: boolean;
  };
  if ((platform !== "java" && platform !== "bedrock") || acceptedTerms !== true) {
    return NextResponse.json({ error: "invalid_onboarding" }, { status: 400 });
  }
  const token = await signSession({
    discordId: session.discordId,
    discordUsername: session.discordUsername,
    discordAvatar: session.discordAvatar,
    email: session.email,
    platform,
    tosAcceptedAt: Date.now(),
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
