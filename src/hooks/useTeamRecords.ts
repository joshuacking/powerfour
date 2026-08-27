import { useEffect, useState } from 'react'
import type { TeamRecords } from '../data/standings'

interface UseTeamRecordsResult {
  records: TeamRecords | null
  loading: boolean
  error: string | null
}

// Fetches live team records from /api/records on mount, so the
// leaderboard always reflects current-season results when the app loads.
export function useTeamRecords(): UseTeamRecordsResult {
  const [records, setRecords] = useState<TeamRecords | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetch('/api/records')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<TeamRecords>
      })
      .then((data) => {
        if (!cancelled) setRecords(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load records')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { records, loading, error }
}
