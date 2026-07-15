import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Resolves a player's raw skin texture URL (textures.minecraft.net) so the
// client can crop the head itself — no third-party avatar service, which
// kept serving stale/default heads.
//   java:    Mojang name → uuid → session profile → SKIN url
//   bedrock: GeyserMC gamertag → xuid → texture_id → textures url

const cache = new Map<string, { url: string | null; exp: number }>();
const TTL_MS = 60 * 60 * 1000;

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function resolveJava(name: string): Promise<string | null> {
  const profile = await getJson(
    `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`
  );
  if (!profile?.id) return null;
  const session = await getJson(
    `https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`
  );
  const prop = session?.properties?.find((p: { name: string }) => p.name === "textures");
  if (!prop?.value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(prop.value, "base64").toString("utf8"));
    const url: string | undefined = decoded?.textures?.SKIN?.url;
    return url ? url.replace(/^http:/, "https:") : null;
  } catch {
    return null;
  }
}

async function resolveBedrock(gamertag: string): Promise<string | null> {
  const xbox = await getJson(
    `https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(gamertag)}`
  );
  if (!xbox?.xuid) return null;
  const skin = await getJson(`https://api.geysermc.org/v2/skin/${xbox.xuid}`);
  if (!skin?.texture_id) return null;
  return `https://textures.minecraft.net/texture/${skin.texture_id}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") ?? "").trim().replace(/^\./, "");
  const platform = searchParams.get("platform") === "bedrock" ? "bedrock" : "java";

  if (!/^[A-Za-z0-9_ ]{1,16}$/.test(username)) {
    return NextResponse.json({ skinUrl: null });
  }

  const key = `${platform}:${username.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) {
    return NextResponse.json({ skinUrl: hit.url });
  }

  const url = platform === "java" ? await resolveJava(username) : await resolveBedrock(username);
  cache.set(key, { url, exp: Date.now() + TTL_MS });
  return NextResponse.json({ skinUrl: url });
}
