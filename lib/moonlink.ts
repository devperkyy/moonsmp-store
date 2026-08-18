import { createClient, type Client } from "@libsql/client";

/**
 * Read side of Moon Handler's database (moonsmp-bot, Turso/libSQL) — the
 * SAME database support.moonsmp.org reads (see its lib/moonlink.ts).
 *
 * The bot owns account linking — it's the only process watching the
 * Minecraft console, which is what actually verifies an in-game
 * `/link <code>`. This module reads that data and can *issue* a code into
 * the shared `link_codes` table; the bot's watcher then completes the link
 * with no bot changes needed.
 *
 * Everything here degrades to null/no-op when TURSO_DATABASE_URL is unset,
 * so the site builds and runs before those credentials exist — matching
 * support's own defensive pattern.
 */

export const LINK_CODE_LENGTH = 7;
export const LINK_EXPIRY_MINUTES = 10;

let client: Client | null | undefined;

function db(): Client | null {
  if (client !== undefined) return client;

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    client = null;
    return null;
  }
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  client = createClient(authToken ? { url, authToken } : { url });
  return client;
}

export function linkingConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

export type MoonLink = { player: string; linkedAt: number };

/**
 * Live-read, never cached in the session cookie — a stale cached Minecraft
 * username tied to real purchases is a worse failure mode than the network
 * round trip. Call this fresh at every gate check and at checkout time.
 */
export async function getLinkByDiscord(discordId: string): Promise<MoonLink | null> {
  const c = db();
  if (!c) return null;
  try {
    const res = await c.execute({
      sql: "SELECT player, linked_at FROM links WHERE discord_id = ?",
      args: [discordId],
    });
    const row = res.rows[0];
    if (!row) return null;
    return { player: String(row.player), linkedAt: Number(row.linked_at) };
  } catch {
    // Bot DB unreachable — treat as "not linked" for display purposes.
    // /api/checkout must NOT make the same call and silently treat this the
    // same as "never linked" — see the distinct linking_unavailable error.
    return null;
  }
}

function generateCode(): string {
  const bytes = new Uint32Array(LINK_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 10).toString()).join("");
}

export type IssuedCode = { code: string; expiresAt: number; command: string };

/**
 * Issues a pending link code for this Discord user. Mirrors the bot's
 * createLinkCode: one pending code per user, so the previous one is dropped.
 */
export async function issueLinkCode(discordId: string): Promise<IssuedCode | null> {
  const c = db();
  if (!c) return null;

  const guildId = process.env.DISCORD_GUILD_ID ?? "";
  const code = generateCode();
  const now = Date.now();
  const expiresAt = now + LINK_EXPIRY_MINUTES * 60_000;

  try {
    await c.execute({ sql: "DELETE FROM link_codes WHERE discord_id = ?", args: [discordId] });
    await c.execute({
      sql: "INSERT INTO link_codes (code, discord_id, guild_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
      args: [code, discordId, guildId, now, expiresAt],
    });
  } catch {
    return null;
  }

  return { code, expiresAt, command: `/link ${code}` };
}
