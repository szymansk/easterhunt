import type { WhackAMoleConfig } from '../../types'

interface Props {
  value: WhackAMoleConfig
  onChange: (v: WhackAMoleConfig) => void
  errors?: Record<string, string>
}

export default function WhackAMoleConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<WhackAMoleConfig>) {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maulwurf-Emoji</label>
          <input
            type="text"
            value={value.mole_emoji}
            onChange={(e) => update({ mole_emoji: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rastergrö&szlig;e</label>
          <select
            value={value.grid_size}
            onChange={(e) => update({ grid_size: Number(e.target.value) as 3 | 4 | 6 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={3}>3 Löcher</option>
            <option value={4}>4 Löcher</option>
            <option value={6}>6 Löcher</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (s)</label>
          <input
            type="number"
            value={value.duration_s}
            onChange={(e) => update({ duration_s: Number(e.target.value) })}
            min={10} max={60}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zeigzeit (ms)</label>
          <input
            type="number"
            value={value.appear_ms}
            onChange={(e) => update({ appear_ms: Number(e.target.value) })}
            min={400} max={2000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zielpunkte</label>
          <input
            type="number"
            value={value.target_score}
            onChange={(e) => update({ target_score: Number(e.target.value) })}
            min={1}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      {errors?.target_score && <p className="text-sm text-red-600">{errors.target_score}</p>}
    </div>
  )
}
