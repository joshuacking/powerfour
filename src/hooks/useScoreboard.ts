import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScoreboardEntry } from '../types'

type Scoreboard = Record<string, ScoreboardEntry>

interface UseScoreboardResult {
  scoreboard: Scoreboard | null
  loading: boolean
  error: string | null
  refresh: () => void
}

// Fetches live in-progress scores from /api/scoreboard on mount, and
// again whenever refresh() is called (e.g. from a manual refresh
// button). Unlike schedules, this is never cached in the browser — it's
// meant to reflect whatever's happening right now.
export function useScoreboard(): UseScoreboardResult {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(() => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)

    fetch('/api/scoreboard')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<Scoreboard>
      })
      .then((data) => {
        if (id === requestId.current) setScoreboard(data)
      })
      .catch((err) => {
        if (id === requestId.current) {
          setError(
            err instanceof Error ? err.message : 'Failed to load scoreboard',
          )
        }
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { scoreboard, loading, error, refresh: load }
}
