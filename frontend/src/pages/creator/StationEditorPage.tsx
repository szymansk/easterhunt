import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MazeConfigForm from '../../components/minigames/MazeConfigForm'
import NumberRiddleConfigForm from '../../components/minigames/NumberRiddleConfigForm'
import PictureRiddleConfigForm from '../../components/minigames/PictureRiddleConfigForm'
import PuzzleConfigForm from '../../components/minigames/PuzzleConfigForm'
import TextRiddleConfigForm from '../../components/minigames/TextRiddleConfigForm'
import { BigButton, Card, ErrorMessage, LoadingSpinner, Modal } from '../../components/ui'
import { getStation, listStations, updateStation } from '../../services/api'
import type { MiniGameConfig, Station } from '../../types'
import { MiniGameType } from '../../types'

const MINI_GAME_TYPES: { type: MiniGameType; label: string; icon: string }[] = [
  { type: MiniGameType.puzzle, label: 'Puzzle', icon: '🧩' },
  { type: MiniGameType.number_riddle, label: 'Zahlenrätsel', icon: '🔢' },
  { type: MiniGameType.maze, label: 'Labyrinth', icon: '🌀' },
  { type: MiniGameType.text_riddle, label: 'Texträtsel', icon: '📝' },
  { type: MiniGameType.picture_riddle, label: 'Bilderrätsel', icon: '🖼️' },
]

function defaultConfig(type: MiniGameType): MiniGameConfig {
  switch (type) {
    case MiniGameType.puzzle:
      return { type: MiniGameType.puzzle, grid_size: 4 }
    case MiniGameType.number_riddle:
      return {
        type: MiniGameType.number_riddle,
        task_type: 'count',
        prompt_text: '',
        correct_answer: 1,
        distractor_answers: [2, 3],
      }
    case MiniGameType.maze:
      return { type: MiniGameType.maze, maze_data: { difficulty: 'easy', rows: 5, cols: 5 } }
    case MiniGameType.text_riddle:
      return {
        type: MiniGameType.text_riddle,
        question_text: '',
        answer_mode: 'multiple_choice',
        answer_options: [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
        ],
        tts_enabled: false,
      }
    case MiniGameType.picture_riddle:
      return {
        type: MiniGameType.picture_riddle,
        category: '',
        reference_items: [],
        answer_options: [],
      }
  }
}

function validateConfig(type: MiniGameType, config: MiniGameConfig): Record<string, string> {
  const errs: Record<string, string> = {}
  switch (type) {
    case MiniGameType.number_riddle: {
      const c = config as import('../../types').NumberRiddleConfig
      if (!c.prompt_text.trim()) errs.prompt_text = 'Frage ist erforderlich'
      if (!c.distractor_answers || c.distractor_answers.length < 2 || c.distractor_answers.length > 4)
        errs.distractor_answers = '2–4 falsche Antworten erforderlich'
      break
    }
    case MiniGameType.text_riddle: {
      const c = config as import('../../types').TextRiddleConfig
      if (!c.question_text.trim()) errs.question_text = 'Frage ist erforderlich'
      const filled = c.answer_options.filter((o) => o.text.trim())
      if (filled.length < 2) errs.answer_options = 'Mindestens 2 Antwortoptionen erforderlich'
      break
    }
    case MiniGameType.picture_riddle: {
      const c = config as import('../../types').PictureRiddleConfig
      if (!c.category?.trim()) errs.category = 'Kategorie ist erforderlich'
      if (c.reference_items.length !== 2) errs.reference_items = 'Genau 2 Referenzbilder erforderlich'
      if (c.answer_options.length !== 4) errs.answer_options = 'Genau 4 Antwortoptionen erforderlich'
      break
    }
  }
  return errs
}

