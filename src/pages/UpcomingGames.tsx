import { useEffect, useMemo, useRef, useState } from 'react'
import teamsByPerson from '../data/teams-by-person.json'
import TeamLogo from '../components/TeamLogo'
import {
  getCurrentWeek,
  getGameForWeek,
  getMatchupScores,
  getNextGame,
  getTeamOwner,
  getTeamScheduleByWeek,
  isTeamLive,
} from '../data/schedules'
import { getStandings } from '../data/standings'
import { useScoreboard } from '../hooks/useScoreboard'
import { useTeamRecords } from '../hooks/useTeamRecords'
import { useTeamSchedules } from '../hooks/useTeamSchedules'
import type { ScoreboardEntry, TeamGame } from '../types'

const roster = Object.entries(teamsByPerson as Record<string, string[]>).map(
  ([person, teams]) => ({ person, teams }),
)

const dateFormatter = new Intl.DateTimeFormat(undefined, {
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

function getOutcome(
  mine: number,
  theirs: number,
  status: 'live' | 'final',
): 'win' | 'loss' | 'tie' | 'live' {
  if (status === 'live') return 'live'
  if (mine > theirs) return 'win'
  if (mine < theirs) return 'loss'
  return 'tie'
}

// Builds the road/home display for a single game: which team lines up
// on which line, their owners, and their current scores (if the game
// has started or finished).
function getMatchup(
  team: string,
  game: TeamGame,
  scoreboard: Record<string, ScoreboardEntry> | null,
) {
  const road = game.isHome ? game.opponent : team
  const home = game.isHome ? team : game.opponent
  const scores = getMatchupScores(scoreboard, team, game)
  const roadPoints = scores
    ? game.isHome
      ? scores.opponentPoints
      : scores.teamPoints
    : null
  const homePoints = scores
    ? game.isHome
      ? scores.teamPoints
      : scores.opponentPoints
    : null
  const live =
    scores && scores.status === 'live'
      ? [scores.period != null ? `Q${scores.period}` : null, scores.clock]
          .filter(Boolean)
          .join(' ')
      : null
  return {
    road: {
      name: road,
      owner: getTeamOwner(road),
      score: roadPoints,
      outcome:
        scores && roadPoints !== null && homePoints !== null
          ? getOutcome(roadPoints, homePoints, scores.status)
          : null,
    },
    home: {
      name: home,
      owner: getTeamOwner(home),
      score: homePoints,
      outcome:
        scores && roadPoints !== null && homePoints !== null
          ? getOutcome(homePoints, roadPoints, scores.status)
          : null,
    },
    hasResult: scores !== null,
    network: game.network,
    live: live || null,
  }
}

function MatchupTeamLine({
  name,
  owner,
  score,
  outcome,
  onSelect,
}: {
  name: string
  owner: string | null
  score: number | null
  outcome: 'win' | 'loss' | 'tie' | 'live' | null
  onSelect?: () => void
}) {
  const label = (
    <>
      <TeamLogo team={name} className="team-logo" />
      {name}
      {owner && <span className="opponent-owner-inline"> ({owner})</span>}
    </>
  )
  return (
    <div className="matchup-line">
      {onSelect ? (
        <button
          type="button"
          className="team-name team-name-link"
          onClick={onSelect}
        >
          {label}
        </button>
      ) : (
        <span className="team-name">{label}</span>
      )}
      {score !== null && (
        <span className={`score score-${outcome}`}>{score}</span>
      )}
    </div>
  )
}

const OPEN_PERSON_KEY = 'powerfour:openPerson'

function getStoredOpenPerson(): string | null {
  const stored = localStorage.getItem(OPEN_PERSON_KEY)
  if (stored && roster.some((entry) => entry.person === stored)) return stored
  return null
}

export default function UpcomingGames() {
  const [openPerson, setOpenPerson] = useState<string | null>(
    getStoredOpenPerson,
  )
  const hasInteracted = useRef(openPerson !== null)
  const [drawerTeam, setDrawerTeam] = useState<string | null>(null)
  const { schedules, loading, error } = useTeamSchedules()
  const {
    scoreboard,
    loading: scoreboardLoading,
    refresh: refreshScoreboard,
  } = useScoreboard()
  const { records } = useTeamRecords()
  const currentWeek = schedules ? getCurrentWeek(schedules) : null

  // Order by current standings (best record first), with anyone who has
  // a live game right now bumped to the top. Falls back to draft order
  // until standings have loaded.
  const orderedRoster = useMemo(() => {
    const base = records ? getStandings(records) : roster
    return [...base].sort((a, b) => {
      const aLive = a.teams.some((team) => isTeamLive(scoreboard, team))
      const bLive = b.teams.some((team) => isTeamLive(scoreboard, team))
      if (aLive !== bLive) return aLive ? -1 : 1
      return 0
    })
  }, [records, scoreboard])

  // If nobody has an explicit preference (from localStorage or a manual
  // toggle), default to the first person in the current standings order
  // once it's loaded, rather than flashing draft order first.
  useEffect(() => {
    if (hasInteracted.current) return
    if (!records) return
    setOpenPerson(orderedRoster[0]?.person ?? null)
  }, [records, orderedRoster])

  useEffect(() => {
    if (openPerson) localStorage.setItem(OPEN_PERSON_KEY, openPerson)
    else localStorage.removeItem(OPEN_PERSON_KEY)
  }, [openPerson])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          Games{currentWeek != null && ` (Week ${currentWeek})`}
        </h1>
        <button
          type="button"
          className={`refresh-button${scoreboardLoading ? ' is-spinning' : ''}`}
          onClick={refreshScoreboard}
          disabled={scoreboardLoading}
          aria-label="Refresh scores"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 11A8 8 0 1 0 18.5 15.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M20 5V11H14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {loading && <p className="status-message">Loading schedules…</p>}
      {error && !loading && (
        <p className="status-message status-message-error">
          Couldn't load schedules. Try reloading the page.
        </p>
      )}
      {schedules && (
      <div className="team-list">
        {orderedRoster.map((entry) => {
          const isOpen = openPerson === entry.person
          const hasLiveGame = entry.teams.some((team) =>
            isTeamLive(scoreboard, team),
          )
          const seenMatchups = new Set<string>()
          const rows = entry.teams
            .map((team) => ({
              team,
              game:
                getGameForWeek(schedules, team, currentWeek) ??
                getNextGame(schedules, team),
            }))
            .filter(({ team, game }) => {
              if (!game) return true
              // If this person owns both teams in a matchup, only show
              // the game once (from the first team's perspective).
              const key = `${game.week}:${[team, game.opponent].sort().join('~')}`
              if (seenMatchups.has(key)) return false
              seenMatchups.add(key)
              return true
            })
            .sort((a, b) => {
              if (!a.game) return 1
              if (!b.game) return -1
              return (
                new Date(a.game.startDate).getTime() -
                new Date(b.game.startDate).getTime()
              )
            })
          return (
            <div className="team-card" key={entry.person}>
              <button
                type="button"
                className="team-card-header"
                onClick={() => {
                  hasInteracted.current = true
                  setOpenPerson(isOpen ? null : entry.person)
                }}
                aria-expanded={isOpen}
              >
                <span className="person-name">
                  {entry.person}
                  {hasLiveGame && <span className="live-badge">LIVE</span>}
                </span>
              </button>
              {isOpen && (
                <ul className="team-sublist">
                  {rows.map(({ team, game }) => {
                    const matchup = game
                      ? getMatchup(team, game, scoreboard)
                      : null
                    return (
                      <li key={team} className="game-row">
                        {game && matchup ? (
                          <>
                            <MatchupTeamLine
                              name={matchup.road.name}
                              owner={matchup.road.owner}
                              score={matchup.road.score}
                              outcome={matchup.road.outcome}
                              onSelect={
                                schedules[matchup.road.name]
                                  ? () => setDrawerTeam(matchup.road.name)
                                  : undefined
                              }
                            />
                            <MatchupTeamLine
                              name={matchup.home.name}
                              owner={matchup.home.owner}
                              score={matchup.home.score}
                              outcome={matchup.home.outcome}
                              onSelect={
                                schedules[matchup.home.name]
                                  ? () => setDrawerTeam(matchup.home.name)
                                  : undefined
                              }
                            />
                            {!matchup.hasResult && (
                              <div className="game-meta">
                                <span className="kickoff">
                                  {formatKickoff(
                                    game.startDate,
                                    game.startTimeTBD,
                                  )}
                                </span>
                                {matchup.network && (
                                  <span className="network">
                                    {matchup.network}
                                  </span>
                                )}
                              </div>
                            )}
                            {matchup.hasResult && (
                              <div className="game-meta">
                                {matchup.live && matchup.network && (
                                  <span className="network">
                                    {matchup.network}
                                  </span>
                                )}
                                <span
                                  className={
                                    matchup.live ? 'live-clock' : 'final-label'
                                  }
                                >
                                  {matchup.live ?? 'Final'}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="opponent">
                            No games remaining
                          </span>
                        )}
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
          scoreboard={scoreboard}
          currentWeek={currentWeek}
          team={drawerTeam}
          onClose={() => setDrawerTeam(null)}
        />
      )}
    </div>
  )
}

function TeamScheduleDrawer({
  schedules,
  scoreboard,
  currentWeek,
  team,
  onClose,
}: {
  schedules: Record<string, TeamGame[]>
  scoreboard: Record<string, ScoreboardEntry> | null
  currentWeek: number | null
  team: string
  onClose: () => void
}) {
  const weeks = getTeamScheduleByWeek(schedules, team)

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">
            <TeamLogo team={team} className="team-logo team-logo-lg" />
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
            const matchup = game
              ? getMatchup(team, game, week === currentWeek ? scoreboard : null)
              : null
            return (
              <li key={week} className="game-row">
                <div className="game-row-top">
                  <span className="week-label">Week {week}</span>
                </div>
                {game && matchup ? (
                  <>
                    <MatchupTeamLine
                      name={matchup.road.name}
                      owner={matchup.road.owner}
                      score={matchup.road.score}
                      outcome={matchup.road.outcome}
                    />
                    <MatchupTeamLine
                      name={matchup.home.name}
                      owner={matchup.home.owner}
                      score={matchup.home.score}
                      outcome={matchup.home.outcome}
                    />
                    {!matchup.hasResult && (
                      <div className="game-meta">
                        <span className="kickoff">
                          {formatKickoff(game.startDate, game.startTimeTBD)}
                        </span>
                        {matchup.network && (
                          <span className="network">{matchup.network}</span>
                        )}
                      </div>
                    )}
                    {matchup.hasResult && (
                      <div className="game-meta">
                        {matchup.live && matchup.network && (
                          <span className="network">{matchup.network}</span>
                        )}
                        <span
                          className={matchup.live ? 'live-clock' : 'final-label'}
                        >
                          {matchup.live ?? 'Final'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="opponent">BYE</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
