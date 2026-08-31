import { useEffect, useState } from 'react'
import type { GameLine } from '../types'

type Lines = Record<string, GameLine>

interface UseLinesResult {
  lines: Lines | null
  loading: boolean
  error: string | null
}

const CACHE_KEY = 'powerfour:lines:v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  fetchedAt: number
  lines: Lines
}

function readCache(): Lines | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null
    return entry.lines
  } catch {
    return null
  }
}

function writeCache(lines: Lines) {
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), lines }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore storage failures (e.g. private browsing, quota exceeded).
  }
}

// Fetches betting lines from /api/lines on mount. Cached in the browser
// for 24 hours since lines don't need to be fresher than that and this
// keeps CFBD call volume down.
export function useLines(): UseLinesResult {
  const cached = readCache()
  const [lines, setLines] = useState<Lines | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cached) return

    let cancelled = false

    setLoading(true)
    setError(null)

    fetch('/api/lines')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<Lines>
      })
      .then((data) => {
        if (cancelled) return
        writeCache(data)
        setLines(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load lines')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { lines, loading, error }
}
