// Vercel serverless function: fetches team schedules (including scores
// and TBD start times) from the College Football Data API on every
// request, keeping CFBD_API_KEY server-side only. Set CFBD_API_KEY in
// the Vercel project's environment variables (not committed to git).

import { fetchTeamSchedules } from '../lib/cfbd.mjs'

const YEAR = 2026

export default async function handler(req, res) {
  const apiKey = process.env.CFBD_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing CFBD_API_KEY' })
    return
  }

  try {
    const schedules = await fetchTeamSchedules(apiKey, YEAR)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(schedules)
  } catch (err) {
    res.status(502).json({
      error: 'Failed to fetch schedules from College Football Data API',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
