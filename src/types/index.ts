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
  rank: number
  isTied: boolean
}

export interface TeamGame {
  opponent: string
  isHome: boolean
  week: number
  seasonType: string
  startDate: string
  startTimeTBD: boolean
  completed: boolean
  teamPoints: number | null
  opponentPoints: number | null
  network: string | null
}

export interface ScoreboardEntry {
  status: 'scheduled' | 'in_progress' | 'completed'
  period: number | null
  clock: string | null
  teamPoints: number | null
  opponentPoints: number | null
}
