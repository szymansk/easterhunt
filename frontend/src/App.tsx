import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GameListPage from './pages/creator/GameListPage'
import GameEditorPage from './pages/creator/GameEditorPage'
import StationEditorPage from './pages/creator/StationEditorPage'
import PlayerPage from './pages/play/PlayerPage'
import PlayerGameListPage from './pages/play/PlayerGameListPage'
import StationMiniGamePage from './pages/play/StationMiniGamePage'
import GameCompletionScreen from './pages/play/GameCompletionScreen'
import NotFoundPage from './pages/NotFoundPage'
import CreatorLayout from './components/layouts/CreatorLayout'
import PlayerLayout from './components/layouts/PlayerLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/creator" element={<CreatorLayout />}>
        <Route index element={<GameListPage />} />
        <Route path="game/:id" element={<GameEditorPage />} />
        <Route path="game/:id/station/:sid" element={<StationEditorPage />} />
      </Route>
      <Route path="/play" element={<PlayerLayout />}>
        <Route index element={<PlayerGameListPage />} />
        <Route path=":id" element={<PlayerPage />} />
        <Route path=":id/station/:sid" element={<StationMiniGamePage />} />
        <Route path=":id/complete" element={<GameCompletionScreen />} />
      </Route>
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
