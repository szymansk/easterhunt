import { useState } from 'react'
import type { NumberRiddleConfig } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: NumberRiddleConfig
  onChange: (v: NumberRiddleConfig) => void
  errors?: Partial<Record<keyof NumberRiddleConfig, string>>
}

const TASK_TYPES: { value: NumberRiddleConfig['task_type']; label: string }[] = [
  { value: 'count', label: 'Zählen' },
  { value: 'assign', label: 'Zuordnen' },
  { value: 'plus_minus', label: 'Rechnen' },
]

function generateDistractors(correctAnswer: number): number[] {
  const pool = Array.from({ length: 10 }, (_, i) => i + 1).filter((n) => n !== correctAnswer)
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export default function NumberRiddleConfigForm({ value, onChange, errors }: Props) {
  const [showPreview, setShowPreview] = useState(false)

  function update(patch: Partial<NumberRiddleConfig>) {
    onChange({ ...value, ...patch })
  }

  function toggleDistractor(n: number) {
    const current = value.distractor_answers ?? []
    if (current.includes(n)) {
      update({ distractor_answers: current.filter((d) => d !== n) })
    } else if (current.length < 4) {
      update({ distractor_answers: [...current, n] })
    }
  }

  function handleAutoFill() {
    update({ distractor_answers: generateDistractors(value.correct_answer) })
  }

  const distractors = value.distractor_answers ?? []
  const allOptions = [...distractors, value.correct_answer].sort(() => Math.random() - 0.5)

  return (
    <div className="space-y-4">
      {/* Task type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabentyp</label>
        <div className="flex gap-2">
          {TASK_TYPES.map(({ value: v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ task_type: v, type: MiniGameType.number_riddle })}
              className={`flex-1 py-2 px-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                value.task_type === v
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              data-testid={`task-type-${v}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frage / Aufgabe <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.prompt_text}
          onChange={(e) => update({ prompt_text: e.target.value })}
          placeholder="z.B. Wie viele Eier siehst du?"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors?.prompt_text ? 'border-red-500' : 'border-gray-300'
          }`}
          data-testid="prompt-text-input"
        />
        {errors?.prompt_text && (
          <p className="text-sm text-red-600 mt-1">{errors.prompt_text}</p>
        )}
      </div>

      {/* Correct answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Richtige Antwort (1–10) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ correct_answer: n, type: MiniGameType.number_riddle })}
              className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                value.correct_answer === n
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid={`correct-answer-${n}`}
            >
              {n}
            </button>
          ))}
        </div>
        {errors?.correct_answer && (
          <p className="text-sm text-red-600 mt-1">{errors.correct_answer}</p>
        )}
      </div>

      {/* Distractors */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Falsche Antworten (2–4 auswählen) <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleAutoFill}
            className="text-xs text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium min-h-[44px] px-2"
            data-testid="auto-fill-btn"
          >
            Auto-Fill
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1)
            .filter((n) => n !== value.correct_answer)
            .map((n) => {
              const selected = distractors.includes(n)
              const maxReached = distractors.length >= 4 && !selected
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleDistractor(n)}
                  disabled={maxReached}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                    selected
                      ? 'bg-red-400 text-white'
                      : maxReached
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`distractor-${n}`}
                >
                  {n}
                </button>
              )
            })}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {distractors.length} von 2–4 ausgewählt
        </p>
        {errors?.distractor_answers && (
          <p className="text-sm text-red-600 mt-1">{errors.distractor_answers}</p>
        )}
      </div>

      {/* Preview toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 active:text-blue-900 underline min-h-[44px] px-1"
          data-testid="preview-toggle"
        >
          {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
        </button>

        {showPreview && (
          <div
            className="mt-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4"
            data-testid="preview-panel"
          >
            <p className="text-xs text-gray-500 mb-2 text-center">Vorschau (Kindansicht)</p>
            <div className="bg-white rounded-xl shadow p-4 text-center max-w-xs mx-auto">
              <div className="text-3xl mb-2">🔢</div>
              <p className="font-bold text-gray-800 mb-4 text-sm">
                {value.prompt_text || '(Frage eingeben)'}
              </p>
              <div className={`grid gap-2 ${allOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {allOptions.map((n) => (
                  <div
                    key={n}
                    className="rounded-lg bg-blue-100 text-blue-800 font-bold text-lg flex items-center justify-center"
                    style={{ minHeight: '48px' }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
