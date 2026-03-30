import { useState, useEffect } from 'react'
import type { BalloonPopConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface BalloonPopGameProps {
  config: BalloonPopConfig
  onComplete?: () => void
}

interface Balloon {
  id: number
  popped: boolean
  left: number
  delay: number
}

export default function BalloonPopGame({ config, onComplete }: BalloonPopGameProps) {
  const [balloons, setBalloons] = useState<Balloon[]>(() =>
    Array.from({ length: config.total_balloons }, (_, i) => ({
      id: i,
      popped: false,
      left: 5 + (i * (90 / config.total_balloons)),
      delay: i * 0.3,
    }))
  )
  const [poppedCount, setPoppedCount] = useState(0)
  const audio = useAudio()
  const tts = useTTS()

  useEffect(() => {
    if (tts.isTTSAvailable()) tts.speak(config.prompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePop(id: number) {
    const balloon = balloons.find((b) => b.id === id)
    if (!balloon || balloon.popped) return

    audio.play('snap')
    const newCount = poppedCount + 1
    setBalloons((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)))
    setPoppedCount(newCount)

    if (newCount >= config.target_count) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center p-4">
      <p className="font-bold text-gray-800 text-lg mb-2 text-center">{config.prompt}</p>
      <p className="text-sm text-gray-600 mb-4" data-testid="balloon-counter">
        {poppedCount} von {config.target_count} geplatzt
      </p>

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-xl bg-blue-100"
        style={{ height: '400px' }}
      >
        {balloons.map((balloon) => (
          <button
            key={balloon.id}
            onClick={() => handlePop(balloon.id)}
            data-testid={`balloon-${balloon.id}`}
            disabled={balloon.popped}
            aria-label={balloon.popped ? 'Geplatzt' : 'Ballon platzen'}
            className={`absolute text-5xl cursor-pointer select-none active:scale-90 transition-all ${
              balloon.popped ? 'opacity-0 scale-150 pointer-events-none' : ''
            }`}
            style={{
              left: `${balloon.left}%`,
              bottom: balloon.popped ? '100%' : '0%',
              animationName: balloon.popped ? 'none' : 'floatUp',
              animationDuration: '4s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${balloon.delay}s`,
            }}
          >
            {config.balloon_emoji}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-420px); }
        }
      `}</style>
    </div>
  )
}
