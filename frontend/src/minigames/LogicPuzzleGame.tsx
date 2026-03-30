import { useState } from 'react'
import type { LogicPuzzleConfig, LogicElement } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface LogicPuzzleGameProps {
  config: LogicPuzzleConfig
  onComplete?: () => void
}

export default function LogicPuzzleGame({ config, onComplete }: LogicPuzzleGameProps) {
  const [elementStates, setElementStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.elements.map((e) => [e.id, false]))
  )
  const [tapOrder, setTapOrder] = useState<string[]>([])
  const [correctPrefix, setCorrectPrefix] = useState(0)
  const audio = useAudio()
  const tts = useTTS()

  function handleTap(element: LogicElement) {
    const newStates = { ...elementStates, [element.id]: !elementStates[element.id] }
    setElementStates(newStates)

    const newOrder = [...tapOrder, element.id]
    setTapOrder(newOrder)

    // Check prefix match
    let prefixLen = 0
    for (let i = 0; i < newOrder.length && i < config.solution.length; i++) {
      if (newOrder[i] === config.solution[i]) {
        prefixLen = i + 1
      } else {
        // Wrong order: reset
        audio.play('error')
        tts.speak('Nochmal!')
        setElementStates(Object.fromEntries(config.elements.map((e) => [e.id, false])))
        setTapOrder([])
        setCorrectPrefix(0)
        return
      }
    }
    setCorrectPrefix(prefixLen)

    if (newOrder.length >= config.solution.length && prefixLen === config.solution.length) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-3 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Aufgabe vorlesen"
            className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Fortschritt: {correctPrefix} / {config.solution.length}
      </p>

      {/* Scene with elements */}
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg">
        <img src={config.scene_image} alt="Szene" className="w-full object-contain" />
        {config.elements.map((element, idx) => {
          const isOn = elementStates[element.id]
          const isCorrect = idx < correctPrefix

          return (
            <button
              key={element.id}
              onClick={() => handleTap(element)}
              data-testid={`logic-element-${element.id}`}
              aria-label={`${element.label} ${isOn ? 'an' : 'aus'}`}
              className={`absolute flex flex-col items-center gap-1 active:scale-90 transition-all rounded-xl ${
                isCorrect ? 'ring-2 ring-green-400' : ''
              }`}
              style={{
                left: `${element.x_pct}%`,
                top: `${element.y_pct}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center shadow">
                <img
                  src={isOn ? element.image_on : element.image_off}
                  alt={element.label}
                  className="w-10 h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <span className="text-xs font-semibold text-white bg-black/50 rounded px-1">
                {element.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
