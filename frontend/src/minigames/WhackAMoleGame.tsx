import { useState, useEffect, useRef } from 'react'
import type { WhackAMoleConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface WhackAMoleGameProps {
  config: WhackAMoleConfig
  onComplete?: () => void
}

export default function WhackAMoleGame({ config, onComplete }: WhackAMoleGameProps) {
  const [activeMole, setActiveMole] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.duration_s)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const lastMoleRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const audio = useAudio()
  const tts = useTTS()

  const gridSize = config.grid_size

  useEffect(() => {
    if (tts.isTTSAvailable()) tts.speak('Klopf die Maulwürfe!')

    const moleInterval = setInterval(() => {
      let next: number
      do {
        next = Math.floor(Math.random() * gridSize)
      } while (next === lastMoleRef.current && gridSize > 1)
      lastMoleRef.current = next
      setActiveMole(next)
      setTimeout(() => setActiveMole(null), config.appear_ms)
    }, 700)

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(moleInterval)
          clearInterval(timerInterval)
          if (scoreRef.current < config.target_score) {
            setGameOver(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(moleInterval)
      clearInterval(timerInterval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleWhack(index: number) {
    if (activeMole !== index) return
    setActiveMole(null)
    const newScore = scoreRef.current + 1
    scoreRef.current = newScore
    setScore(newScore)
    audio.play('snap')

    if (newScore >= config.target_score) {
      setWon(true)
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    }
  }

  function handleRestart() {
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(config.duration_s)
    setGameOver(false)
    setWon(false)
    setActiveMole(null)
  }

  if (gameOver && !won) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
        <p className="text-2xl font-bold text-gray-800 mb-2">Punkte: {score}</p>
        <p className="text-gray-600 mb-6">Ziel: {config.target_score}</p>
        <button
          onClick={handleRestart}
          data-testid="restart-btn"
          className="px-8 py-4 bg-orange-400 text-white text-xl font-bold rounded-2xl active:scale-95 transition-transform shadow"
        >
          Nochmal?
        </button>
      </div>
    )
  }

  const cols = gridSize === 3 ? 'grid-cols-3' : gridSize === 4 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-4">
      <div className="flex justify-between w-full max-w-sm mb-4">
        <p className="font-bold text-gray-700" data-testid="score-display">
          Punkte: {score} / {config.target_score}
        </p>
        <p className="font-bold text-gray-700" data-testid="timer-display">
          Zeit: {timeLeft}s
        </p>
      </div>

      <div className={`grid ${cols} gap-4 w-full max-w-sm`}>
        {Array.from({ length: gridSize }, (_, i) => (
          <button
            key={i}
            onClick={() => handleWhack(i)}
            data-testid={`hole-${i}`}
            aria-label={activeMole === i ? 'Maulwurf klopfen!' : 'Loch'}
            className={`relative rounded-full border-4 border-brown-400 flex items-center justify-center transition-all ${
              activeMole === i
                ? 'bg-green-300 scale-110'
                : 'bg-amber-900'
            }`}
            style={{ aspectRatio: '1', backgroundColor: activeMole === i ? '#86efac' : '#78350f' }}
          >
            {activeMole === i && (
              <span className="text-4xl" data-testid={`mole-${i}`}>
                {config.mole_emoji}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
