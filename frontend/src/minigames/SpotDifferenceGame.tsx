import { useState, useEffect } from 'react'
import type { SpotDifferenceConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface SpotDifferenceGameProps {
  config: SpotDifferenceConfig
  onComplete?: () => void
}

interface Hit {
  id: string
  x: number
  y: number
}

export default function SpotDifferenceGame({ config, onComplete }: SpotDifferenceGameProps) {
  const [found, setFound] = useState<Set<string>>(new Set())
  const [hits, setHits] = useState<Hit[]>([])
  const audio = useAudio()
  const tts = useTTS()

  useEffect(() => {
    if (tts.isTTSAvailable()) {
      tts.speak(config.prompt)
    }
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
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-3 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Frage vorlesen"
            className="flex-shrink-0 w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {found.size} von {config.targets.length} gefunden
      </p>

      <div
        className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg cursor-pointer"
        onClick={handleImageTap}
        onTouchStart={handleImageTap}
        data-testid="spot-diff-image"
      >
        <img src={config.image_url} alt="Bild" className="w-full object-contain" />
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
    </div>
  )
}
