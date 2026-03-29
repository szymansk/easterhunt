import type { TextRiddleConfig, TextRiddleOption } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: TextRiddleConfig
  onChange: (v: TextRiddleConfig) => void
  errors?: {
    question_text?: string
    answer_options?: string
  }
}

export default function TextRiddleConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<TextRiddleConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateOption(index: number, patch: Partial<TextRiddleOption>) {
    const opts = value.answer_options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt))
    update({ answer_options: opts })
  }

  function setCorrect(index: number) {
    const opts = value.answer_options.map((opt, i) => ({ ...opt, is_correct: i === index }))
    update({ answer_options: opts })
  }

  function addOption() {
    if (value.answer_options.length >= 6) return
    update({ answer_options: [...value.answer_options, { text: '', is_correct: false }] })
  }

  function removeOption(index: number) {
    if (value.answer_options.length <= 2) return
    const opts = value.answer_options.filter((_, i) => i !== index)
    // Ensure exactly one is_correct after removal
    if (!opts.some((o) => o.is_correct) && opts.length > 0) {
      opts[0] = { ...opts[0], is_correct: true }
    }
    update({ answer_options: opts })
  }

  const correctCount = value.answer_options.filter((o) => o.is_correct).length

  return (
    <div className="space-y-4">
      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frage <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-2">({value.question_text.length} Zeichen)</span>
        </label>
        <input
          type="text"
          value={value.question_text}
          onChange={(e) => update({ question_text: e.target.value })}
          placeholder="z.B. Welche Farbe hat Gras?"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors?.question_text ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors?.question_text && (
          <p className="text-sm text-red-600 mt-1">{errors.question_text}</p>
        )}
      </div>

      {/* Answer mode */}
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

      {/* Answer options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Antwortoptionen (2–6) <span className="text-red-500">*</span>
          </label>
          {value.answer_options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Hinzufügen
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Klicke den Radio-Button links um die korrekte Antwort zu markieren.
        </p>
        <div className="space-y-2">
          {value.answer_options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-answer"
                checked={opt.is_correct}
                onChange={() => setCorrect(i)}
                aria-label={`Option ${i + 1} ist korrekt`}
                className="w-4 h-4 text-blue-600"
              />
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOption(i, { text: e.target.value })}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {value.answer_options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Entfernen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {correctCount !== 1 && (
          <p className="text-sm text-amber-600 mt-1">
            Genau eine Antwort muss als korrekt markiert sein.
          </p>
        )}
        {errors?.answer_options && (
          <p className="text-sm text-red-600 mt-1">{errors.answer_options}</p>
        )}
      </div>

      {/* TTS toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="tts-enabled"
          checked={value.tts_enabled}
          onChange={(e) => update({ tts_enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="tts-enabled" className="text-sm font-medium text-gray-700">
          Vorlesen-Button anzeigen (TTS)
        </label>
      </div>
    </div>
  )
}
