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
