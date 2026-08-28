// Best-effort, in-memory rate limiter. A serverless function instance can
// cold-start and lose this state, so it's not a hard guarantee across every
// request — but it stops the common case of one client hammering an
// endpoint within a warm instance, which covers admin-login brute forcing
// and checkout abuse without needing an external store like Redis.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Sweep expired buckets periodically so this can't grow unbounded on a
// long-lived instance.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  },
  5 * 60 * 1000,
).unref?.();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  bucket.count++;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}
