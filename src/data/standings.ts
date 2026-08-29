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
          acc.ties += record.ties
          return acc
        },
        { wins: 0, losses: 0, ties: 0 },
      )
      return {
        person,
        teams,
        totalWins: totals.wins,
        totalLosses: totals.losses,
        totalTies: totals.ties,
      }
    },
  )

  const sorted = standings.sort((a, b) => b.totalWins - a.totalWins)

  const winsCount = sorted.reduce(
    (acc, entry) => {
      acc[entry.totalWins] = (acc[entry.totalWins] ?? 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  let rank = 0
  return sorted.map((entry, index) => {
    if (index === 0 || entry.totalWins !== sorted[index - 1].totalWins) {
      rank = index + 1
    }
    return { ...entry, rank, isTied: winsCount[entry.totalWins] > 1 }
  })
}
