import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStation, completeStation, listStations } from '../../services/api'
import type { Station } from '../../types'
import { MiniGameType } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import SuccessOverlay from '../../components/ui/SuccessOverlay'
import ErrorBoundary from '../../components/ui/ErrorBoundary'
import { useToast } from '../../components/ui/Toast'
import PuzzleGameContainer from './PuzzleGameContainer'
import NumberRiddleGame from '../../minigames/NumberRiddleGame'
import MazeGame from '../../minigames/MazeGame'
import TextRiddleGame from '../../minigames/TextRiddleGame'
import PictureRiddleGame from '../../minigames/PictureRiddleGame'
import TreasureGame from '../../components/minigames/TreasureGame'
import MemoryGame from '../../minigames/MemoryGame'
import SoundMatchGame from '../../minigames/SoundMatchGame'
import ColorSortGame from '../../minigames/ColorSortGame'
import SpotDifferenceGame from '../../minigames/SpotDifferenceGame'
import ShadowMatchGame from '../../minigames/ShadowMatchGame'
import BalloonPopGame from '../../minigames/BalloonPopGame'
import CatchFishGame from '../../minigames/CatchFishGame'
import WhackAMoleGame from '../../minigames/WhackAMoleGame'
import BuildObjectGame from '../../minigames/BuildObjectGame'
import SequenceSortGame from '../../minigames/SequenceSortGame'
import DecorateGame from '../../minigames/DecorateGame'
import HiddenObjectGame from '../../minigames/HiddenObjectGame'
import ComparisonGame from '../../minigames/ComparisonGame'
import RhythmGame from '../../minigames/RhythmGame'
import CauseEffectGame from '../../minigames/CauseEffectGame'
import AvoidObstaclesGame from '../../minigames/AvoidObstaclesGame'
import RolePlayGame from '../../minigames/RolePlayGame'
import LogicPuzzleGame from '../../minigames/LogicPuzzleGame'

function MiniGameRouter({
  station,
  onComplete,
}: {
  station: Station
  onComplete: () => void
}) {
  const config = station.mini_game_config as Record<string, unknown>

  switch (station.mini_game_type) {
    case MiniGameType.puzzle:
      return <PuzzleGameContainer station={station} onComplete={onComplete} />

    case MiniGameType.number_riddle:
      return (
        <NumberRiddleGame
          taskType={(config.task_type as 'count' | 'assign' | 'plus_minus') ?? 'count'}
          promptText={String(config.prompt_text ?? 'Was ist die richtige Antwort?')}
          promptImage={config.prompt_image as string | null | undefined}
          correctAnswer={Number(config.correct_answer ?? 1)}
          distractorAnswers={(config.distractor_answers as number[]) ?? []}
          onComplete={onComplete}
        />
      )

    case MiniGameType.maze: {
      const mazeData = config.maze_data as import('../../types').MazeData | undefined
      if (!mazeData || !mazeData.walls) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center bg-white rounded-2xl p-8 shadow">
              <p className="text-gray-500 mb-4">Labyrinth wird geladen…</p>
            </div>
          </div>
        )
      }
      return <MazeGame mazeData={mazeData} onComplete={onComplete} />
    }

    case MiniGameType.text_riddle:
      return (
        <TextRiddleGame
          questionText={String(config.question_text ?? 'Was ist die Antwort?')}
          answerOptions={(config.answer_options as import('../../types').TextRiddleOption[]) ?? []}
          answerMode={(config.answer_mode as 'multiple_choice' | 'single_tap') ?? 'multiple_choice'}
          onComplete={onComplete}
        />
      )

    case MiniGameType.picture_riddle:
      return (
        <PictureRiddleGame
          referenceItems={(config.reference_items as import('../../types').PictureRiddleReferenceItem[]) ?? []}
          answerOptions={(config.answer_options as import('../../types').PictureRiddleAnswerOption[]) ?? []}
          onComplete={onComplete}
        />
      )

    case MiniGameType.treasure:
      return <TreasureGame imageUrl={station.image_path} onComplete={onComplete} />

    case MiniGameType.memory:
      return <MemoryGame config={config as unknown as import('../../types').MemoryConfig} onComplete={onComplete} />

    case MiniGameType.sound_match:
      return <SoundMatchGame config={config as unknown as import('../../types').SoundMatchConfig} onComplete={onComplete} />

    case MiniGameType.color_sort:
      return <ColorSortGame config={config as unknown as import('../../types').ColorSortConfig} onComplete={onComplete} />

    case MiniGameType.spot_difference:
      return <SpotDifferenceGame config={config as unknown as import('../../types').SpotDifferenceConfig} onComplete={onComplete} />

    case MiniGameType.shadow_match:
      return <ShadowMatchGame config={config as unknown as import('../../types').ShadowMatchConfig} onComplete={onComplete} />

    case MiniGameType.balloon_pop:
      return <BalloonPopGame config={config as unknown as import('../../types').BalloonPopConfig} onComplete={onComplete} />

    case MiniGameType.catch_fish:
      return <CatchFishGame config={config as unknown as import('../../types').CatchFishConfig} onComplete={onComplete} />

    case MiniGameType.whack_a_mole:
      return <WhackAMoleGame config={config as unknown as import('../../types').WhackAMoleConfig} onComplete={onComplete} />

    case MiniGameType.build_object:
      return <BuildObjectGame config={config as unknown as import('../../types').BuildObjectConfig} onComplete={onComplete} />

    case MiniGameType.sequence_sort:
      return <SequenceSortGame config={config as unknown as import('../../types').SequenceSortConfig} onComplete={onComplete} />

    case MiniGameType.decorate:
      return <DecorateGame config={config as unknown as import('../../types').DecorateConfig} onComplete={onComplete} />

    case MiniGameType.hidden_object:
      return <HiddenObjectGame config={config as unknown as import('../../types').HiddenObjectConfig} onComplete={onComplete} />

    case MiniGameType.comparison:
      return <ComparisonGame config={config as unknown as import('../../types').ComparisonConfig} onComplete={onComplete} />

    case MiniGameType.rhythm:
      return <RhythmGame config={config as unknown as import('../../types').RhythmConfig} onComplete={onComplete} />

    case MiniGameType.cause_effect:
      return <CauseEffectGame config={config as unknown as import('../../types').CauseEffectConfig} onComplete={onComplete} />

    case MiniGameType.avoid_obstacles:
      return <AvoidObstaclesGame config={config as unknown as import('../../types').AvoidObstaclesConfig} onComplete={onComplete} />

    case MiniGameType.role_play:
      return <RolePlayGame config={config as unknown as import('../../types').RolePlayConfig} onComplete={onComplete} />

    case MiniGameType.logic_puzzle:
      return <LogicPuzzleGame config={config as unknown as import('../../types').LogicPuzzleConfig} onComplete={onComplete} />

    default:
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center bg-white rounded-2xl p-8 shadow">
            <p className="text-gray-500 mb-4">Unbekannter Spieltyp</p>
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-orange-400 text-white rounded-xl font-bold"
            >
              Weiter
            </button>
          </div>
        </div>
      )
  }
}

