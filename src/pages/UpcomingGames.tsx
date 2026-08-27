import { useState } from 'react'
import teamsByPerson from '../data/teams-by-person.json'
import {
  getNextGame,
  getTeamLogo,
  getTeamOwner,
  getTeamSchedule,
} from '../data/schedules'

const roster = Object.entries(teamsByPerson as Record<string, string[]>).map(
  ([person, teams]) => ({ person, teams }),
)

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
  const [openPerson, setOpenPerson] = useState<string | null>(
    roster[0]?.person ?? null,
  )
  const [drawerTeam, setDrawerTeam] = useState<string | null>(null)

  return (
    <div className="page">
      <h1 className="page-title">Upcoming Games</h1>
      <div className="team-list">
        {roster.map((entry) => {
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
                  {entry.teams
                    .map((team) => ({ team, nextGame: getNextGame(team) }))
                    .sort((a, b) => {
                      if (!a.nextGame) return 1
                      if (!b.nextGame) return -1
                      return (
                        new Date(a.nextGame.startDate).getTime() -
                        new Date(b.nextGame.startDate).getTime()
                      )
                    })
                    .map(({ team, nextGame }) => {
                      const owner = nextGame
                        ? getTeamOwner(nextGame.opponent)
                        : null
                      const logo = getTeamLogo(team)
                      return (
                        <li key={team} className="game-row">
                          <div className="game-row-top">
                            <button
                              type="button"
                              className="team-name team-name-link"
                              onClick={() => setDrawerTeam(team)}
                            >
                              {logo && (
                                <img
                                  src={logo}
                                  alt=""
                                  className="team-logo"
                                />
                              )}
                              {team}
                            </button>
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
                              <span className="opponent">
                                {nextGame.isHome ? 'vs' : '@'}{' '}
                                {nextGame.opponent}
                                {owner && (
                                  <span className="opponent-owner-inline">
                                    {' '}
                                    ({owner})
                                  </span>
                                )}
                              </span>
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
      {drawerTeam && (
        <TeamScheduleDrawer
          team={drawerTeam}
          onClose={() => setDrawerTeam(null)}
        />
      )}
    </div>
  )
}

function TeamScheduleDrawer({
  team,
  onClose,
}: {
  team: string
  onClose: () => void
}) {
  const games = getTeamSchedule(team)
  const logo = getTeamLogo(team)

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">
            {logo && (
              <img src={logo} alt="" className="team-logo team-logo-lg" />
            )}
            {team}
          </span>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul className="drawer-schedule">
          {games.map((game) => {
            const owner = getTeamOwner(game.opponent)
            return (
              <li
                key={`${game.opponent}-${game.startDate}`}
                className="game-row"
              >
                <div className="game-row-top">
                  <span className="kickoff">
                    {formatKickoff(game.startDate, game.startTimeTBD)}
                  </span>
                </div>
                <div className="game-row-bottom">
                  <span className="opponent">
                    {game.isHome ? 'vs' : '@'} {game.opponent}
                    {owner && (
                      <span className="opponent-owner-inline"> ({owner})</span>
                    )}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
