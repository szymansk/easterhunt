import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame, getGameProgress, createGameProgress } from '../../services/api'
import type { Game, GameProgress } from '../../types'
import { GameStatus } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [progress, setProgress] = useState<GameProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [gameData, progressData] = await Promise.all([
        getGame(id),
        getGameProgress(id).catch(async (err) => {
          if (err?.status === 404) {
            return createGameProgress(id)
          }
          throw err
        }),
      ])
      setGame(gameData)
      setProgress(progressData)
    } catch {
      setError('Spiel konnte nicht geladen werden. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!game || !progress) return null

  if (game.status === GameStatus.finished) {
    navigate(`/play/${id}/complete`, { replace: true })
    return null
  }

  const sortedStations = [...game.stations].sort((a, b) => a.position - b.position)

  function getStationStatus(position: number): 'completed' | 'current' | 'locked' {
    if (!progress) return 'locked'
    if ((progress.stations_completed as number[]).includes(position)) return 'completed'
    if (progress.current_station === position) return 'current'
    return 'locked'
  }

  function handleStationTap(stationId: string, position: number) {
    if (getStationStatus(position) !== 'current') return
    navigate(`/play/${id}/station/${stationId}`)
  }

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-2">
          {game.name}
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Station {progress.current_station} von {game.stations.length}
        </p>

        <div className="space-y-3">
          {sortedStations.map((station, idx) => {
            const status = getStationStatus(station.position)
            const stationNumber = idx + 1

            return (
              <div
                key={station.id}
                data-testid={`station-${stationNumber}`}
                data-status={status}
                onClick={() => handleStationTap(station.id, station.position)}
                className={[
                  'rounded-2xl p-4 flex items-center gap-4 shadow transition-transform',
                  status === 'completed'
                    ? 'bg-green-100 border-2 border-green-400'
                    : status === 'current'
                      ? 'bg-white border-2 border-orange-400 cursor-pointer active:scale-95'
                      : 'bg-gray-100 border-2 border-gray-200 opacity-60',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0',
                    status === 'completed'
                      ? 'bg-green-400 text-white'
                      : status === 'current'
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-300 text-gray-500',
                  ].join(' ')}
                >
                  {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : stationNumber}
                </div>
                <div className="flex-1">
                  <p
                    className={[
                      'font-semibold',
                      status === 'completed'
                        ? 'text-green-700'
                        : status === 'current'
                          ? 'text-orange-700'
                          : 'text-gray-400',
                    ].join(' ')}
                  >
                    Station {stationNumber}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {station.mini_game_type.replace('_', ' ')}
                  </p>
                </div>
                {status === 'current' && (
                  <span className="text-orange-400 text-2xl">▶</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
