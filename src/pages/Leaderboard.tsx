import { useState } from 'react'
import { getDraftPick } from '../data/draft'
import { getStandings, getTeamRecord } from '../data/standings'
import TeamLogo from '../components/TeamLogo'
import { useTeamRecords } from '../hooks/useTeamRecords'

export default function Leaderboard() {
  const { records, loading, error } = useTeamRecords()
  const [openPerson, setOpenPerson] = useState<string | null>(null)

  return (
    <div className="page">
      <h1 className="page-title">Leaderboard</h1>
      {loading && <p className="status-message">Loading current records…</p>}
      {error && !loading && (
        <p className="status-message status-message-error">
          Couldn't load current records. Try reloading the page.
        </p>
      )}
      {records && (
        <ul className="leaderboard-list">
          {getStandings(records).map((entry) => {
            const isOpen = openPerson === entry.person
            return (
              <li className="leaderboard-item" key={entry.person}>
                <button
                  type="button"
                  className="leaderboard-row"
                  onClick={() => setOpenPerson(isOpen ? null : entry.person)}
                  aria-expanded={isOpen}
                >
                  <span className="rank">
                    {entry.isTied ? `T-${entry.rank}` : entry.rank}
                  </span>
                  <span className="person-name">{entry.person}</span>
                  <span className="record">
                    {entry.totalWins} <span className="record-label">W</span>
                  </span>
                </button>
                {isOpen && (
                  <ul className="team-sublist">
                    {entry.teams.map((team) => {
                      const record = getTeamRecord(records, team)
                      const pick = getDraftPick(team)
                      return (
                        <li key={team} className="team-sublist-row">
                          <span className="team-name">
                            <TeamLogo team={team} className="team-logo" />
                            {team}
                            {pick != null && (
                              <span className="draft-pick"> ({pick})</span>
                            )}
                          </span>
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
      )}
    </div>
  )
}
