import { useState } from 'react'
import type { CauseEffectConfig, CauseEffectObject } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface CauseEffectGameProps {
  config: CauseEffectConfig
  onComplete?: () => void
}

export default function CauseEffectGame({ config, onComplete }: CauseEffectGameProps) {
  const [tapped, setTapped] = useState<Set<string>>(new Set())
  const [activeAnimations, setActiveAnimations] = useState<Set<string>>(new Set())
  const audio = useAudio()
  const tts = useTTS()

  function handleObjectTap(obj: CauseEffectObject) {
    if (obj.sound) audio.play(obj.sound)
    tts.speak(obj.label)

    const newActive = new Set(activeAnimations)
    newActive.add(obj.id)
    setActiveAnimations(newActive)
    setTimeout(() => {
      setActiveAnimations((prev) => {
        const next = new Set(prev)
        next.delete(obj.id)
        return next
      })
    }, 350)

    const newTapped = new Set(tapped)
    newTapped.add(obj.id)
    setTapped(newTapped)

    if (config.require_all_tapped && newTapped.size === config.objects.length) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 500)
    }
  }

  function handleDone() {
    audio.play('success')
    setTimeout(() => onComplete?.(), 400)
  }

  const animClass = (obj: CauseEffectObject) => {
    if (!activeAnimations.has(obj.id)) return ''
    switch (obj.animation) {
      case 'bounce': return 'animate-bounce'
      case 'spin': return 'animate-spin'
      case 'flash': return 'animate-ping'
      case 'grow': return 'scale-125'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-3 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Aufgabe vorlesen"
            className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      {/* Scene with objects */}
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg mb-4">
        <img src={config.scene_image} alt="Szene" className="w-full object-contain" />
        {config.objects.map((obj) => (
          <button
            key={obj.id}
            onClick={() => handleObjectTap(obj)}
            data-testid={`cause-obj-${obj.id}`}
            aria-label={obj.label}
            className={`absolute flex items-center justify-center rounded-full transition-transform active:scale-90 ${animClass(obj)} ${
              tapped.has(obj.id) ? 'ring-2 ring-green-400' : ''
            }`}
            style={{
              left: `${obj.x_pct}%`,
              top: `${obj.y_pct}%`,
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
            }}
          >
            <img
              src={obj.image_url}
              alt={obj.label}
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </button>
        ))}
      </div>

      {!config.require_all_tapped && (
        <button
          onClick={handleDone}
          data-testid="cause-done-btn"
          className="w-full max-w-sm py-4 bg-teal-500 text-white text-lg font-bold rounded-2xl active:scale-95 transition-transform shadow"
        >
          Fertig!
        </button>
      )}

      {config.require_all_tapped && (
        <p className="text-sm text-gray-600">
          {tapped.size} von {config.objects.length} berührt
        </p>
      )}
    </div>
  )
}
