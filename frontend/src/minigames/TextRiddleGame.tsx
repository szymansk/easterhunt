import { useState } from 'react'
import type { TextRiddleOption } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface TextRiddleGameProps {
  questionText: string
  answerMode: 'multiple_choice' | 'single_tap'
  answerOptions: TextRiddleOption[]
  ttsEnabled: boolean
  onComplete?: () => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export default function TextRiddleGame({
  questionText,
  answerOptions,
  ttsEnabled,
  onComplete,
}: TextRiddleGameProps) {
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
      }, 1000)
    } else {
      audio.play('error')
      setAnswerStates((prev) => ({ ...prev, [index]: 'wrong' }))
      setTimeout(() => {
        setAnswerStates((prev) => ({ ...prev, [index]: 'idle' }))
      }, 600)
    }
  }

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-start p-4">
      {/* Question area */}
      <div className="w-full max-w-sm mt-4 mb-4">
        <div className="flex items-start gap-2">
          <p
            className="flex-1 font-bold text-gray-800 text-center"
            style={{ fontSize: '20px', lineHeight: '1.4' }}
          >
            {questionText}
          </p>
          {ttsEnabled && (
            <button
              onClick={() => tts.speak(questionText)}
              aria-label="Frage vorlesen"
              data-testid="tts-button"
              className="flex-shrink-0 flex items-center justify-center rounded-full bg-purple-200 hover:bg-purple-300 active:scale-95 transition-transform"
              style={{ width: '44px', height: '44px' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-purple-700"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Answer cards */}
      <div className="w-full max-w-sm space-y-3">
        {answerOptions.map((option, i) => {
          const state = answerStates[i] ?? 'idle'
          const isCorrect = state === 'correct'
          const isWrong = state === 'wrong'

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
              data-testid={`answer-option-${i}`}
              aria-label={option.text}
              className={`w-full px-4 font-semibold text-left rounded-2xl border-2 ${borderClass} ${bgClass} active:scale-95 transition-transform shadow ${isWrong ? 'animate-shake' : ''}`}
              style={{ minHeight: '60px', fontSize: '16px' }}
            >
              {option.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
