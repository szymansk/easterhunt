import { useState } from 'react'
import { useAudio } from '../hooks/useAudio'

interface NumberRiddleGameProps {
  taskType: 'count' | 'assign' | 'plus_minus'
  promptText: string
  promptImage?: string | null
  correctAnswer: number
  distractorAnswers: number[]
  onComplete?: () => void
}

type ButtonState = 'idle' | 'correct' | 'wrong'

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function gridCols(count: number): string {
  if (count === 3) return 'grid-cols-3'
  if (count === 4) return 'grid-cols-2'
  return 'grid-cols-3'
}

export default function NumberRiddleGame({
  taskType,
  promptText,
  promptImage,
  correctAnswer,
  distractorAnswers,
  onComplete,
}: NumberRiddleGameProps) {
  const [options] = useState(() => shuffleArray([correctAnswer, ...distractorAnswers]))
  const [buttonStates, setButtonStates] = useState<Record<number, ButtonState>>({})
  const audio = useAudio()

  function handleTap(value: number) {
    const isCorrect = value === correctAnswer

    if (isCorrect) {
      audio.play('success')
      setButtonStates((prev) => ({ ...prev, [value]: 'correct' }))
      setTimeout(() => {
        onComplete?.()
      }, 600)
    } else {
      audio.play('error')
      setButtonStates((prev) => ({ ...prev, [value]: 'wrong' }))
      setTimeout(() => {
        setButtonStates((prev) => ({ ...prev, [value]: 'idle' }))
      }, 500)
    }
  }

  const showImage = taskType !== 'plus_minus' && !!promptImage

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-5xl mb-3">🔢</div>

        {/* Prompt area */}
        {showImage ? (
          <div className="mb-4">
            <img
              src={promptImage!}
              alt={promptText}
              className="w-32 h-32 mx-auto object-contain rounded-xl"
            />
            <p className="mt-2 text-lg font-bold text-gray-800">{promptText}</p>
          </div>
        ) : (
          <h2 className="text-xl font-bold text-gray-800 mb-6">{promptText}</h2>
        )}

        {/* Answer buttons grid */}
        <div className={`grid ${gridCols(options.length)} gap-3`}>
          {options.map((value) => {
            const state = buttonStates[value] ?? 'idle'

            let bgClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            let borderClass = 'border-transparent'
            if (state === 'correct') {
              bgClass = 'bg-green-100 text-green-800'
              borderClass = 'border-green-400'
            } else if (state === 'wrong') {
              bgClass = 'bg-red-100 text-red-800'
              borderClass = 'border-red-400'
            }

            return (
              <button
                key={value}
                onClick={() => handleTap(value)}
                className={`rounded-xl border-2 ${borderClass} ${bgClass} font-bold text-2xl active:scale-95 transition-transform ${state === 'wrong' ? 'animate-shake' : ''}`}
                style={{ minWidth: '60px', minHeight: '60px' }}
                data-testid={`answer-btn-${value}`}
                aria-label={`Antwort ${value}`}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
