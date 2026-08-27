import { getStandings } from '../data/standings'

export default function Leaderboard() {
  const standings = getStandings()

  return (
    <div className="page">
      <h1 className="page-title">Leaderboard</h1>
      <ul className="leaderboard-list">
        {standings.map((entry, index) => (
          <li key={entry.person} className="leaderboard-row">
            <span className="rank">{index + 1}</span>
            <span className="person-name">{entry.person}</span>
            <span className="record">
              {entry.totalWins} <span className="record-label">W</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
