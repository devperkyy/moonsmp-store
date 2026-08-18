import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl, discordAuthConfigured } from "@/lib/discord";
import { OAUTH_STATE_COOKIE, signState } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!discordAuthConfigured()) {
    return NextResponse.json({ error: "Discord OAuth is not configured" }, { status: 503 });
  }
  const rawNext = request.nextUrl.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const state = await signState(`${crypto.randomUUID()}|${next}`);
  const response = NextResponse.redirect(authorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
