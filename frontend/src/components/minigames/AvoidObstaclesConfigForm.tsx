import type { AvoidObstaclesConfig } from '../../types'

interface Props {
  value: AvoidObstaclesConfig
  onChange: (v: AvoidObstaclesConfig) => void
  errors?: Record<string, string>
}

export default function AvoidObstaclesConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<AvoidObstaclesConfig>) {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Charakter-Emoji</label>
          <input
            type="text"
            value={value.character_emoji}
            onChange={(e) => update({ character_emoji: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hindernis-Emoji</label>
          <input
            type="text"
            value={value.obstacle_emoji}
            onChange={(e) => update({ obstacle_emoji: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geschwindigkeit</label>
          <select
            value={value.obstacle_speed}
            onChange={(e) => update({ obstacle_speed: Number(e.target.value) as 1 | 2 | 3 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={1}>Langsam</option>
            <option value={2}>Mittel</option>
            <option value={3}>Schnell</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leben</label>
          <input
            type="number"
            value={value.lives}
            onChange={(e) => update({ lives: Number(e.target.value) })}
            min={1} max={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Zieldistanz</label>
          <input
            type="number"
            value={value.target_distance}
            onChange={(e) => update({ target_distance: Number(e.target.value) })}
            min={100} max={1000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      {errors?.lives && <p className="text-sm text-red-600">{errors.lives}</p>}
    </div>
  )
}