export default function StationMiniGamePage() {
  const { id, sid } = useParams<{ id: string; sid: string }>()
  const navigate = useNavigate()
  const { showError } = useToast()
  const [station, setStation] = useState<Station | null>(null)
  const [allStations, setAllStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showNextPreview, setShowNextPreview] = useState(false)
  const [completing, setCompleting] = useState(false)

  const load = useCallback(async () => {
    if (!id || !sid) return
    setLoading(true)
    setError(null)
    try {
      const [stationData, stations] = await Promise.all([
        getStation(id, sid),
        listStations(id),
      ])
      setStation(stationData)
      setAllStations(stations)
    } catch {
      setError('Station konnte nicht geladen werden. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }, [id, sid])

  useEffect(() => {
    load()
  }, [load])

  const handleComplete = useCallback(async () => {
    if (completing || !id || !station) return
    setCompleting(true)
    setShowSuccess(true)

    try {
      await completeStation(id)
    } catch {
      // Don't block the user — station progress failure is non-critical
      showError()
    }

    const sorted = [...allStations].sort((a, b) => a.position - b.position)
    const nextStation = sorted.find((s) => s.position > station.position)

    setTimeout(() => {
      setShowSuccess(false)
      if (nextStation?.image_path) {
        setShowNextPreview(true)
      } else {
        navigate(`/play/${id}/complete`, { replace: true })
      }
    }, 2500)
  }, [completing, id, station, allStations, navigate, showError])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) return <ErrorMessage message={error} />
  if (!station) return null

  const sorted = [...allStations].sort((a, b) => a.position - b.position)
  const nextStation = station ? sorted.find((s) => s.position > station.position) : undefined

  if (showNextPreview && nextStation?.image_path) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-yellow-50" data-testid="next-station-preview">
        <p className="text-center text-2xl font-bold text-orange-600 pt-10 pb-4 px-4">
          Such das hier:
        </p>
        <div className="flex-1 overflow-hidden px-4">
          <img
            src={nextStation.image_path}
            alt="Nächste Station"
            className="w-full h-full object-contain rounded-2xl"
          />
        </div>
        <div className="p-6">
          <button
            data-testid="next-station-weiter"
            onClick={() => navigate(`/play/${id}`, { replace: true })}
            className="w-full py-5 text-2xl font-bold text-white bg-orange-400 rounded-2xl active:scale-95 transition-transform"
          >
            Weiter →
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {showSuccess && (
        <SuccessOverlay
          message="Super gemacht! 🎉"
          onClose={() => {}}
        />
      )}
      {!showSuccess && (
        <ErrorBoundary>
          <MiniGameRouter station={station} onComplete={handleComplete} />
        </ErrorBoundary>
      )}
    </>
  )
}
