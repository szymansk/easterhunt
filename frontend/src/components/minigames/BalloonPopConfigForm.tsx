import type { BalloonPopConfig } from '../../types'

interface Props {
  value: BalloonPopConfig
  onChange: (v: BalloonPopConfig) => void
  errors?: Record<string, string>
}

export default function BalloonPopConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<BalloonPopConfig>) {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabe</label>
        <input
          type="text"
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="z.B. Platze die Ballons!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ballon-Emoji</label>
          <input
            type="text"
            value={value.balloon_emoji}
            onChange={(e) => update({ balloon_emoji: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gesamt</label>
          <input
            type="number"
            value={value.total_balloons}
            onChange={(e) => update({ total_balloons: Number(e.target.value) })}
            min={3} max={12}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ziel</label>
          <input
            type="number"
            value={value.target_count}
            onChange={(e) => update({ target_count: Number(e.target.value) })}
            min={1}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      {errors?.target_count && <p className="text-sm text-red-600">{errors.target_count}</p>}
    </div>
  )
}
