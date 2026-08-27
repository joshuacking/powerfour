import teamsByPerson from './teams-by-person.json'
import teamRecords from './team-records.json'
import type { PersonStanding, TeamRecord } from '../types'

const records = teamRecords as Record<string, TeamRecord>

export function getTeamRecord(team: string): TeamRecord {
  return records[team] ?? { wins: 0, losses: 0, ties: 0 }
}

export function getStandings(): PersonStanding[] {
  const standings = Object.entries(teamsByPerson as Record<string, string[]>).map(
    ([person, teams]) => {
      const totals = teams.reduce(
        (acc, team) => {
          const record = getTeamRecord(team)
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
