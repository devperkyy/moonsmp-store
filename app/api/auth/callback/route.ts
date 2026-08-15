import { NextResponse, type NextRequest } from "next/server";
import { discordAvatarUrl, exchangeCode, fetchDiscordUser } from "@/lib/discord";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifyState,
} from "@/lib/session";

export const dynamic = "force-dynamic";

function fail(request: NextRequest, reason: string) {
  return NextResponse.redirect(new URL(`/?auth_error=${reason}`, request.nextUrl.origin));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) return fail(request, "missing_code");
  if (request.cookies.get(OAUTH_STATE_COOKIE)?.value !== state) return fail(request, "bad_state");
  const payload = await verifyState(state);
  if (!payload) return fail(request, "bad_state");
  const accessToken = await exchangeCode(code);
  if (!accessToken) return fail(request, "exchange_failed");
  const user = await fetchDiscordUser(accessToken);
  if (!user) return fail(request, "profile_failed");

  const token = await signSession({
    discordId: user.id,
    discordUsername: user.global_name || user.username,
    discordAvatar: discordAvatarUrl(user),
    email: user.email ?? null,
    platform: null,
    tosAcceptedAt: null,
  });
  const next = payload.split("|")[1] || "/";
  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
