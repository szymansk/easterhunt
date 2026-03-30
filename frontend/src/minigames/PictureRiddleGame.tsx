import { useState } from 'react'
import type { PictureRiddleAnswerOption, PictureRiddleReferenceItem } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface PictureRiddleGameProps {
  referenceItems: PictureRiddleReferenceItem[]
  answerOptions: PictureRiddleAnswerOption[]
  onComplete?: () => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export default function PictureRiddleGame({
  referenceItems,
  answerOptions,
  onComplete,
}: PictureRiddleGameProps) {
  const [answerStates, setAnswerStates] = useState<Record<number, AnswerState>>({})
  const audio = useAudio()
  const tts = useTTS()

  function handleTap(index: number, isCorrect: boolean) {
    if (answerStates[index] === 'wrong') return

    if (isCorrect) {
      audio.play('success')
      setAnswerStates((prev) => ({ ...prev, [index]: 'correct' }))
      setTimeout(() => {
        onComplete?.()
      }, 600)
    } else {
      audio.play('error')
      setAnswerStates((prev) => ({ ...prev, [index]: 'wrong' }))
      setTimeout(() => {
        setAnswerStates((prev) => ({ ...prev, [index]: 'idle' }))
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-start p-4">
      {/* Prompt */}
      <div className="flex items-center justify-center gap-2 mt-4 mb-3">
        <p className="text-lg font-bold text-gray-700 text-center">Was gehört dazu?</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak('Was gehört dazu?')}
            aria-label="Vorlesen"
            className="flex-shrink-0 text-lg active:scale-90 transition-transform"
          >
            🔊
          </button>
        )}
      </div>

      {/* Reference area: 2 images side by side */}
      <div className="flex gap-3 justify-center mb-5">
        {referenceItems.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-[100px] h-[100px] rounded-xl overflow-hidden bg-white shadow border border-gray-100">
              <img
                src={item.image_url}
                alt={item.label}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="mt-1 text-xs text-gray-600 font-medium text-center max-w-[100px] truncate">
              {item.label}
            </span>
            {tts.isTTSAvailable() && (
              <button
                onClick={() => tts.speak(item.label)}
                aria-label={`${item.label} vorlesen`}
                className="mt-1 text-sm active:scale-90 transition-transform"
              >
                🔊
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Answer area: 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {answerOptions.map((option, i) => {
          const state = answerStates[i] ?? 'idle'
          const isWrong = state === 'wrong'
          const isCorrect = state === 'correct'

          let borderClass = 'border-gray-200'
          let bgClass = 'bg-white'
          if (isCorrect) {
            borderClass = 'border-green-400'
            bgClass = 'bg-green-50'
          } else if (isWrong) {
            borderClass = 'border-red-400'
            bgClass = 'bg-red-50'
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(i, option.is_correct)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 ${borderClass} ${bgClass} active:scale-95 transition-transform shadow`}
              style={{ minHeight: '80px' }}
              data-testid={`answer-option-${i}`}
              aria-label={option.label}
            >
              <div
                className={`w-[72px] h-[72px] ${isWrong ? 'animate-shake' : ''}`}
              >
                <img
                  src={option.image_url}
                  alt={option.label}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="mt-1 text-xs text-gray-700 font-medium text-center leading-tight">
                {option.label}
              </span>
              {tts.isTTSAvailable() && (
                <button
                  onClick={(e) => { e.stopPropagation(); tts.speak(option.label) }}
                  aria-label={`${option.label} vorlesen`}
                  className="mt-1 text-sm active:scale-90 transition-transform"
                >
                  🔊
                </button>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
