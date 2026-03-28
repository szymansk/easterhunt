import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStation, completeStation } from '../../services/api'
import type { Station } from '../../types'
import { MiniGameType } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import SuccessOverlay from '../../components/ui/SuccessOverlay'
import PuzzleGameContainer from './PuzzleGameContainer'
import NumberRiddleGame from '../../minigames/NumberRiddleGame'
import MazeGame from '../../minigames/MazeGame'
import TextRiddleGame from '../../minigames/TextRiddleGame'
import PictureRiddleGame from '../../minigames/PictureRiddleGame'

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
          question={String(config.question ?? 'Was ist die richtige Antwort?')}
          correctAnswer={Number(config.correct_answer ?? 1)}
          onComplete={onComplete}
        />
      )

    case MiniGameType.maze:
      return <MazeGame onComplete={onComplete} />

    case MiniGameType.text_riddle:
      return (
        <TextRiddleGame
          question={String(config.question ?? 'Was ist die Antwort?')}
          options={(config.options as string[]) ?? []}
          answerMode={(config.answer_mode as 'multiple_choice' | 'single_tap') ?? 'multiple_choice'}
          onComplete={onComplete}
        />
      )

    case MiniGameType.picture_riddle:
      return (
        <PictureRiddleGame
          question={String(config.question ?? 'Was siehst du?')}
          onComplete={onComplete}
        />
      )

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
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [completing, setCompleting] = useState(false)

  const load = useCallback(async () => {
    if (!id || !sid) return
    setLoading(true)
    setError(null)
    try {
      const stationData = await getStation(id, sid)
      setStation(stationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Station konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [id, sid])

  useEffect(() => {
    load()
  }, [load])

  const handleComplete = useCallback(async () => {
    if (completing || !id) return
    setCompleting(true)
    setShowSuccess(true)

    try {
      await completeStation(id)
    } catch (err) {
      console.error('Failed to complete station:', err)
      // Don't block the user — show error but still allow flow
    }

    setTimeout(() => {
      setShowSuccess(false)
      navigate(`/play/${id}`, { replace: true })
    }, 2500)
  }, [completing, id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) return <ErrorMessage message={error} />
  if (!station) return null

  return (
    <>
      {showSuccess && (
        <SuccessOverlay
          message="Super gemacht! 🎉"
          onClose={() => {}}
        />
      )}
      {!showSuccess && (
        <MiniGameRouter station={station} onComplete={handleComplete} />
      )}
    </>
  )
}
