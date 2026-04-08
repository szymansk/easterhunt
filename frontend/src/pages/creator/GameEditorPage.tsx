import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  createGameProgress,
  createStation,
  deleteStation,
  getGame,
  getGameProgress,
  reorderStations,
  startGame,
  updateGame,
} from '../../services/api'
import type { Game, GameProgress, StartGameError, Station } from '../../types'
import { GameStatus, MiniGameType } from '../../types'
import { BigButton, Card, ErrorMessage, LoadingSpinner, Modal } from '../../components/ui'

const MAX_STATIONS = 20

function miniGameLabel(type: MiniGameType): string {
  const labels: Record<MiniGameType, string> = {
    [MiniGameType.puzzle]: 'Puzzle',
    [MiniGameType.number_riddle]: 'Zahlenrätsel',
    [MiniGameType.maze]: 'Labyrinth',
    [MiniGameType.text_riddle]: 'Texträtsel',
    [MiniGameType.picture_riddle]: 'Bilderrätsel',
    [MiniGameType.treasure]: '🎁 Schatz',
    [MiniGameType.memory]: 'Memory',
    [MiniGameType.sound_match]: 'Geräusch-Zuordnung',
    [MiniGameType.color_sort]: 'Farb-Sortierer',
    [MiniGameType.spot_difference]: 'Fehler finden',
    [MiniGameType.shadow_match]: 'Schatten-Matching',
    [MiniGameType.balloon_pop]: 'Ballons platzen',
    [MiniGameType.catch_fish]: 'Fisch fangen',
    [MiniGameType.whack_a_mole]: 'Whack-a-Mole',
    [MiniGameType.build_object]: 'Objekt bauen',
    [MiniGameType.sequence_sort]: 'Reihenfolge',
    [MiniGameType.decorate]: 'Dekorieren',
    [MiniGameType.hidden_object]: 'Wimmelbild',
    [MiniGameType.comparison]: 'Vergleich',
    [MiniGameType.rhythm]: 'Rhythmus',
    [MiniGameType.cause_effect]: 'Ursache-Wirkung',
    [MiniGameType.avoid_obstacles]: 'Hindernisse',
    [MiniGameType.role_play]: 'Rollenspiel',
    [MiniGameType.logic_puzzle]: 'Logikrätsel',
  }
  return labels[type]
}

interface SortableStationRowProps {
  station: Station
  game: { status: string }
  onEdit: () => void
  onDelete?: (stationId: string) => void
}

