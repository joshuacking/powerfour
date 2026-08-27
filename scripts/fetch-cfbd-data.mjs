// Fetches team records and schedules from the College Football Data API
// (https://api.collegefootballdata.com) and writes them to static JSON
// files consumed by the app. Run with:
//   node --env-file=.env scripts/fetch-cfbd-data.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataDir = path.join(rootDir, 'src', 'data')

const YEAR = 2026
const API_KEY = process.env.CFBD_API_KEY

if (!API_KEY) {
  console.error(
    'Missing CFBD_API_KEY. Run with: node --env-file=.env scripts/fetch-cfbd-data.mjs',
  )
  process.exit(1)
}

const teamsByPerson = JSON.parse(
  readFileSync(path.join(dataDir, 'teams-by-person.json'), 'utf-8'),
)
const trackedTeams = new Set(Object.values(teamsByPerson).flat())

// Maps our team names to the CFBD API's canonical team names, where they differ.
const CFBD_NAME_ALIASES = {
  Pitt: 'Pittsburgh',
}
const fromCfbdName = (cfbdTeam) => {
  const entry = Object.entries(CFBD_NAME_ALIASES).find(
    ([, cfbdName]) => cfbdName === cfbdTeam,
  )
  return entry ? entry[0] : cfbdTeam
}

async function cfbdGet(pathname, params) {
  const url = new URL(`https://api.collegefootballdata.com${pathname}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
  if (!res.ok) {
    throw new Error(`${pathname} failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

async function fetchRecords() {
  const records = await cfbdGet('/records', { year: YEAR })
  const result = {}
  for (const r of records) {
    const team = fromCfbdName(r.team)
    if (!trackedTeams.has(team)) continue
    result[team] = {
      wins: r.total.wins,
      losses: r.total.losses,
      ties: r.total.ties,
    }
  }
  for (const team of trackedTeams) {
    if (!result[team]) {
      console.warn(`No record found for tracked team: ${team}`)
      result[team] = { wins: 0, losses: 0, ties: 0 }
    }
  }
  return result
}

async function fetchSchedules() {
  const games = await cfbdGet('/games', { year: YEAR, seasonType: 'regular' })
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

const [records, schedules] = await Promise.all([
  fetchRecords(),
  fetchSchedules(),
])

writeFileSync(
  path.join(dataDir, 'team-records.json'),
  JSON.stringify(records, null, 2) + '\n',
)
writeFileSync(
  path.join(dataDir, 'team-schedules.json'),
  JSON.stringify(schedules, null, 2) + '\n',
)

console.log(`Wrote records and schedules for ${trackedTeams.size} teams.`)
