/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window approach: tracks request timestamps per key
 * and rejects requests that exceed the configured limit within the window.
 *
 * Note: This is an in-memory store, so it resets on server restart and
 * does not share state across multiple serverless instances. For production
 * at scale, consider a Redis-backed solution.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return

  lastCleanup = now
  const cutoff = now - windowMs

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetMs: number
}

/**
 * Check and consume a rate limit token for the given key.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns RateLimitResult indicating whether the request is allowed
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now()
  const cutoff = now - windowMs

  // Lazy cleanup
  cleanup(windowMs)

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= limit) {
    // Rate limited
    const oldestInWindow = entry.timestamps[0]
    const resetMs = oldestInWindow + windowMs - now

    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
    }
  }

  // Allow the request
  entry.timestamps.push(now)

  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    resetMs: windowMs,
  }
}
