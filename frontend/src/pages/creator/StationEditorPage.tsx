import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MazeConfigForm from '../../components/minigames/MazeConfigForm'
import NumberRiddleConfigForm from '../../components/minigames/NumberRiddleConfigForm'
import PictureRiddleConfigForm from '../../components/minigames/PictureRiddleConfigForm'
import PuzzleConfigForm from '../../components/minigames/PuzzleConfigForm'
import TextRiddleConfigForm from '../../components/minigames/TextRiddleConfigForm'
import MemoryConfigForm from '../../components/minigames/MemoryConfigForm'
import SoundMatchConfigForm from '../../components/minigames/SoundMatchConfigForm'
import ColorSortConfigForm from '../../components/minigames/ColorSortConfigForm'
import SpotDifferenceConfigForm from '../../components/minigames/SpotDifferenceConfigForm'
import ShadowMatchConfigForm from '../../components/minigames/ShadowMatchConfigForm'
import BalloonPopConfigForm from '../../components/minigames/BalloonPopConfigForm'
import CatchFishConfigForm from '../../components/minigames/CatchFishConfigForm'
import WhackAMoleConfigForm from '../../components/minigames/WhackAMoleConfigForm'
import BuildObjectConfigForm from '../../components/minigames/BuildObjectConfigForm'
import SequenceSortConfigForm from '../../components/minigames/SequenceSortConfigForm'
import DecorateConfigForm from '../../components/minigames/DecorateConfigForm'
import HiddenObjectConfigForm from '../../components/minigames/HiddenObjectConfigForm'
import ComparisonConfigForm from '../../components/minigames/ComparisonConfigForm'
import RhythmConfigForm from '../../components/minigames/RhythmConfigForm'
import CauseEffectConfigForm from '../../components/minigames/CauseEffectConfigForm'
import AvoidObstaclesConfigForm from '../../components/minigames/AvoidObstaclesConfigForm'
import RolePlayConfigForm from '../../components/minigames/RolePlayConfigForm'
import LogicPuzzleConfigForm from '../../components/minigames/LogicPuzzleConfigForm'
import { BigButton, Card, ErrorMessage, ImageUpload, LoadingSpinner, Modal } from '../../components/ui'
import { getStation, listStations, updateStation } from '../../services/api'
import type { MiniGameConfig, Station } from '../../types'
import { MiniGameType } from '../../types'

