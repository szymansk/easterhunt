import type { BuildObjectConfig } from '../../types'
import { AssetPicker } from '../../components/ui'

interface Props {
  value: BuildObjectConfig
  onChange: (v: BuildObjectConfig) => void
  errors?: Record<string, string>
}

export default function BuildObjectConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<BuildObjectConfig>) {
    onChange({ ...value, ...patch })
  }

  function updatePart(index: number, patch: Partial<BuildObjectConfig['parts'][0]>) {
    const parts = value.parts.map((p, i) => (i === index ? { ...p, ...patch } : p))
    update({ parts })
  }

  function addPart() {
    if (value.parts.length >= 8) return
    update({
      parts: [
        ...value.parts,
        { id: `part-${Date.now()}`, image_url: '', label: '', slot_x_pct: 50, slot_y_pct: 50, width_pct: 20, height_pct: 20 },
      ],
    })
  }

  function removePart(index: number) {
    if (value.parts.length <= 2) return
    update({ parts: value.parts.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <AssetPicker
          value={value.background_image}
          onChange={(url) => update({ background_image: url })}
          label="Hintergrundbild"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabe</label>
        <input
          type="text"
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="z.B. Baue das Haus!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Teile (2–8)</label>
          {value.parts.length < 8 && (
            <button type="button" onClick={addPart} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Teil
            </button>
          )}
        </div>
        {errors?.parts && <p className="text-sm text-red-600 mb-1">{errors.parts}</p>}
        <div className="space-y-3">
          {value.parts.map((part, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={part.label}
                  onChange={(e) => updatePart(i, { label: e.target.value })}
                  placeholder="Name"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex-1">
                  <AssetPicker
                    value={part.image_url}
                    onChange={(url) => updatePart(i, { image_url: url })}
                    label="Teil-Bild"
                  />
                </div>
                {value.parts.length > 2 && (
                  <button type="button" onClick={() => removePart(i)} className="text-gray-400 hover:text-red-500 px-2">✕</button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <input type="number" value={part.slot_x_pct} onChange={(e) => updatePart(i, { slot_x_pct: Number(e.target.value) })} placeholder="X%" className="rounded border border-gray-300 px-2 py-1" />
                <input type="number" value={part.slot_y_pct} onChange={(e) => updatePart(i, { slot_y_pct: Number(e.target.value) })} placeholder="Y%" className="rounded border border-gray-300 px-2 py-1" />
                <input type="number" value={part.width_pct} onChange={(e) => updatePart(i, { width_pct: Number(e.target.value) })} placeholder="B%" className="rounded border border-gray-300 px-2 py-1" />
                <input type="number" value={part.height_pct} onChange={(e) => updatePart(i, { height_pct: Number(e.target.value) })} placeholder="H%" className="rounded border border-gray-300 px-2 py-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
