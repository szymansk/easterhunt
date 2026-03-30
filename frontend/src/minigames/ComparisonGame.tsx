import { useEffect } from 'react'
import type { ComparisonConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface ComparisonGameProps {
  config: ComparisonConfig
  onComplete?: () => void
}

function renderItemContent(item: ComparisonConfig['left_item'], compType: 'size' | 'count', maxValue: number) {
  if (compType === 'size') {
    const sizePct = Math.round((item.value / maxValue) * 80 + 20)
    return (
      <div className="flex flex-col items-center gap-2">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.label}
            style={{ width: `${sizePct}%`, maxWidth: '120px' }}
            className="object-contain"
          />
        ) : (
          <div
            className="rounded-full bg-orange-200"
            style={{ width: `${sizePct * 1.2}px`, height: `${sizePct * 1.2}px`, maxWidth: '120px', maxHeight: '120px' }}
          />
        )}
        <span className="font-semibold text-gray-700">{item.label}</span>
      </div>
    )
  } else {
    const icons = Array.from({ length: item.value }, (_, i) => i)
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-4 gap-1">
          {icons.map((i) => (
            item.image_url ? (
              <img key={i} src={item.image_url} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <div key={i} className="w-6 h-6 rounded-full bg-orange-300" />
            )
          ))}
        </div>
        <span className="font-semibold text-gray-700">{item.label}</span>
      </div>
    )
  }
}

export default function ComparisonGame({ config, onComplete }: ComparisonGameProps) {
  const audio = useAudio()
  const tts = useTTS()

  useEffect(() => {
    if (tts.isTTSAvailable()) tts.speak(config.question)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const maxValue = Math.max(config.left_item.value, config.right_item.value)

  function handleTap(side: 'left' | 'right') {
    if (side === config.correct_side) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    } else {
      audio.play('error')
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-6 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center text-lg">{config.question}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.question)}
            aria-label="Frage vorlesen"
            className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={() => handleTap('left')}
          data-testid="comparison-left"
          aria-label={config.left_item.label}
          className="flex-1 rounded-2xl border-2 border-gray-200 bg-white p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg min-h-48"
        >
          {renderItemContent(config.left_item, config.comparison_type, maxValue)}
        </button>

        <button
          onClick={() => handleTap('right')}
          data-testid="comparison-right"
          aria-label={config.right_item.label}
          className="flex-1 rounded-2xl border-2 border-gray-200 bg-white p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg min-h-48"
        >
          {renderItemContent(config.right_item, config.comparison_type, maxValue)}
        </button>
      </div>
    </div>
  )
}
