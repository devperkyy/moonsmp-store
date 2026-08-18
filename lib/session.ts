import { cookies } from "next/headers";

/**
 * Session token: `<base64url(json)>.<hex hmac-sha256>`.
 *
 * WebCrypto only — no node:crypto — matching lib/auth.ts's admin-session
 * pattern, in case this ever needs to be read from Edge middleware. Same
 * shape as moonsmp-support's lib/session.ts, but carrying buyer identity
 * instead of staff roles, and deliberately NOT caching the linked Minecraft
 * username here — see getLinkByDiscord() call sites for why.
 */

export const SESSION_COOKIE = "moon_store_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const OAUTH_STATE_COOKIE = "moon_store_oauth";

export type Session = {
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  /** From the `email` scope. Only ever used for Stripe's customer_email prefill. */
  email: string | null;
  /** Chosen once during onboarding (components/SignInGate.tsx step 3). */
  platform: "java" | "bedrock" | null;
  /** Set server-side by /api/auth/complete — never trust a client timestamp. */
  tosAcceptedAt: number | null;
  /** Issued-at, seconds. */
  iat: number;
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time-ish compare so a bad signature can't be probed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(session: Omit<Session, "iat">): Promise<string> {
  const payload: Session = { ...session, iat: Math.floor(Date.now() / 1000) };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmacHex(body)}`;
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, await hmacHex(body))) return null;

  let session: Session;
  try {
    session = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Session;
  } catch {
    return null;
  }

  if (typeof session.iat !== "number") return null;
  if (Math.floor(Date.now() / 1000) - session.iat > SESSION_MAX_AGE_SECONDS) return null;
  if (!session.discordId) return null;
  return session;
}

/** Signed, short-lived value used for the OAuth `state` round trip. */
export async function signState(value: string): Promise<string> {
  return `${value}.${await hmacHex(value)}`;
}

export async function verifyState(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  return safeEqual(token.slice(dot + 1), await hmacHex(body)) ? body : null;
}

/** The session as signed at login/complete. Cheap — cookie read only, no network. */
export async function getSession(): Promise<Session | null> {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}
