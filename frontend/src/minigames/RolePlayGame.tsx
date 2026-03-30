import { useState } from 'react'
import type { RolePlayConfig, RolePlayStep } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface RolePlayGameProps {
  config: RolePlayConfig
  onComplete?: () => void
}

export default function RolePlayGame({ config, onComplete }: RolePlayGameProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [shakingId, setShakingId] = useState<string | null>(null)
  const audio = useAudio()
  const tts = useTTS()

  function getNextStepId() {
    if (!config.ordered) return null
    for (const step of config.steps) {
      if (!completedIds.has(step.id)) return step.id
    }
    return null
  }

  function handleStepTap(step: RolePlayStep) {
    if (config.ordered) {
      const nextId = getNextStepId()
      if (step.id !== nextId) {
        audio.play('error')
        setShakingId(step.id)
        tts.speak('Probier ein anderes!')
        setTimeout(() => setShakingId(null), 600)
        return
      }
    }

    if (step.sound) audio.play(step.sound)
    tts.speak(step.action_label)

    const newCompleted = new Set(completedIds)
    newCompleted.add(step.id)
    setCompletedIds(newCompleted)

    if (newCompleted.size === config.steps.length) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    }
  }

  const nextId = config.ordered ? getNextStepId() : null

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-3 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800 text-center">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Aufgabe vorlesen"
            className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      {/* Scene with objects */}
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg">
        <img src={config.scene_image} alt="Szene" className="w-full object-contain" />
        {config.steps.map((step) => {
          const isCompleted = completedIds.has(step.id)
          const isActive = !config.ordered || step.id === nextId
          const isShaking = shakingId === step.id
          return (
            <button
              key={step.id}
              onClick={() => handleStepTap(step)}
              data-testid={`roleplay-step-${step.id}`}
              aria-label={step.object_label}
              className={`absolute flex flex-col items-center gap-1 transition-all active:scale-90 ${
                isCompleted
                  ? 'opacity-100'
                  : isActive
                  ? 'opacity-100 ring-2 ring-yellow-400 rounded-xl'
                  : 'opacity-50'
              } ${isShaking ? 'animate-shake' : ''}`}
              style={{
                left: `${step.x_pct}%`,
                top: `${step.y_pct}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center shadow">
                {step.object_image ? (
                  <img src={step.object_image} alt={step.object_label} className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-xl">{step.object_label[0]}</span>
                )}
                {isCompleted && (
                  <span className="absolute -top-1 -right-1 text-lg">✅</span>
                )}
              </div>
              <span className="text-xs font-semibold text-white bg-black/50 rounded px-1">
                {isCompleted ? step.action_label : step.object_label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
