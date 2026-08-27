import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      >
        Leaderboard
      </NavLink>
      <NavLink
        to="/upcoming"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      >
        Upcoming Games
      </NavLink>
    </nav>
  )
}
