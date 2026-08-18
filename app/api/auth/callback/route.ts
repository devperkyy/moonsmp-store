import { NextResponse, type NextRequest } from "next/server";
import { avatarUrl, exchangeCode, fetchSelf } from "@/lib/discord";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifyState,
} from "@/lib/session";

export const dynamic = "force-dynamic";

function fail(req: NextRequest, reason: string) {
  return NextResponse.redirect(new URL(`/?error=${reason}`, req.nextUrl.origin));
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) return fail(req, "missing_code");

  // The state must both verify against our secret and match the cookie we
  // set, which is what makes the login leg CSRF-proof.
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) return fail(req, "bad_state");

  const payload = await verifyState(state);
  if (!payload) return fail(req, "bad_state");
  const next = payload.split("|")[1] ?? "/";

  const accessToken = await exchangeCode(code);
  if (!accessToken) return fail(req, "exchange_failed");

  const user = await fetchSelf(accessToken);
  if (!user) return fail(req, "profile_failed");

  // Platform/ToS are chosen in a later onboarding step (SignInGate step 3,
  // via /api/auth/complete) — not known yet at this point.
  const token = await signSession({
    discordId: user.id,
    discordUsername: user.global_name || user.username,
    discordAvatar: avatarUrl(user),
    email: user.email ?? null,
    platform: null,
    tosAcceptedAt: null,
  });

  const res = NextResponse.redirect(new URL(next, req.nextUrl.origin));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
