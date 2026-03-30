import { useState, useEffect } from 'react'
import type { HiddenObjectConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface HiddenObjectGameProps {
  config: HiddenObjectConfig
  onComplete?: () => void
}

interface Hit {
  id: string
  x: number
  y: number
}

export default function HiddenObjectGame({ config, onComplete }: HiddenObjectGameProps) {
  const [found, setFound] = useState<Set<string>>(new Set())
  const [hits, setHits] = useState<Hit[]>([])
  const audio = useAudio()
  const tts = useTTS()

  useEffect(() => {
    if (tts.isTTSAvailable()) tts.speak(config.prompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleImageTap(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    let clientX: number
    let clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const xPct = ((clientX - rect.left) / rect.width) * 100
    const yPct = ((clientY - rect.top) / rect.height) * 100

    for (const target of config.targets) {
      if (found.has(target.id)) continue
      const dx = xPct - target.x_pct
      const dy = yPct - target.y_pct
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < target.radius_pct) {
        tts.speak(target.label)
        const newFound = new Set(found)
        newFound.add(target.id)
        setFound(newFound)
        setHits((prev) => [...prev, { id: target.id, x: xPct, y: yPct }])
        setTimeout(() => {
          setHits((prev) => prev.filter((h) => h.id !== target.id))
        }, 1500)

        if (newFound.size === config.targets.length) {
          audio.play('success')
          setTimeout(() => onComplete?.(), 600)
        }
        return
      }
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-3 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Aufgabe vorlesen"
            className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      {/* Scene */}
      <div
        className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg cursor-pointer mb-4"
        onClick={handleImageTap}
        onTouchStart={handleImageTap}
        data-testid="hidden-object-scene"
      >
        <img src={config.scene_image} alt="Wimmelbild" className="w-full object-contain" />
        {hits.map((hit) => (
          <div
            key={hit.id}
            className="absolute flex items-center justify-center text-3xl animate-ping pointer-events-none"
            style={{
              left: `${hit.x}%`,
              top: `${hit.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            ✅
          </div>
        ))}
      </div>

      {/* Target strip */}
      <div className="w-full max-w-sm bg-white rounded-xl p-3 border-2 border-gray-200 shadow">
        <p className="text-xs text-gray-500 mb-2">Finde alle:</p>
        <div className="flex flex-wrap gap-2">
          {config.targets.map((target) => (
            <div
              key={target.id}
              data-testid={`target-${target.id}`}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 ${
                found.has(target.id) ? 'border-green-400 bg-green-50' : 'border-gray-200'
              }`}
            >
              {found.has(target.id) ? (
                <span className="text-2xl">✅</span>
              ) : (
                <span className="text-2xl">🔍</span>
              )}
              <span className="text-xs text-gray-600">{target.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
