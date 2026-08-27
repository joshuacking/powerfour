export interface TeamRecord {
  wins: number
  losses: number
}

export interface PersonStanding {
  person: string
  teams: string[]
  totalWins: number
  totalLosses: number
}
