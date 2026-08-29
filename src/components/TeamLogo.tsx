import { getTeamLogo } from '../data/schedules'

// Renders a team's logo, or a generic football icon (sized to match)
// for teams the CFBD API doesn't have logo art for.
export default function TeamLogo({
  team,
  className,
}: {
  team: string
  className?: string
}) {
  const logo = getTeamLogo(team)
  if (logo) {
    return <img src={logo} alt="" className={className} />
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={`team-logo-fallback ${className ?? ''}`.trim()}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="12" rx="10" ry="6" fill="currentColor" />
      <path
        d="M5.5 12h13M9.5 9.3v5.4M12 8.8v6.4M14.5 9.3v5.4"
        stroke="var(--bg)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  )
}
