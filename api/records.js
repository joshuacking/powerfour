// Vercel serverless function: fetches current team records from the
// College Football Data API on every request, keeping CFBD_API_KEY
// server-side only. Set CFBD_API_KEY in the Vercel project's
// environment variables (not committed to git).

import { fetchTeamRecords } from '../lib/cfbd.mjs'

const YEAR = 2026

export default async function handler(req, res) {
  const apiKey = process.env.CFBD_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing CFBD_API_KEY' })
    return
  }

  try {
    const records = await fetchTeamRecords(apiKey, YEAR)
    res.setHeader(
      'Cache-Control',
      's-maxage=300, stale-while-revalidate=60',
    )
    res.status(200).json(records)
  } catch (err) {
    res.status(502).json({
      error: 'Failed to fetch records from College Football Data API',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
