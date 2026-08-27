import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Leaderboard from './pages/Leaderboard'
import Teams from './pages/Teams'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>PowerFour</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/teams" element={<Teams />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
