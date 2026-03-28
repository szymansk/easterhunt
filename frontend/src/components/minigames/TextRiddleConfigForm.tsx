import type { TextRiddleConfig } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: TextRiddleConfig
  onChange: (v: TextRiddleConfig) => void
  errors?: {
    question?: string
    options?: string
  }
}

export default function TextRiddleConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<TextRiddleConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateOption(index: number, text: string) {
    const opts = [...value.options]
    opts[index] = text
    update({ options: opts })
  }

  function addOption() {
    if (value.options.length >= 6) return
    update({ options: [...value.options, ''] })
  }

  function removeOption(index: number) {
    if (value.options.length <= 2) return
    update({ options: value.options.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frage <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.question}
          onChange={(e) => update({ question: e.target.value })}
          placeholder="z.B. Welche Farbe hat Gras?"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors?.question ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors?.question && <p className="text-sm text-red-600 mt-1">{errors.question}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Antwortmodus</label>
        <div className="flex gap-3">
          {(['multiple_choice', 'single_tap'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update({ answer_mode: mode, type: MiniGameType.text_riddle })}
              className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                value.answer_mode === mode
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {mode === 'multiple_choice' ? 'Multiple Choice' : 'Einzelauswahl'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Antwortoptionen (2–6) <span className="text-red-500">*</span>
          </label>
          {value.options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Hinzufügen
            </button>
          )}
        </div>
        <div className="space-y-2">
          {value.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {value.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Entfernen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {errors?.options && <p className="text-sm text-red-600 mt-1">{errors.options}</p>}
      </div>
    </div>
  )
}
