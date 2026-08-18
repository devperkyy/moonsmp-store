const API = "https://discord.com/api/v10";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function redirectUri(): string {
  return `${siteUrl().replace(/\/$/, "")}/api/auth/callback`;
}

/**
 * What we ask the buyer to approve on Discord's consent screen. Deliberately
 * narrower than support.moonsmp.org's scopes — the store has no staff-only
 * area, so no guild/role scopes are requested (a shorter consent screen is
 * also just better for checkout conversion):
 *   identify — user ID, username, avatar. Ties the session to the `links`
 *              row Moon Handler wrote when they ran /link, so we know their
 *              Minecraft account.
 *   email    — used only to prefill Stripe's customer_email at checkout.
 */
export const OAUTH_SCOPES = ["identify", "email"] as const;

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: OAUTH_SCOPES.join(" "),
    state,
    // "consent" forces the authorize screen every time, so the buyer always
    // sees and approves what they're handing over.
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<string | null> {
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID ?? "",
      client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  /** Present only because we ask for the `email` scope. */
  email: string | null;
};

export async function fetchSelf(accessToken: string): Promise<DiscordUser | null> {
  const res = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as DiscordUser;
}

export function avatarUrl(user: { id: string; avatar: string | null }): string {
  if (!user.avatar) {
    const index = (BigInt(user.id) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embeds/avatars/${index}.png`;
  }
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=64`;
}
