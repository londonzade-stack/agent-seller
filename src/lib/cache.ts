const TWO_HOURS_MS = 2 * 60 * 60 * 1000

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TWO_HOURS_MS) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() })
}

export function clearCache(key: string): void {
  store.delete(key)
}
