// Shared helpers for talking to the College Football Data API
// (https://api.collegefootballdata.com). Used by the live /api/records
// endpoint, its local dev equivalent in vite.config.ts, and the
// build-time schedule fetch script.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const teamsByPerson = JSON.parse(
  readFileSync(
    path.join(rootDir, 'src', 'data', 'teams-by-person.json'),
    'utf-8',
  ),
)

export const trackedTeams = new Set(Object.values(teamsByPerson).flat())

// Maps our team names to the CFBD API's canonical team names, where they differ.
const CFBD_NAME_ALIASES = {
  Pitt: 'Pittsburgh',
}

export function fromCfbdName(cfbdTeam) {
  const entry = Object.entries(CFBD_NAME_ALIASES).find(
    ([, cfbdName]) => cfbdName === cfbdTeam,
  )
  return entry ? entry[0] : cfbdTeam
}

// The /scoreboard endpoint (unlike /games, /records, etc.) returns full
// team names including mascots (e.g. "North Carolina Tar Heels" instead
// of "North Carolina"), and name matching is unsafe: some unrelated,
// untracked schools share a name prefix with a tracked one (e.g. "North
// Carolina A&T" vs. "North Carolina"). CFBD's numeric team IDs are
// stable, so we match on those instead, using a static id map baked in
// at build time (see scripts/fetch-static-data.mjs).
const teamIds = JSON.parse(
  readFileSync(path.join(rootDir, 'src', 'data', 'team-ids.json'), 'utf-8'),
)
const teamByCfbdId = new Map(
  Object.entries(teamIds).map(([team, id]) => [id, team]),
)

export async function cfbdGet(pathname, params, apiKey) {
  const url = new URL(`https://api.collegefootballdata.com${pathname}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    throw new Error(`${pathname} failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

export async function fetchTeamLogos(apiKey, year) {
  const teams = await cfbdGet('/teams', { year }, apiKey)
  const result = {}
  for (const t of teams) {
    const team = fromCfbdName(t.school)
    if (!trackedTeams.has(team)) continue
    const logo =
      (t.logos ?? []).find((url) => url.includes('/logos/32/')) ??
      (t.logos ?? [])[0] ??
      null
    if (logo) result[team] = logo
  }
  return result
}

// Fetches CFBD's numeric team IDs, which are stable identifiers we bake
// into src/data/team-ids.json at build time and use at runtime to match
// /scoreboard entries (see fetchScoreboard below) without relying on
// fragile name matching.
export async function fetchTeamIds(apiKey, year) {
  const teams = await cfbdGet('/teams', { year }, apiKey)
  const result = {}
  for (const t of teams) {
    const team = fromCfbdName(t.school)
    if (!trackedTeams.has(team)) continue
    result[team] = t.id
  }
  return result
}

// Fetches broadcast info from CFBD's /games/media endpoint and returns
// a map of "team-week" -> network, one entry per televised game
// (mediaType === 'tv'). Games without TV coverage (web streams,
// radio-only, etc.) are omitted.
async function fetchMediaByTeamWeek(apiKey, year) {
  const media = await cfbdGet(
    '/games/media',
    { year, seasonType: 'regular' },
    apiKey,
  )
  const result = {}

  for (const m of media) {
    if (m.mediaType !== 'tv' || !m.outlet) continue
    for (const cfbdTeam of [m.homeTeam, m.awayTeam]) {
      const team = fromCfbdName(cfbdTeam)
      if (!trackedTeams.has(team)) continue
      result[`${team}-${m.week}`] = m.outlet
    }
  }

  return result
}

// Betting line providers CFBD reports, in preference order. Most games
// only carry one provider; when a game has several, the first match
// here wins so the displayed line is consistent across games.
const LINE_PROVIDER_PRIORITY = ['DraftKings', 'Draft Kings', 'Bovada']

function pickLine(lines) {
  if (!lines || lines.length === 0) return null
  for (const provider of LINE_PROVIDER_PRIORITY) {
    const match = lines.find((l) => l.provider === provider)
    if (match) return match
  }
  return lines[0]
}

// Fetches betting lines from CFBD's /lines endpoint and returns a map of
// "team-week" -> { formattedSpread, overUnder }, one entry per team per
// game that has odds posted (CFBD only posts lines a week or so out
// from kickoff, so far-future games are naturally omitted).
export async function fetchLines(apiKey, year) {
  const games = await cfbdGet(
    '/lines',
    { year, seasonType: 'regular' },
    apiKey,
  )
  const result = {}

  for (const g of games) {
    const line = pickLine(g.lines)
    if (!line || (line.formattedSpread == null && line.overUnder == null)) {
      continue
    }
    for (const cfbdTeam of [g.homeTeam, g.awayTeam]) {
      const team = fromCfbdName(cfbdTeam)
      if (!trackedTeams.has(team)) continue
      result[`${team}-${g.week}`] = {
        formattedSpread: line.formattedSpread ?? null,
        overUnder: line.overUnder ?? null,
      }
    }
  }

  return result
}

export async function fetchTeamSchedules(apiKey, year) {
  const [games, mediaByTeamWeek] = await Promise.all([
    cfbdGet('/games', { year, seasonType: 'regular' }, apiKey),
    fetchMediaByTeamWeek(apiKey, year),
  ])
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
        week: g.week,
        seasonType: g.seasonType,
        startDate: g.startDate,
        startTimeTBD: g.startTimeTBD,
        completed: g.completed,
        teamPoints: isHome ? g.homePoints : g.awayPoints,
        opponentPoints: isHome ? g.awayPoints : g.homePoints,
        network: mediaByTeamWeek[`${team}-${g.week}`] ?? null,
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

// Fetches live in-progress scores from CFBD's /scoreboard endpoint,
// which (unlike /games) reflects games as they're actually being
// played: status, period, clock, and current points. Returns a map
// keyed by team name. The endpoint can return more than one game per
// team (e.g. today's live game plus next week's scheduled game), so
// an in-progress entry always wins over a non-live one for the same
// team rather than being overwritten by whichever game appears later
// in the response.
export async function fetchScoreboard(apiKey, year) {
  const games = await cfbdGet('/scoreboard', { season: year }, apiKey)
  const scoreboard = {}

  for (const g of games) {
    for (const [teamSide, opponentSide] of [
      [g.homeTeam, g.awayTeam],
      [g.awayTeam, g.homeTeam],
    ]) {
      const team = teamByCfbdId.get(teamSide.id)
      if (!team) continue
      if (scoreboard[team] && scoreboard[team].status === 'in_progress') {
        continue
      }
      scoreboard[team] = {
        status: g.status,
        period: g.period,
        clock: g.clock,
        teamPoints: teamSide.points,
        opponentPoints: opponentSide.points,
      }
    }
  }

  return scoreboard
}

export async function fetchTeamRecords(apiKey, year) {
  const records = await cfbdGet('/records', { year }, apiKey)
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
      result[team] = { wins: 0, losses: 0, ties: 0 }
    }
  }
  return result
}
