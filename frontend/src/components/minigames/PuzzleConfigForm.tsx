import type { PuzzleConfig } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: PuzzleConfig
  onChange: (v: PuzzleConfig) => void
  errors?: Partial<Record<keyof PuzzleConfig, string>>
}

const GRID_OPTIONS: { value: PuzzleConfig['grid_size']; label: string; cols: number; rows: number }[] = [
  { value: 3, label: '1×3', cols: 3, rows: 1 },
  { value: 4, label: '2×2', cols: 2, rows: 2 },
  { value: 6, label: '2×3', cols: 3, rows: 2 },
  { value: 9, label: '3×3', cols: 3, rows: 3 },
]

export default function PuzzleConfigForm({ value, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Rastergröße</label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GRID_OPTIONS.map((opt) => {
          const selected = value.grid_size === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ type: MiniGameType.puzzle, grid_size: opt.value })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Visual grid preview */}
              <div
                className="gap-0.5"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${opt.cols}, 1fr)`,
                  width: 40,
                }}
              >
                {Array.from({ length: opt.value }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${selected ? 'bg-blue-400' : 'bg-gray-300'}`}
                    style={{ height: 40 / opt.rows }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">{opt.label}</span>
            </button>
          )
        })}
      </div>
      {errors?.grid_size && (
        <p className="text-sm text-red-600">{errors.grid_size}</p>
      )}
    </div>
  )
}
