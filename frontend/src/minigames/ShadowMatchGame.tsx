import { useState } from 'react'
import type { ShadowMatchConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface ShadowMatchGameProps {
  config: ShadowMatchConfig
  onComplete?: () => void
}

export default function ShadowMatchGame({ config, onComplete }: ShadowMatchGameProps) {
  const [shakingId, setShakingId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const audio = useAudio()
  const tts = useTTS()

  function handleTap(option: (typeof config.options)[0]) {
    if (option.is_correct) {
      setCorrectId(option.id)
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    } else {
      audio.play('error')
      setShakingId(option.id)
      setTimeout(() => setShakingId(null), 600)
    }
  }

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center p-4">
      {/* Silhouette */}
      <div className="w-full max-w-sm mb-4">
        <img
          src={config.silhouette_image_url}
          alt="Silhouette"
          data-testid="silhouette"
          className="w-48 h-48 mx-auto object-contain"
          style={{ filter: 'brightness(0)' }}
        />
      </div>

      {/* Prompt */}
      <div className="flex items-center gap-2 mb-4 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Aufgabe vorlesen"
            className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {config.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleTap(option)}
            data-testid={`shadow-option-${option.id}`}
            aria-label={option.label}
            className={`rounded-xl border-2 bg-white p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow ${
              shakingId === option.id
                ? 'animate-shake border-red-400 bg-red-50'
                : correctId === option.id
                ? 'border-green-400 bg-green-50 scale-105'
                : 'border-gray-200'
            }`}
          >
            {option.image_url ? (
              <img src={option.image_url} alt={option.label} className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                ?
              </div>
            )}
            <span className="text-sm font-semibold text-gray-700">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
