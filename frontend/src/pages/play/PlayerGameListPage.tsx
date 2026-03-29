import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGames } from '../../services/api'
import type { GameListItem } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function PlayerGameListPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<GameListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listGames('started')
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <p className="text-2xl font-bold text-gray-600">
          Noch kein Spiel gestartet. Frag einen Erwachsenen!
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center text-orange-500 mb-2">Spiel auswählen</h1>
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => navigate(`/play/${game.id}`)}
          className="w-full min-h-[60px] bg-white rounded-2xl shadow-md border border-orange-100 p-5 text-left active:scale-95 transition-transform"
          data-testid={`game-card-${game.id}`}
        >
          <p className="text-xl font-bold text-gray-800">{game.name}</p>
          <p className="text-sm text-gray-500 mt-1">{game.station_count} Stationen</p>
        </button>
      ))}
    </div>
  )
}
