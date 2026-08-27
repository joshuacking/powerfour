import teamsByPerson from './teams-by-person.json'
import teamSchedules from './team-schedules.json'
import type { TeamGame } from '../types'

const schedules = teamSchedules as Record<string, TeamGame[]>

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

export function getNextGame(team: string): TeamGame | null {
  const games = schedules[team] ?? []
  return games.find((game) => !game.completed) ?? null
}
