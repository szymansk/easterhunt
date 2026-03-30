import type { RhythmConfig } from '../../types'

interface Props {
  value: RhythmConfig
  onChange: (v: RhythmConfig) => void
  errors?: Record<string, string>
}

export default function RhythmConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<RhythmConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateBeat(index: number, delay_ms: number) {
    const pattern = value.pattern.map((b, i) => (i === index ? { delay_ms } : b))
    update({ pattern })
  }

  function addBeat() {
    if (value.pattern.length >= 5) return
    update({ pattern: [...value.pattern, { delay_ms: 500 }] })
  }

  function removeBeat(index: number) {
    if (value.pattern.length <= 2) return
    update({ pattern: value.pattern.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabe</label>
        <input
          type="text"
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="z.B. Tippe den Rhythmus nach!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max. Versuche</label>
          <input
            type="number"
            value={value.max_attempts}
            onChange={(e) => update({ max_attempts: Number(e.target.value) })}
            min={1} max={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Toleranz (ms)</label>
          <input
            type="number"
            value={value.tolerance_ms}
            onChange={(e) => update({ tolerance_ms: Number(e.target.value) })}
            min={100} max={500}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Beats (2–5)</label>
          {value.pattern.length < 5 && (
            <button type="button" onClick={addBeat} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Beat
            </button>
          )}
        </div>
        {errors?.pattern && <p className="text-sm text-red-600 mb-1">{errors.pattern}</p>}
        <div className="space-y-2">
          {value.pattern.map((beat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-sm text-gray-500 w-16">Beat {i + 1}:</span>
              <input
                type="number"
                value={beat.delay_ms}
                onChange={(e) => updateBeat(i, Number(e.target.value))}
                placeholder="Verzögerung (ms)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                min={0}
              />
              <span className="text-xs text-gray-500">ms</span>
              {value.pattern.length > 2 && (
                <button type="button" onClick={() => removeBeat(i)} className="text-gray-400 hover:text-red-500 px-2">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
