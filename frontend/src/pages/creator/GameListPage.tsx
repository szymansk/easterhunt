import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame, deleteGame, listGames } from '../../services/api'
import type { GameListItem } from '../../types'
import { GameStatus } from '../../types'
import { BigButton, Card, ErrorMessage, LoadingSpinner, Modal } from '../../components/ui'

function statusLabel(status: GameStatus): string {
  const labels: Record<GameStatus, string> = {
    [GameStatus.draft]: 'Entwurf',
    [GameStatus.started]: 'Gestartet',
    [GameStatus.finished]: 'Beendet',
  }
  return labels[status]
}

function statusBadgeClass(status: GameStatus): string {
  const classes: Record<GameStatus, string> = {
    [GameStatus.draft]: 'bg-yellow-100 text-yellow-800',
    [GameStatus.started]: 'bg-green-100 text-green-800',
    [GameStatus.finished]: 'bg-gray-100 text-gray-600',
  }
  return classes[status]
}

export default function GameListPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<GameListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GameListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    listGames()
      .then(setGames)
      .catch(() => setError('Spiele konnten nicht geladen werden. Bitte versuche es erneut.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    setError('')
    try {
      const game = await createGame('Neues Spiel')
      navigate(`/creator/game/${game.id}`)
    } catch {
      setError('Spiel konnte nicht erstellt werden.')
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGame(deleteTarget.id)
      setGames((prev) => prev.filter((g) => g.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      setError('Spiel konnte nicht gelöscht werden.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meine Spiele</h1>
        <BigButton onClick={handleCreate} disabled={creating}>
          {creating ? 'Erstelle…' : '+ Neues Spiel'}
        </BigButton>
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {games.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Noch keine Spiele vorhanden</p>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <Card key={game.id} data-testid="game-list-item" className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 truncate">{game.name}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(game.status)}`}
                  >
                    {game.status === GameStatus.started && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                    )}
                    {statusLabel(game.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {game.station_count} Station{game.station_count !== 1 ? 'en' : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/creator/game/${game.id}`)}
                  className="px-4 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => setDeleteTarget(game)}
                  className="px-4 py-2 min-h-[44px] text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                >
                  Löschen
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Spiel löschen"
      >
        <p className="text-gray-600 mb-6">
          Möchtest du <strong>{deleteTarget?.name}</strong> wirklich löschen? Diese Aktion kann
          nicht rückgängig gemacht werden.
        </p>
        <div className="flex gap-3 justify-end">
          <BigButton variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Abbrechen
          </BigButton>
          <BigButton variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Löschen…' : 'Löschen'}
          </BigButton>
        </div>
      </Modal>
    </div>
  )
}
