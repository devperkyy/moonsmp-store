const API = "https://discord.com/api/v10";

export function discordAuthConfigured() {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.SESSION_SECRET);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function redirectUri() {
  return `${siteUrl()}/api/auth/callback`;
}

export function authorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "identify email",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export async function exchangeCode(code: string) {
  const response = await fetch(`${API}/oauth2/token`, {
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
  if (!response.ok) return null;
  return ((await response.json()) as { access_token?: string }).access_token ?? null;
}

export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email: string | null;
};

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  const response = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return response.ok ? ((await response.json()) as DiscordUser) : null;
}

export function discordAvatarUrl(user: DiscordUser) {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}
