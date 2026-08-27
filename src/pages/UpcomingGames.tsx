import { useState } from 'react'
import { getStandings } from '../data/standings'
import { getNextGame, getTeamOwner } from '../data/schedules'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

function formatKickoff(startDate: string, startTimeTBD: boolean): string {
  const date = new Date(startDate)
  const datePart = dateFormatter.format(date)
  if (startTimeTBD) return `${datePart}, TBD`
  return `${datePart}, ${timeFormatter.format(date)}`
}

export default function UpcomingGames() {
  const standings = getStandings()
  const [openPerson, setOpenPerson] = useState<string | null>(
    standings[0]?.person ?? null,
  )

  return (
    <div className="page">
      <h1 className="page-title">Upcoming Games</h1>
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
              </button>
              {isOpen && (
                <ul className="team-sublist">
                  {entry.teams.map((team) => {
                    const nextGame = getNextGame(team)
                    const owner = nextGame
                      ? getTeamOwner(nextGame.opponent)
                      : null
                    return (
                      <li key={team} className="game-row">
                        <div className="game-row-top">
                          <span className="team-name">{team}</span>
                          {nextGame && (
                            <span className="kickoff">
                              {formatKickoff(
                                nextGame.startDate,
                                nextGame.startTimeTBD,
                              )}
                            </span>
                          )}
                        </div>
                        <div className="game-row-bottom">
                          {nextGame ? (
                            <>
                              <span className="opponent">
                                {nextGame.isHome ? 'vs' : '@'}{' '}
                                {nextGame.opponent}
                              </span>
                              <span
                                className={`opponent-owner${owner ? '' : ' unowned'}`}
                              >
                                {owner ? `${owner}'s team` : 'not in pool'}
                              </span>
                            </>
                          ) : (
                            <span className="opponent">
                              No games remaining
                            </span>
                          )}
                        </div>
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
