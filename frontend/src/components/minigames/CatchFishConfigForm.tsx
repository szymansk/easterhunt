import type { CatchFishConfig } from '../../types'

interface Props {
  value: CatchFishConfig
  onChange: (v: CatchFishConfig) => void
  errors?: Record<string, string>
}

export default function CatchFishConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<CatchFishConfig>) {
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
          placeholder="z.B. Fang die Fische!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fisch-Emoji</label>
          <input
            type="text"
            value={value.fish_emoji}
            onChange={(e) => update({ fish_emoji: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geschwindigkeit</label>
          <select
            value={value.animation_speed}
            onChange={(e) => update({ animation_speed: e.target.value as 'slow' | 'medium' | 'fast' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="slow">Langsam</option>
            <option value="medium">Mittel</option>
            <option value="fast">Schnell</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fische gesamt</label>
          <input
            type="number"
            value={value.total_fish}
            onChange={(e) => update({ total_fish: Number(e.target.value) })}
            min={1}
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
