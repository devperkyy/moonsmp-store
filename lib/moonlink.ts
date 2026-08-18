import { createClient, type Client } from "@libsql/client";

let client: Client | null | undefined;

function db() {
  if (client !== undefined) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return (client = null);
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  return (client = createClient(authToken ? { url, authToken } : { url }));
}

export function linkingConfigured() {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

export type MoonLink = { player: string; linkedAt: number };

export async function getLinkByDiscord(discordId: string): Promise<MoonLink | null> {
  const database = db();
  if (!database) return null;
  const result = await database.execute({
    sql: "SELECT player, linked_at FROM links WHERE discord_id = ?",
    args: [discordId],
  });
  const row = result.rows[0];
  return row ? { player: String(row.player), linkedAt: Number(row.linked_at) } : null;
}

function generateCode() {
  const values = new Uint32Array(7);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => String(value % 10)).join("");
}

export async function issueLinkCode(discordId: string) {
  const database = db();
  if (!database) return null;
  const code = generateCode();
  const now = Date.now();
  const expiresAt = now + 10 * 60_000;
  await database.execute({ sql: "DELETE FROM link_codes WHERE discord_id = ?", args: [discordId] });
  await database.execute({
    sql: "INSERT INTO link_codes (code, discord_id, guild_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    args: [code, discordId, process.env.DISCORD_GUILD_ID ?? "", now, expiresAt],
  });
  return { code, expiresAt, command: `/link ${code}` };
}
