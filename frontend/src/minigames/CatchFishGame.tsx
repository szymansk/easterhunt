import { useState, useEffect } from 'react'
import type { CatchFishConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface CatchFishGameProps {
  config: CatchFishConfig
  onComplete?: () => void
}

interface Fish {
  id: number
  caught: boolean
  top: number
  direction: 'ltr' | 'rtl'
  duration: number
  delay: number
}

const SPEED_MAP = { slow: 5, medium: 3, fast: 1.5 }

export default function CatchFishGame({ config, onComplete }: CatchFishGameProps) {
  const duration = SPEED_MAP[config.animation_speed]
  const [fish, setFish] = useState<Fish[]>(() =>
    Array.from({ length: config.total_fish }, (_, i) => ({
      id: i,
      caught: false,
      top: 5 + (i * (85 / config.total_fish)),
      direction: i % 2 === 0 ? 'ltr' : 'rtl',
      duration,
      delay: i * 0.8,
    }))
  )
  const [caughtCount, setCaughtCount] = useState(0)
  const audio = useAudio()
  const tts = useTTS()

  useEffect(() => {
    if (tts.isTTSAvailable()) tts.speak(config.prompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCatch(id: number) {
    const f = fish.find((f) => f.id === id)
    if (!f || f.caught) return

    audio.play('snap')
    const newCount = caughtCount + 1
    setFish((prev) => prev.map((f) => (f.id === id ? { ...f, caught: true } : f)))
    setCaughtCount(newCount)

    if (newCount >= config.target_count) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    }
  }

  return (
    <div className="min-h-screen bg-blue-100 flex flex-col items-center p-4">
      <p className="font-bold text-gray-800 text-lg mb-2 text-center">{config.prompt}</p>
      <p className="text-sm text-gray-600 mb-4" data-testid="fish-counter">
        {caughtCount} von {config.target_count} gefangen
      </p>

      <div
        className="relative w-full max-w-sm rounded-xl overflow-hidden"
        style={{ height: '350px', background: 'linear-gradient(to bottom, #bfdbfe, #3b82f6)' }}
      >
        {fish.map((f) => (
          <button
            key={f.id}
            onClick={() => handleCatch(f.id)}
            onTouchStart={(e) => { e.preventDefault(); handleCatch(f.id) }}
            data-testid={`fish-${f.id}`}
            disabled={f.caught}
            aria-label={f.caught ? 'Gefangen' : 'Fisch fangen'}
            className={`absolute text-4xl cursor-pointer select-none transition-all ${
              f.caught ? 'opacity-0 scale-150 pointer-events-none' : ''
            }`}
            style={{
              top: `${f.top}%`,
              animationName: f.caught ? 'none' : 'swimAcross',
              animationDuration: `${f.duration}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${f.delay}s`,
              transform: f.direction === 'rtl' ? 'scaleX(-1)' : 'scaleX(1)',
              ...(f.direction === 'ltr'
                ? { left: '-10%' }
                : { right: '-10%' }),
            }}
          >
            {config.fish_emoji}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes swimAcross {
          0% { transform: translateX(0); }
          100% { transform: translateX(400px); }
        }
      `}</style>
    </div>
  )
}
