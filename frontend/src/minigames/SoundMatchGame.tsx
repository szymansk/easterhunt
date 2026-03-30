import { useState, useEffect, useRef } from 'react'
import type { SoundMatchConfig, SoundMatchItem } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface SoundMatchGameProps {
  config: SoundMatchConfig
  onComplete?: () => void
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function SoundMatchGame({ config, onComplete }: SoundMatchGameProps) {
  const [options] = useState<Array<SoundMatchItem & { isCorrect: boolean }>>(() =>
    shuffleArray([
      { ...config.correct_item, isCorrect: true },
      ...config.distractors.map((d) => ({ ...d, isCorrect: false })),
    ])
  )
  const [shakingIndex, setShakingIndex] = useState<number | null>(null)
  const audio = useAudio()
  const tts = useTTS()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    playSound()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function playSound() {
    if (typeof Audio === 'undefined') return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    try {
      const a = new Audio(config.sound_url)
      audioRef.current = a
      a.play().catch(() => {})
    } catch {
      // Audio not available
    }
  }

  function handleTap(index: number, item: SoundMatchItem & { isCorrect: boolean }) {
    tts.speak(item.label)
    if (item.isCorrect) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    } else {
      audio.play('error')
      setShakingIndex(index)
      setTimeout(() => setShakingIndex(null), 600)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Was hörst du?</h2>
      <button
        onClick={playSound}
        data-testid="play-sound-btn"
        aria-label="Geräusch abspielen"
        className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-4xl mb-6 active:scale-95 transition-transform shadow-lg"
      >
        🔊
      </button>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {options.map((item, i) => (
          <button
            key={i}
            onClick={() => handleTap(i, item)}
            data-testid={`sound-option-${i}`}
            aria-label={item.label}
            className={`rounded-xl border-2 border-gray-200 bg-white p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow ${
              shakingIndex === i ? 'animate-shake border-red-400 bg-red-50' : ''
            }`}
          >
            {item.image_url ? (
              <img src={item.image_url} alt={item.label} className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center text-4xl bg-gray-100 rounded-lg">
                ?
              </div>
            )}
            <span className="text-sm font-semibold text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