function SortableStationRow({ station, game, onEdit, onDelete }: SortableStationRowProps) {
  const isTreasure = station.mini_game_type === MiniGameType.treasure
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: station.id,
    disabled: isTreasure,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} data-testid="station-item" className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-3 border border-gray-100">
      {/* Drag handle — hidden for treasure */}
      {isTreasure ? (
        <div className="min-w-[44px] min-h-[44px]" />
      ) : (
        <button
          className="touch-none cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Verschieben"
          data-testid={`drag-handle-${station.id}`}
          {...attributes}
          {...listeners}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>
      )}

      {/* Position number */}
      <span className="w-6 text-sm font-semibold text-gray-500 text-center">{station.position}</span>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {station.image_path ? (
          <img src={station.image_path} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Mini game type + completeness */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{miniGameLabel(station.mini_game_type)}</p>
        {!station.image_path && (
          <p className="text-xs text-amber-600 mt-0.5">Kein Stationsbild</p>
        )}
      </div>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="px-3 py-2 min-h-[44px] text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors shrink-0"
      >
        Bearbeiten
      </button>

      {/* Delete button — only for non-treasure stations in draft games */}
      {!isTreasure && game.status === 'draft' && onDelete && (
        <button
          onClick={() => onDelete(station.id)}
          className="p-2 min-h-[44px] min-w-[44px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 flex items-center justify-center"
          aria-label="Station löschen"
          data-testid={`delete-btn-${station.id}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function GameEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [game, setGame] = useState<Game | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [progress, setProgress] = useState<GameProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nameEditing, setNameEditing] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startErrors, setStartErrors] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!id) return
    getGame(id)
      .then((g) => {
        setGame(g)
        setNameValue(g.name)
        const sorted = [...g.stations].sort((a, b) => a.position - b.position)
        setStations(sorted)
        if (g.status !== GameStatus.draft) {
          getGameProgress(id).then(setProgress).catch(() => {})
        }
      })
      .catch(() => setError('Spiel konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (nameEditing) nameInputRef.current?.focus()
  }, [nameEditing])

  async function handleNameSave() {
    if (!game || !id) return
    setNameSaving(true)
    try {
      const updated = await updateGame(id, { name: nameValue })
      setGame((prev) => (prev ? { ...prev, name: updated.name } : prev))
      setNameEditing(false)
    } catch {
      setError('Name konnte nicht gespeichert werden.')
    } finally {
      setNameSaving(false)
    }
  }

  async function handleAddStation() {
    if (!id) return
    setAdding(true)
    setError('')
    try {
      const newStation = await createStation(id, {
        position: stations.length + 1,
        image_path: null,
        mini_game_type: MiniGameType.puzzle,
        mini_game_config: { type: 'puzzle', grid_size: 4 },
      })
      setStations((prev) => [...prev, newStation])
    } catch {
      setError('Station konnte nicht hinzugefügt werden.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !id) return

    const oldIndex = stations.findIndex((s) => s.id === active.id)
    const newIndex = stations.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(stations, oldIndex, newIndex).map((s, i) => ({
      ...s,
      position: i + 1,
    }))
    setStations(reordered) // optimistic

    try {
      const updated = await reorderStations(id, reordered.map((s) => s.id))
      setStations(updated.sort((a, b) => a.position - b.position))
    } catch {
      // revert on error
      setStations(stations)
      setError('Reihenfolge konnte nicht gespeichert werden.')
    }
  }

  async function handleConfirmDelete() {
    if (!id || !deletingId) return
    setDeleteInProgress(true)
    setError('')
    try {
      await deleteStation(id, deletingId)
      setStations((prev) => {
        const filtered = prev.filter((s) => s.id !== deletingId)
        return filtered.map((s, i) => ({ ...s, position: i + 1 }))
      })
    } catch {
      setError('Station konnte nicht gelöscht werden.')
    } finally {
      setDeleteInProgress(false)
      setDeletingId(null)
    }
  }

  async function handleReset() {
    if (!id) return
    setResetting(true)
    setError('')
    try {
      const newProgress = await createGameProgress(id)
      setProgress(newProgress)
      setGame((prev) => prev ? { ...prev, status: GameStatus.started } : prev)
    } catch {
      setError('Fortschritt konnte nicht zurückgesetzt werden.')
    } finally {
      setResetting(false)
    }
  }

  async function handleStartGame() {
    if (!id) return
    setStarting(true)
    setStartErrors([])
    setError('')
    try {
      await startGame(id)
      navigate(`/play/${id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as StartGameError | undefined
        if (body?.incomplete_stations?.length) {
          setStartErrors(
            body.incomplete_stations.map((pos) => `Station ${pos}: Kein Stationsbild`),
          )
        } else {
          setStartErrors([body?.detail ?? 'Spiel ist unvollständig.'])
        }
      } else {
        setError('Spiel konnte nicht gestartet werden.')
      }
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!game) {
    return <ErrorMessage message={error || 'Spiel nicht gefunden.'} />
  }

  const atMax = stations.length >= MAX_STATIONS

  return (
    <div>
      {/* Game name */}
      <div className="flex items-center gap-3 mb-6">
        {nameEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave()
                if (e.key === 'Escape') {
                  setNameValue(game.name)
                  setNameEditing(false)
                }
              }}
              className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 outline-none bg-transparent flex-1"
            />
            <button
              onClick={handleNameSave}
              disabled={nameSaving}
              className="text-sm text-blue-600 font-medium px-3 py-1 hover:bg-blue-50 rounded-lg"
            >
              {nameSaving ? 'Speichern…' : 'Speichern'}
            </button>
            <button
              onClick={() => { setNameValue(game.name); setNameEditing(false) }}
              className="text-sm text-gray-500 px-3 py-1 hover:bg-gray-100 rounded-lg"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setNameEditing(true)}
            data-testid="game-title"
            className="flex items-center gap-2 group text-left"
            aria-label="Spielname bearbeiten"
          >
            <h1 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              {game.name}
            </h1>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress banner for running / finished games */}
      {game.status !== GameStatus.draft && (
        <div className={`mb-5 rounded-xl p-4 flex items-center justify-between gap-4 ${
          game.status === GameStatus.started
            ? 'bg-green-50 border border-green-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div>
            {game.status === GameStatus.started ? (
              <>
                <p className="font-semibold text-green-800 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Spiel läuft
                </p>
                {progress && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Spieler ist bei Station {progress.current_station} von {stations.length}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-700">Spiel beendet</p>
                {progress && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {progress.stations_completed.length} von {stations.length} Stationen abgeschlossen
                  </p>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="shrink-0 px-4 py-2 min-h-[44px] text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
          >
            {resetting
              ? 'Zurücksetzen…'
              : game.status === GameStatus.started
                ? 'Zurücksetzen'
                : 'Neu starten'}
          </button>
        </div>
      )}

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {/* Stations list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">
            Stationen ({stations.length}/{MAX_STATIONS})
          </h2>
          <div className="flex items-center gap-2">
            {atMax && (
              <span className="text-xs text-amber-600 font-medium">Maximale Anzahl erreicht</span>
            )}
            <BigButton onClick={handleAddStation} disabled={adding || atMax}>
              {adding ? 'Hinzufügen…' : '+ Station'}
            </BigButton>
          </div>
        </div>

        {stations.length === 0 ? (
          <Card className="text-center py-8 text-gray-500">
            Noch keine Stationen. Füge deine erste Station hinzu!
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={stations.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {stations.map((station) => (
                  <SortableStationRow
                    key={station.id}
                    station={station}
                    game={game}
                    onEdit={() => navigate(`/creator/game/${id}/station/${station.id}`)}
                    onDelete={(sid) => setDeletingId(sid)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Start / play section */}
      <div className="border-t border-gray-200 pt-6">
        {startErrors.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-700 mb-2">Spiel kann nicht gestartet werden:</p>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {startErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {game.status === GameStatus.draft ? (
          <>
            <BigButton
              onClick={handleStartGame}
              disabled={starting || stations.length === 0}
              className="w-full"
            >
              {starting ? 'Starte…' : '▶ Spiel starten'}
            </BigButton>
            {stations.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Mindestens eine Station erforderlich
              </p>
            )}
          </>
        ) : (
          <BigButton onClick={() => navigate(`/play/${id}`)} className="w-full">
            ▶ Zur Spielansicht
          </BigButton>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Station löschen"
      >
        <p className="text-gray-600 mb-6">
          Station „{stations.find((s) => s.id === deletingId)?.position}" wirklich löschen?
          Alle Daten gehen verloren.
        </p>
        <div className="flex gap-3 justify-end">
          <BigButton variant="secondary" onClick={() => setDeletingId(null)} disabled={deleteInProgress}>
            Abbrechen
          </BigButton>
          <BigButton onClick={handleConfirmDelete} disabled={deleteInProgress}>
            {deleteInProgress ? 'Löschen…' : 'Löschen'}
          </BigButton>
        </div>
      </Modal>
    </div>
  )
}
