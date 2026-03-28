import type { MazeConfig } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: MazeConfig
  onChange: (v: MazeConfig) => void
}

const DIFFICULTIES: { value: 'easy' | 'medium' | 'hard'; label: string; desc: string; rows: number; cols: number }[] = [
  { value: 'easy', label: 'Einfach', desc: '5×5', rows: 5, cols: 5 },
  { value: 'medium', label: 'Mittel', desc: '6×6', rows: 6, cols: 6 },
  { value: 'hard', label: 'Schwer', desc: '8×8', rows: 8, cols: 8 },
]

export default function MazeConfigForm({ value, onChange }: Props) {
  const current = (value.maze_data?.difficulty as 'easy' | 'medium' | 'hard') ?? 'easy'

  function select(difficulty: 'easy' | 'medium' | 'hard') {
    const opt = DIFFICULTIES.find((d) => d.value === difficulty)!
    onChange({
      type: MiniGameType.maze,
      maze_data: { difficulty, rows: opt.rows, cols: opt.cols },
    })
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Schwierigkeit</label>
      <div className="grid grid-cols-3 gap-3">
        {DIFFICULTIES.map((opt) => {
          const selected = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-colors ${
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-base font-semibold text-gray-800">{opt.label}</span>
              <span className="text-xs text-gray-500">{opt.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
