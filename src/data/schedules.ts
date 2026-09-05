import teamsByPerson from './teams-by-person.json'
import teamLogos from './team-logos.json'
import type { GameLine, ScoreboardEntry, TeamGame } from '../types'

const logos = teamLogos as Record<string, string>

export function getTeamLogo(team: string): string | null {
  return logos[team] ?? null
}

const ownerByTeam: Record<string, string> = Object.entries(
  teamsByPerson as Record<string, string[]>,
).reduce(
  (acc, [person, teams]) => {
    for (const team of teams) acc[team] = person
    return acc
  },
  {} as Record<string, string>,
)

export function getTeamOwner(team: string): string | null {
  return ownerByTeam[team] ?? null
}

export function getNextGame(
  schedules: Record<string, TeamGame[]>,
  team: string,
): TeamGame | null {
  const games = schedules[team] ?? []
  return games.find((game) => !game.completed) ?? null
}

// The "current week" is the week of the soonest game that hasn't been
// played yet, across all tracked teams. Once the season is over (every
// game completed), falls back to the last week that was played.
export function getCurrentWeek(
  schedules: Record<string, TeamGame[]>,
): number | null {
  let soonestUpcoming: TeamGame | null = null
  let maxWeek: number | null = null

  for (const games of Object.values(schedules)) {
    for (const game of games) {
      if (maxWeek === null || game.week > maxWeek) maxWeek = game.week
      if (game.completed) continue
      if (
        !soonestUpcoming ||
        new Date(game.startDate).getTime() <
          new Date(soonestUpcoming.startDate).getTime()
      ) {
        soonestUpcoming = game
      }
    }
  }

  return soonestUpcoming ? soonestUpcoming.week : maxWeek
}

export function getGameForWeek(
  schedules: Record<string, TeamGame[]>,
  team: string,
  week: number | null,
): TeamGame | null {
  if (week === null) return null
  const games = schedules[team] ?? []
  return games.find((game) => game.week === week) ?? null
}

// All week numbers that appear anywhere in the season's schedule, in
// order. Used to fill in bye weeks for a team that has no game that
// week.
function getSeasonWeeks(schedules: Record<string, TeamGame[]>): number[] {
  const weeks = new Set<number>()
  for (const games of Object.values(schedules)) {
    for (const game of games) weeks.add(game.week)
  }
  return Array.from(weeks).sort((a, b) => a - b)
}

export function getTeamScheduleByWeek(
  schedules: Record<string, TeamGame[]>,
  team: string,
): { week: number; game: TeamGame | null }[] {
  const games = schedules[team] ?? []
  const gameByWeek = new Map(games.map((game) => [game.week, game]))
  return getSeasonWeeks(schedules).map((week) => ({
    week,
    game: gameByWeek.get(week) ?? null,
  }))
}

export function getGameLine(
  lines: Record<string, GameLine> | null,
  team: string,
  game: TeamGame,
): GameLine | null {
  return lines?.[`${team}-${game.week}`] ?? null
}

export function isTeamLive(
  scoreboard: Record<string, ScoreboardEntry> | null,
  team: string,
): boolean {
  const entry = scoreboard?.[team]
  if (!entry) return false
  return (
    entry.status === 'in_progress' &&
    entry.teamPoints !== null &&
    entry.opponentPoints !== null
  )
}

// Returns the current score for a team's game, from the live scoreboard
// if the game is in progress or has just finished there (the scoreboard
// updates faster than the schedule data's `completed` flag), otherwise
// from the final schedule data if the game has been completed. Returns
// null while the game is still upcoming.
export function getMatchupScores(
  scoreboard: Record<string, ScoreboardEntry> | null,
  team: string,
  game: TeamGame,
): {
  teamPoints: number
  opponentPoints: number
  status: 'live' | 'final'
  period: number | null
  clock: string | null
} | null {
  const entry = scoreboard?.[team]
  if (
    entry &&
    entry.status === 'in_progress' &&
    entry.teamPoints !== null &&
    entry.opponentPoints !== null
  ) {
    return {
      teamPoints: entry.teamPoints,
      opponentPoints: entry.opponentPoints,
      status: 'live',
      period: entry.period,
      clock: entry.clock,
    }
  }
  if (
    entry &&
    entry.status === 'completed' &&
    entry.teamPoints !== null &&
    entry.opponentPoints !== null
  ) {
    return {
      teamPoints: entry.teamPoints,
      opponentPoints: entry.opponentPoints,
      status: 'final',
      period: null,
      clock: null,
    }
  }
  if (game.completed && game.teamPoints !== null && game.opponentPoints !== null) {
    return {
      teamPoints: game.teamPoints,
      opponentPoints: game.opponentPoints,
      status: 'final',
      period: null,
      clock: null,
    }
  }
  return null
}
