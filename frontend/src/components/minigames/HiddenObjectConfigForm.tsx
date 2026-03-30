import type { HiddenObjectConfig } from '../../types'

interface Props {
  value: HiddenObjectConfig
  onChange: (v: HiddenObjectConfig) => void
  errors?: Record<string, string>
}

export default function HiddenObjectConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<HiddenObjectConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateTarget(index: number, patch: Partial<HiddenObjectConfig['targets'][0]>) {
    const targets = value.targets.map((t, i) => (i === index ? { ...t, ...patch } : t))
    update({ targets })
  }

  function addTarget() {
    if (value.targets.length >= 8) return
    update({
      targets: [...value.targets, { id: `t-${Date.now()}`, label: '', x_pct: 50, y_pct: 50, radius_pct: 8 }],
    })
  }

  function removeTarget(index: number) {
    if (value.targets.length <= 2) return
    update({ targets: value.targets.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Szenenbild-URL</label>
        <input
          type="text"
          value={value.scene_image}
          onChange={(e) => update({ scene_image: e.target.value })}
          placeholder="https://..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabe</label>
        <input
          type="text"
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="z.B. Finde alle Gegenstände!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Ziele (2–8)</label>
          {value.targets.length < 8 && (
            <button type="button" onClick={addTarget} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Ziel
            </button>
          )}
        </div>
        {errors?.targets && <p className="text-sm text-red-600 mb-1">{errors.targets}</p>}
        <div className="space-y-2">
          {value.targets.map((t, i) => (
            <div key={i} className="grid grid-cols-5 gap-1 items-center">
              <input
                type="text"
                value={t.label}
                onChange={(e) => updateTarget(i, { label: e.target.value })}
                placeholder="Name"
                className="col-span-2 rounded-lg border border-gray-300 px-2 py-1 text-sm"
              />
              <input type="number" value={t.x_pct} onChange={(e) => updateTarget(i, { x_pct: Number(e.target.value) })} placeholder="X%" className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
              <input type="number" value={t.y_pct} onChange={(e) => updateTarget(i, { y_pct: Number(e.target.value) })} placeholder="Y%" className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
              {value.targets.length > 2 && (
                <button type="button" onClick={() => removeTarget(i)} className="text-gray-400 hover:text-red-500">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
