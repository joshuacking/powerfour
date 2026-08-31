// Vercel serverless function: fetches betting lines (spread, over/under)
// from the College Football Data API, keeping CFBD_API_KEY server-side
// only. Set CFBD_API_KEY in the Vercel project's environment variables
// (not committed to git).
//
// Edge-cached for 24 hours since lines only matter for upcoming games
// and don't need to be fresh to the minute; this keeps CFBD call volume
// down to fit the account's Patreon tier limits.

import { fetchLines } from '../lib/cfbd.mjs'

const YEAR = 2026

export default async function handler(req, res) {
  const apiKey = process.env.CFBD_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing CFBD_API_KEY' })
    return
  }

  try {
    const lines = await fetchLines(apiKey, YEAR)
    res.setHeader(
      'Cache-Control',
      's-maxage=86400, stale-while-revalidate=3600',
    )
    res.status(200).json(lines)
  } catch (err) {
    res.status(502).json({
      error: 'Failed to fetch lines from College Football Data API',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
