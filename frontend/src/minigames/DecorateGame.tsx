import { useState } from 'react'
import type { DecorateConfig, DecorateSticker } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface DecorateGameProps {
  config: DecorateConfig
  onComplete?: () => void
}

type Selection = { type: 'color'; value: string } | { type: 'sticker'; sticker: DecorateSticker } | null

interface PlacedItem {
  id: string
  x: number
  y: number
  selection: Selection
}

export default function DecorateGame({ config, onComplete }: DecorateGameProps) {
  const [selection, setSelection] = useState<Selection>(null)
  const [placed, setPlaced] = useState<PlacedItem[]>([])
  const audio = useAudio()
  const tts = useTTS()

  function handleCanvasTap(e: React.MouseEvent<HTMLDivElement>) {
    if (!selection) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = `item-${Date.now()}-${Math.random()}`
    setPlaced((prev) => [...prev, { id, x, y, selection }])
    audio.play('snap')
  }

  function handleDone() {
    audio.play('success')
    setTimeout(() => onComplete?.(), 400)
  }

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-3 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Aufgabe vorlesen"
            className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg cursor-crosshair mb-4"
        onClick={handleCanvasTap}
        data-testid="decorate-canvas"
      >
        <img src={config.base_image} alt="Dekoriere!" className="w-full object-contain" />
        {placed.map((item) => (
          <div
            key={item.id}
            className="absolute pointer-events-none"
            style={{ left: item.x, top: item.y, transform: 'translate(-50%, -50%)' }}
          >
            {item.selection?.type === 'color' ? (
              <div
                className="rounded-full"
                style={{ width: 24, height: 24, background: item.selection.value }}
              />
            ) : item.selection?.type === 'sticker' ? (
              <img
                src={item.selection.sticker.image_url}
                alt={item.selection.sticker.label}
                className="w-10 h-10 object-contain"
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Color palette */}
      <div className="w-full max-w-sm mb-3">
        <p className="text-xs text-gray-500 mb-2">Farben:</p>
        <div className="flex flex-wrap gap-2">
          {config.colors.map((color, i) => (
            <button
              key={i}
              onClick={() => setSelection({ type: 'color', value: color })}
              data-testid={`color-${i}`}
              aria-label={color}
              className={`w-9 h-9 rounded-full border-4 transition-transform active:scale-90 ${
                selection?.type === 'color' && selection.value === color
                  ? 'border-gray-800 scale-110'
                  : 'border-white shadow'
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>

      {/* Sticker shelf */}
      <div className="w-full max-w-sm mb-4">
        <p className="text-xs text-gray-500 mb-2">Sticker:</p>
        <div className="flex flex-wrap gap-2">
          {config.stickers.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => setSelection({ type: 'sticker', sticker })}
              data-testid={`sticker-${sticker.id}`}
              aria-label={sticker.label}
              className={`w-12 h-12 rounded-lg border-4 bg-white flex items-center justify-center transition-transform active:scale-90 ${
                selection?.type === 'sticker' && selection.sticker.id === sticker.id
                  ? 'border-rose-400 scale-110'
                  : 'border-gray-200'
              }`}
            >
              {sticker.image_url ? (
                <img src={sticker.image_url} alt={sticker.label} className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-lg">{sticker.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleDone}
        data-testid="decorate-done-btn"
        className="w-full max-w-sm py-4 bg-rose-500 text-white text-lg font-bold rounded-2xl active:scale-95 transition-transform shadow"
      >
        Fertig!
      </button>
    </div>
  )
}
