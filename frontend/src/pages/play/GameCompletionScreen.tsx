import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createGameProgress } from '../../services/api'

export default function GameCompletionScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hasReset = useRef(false)

  // Preload audio — only on user gesture
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Try to play a celebration sound on mount (may be blocked without user gesture)
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAA' +
      'EAAQARAAAAAgABAAIAAABkYXRhAAAAAA=='
    )
  }, [])

  function playSound() {
    const result = audioRef.current?.play()
    if (result && typeof result.catch === 'function') {
      result.catch(() => {})
    }
  }

  async function handlePlayAgain() {
    if (!id || hasReset.current) return
    hasReset.current = true
    try {
      await createGameProgress(id)
    } catch {
      // ignore — game might allow new progress
    }
    navigate(`/play/${id}`, { replace: true })
  }

  function handleGoHome() {
    navigate('/', { replace: true })
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-yellow-300 to-orange-400 flex flex-col items-center justify-center p-4 overflow-hidden"
      onClick={playSound}
    >
      {/* Bouncing eggs animation */}
      <div className="relative w-full h-32 mb-4 overflow-hidden">
        {['🥚', '🐣', '🐥', '🌸', '🌟'].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-4xl animate-bounce"
            style={{
              left: `${10 + i * 18}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.8 + i * 0.1}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Confetti dots */}
      <div className="relative w-full h-8 mb-6 overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="absolute w-3 h-3 rounded-full animate-ping"
            style={{
              left: `${(i * 8) + 2}%`,
              backgroundColor: ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#c084fc'][i % 5],
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-3">
          🎉 Geschafft! 🎉
        </h1>
        <p className="text-2xl font-bold text-yellow-100 mb-2">
          Du hast alle Stationen gefunden!
        </p>
        <p className="text-xl text-yellow-200">
          Frohe Ostern! 🐰
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={handlePlayAgain}
          className="w-full py-4 bg-white text-orange-500 rounded-2xl font-extrabold text-xl shadow-lg active:scale-95 transition-transform"
        >
          🔄 Nochmal spielen
        </button>
        <button
          onClick={handleGoHome}
          className="w-full py-4 bg-orange-600 text-white rounded-2xl font-extrabold text-xl shadow-lg active:scale-95 transition-transform"
        >
          🏠 Zum Start
        </button>
      </div>
    </div>
  )
}
