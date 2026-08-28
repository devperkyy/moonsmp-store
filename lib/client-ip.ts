import { headers } from "next/headers";

// Vercel sets x-forwarded-for on every request; the first entry is the
// original client. Falls back to x-real-ip, then "unknown" so callers never
// have to null-check.
export function clientIp(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
