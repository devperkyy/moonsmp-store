import type { Platform } from "@/lib/minecraft";

const UUID_RE = /^[0-9a-f]{32}$/i;

function dashedUuid(value: string): string | null {
  const compact = value.replace(/-/g, "").toLowerCase();
  if (!UUID_RE.test(compact)) return null;
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json().catch(() => null);
  } catch {
    return null;
  }
}

async function javaUuid(username: string): Promise<string | null> {
  const data = (await fetchJson(
    `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
  )) as { id?: unknown } | null;
  return typeof data?.id === "string" ? dashedUuid(data.id) : null;
}

async function bedrockUuid(gamertag: string): Promise<string | null> {
  const data = (await fetchJson(
    `https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(gamertag)}`,
  )) as { xuid?: unknown } | null;
  const raw = typeof data?.xuid === "number" ? String(data.xuid) : data?.xuid;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;
  try {
    const hex = BigInt(raw).toString(16).padStart(16, "0");
    if (hex.length > 16) return null;
    return `00000000-0000-0000-${hex.slice(0, 4)}-${hex.slice(4)}`;
  } catch {
    return null;
  }
}

export async function resolvePlayerUuid(
  username: string,
  platform: Platform,
): Promise<string | null> {
  return platform === "bedrock" ? bedrockUuid(username) : javaUuid(username);
}
