import { useState } from 'react'
import teamsByPerson from '../data/teams-by-person.json'
import {
  getCurrentWeek,
  getGameForWeek,
  getGameResult,
  getNextGame,
  getTeamLogo,
  getTeamOwner,
  getTeamScheduleByWeek,
} from '../data/schedules'
import { useTeamSchedules } from '../hooks/useTeamSchedules'
import type { TeamGame } from '../types'

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
  const { schedules, loading, error } = useTeamSchedules()
  const currentWeek = schedules ? getCurrentWeek(schedules) : null

  return (
    <div className="page">
      <h1 className="page-title">
        Games{currentWeek != null && ` (Week ${currentWeek})`}
      </h1>
      {loading && <p className="status-message">Loading schedules…</p>}
      {error && !loading && (
        <p className="status-message status-message-error">
          Couldn't load schedules. Try reloading the page.
        </p>
      )}
      {schedules && (
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
                    .map((team) => ({
                      team,
                      game:
                        getGameForWeek(schedules, team, currentWeek) ??
                        getNextGame(schedules, team),
                    }))
                    .sort((a, b) => {
                      if (!a.game) return 1
                      if (!b.game) return -1
                      return (
                        new Date(a.game.startDate).getTime() -
                        new Date(b.game.startDate).getTime()
                      )
                    })
                    .map(({ team, game }) => {
                      const owner = game ? getTeamOwner(game.opponent) : null
                      const logo = getTeamLogo(team)
                      const result = game ? getGameResult(game) : null
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
                            {game && (
                              <span className="kickoff">
                                {formatKickoff(
                                  game.startDate,
                                  game.startTimeTBD,
                                )}
                              </span>
                            )}
                          </div>
                          <div className="game-row-bottom">
                            {game ? (
                              <span className="opponent">
                                {game.isHome ? 'vs' : '@'} {game.opponent}
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
                            {result && (
                              <span
                                className={`score score-${result.outcome}`}
                              >
                                {result.label}
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
      )}
      {schedules && drawerTeam && (
        <TeamScheduleDrawer
          schedules={schedules}
          team={drawerTeam}
          onClose={() => setDrawerTeam(null)}
        />
      )}
    </div>
  )
}

function TeamScheduleDrawer({
  schedules,
  team,
  onClose,
}: {
  schedules: Record<string, TeamGame[]>
  team: string
  onClose: () => void
}) {
  const weeks = getTeamScheduleByWeek(schedules, team)
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
          {weeks.map(({ week, game }) => {
            const owner = game ? getTeamOwner(game.opponent) : null
            const result = game ? getGameResult(game) : null
            return (
              <li key={week} className="game-row">
                <div className="game-row-top">
                  <span className="week-label">Week {week}</span>
                  {game && (
                    <span className="kickoff">
                      {formatKickoff(game.startDate, game.startTimeTBD)}
                    </span>
                  )}
                </div>
                <div className="game-row-bottom">
                  {game ? (
                    <span className="opponent">
                      {game.isHome ? 'vs' : '@'} {game.opponent}
                      {owner && (
                        <span className="opponent-owner-inline"> ({owner})</span>
                      )}
                    </span>
                  ) : (
                    <span className="opponent">BYE</span>
                  )}
                  {result && (
                    <span className={`score score-${result.outcome}`}>
                      {result.label}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
