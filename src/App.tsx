import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Leaderboard from './pages/Leaderboard'
import UpcomingGames from './pages/UpcomingGames'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>PowerFour</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/upcoming" element={<UpcomingGames />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
