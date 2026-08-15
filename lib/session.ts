import { cookies } from "next/headers";

export const SESSION_COOKIE = "moon_store_session";
export const OAUTH_STATE_COOKIE = "moon_store_oauth";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type StoreSession = {
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  email: string | null;
  platform: "java" | "bedrock" | null;
  tosAcceptedAt: number | null;
  iat: number;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

function encode(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const result = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

export async function signSession(session: Omit<StoreSession, "iat">) {
  const payload: StoreSession = { ...session, iat: Math.floor(Date.now() / 1000) };
  const body = encode(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

export async function verifySession(token: string | undefined): Promise<StoreSession | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), await hmac(body))) return null;
  try {
    const session = JSON.parse(new TextDecoder().decode(decode(body))) as StoreSession;
    if (!session.discordId || typeof session.iat !== "number") return null;
    if (Math.floor(Date.now() / 1000) - session.iat > SESSION_MAX_AGE_SECONDS) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

export async function signState(value: string) {
  return `${value}.${await hmac(value)}`;
}

export async function verifyState(token: string | undefined) {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const value = token.slice(0, dot);
  return safeEqual(token.slice(dot + 1), await hmac(value)) ? value : null;
}
