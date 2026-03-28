import type { NumberRiddleConfig } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: NumberRiddleConfig
  onChange: (v: NumberRiddleConfig) => void
  errors?: Partial<Record<keyof NumberRiddleConfig, string>>
}

export default function NumberRiddleConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<NumberRiddleConfig>) {
    onChange({ ...value, ...patch })
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
          placeholder="z.B. Wie viele Eier siehst du?"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors?.question ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors?.question && <p className="text-sm text-red-600 mt-1">{errors.question}</p>}
      </div>

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
            >
              {n}
            </button>
          ))}
        </div>
        {errors?.correct_answer && (
          <p className="text-sm text-red-600 mt-1">{errors.correct_answer}</p>
        )}
      </div>
    </div>
  )
}
