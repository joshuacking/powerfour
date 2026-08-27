import teamsByPerson from './teams-by-person.json'
import type { PersonStanding, TeamRecord } from '../types'

export type TeamRecords = Record<string, TeamRecord>

export function getTeamRecord(records: TeamRecords, team: string): TeamRecord {
  return records[team] ?? { wins: 0, losses: 0, ties: 0 }
}

export function getStandings(records: TeamRecords): PersonStanding[] {
  const standings = Object.entries(teamsByPerson as Record<string, string[]>).map(
    ([person, teams]) => {
      const totals = teams.reduce(
        (acc, team) => {
          const record = getTeamRecord(records, team)
          acc.wins += record.wins
          acc.losses += record.losses
          return acc
        },
        { wins: 0, losses: 0 },
      )
      return {
        person,
        teams,
        totalWins: totals.wins,
        totalLosses: totals.losses,
      }
    },
  )

  return standings.sort((a, b) => b.totalWins - a.totalWins)
}
