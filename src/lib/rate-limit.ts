type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Simple sliding-window limiter (per serverless isolate). */
export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true };
}

/** Short TTL response cache for GET bot data (reduces upstream hits). */
type CacheEntry = { expiresAt: number; body: unknown; status: number };
const responseCache = new Map<string, CacheEntry>();

export function getCached(key: string): CacheEntry | null {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return hit;
}

export function setCached(
  key: string,
  body: unknown,
  status: number,
  ttlMs = 15_000
) {
  // Don't cache errors
  if (status >= 400) return;
  responseCache.set(key, {
    body,
    status,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateCachePrefix(prefix: string) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}
