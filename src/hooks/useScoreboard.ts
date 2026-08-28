import { useEffect, useState } from 'react'
import type { ScoreboardEntry } from '../types'

type Scoreboard = Record<string, ScoreboardEntry>

interface UseScoreboardResult {
  scoreboard: Scoreboard | null
  loading: boolean
  error: string | null
}

// Fetches live in-progress scores from /api/scoreboard on mount. Unlike
// schedules, this is never cached in the browser — it's meant to
// reflect whatever's happening right now, so it's refetched on every
// page load/reload. No background polling: the user can just reload
// the page to check for an update.
export function useScoreboard(): UseScoreboardResult {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetch('/api/scoreboard')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<Scoreboard>
      })
      .then((data) => {
        if (!cancelled) setScoreboard(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load scoreboard',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { scoreboard, loading, error }
}