const MINI_GAME_TYPES: { type: MiniGameType; label: string; icon: string }[] = [
  { type: MiniGameType.puzzle, label: 'Puzzle', icon: '🧩' },
  { type: MiniGameType.number_riddle, label: 'Zahlenrätsel', icon: '🔢' },
  { type: MiniGameType.maze, label: 'Labyrinth', icon: '🌀' },
  { type: MiniGameType.text_riddle, label: 'Texträtsel', icon: '📝' },
  { type: MiniGameType.picture_riddle, label: 'Bilderrätsel', icon: '🖼️' },
  { type: MiniGameType.memory, label: 'Memory', icon: '🃏' },
  { type: MiniGameType.sound_match, label: 'Geräusch-Zuordnung', icon: '🐾' },
  { type: MiniGameType.color_sort, label: 'Farb-Sortierer', icon: '🎨' },
  { type: MiniGameType.spot_difference, label: 'Fehler finden', icon: '🕵️' },
  { type: MiniGameType.shadow_match, label: 'Schatten-Matching', icon: '👻' },
  { type: MiniGameType.balloon_pop, label: 'Ballons platzen', icon: '🎈' },
  { type: MiniGameType.catch_fish, label: 'Fisch fangen', icon: '🐟' },
  { type: MiniGameType.whack_a_mole, label: 'Whack-a-Mole', icon: '🐭' },
  { type: MiniGameType.build_object, label: 'Objekt bauen', icon: '🧱' },
  { type: MiniGameType.sequence_sort, label: 'Reihenfolge', icon: '🔢' },
  { type: MiniGameType.decorate, label: 'Dekorieren', icon: '🧁' },
  { type: MiniGameType.hidden_object, label: 'Wimmelbild', icon: '🔍' },
  { type: MiniGameType.comparison, label: 'Vergleich', icon: '⚖️' },
  { type: MiniGameType.rhythm, label: 'Rhythmus', icon: '🎵' },
  { type: MiniGameType.cause_effect, label: 'Ursache-Wirkung', icon: '🧲' },
  { type: MiniGameType.avoid_obstacles, label: 'Hindernisse', icon: '🚧' },
  { type: MiniGameType.role_play, label: 'Rollenspiel', icon: '🏥' },
  { type: MiniGameType.logic_puzzle, label: 'Logikrätsel', icon: '🧠' },
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
    case MiniGameType.treasure:
      return { type: MiniGameType.treasure }
    case MiniGameType.memory:
      return {
        type: MiniGameType.memory,
        pairs: [
          { id: 'p1', image_url: '', label: 'Pair 1' },
          { id: 'p2', image_url: '', label: 'Pair 2' },
          { id: 'p3', image_url: '', label: 'Pair 3' },
          { id: 'p4', image_url: '', label: 'Pair 4' },
        ],
        grid_cols: 4,
      }
    case MiniGameType.sound_match:
      return {
        type: MiniGameType.sound_match,
        sound_url: '',
        correct_item: { image_url: '', label: '' },
        distractors: [{ image_url: '', label: '' }, { image_url: '', label: '' }],
      }
    case MiniGameType.color_sort:
      return {
        type: MiniGameType.color_sort,
        buckets: [
          { id: 'red', color: '#ff0000', label: 'Rot', item_ids: [] },
          { id: 'blue', color: '#0000ff', label: 'Blau', item_ids: [] },
        ],
        items: [
          { id: 'item1', color: '#ff0000', label: 'Item 1', emoji: '🔴' },
          { id: 'item2', color: '#ff0000', label: 'Item 2', emoji: '❤️' },
          { id: 'item3', color: '#0000ff', label: 'Item 3', emoji: '🔵' },
          { id: 'item4', color: '#0000ff', label: 'Item 4', emoji: '💙' },
        ],
      }
    case MiniGameType.spot_difference:
      return {
        type: MiniGameType.spot_difference,
        image_url: '',
        prompt: 'Finde die Unterschiede!',
        targets: [{ id: 't1', label: 'Unterschied 1', x_pct: 50, y_pct: 50, radius_pct: 10 }],
      }
    case MiniGameType.shadow_match:
      return {
        type: MiniGameType.shadow_match,
        silhouette_image_url: '',
        prompt: 'Was ist das?',
        options: [
          { id: 'o1', image_url: '', label: 'Option 1', is_correct: true },
          { id: 'o2', image_url: '', label: 'Option 2', is_correct: false },
        ],
      }
    case MiniGameType.balloon_pop:
      return {
        type: MiniGameType.balloon_pop,
        prompt: 'Platze die Ballons!',
        target_count: 3,
        balloon_emoji: '🎈',
        total_balloons: 5,
      }
    case MiniGameType.catch_fish:
      return {
        type: MiniGameType.catch_fish,
        prompt: 'Fang die Fische!',
        target_count: 3,
        fish_emoji: '🐟',
        total_fish: 5,
        animation_speed: 'medium',
      }
    case MiniGameType.whack_a_mole:
      return {
        type: MiniGameType.whack_a_mole,
        duration_s: 30,
        grid_size: 3,
        appear_ms: 800,
        mole_emoji: '🐭',
        target_score: 5,
      }
    case MiniGameType.build_object:
      return {
        type: MiniGameType.build_object,
        background_image: '',
        parts: [
          { id: 'p1', image_url: '', label: 'Teil 1', slot_x_pct: 30, slot_y_pct: 30, width_pct: 20, height_pct: 20 },
          { id: 'p2', image_url: '', label: 'Teil 2', slot_x_pct: 70, slot_y_pct: 70, width_pct: 20, height_pct: 20 },
        ],
        prompt: 'Baue das Objekt!',
      }
    case MiniGameType.sequence_sort:
      return {
        type: MiniGameType.sequence_sort,
        steps: [
          { id: 's1', image_url: '', label: 'Schritt 1', correct_order: 0 },
          { id: 's2', image_url: '', label: 'Schritt 2', correct_order: 1 },
          { id: 's3', image_url: '', label: 'Schritt 3', correct_order: 2 },
        ],
        prompt: 'Ordne die Schritte!',
      }
    case MiniGameType.decorate:
      return {
        type: MiniGameType.decorate,
        base_image: '',
        prompt: 'Dekoriere!',
        stickers: [
          { id: 'st1', image_url: '', label: 'Sticker 1' },
          { id: 'st2', image_url: '', label: 'Sticker 2' },
        ],
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }
    case MiniGameType.hidden_object:
      return {
        type: MiniGameType.hidden_object,
        scene_image: '',
        prompt: 'Finde alle Gegenstände!',
        targets: [
          { id: 't1', label: 'Objekt 1', x_pct: 30, y_pct: 40, radius_pct: 8 },
          { id: 't2', label: 'Objekt 2', x_pct: 70, y_pct: 60, radius_pct: 8 },
        ],
      }
    case MiniGameType.comparison:
      return {
        type: MiniGameType.comparison,
        question: 'Was ist größer?',
        left_item: { image_url: '', label: 'Links', value: 5 },
        right_item: { image_url: '', label: 'Rechts', value: 3 },
        correct_side: 'left',
        comparison_type: 'size',
      }
    case MiniGameType.rhythm:
      return {
        type: MiniGameType.rhythm,
        pattern: [{ delay_ms: 0 }, { delay_ms: 500 }, { delay_ms: 500 }],
        prompt: 'Tippe den Rhythmus nach!',
        max_attempts: 3,
        tolerance_ms: 250,
      }
    case MiniGameType.cause_effect:
      return {
        type: MiniGameType.cause_effect,
        scene_image: '',
        prompt: 'Tippe auf die Objekte!',
        objects: [
          { id: 'o1', x_pct: 30, y_pct: 40, image_url: '', label: 'Objekt 1', animation: 'bounce', sound: 'snap' },
          { id: 'o2', x_pct: 70, y_pct: 60, image_url: '', label: 'Objekt 2', animation: 'spin', sound: null },
        ],
        require_all_tapped: true,
      }
    case MiniGameType.avoid_obstacles:
      return {
        type: MiniGameType.avoid_obstacles,
        obstacle_speed: 2,
        lives: 3,
        target_distance: 300,
        character_emoji: '🐰',
        obstacle_emoji: '🪨',
      }
    case MiniGameType.role_play:
      return {
        type: MiniGameType.role_play,
        scene_image: '',
        prompt: 'Führe die Aufgabe durch!',
        steps: [
          { id: 'step1', object_image: '', object_label: 'Objekt 1', action_label: 'Aktion 1', x_pct: 30, y_pct: 40, sound: 'snap' },
          { id: 'step2', object_image: '', object_label: 'Objekt 2', action_label: 'Aktion 2', x_pct: 70, y_pct: 60, sound: null },
        ],
        ordered: false,
      }
    case MiniGameType.logic_puzzle:
      return {
        type: MiniGameType.logic_puzzle,
        scene_image: '',
        prompt: 'Löse das Rätsel!',
        elements: [
          { id: 'el1', type: 'switch', x_pct: 30, y_pct: 40, image_off: '', image_on: '', label: 'Schalter 1' },
          { id: 'el2', type: 'button', x_pct: 70, y_pct: 60, image_off: '', image_on: '', label: 'Knopf 1' },
        ],
        solution: ['el1', 'el2'],
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
        <ImageUpload
          gameId={gameId!}
          stationId={stationId!}
          currentImageUrl={station.image_path}
          onUploaded={(imagePath) => {
            setStation((s) => s ? { ...s, image_path: imagePath } : s)
          }}
        />
      </Card>

      {/* Mini game type selection — hidden for treasure stations */}
      {miniGameType !== MiniGameType.treasure && (
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
      )}

      {/* Config panel — hidden for treasure stations */}
      {miniGameType !== MiniGameType.treasure && <Card className="mb-6">
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
              stationId={stationId}
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
        {miniGameType === MiniGameType.memory && (
          <MemoryConfigForm
            value={config as import('../../types').MemoryConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.sound_match && (
          <SoundMatchConfigForm
            value={config as import('../../types').SoundMatchConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.color_sort && (
          <ColorSortConfigForm
            value={config as import('../../types').ColorSortConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.spot_difference && (
          <SpotDifferenceConfigForm
            value={config as import('../../types').SpotDifferenceConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.shadow_match && (
          <ShadowMatchConfigForm
            value={config as import('../../types').ShadowMatchConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.balloon_pop && (
          <BalloonPopConfigForm
            value={config as import('../../types').BalloonPopConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.catch_fish && (
          <CatchFishConfigForm
            value={config as import('../../types').CatchFishConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.whack_a_mole && (
          <WhackAMoleConfigForm
            value={config as import('../../types').WhackAMoleConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.build_object && (
          <BuildObjectConfigForm
            value={config as import('../../types').BuildObjectConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.sequence_sort && (
          <SequenceSortConfigForm
            value={config as import('../../types').SequenceSortConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.decorate && (
          <DecorateConfigForm
            value={config as import('../../types').DecorateConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.hidden_object && (
          <HiddenObjectConfigForm
            value={config as import('../../types').HiddenObjectConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.comparison && (
          <ComparisonConfigForm
            value={config as import('../../types').ComparisonConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.rhythm && (
          <RhythmConfigForm
            value={config as import('../../types').RhythmConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.cause_effect && (
          <CauseEffectConfigForm
            value={config as import('../../types').CauseEffectConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.avoid_obstacles && (
          <AvoidObstaclesConfigForm
            value={config as import('../../types').AvoidObstaclesConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.role_play && (
          <RolePlayConfigForm
            value={config as import('../../types').RolePlayConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
        {miniGameType === MiniGameType.logic_puzzle && (
          <LogicPuzzleConfigForm
            value={config as import('../../types').LogicPuzzleConfig}
            onChange={setConfig}
            errors={configErrors}
          />
        )}
      </Card>}

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
