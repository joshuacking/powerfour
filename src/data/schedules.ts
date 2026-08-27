import teamsByPerson from './teams-by-person.json'
import teamLogos from './team-logos.json'
import type { TeamGame } from '../types'

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

export function getTeamSchedule(
  schedules: Record<string, TeamGame[]>,
  team: string,
): TeamGame[] {
  return schedules[team] ?? []
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

export function getGameResult(
  game: TeamGame,
): { label: string; outcome: 'win' | 'loss' | 'tie' } | null {
  if (
    !game.completed ||
    game.teamPoints === null ||
    game.opponentPoints === null
  ) {
    return null
  }
  const { teamPoints, opponentPoints } = game
  const outcome =
    teamPoints > opponentPoints
      ? 'win'
      : teamPoints < opponentPoints
        ? 'loss'
        : 'tie'
  const prefix = outcome === 'win' ? 'W' : outcome === 'loss' ? 'L' : 'T'
  return { label: `${prefix} ${teamPoints}-${opponentPoints}`, outcome }
}
