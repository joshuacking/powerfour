import { useState } from 'react'
import { getStandings, getTeamRecord } from '../data/standings'

export default function Teams() {
  const standings = getStandings()
  const [openPerson, setOpenPerson] = useState<string | null>(
    standings[0]?.person ?? null,
  )

  return (
    <div className="page">
      <h1 className="page-title">Teams by Person</h1>
      <div className="team-list">
        {standings.map((entry) => {
          const isOpen = openPerson === entry.person
          return (
            <div className="team-card" key={entry.person}>
              <button
                type="button"
                className="team-card-header"
                onClick={() => setOpenPerson(isOpen ? null : entry.person)}
                aria-expanded={isOpen}
              >
                <span className="person-name">{entry.person}</span>
                <span className="record">
                  {entry.totalWins}-{entry.totalLosses}
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
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
