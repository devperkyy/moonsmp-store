import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl } from "@/lib/discord";
import { OAUTH_STATE_COOKIE, signState } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
    return NextResponse.json({ error: "Discord sign-in is not configured." }, { status: 503 });
  }

  // Only same-site paths are allowed back, so ?next= can't be used as an open
  // redirect into someone else's domain.
  const raw = req.nextUrl.searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const nonce = crypto.randomUUID();
  const state = await signState(`${nonce}|${next}`);

  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
