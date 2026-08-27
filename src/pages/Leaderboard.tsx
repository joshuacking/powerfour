import { useState } from 'react'
import { getStandings, getTeamRecord } from '../data/standings'

export default function Leaderboard() {
  const standings = getStandings()
  const [openPerson, setOpenPerson] = useState<string | null>(null)

  return (
    <div className="page">
      <h1 className="page-title">Leaderboard</h1>
      <ul className="leaderboard-list">
        {standings.map((entry, index) => {
          const isOpen = openPerson === entry.person
          return (
            <li className="leaderboard-item" key={entry.person}>
              <button
                type="button"
                className="leaderboard-row"
                onClick={() => setOpenPerson(isOpen ? null : entry.person)}
                aria-expanded={isOpen}
              >
                <span className="rank">{index + 1}</span>
                <span className="person-name">{entry.person}</span>
                <span className="record">
                  {entry.totalWins} <span className="record-label">W</span>
                </span>
              </button>
              {isOpen && (
                <ul className="team-sublist">
                  {entry.teams.map((team) => {
                    const record = getTeamRecord(team)
                    return (
                      <li key={team} className="team-sublist-row">
                        <span className="team-name">{team}</span>
                        <span className="record">
                          {record.wins}-{record.losses}
                          {record.ties ? `-${record.ties}` : ''}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
