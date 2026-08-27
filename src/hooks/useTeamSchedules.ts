import { useEffect, useState } from 'react'
import type { TeamGame } from '../types'

type TeamSchedules = Record<string, TeamGame[]>

interface UseTeamSchedulesResult {
  schedules: TeamSchedules | null
  loading: boolean
  error: string | null
}

const CACHE_KEY = 'powerfour:schedules:v1'
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
  fetchedAt: number
  schedules: TeamSchedules
}

function readCache(): TeamSchedules | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null
    return entry.schedules
  } catch {
    return null
  }
}

function writeCache(schedules: TeamSchedules) {
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), schedules }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore storage failures (e.g. private browsing, quota exceeded).
  }
}

// Fetches live team schedules from /api/schedules on mount, so kickoff
// times, TBD updates, and scores always reflect the latest data from
// the College Football Data API. Caches the response in the browser
// for a few minutes to avoid refetching on every navigation.
export function useTeamSchedules(): UseTeamSchedulesResult {
  const cached = readCache()
  const [schedules, setSchedules] = useState<TeamSchedules | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cached) return

    let cancelled = false

    setLoading(true)
    setError(null)

    fetch('/api/schedules')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<TeamSchedules>
      })
      .then((data) => {
        if (cancelled) return
        writeCache(data)
        setSchedules(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load schedules',
          )
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

  return { schedules, loading, error }
}
