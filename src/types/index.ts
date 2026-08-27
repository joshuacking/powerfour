export interface TeamRecord {
  wins: number
  losses: number
  ties: number
}

export interface PersonStanding {
  person: string
  teams: string[]
  totalWins: number
  totalLosses: number
}

export interface TeamGame {
  opponent: string
  isHome: boolean
  startDate: string
  startTimeTBD: boolean
  completed: boolean
  teamPoints: number | null
  opponentPoints: number | null
}
