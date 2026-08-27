// Fetches team schedules and logos from the College Football Data API
// (https://api.collegefootballdata.com) and writes them to static JSON
// files consumed by the app. Team records are fetched live at request
// time instead (see api/records.js), since they change throughout the
// season.
//
// Run with:
//   node --env-file=.env scripts/fetch-static-data.mjs

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  cfbdGet,
  fetchTeamLogos,
  fromCfbdName,
  trackedTeams,
} from '../lib/cfbd.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '..', 'src', 'data')

const YEAR = 2026
const API_KEY = process.env.CFBD_API_KEY

if (!API_KEY) {
  console.error(
    'Missing CFBD_API_KEY. Run with: node --env-file=.env scripts/fetch-static-data.mjs',
  )
  process.exit(1)
}

async function fetchSchedules() {
  const games = await cfbdGet(
    '/games',
    { year: YEAR, seasonType: 'regular' },
    API_KEY,
  )
  const schedules = {}
  for (const team of trackedTeams) schedules[team] = []

  for (const g of games) {
    for (const [cfbdTeam, cfbdOpponent, isHome] of [
      [g.homeTeam, g.awayTeam, true],
      [g.awayTeam, g.homeTeam, false],
    ]) {
      const team = fromCfbdName(cfbdTeam)
      const opponent = fromCfbdName(cfbdOpponent)
      if (!trackedTeams.has(team)) continue
      schedules[team].push({
        opponent,
        isHome,
        startDate: g.startDate,
        startTimeTBD: g.startTimeTBD,
        completed: g.completed,
        teamPoints: isHome ? g.homePoints : g.awayPoints,
        opponentPoints: isHome ? g.awayPoints : g.homePoints,
      })
    }
  }

  for (const team of trackedTeams) {
    schedules[team].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate),
    )
  }

  return schedules
}

const schedules = await fetchSchedules()

writeFileSync(
  path.join(dataDir, 'team-schedules.json'),
  JSON.stringify(schedules, null, 2) + '\n',
)

console.log(`Wrote schedules for ${trackedTeams.size} teams.`)

const logos = await fetchTeamLogos(API_KEY, YEAR)

writeFileSync(
  path.join(dataDir, 'team-logos.json'),
  JSON.stringify(logos, null, 2) + '\n',
)

console.log(`Wrote logos for ${Object.keys(logos).length} teams.`)