export default function StationEditorPage() {
  const { id: gameId, sid: stationId } = useParams<{ id: string; sid: string }>()
  const navigate = useNavigate()

  const [station, setStation] = useState<Station | null>(null)
  const [allStations, setAllStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [miniGameType, setMiniGameType] = useState<MiniGameType>(MiniGameType.puzzle)
  const [config, setConfig] = useState<MiniGameConfig>(defaultConfig(MiniGameType.puzzle))
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({})
  const [typeChangeTarget, setTypeChangeTarget] = useState<MiniGameType | null>(null)

  useEffect(() => {
    if (!gameId || !stationId) return
    Promise.all([getStation(gameId, stationId), listStations(gameId)])
      .then(([s, stations]) => {
        setStation(s)
        setAllStations(stations)
        setMiniGameType(s.mini_game_type)
        // Reconstruct typed config from raw dict
        setConfig({ type: s.mini_game_type, ...s.mini_game_config } as MiniGameConfig)
      })
      .catch(() => setError('Station konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [gameId, stationId])

  function handleTypeSelect(type: MiniGameType) {
    if (type === miniGameType) return
    setTypeChangeTarget(type)
  }

  function confirmTypeChange() {
    if (!typeChangeTarget) return
    setMiniGameType(typeChangeTarget)
    setConfig(defaultConfig(typeChangeTarget))
    setConfigErrors({})
    setTypeChangeTarget(null)
  }

  async function handleSave() {
    if (!gameId || !stationId) return
    const errs = validateConfig(miniGameType, config)
    if (Object.keys(errs).length > 0) {
      setConfigErrors(errs)
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateStation(gameId, stationId, {
        mini_game_type: miniGameType,
        mini_game_config: config as unknown as Record<string, unknown>,
      })
      setStation(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Station konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!station) {
    return <ErrorMessage message={error || 'Station nicht gefunden.'} />
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/creator/game/${gameId}`)}
          className="text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium text-sm min-h-[44px] px-1"
        >
          ← Zurück
        </button>
        <h1 className="text-xl font-bold text-gray-800">Station {station.position}</h1>
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {/* Image upload area */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Stationsbild</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {station.image_path ? (
              <img src={station.image_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            {station.image_path ? (
              <p className="text-sm text-gray-600 mb-2 truncate">{station.image_path}</p>
            ) : (
              <p className="text-sm text-amber-600 mb-2">Kein Bild ausgewählt</p>
            )}
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 active:text-blue-800 min-h-[44px] px-1">
              Bild hochladen
            </button>
          </div>
        </div>
      </Card>

      {/* Mini game type selection */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Minispiel-Typ</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MINI_GAME_TYPES.map(({ type, label, icon }) => {
            const selected = miniGameType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeSelect(type)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className={`text-xs font-medium ${selected ? 'text-blue-700' : 'text-gray-600'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Config panel */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Konfiguration</h2>
        {miniGameType === MiniGameType.puzzle && (() => {
          // Puzzle station N uses the image from station N+1 as source.
          // For the last station, fall back to the current station.
          const sorted = [...allStations].sort((a, b) => a.position - b.position)
          const currentIdx = sorted.findIndex((s) => s.id === stationId)
          const nextStation = currentIdx >= 0 && currentIdx < sorted.length - 1
            ? sorted[currentIdx + 1]
            : sorted[currentIdx] ?? null
          return (
            <PuzzleConfigForm
              value={config as import('../../types').PuzzleConfig}
              onChange={setConfig}
              errors={configErrors}
              gameId={gameId}
              generateStationId={nextStation?.id}
            />
          )
        })()}
        {miniGameType === MiniGameType.number_riddle && (
          <NumberRiddleConfigForm
            value={config as import('../../types').NumberRiddleConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.maze && (
          <MazeConfigForm
            value={config as import('../../types').MazeConfig}
            onChange={setConfig}
            gameId={gameId}
            stationId={stationId}
          />
        )}
        {miniGameType === MiniGameType.text_riddle && (
          <TextRiddleConfigForm
            value={config as import('../../types').TextRiddleConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.picture_riddle && (
          <PictureRiddleConfigForm
            value={config as import('../../types').PictureRiddleConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
      </Card>

      <BigButton onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Speichern'}
      </BigButton>

      {/* Type change confirmation modal */}
      <Modal
        isOpen={typeChangeTarget !== null}
        onClose={() => setTypeChangeTarget(null)}
        title="Minispiel-Typ wechseln"
      >
        <p className="text-gray-600 mb-6">
          Wenn du den Typ wechselst, wird die aktuelle Konfiguration zurückgesetzt. Möchtest du
          fortfahren?
        </p>
        <div className="flex gap-3 justify-end">
          <BigButton variant="secondary" onClick={() => setTypeChangeTarget(null)}>
            Abbrechen
          </BigButton>
          <BigButton onClick={confirmTypeChange}>Wechseln</BigButton>
        </div>
      </Modal>
    </div>
  )
}
