import type { CauseEffectConfig } from '../../types'
import { AssetPicker } from '../../components/ui'

interface Props {
  value: CauseEffectConfig
  onChange: (v: CauseEffectConfig) => void
  errors?: Record<string, string>
}

export default function CauseEffectConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<CauseEffectConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateObject(index: number, patch: Partial<CauseEffectConfig['objects'][0]>) {
    const objects = value.objects.map((o, i) => (i === index ? { ...o, ...patch } : o))
    update({ objects })
  }

  function addObject() {
    if (value.objects.length >= 8) return
    update({
      objects: [
        ...value.objects,
        { id: `obj-${Date.now()}`, x_pct: 50, y_pct: 50, image_url: '', label: '', animation: 'bounce' as const, sound: null },
      ],
    })
  }

  function removeObject(index: number) {
    if (value.objects.length <= 2) return
    update({ objects: value.objects.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <AssetPicker
          value={value.scene_image}
          onChange={(url) => update({ scene_image: url })}
          label="Szenenbild"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabe</label>
        <input
          type="text"
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="z.B. Tippe auf die Objekte!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="require-all"
          checked={value.require_all_tapped}
          onChange={(e) => update({ require_all_tapped: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="require-all" className="text-sm font-medium text-gray-700">
          Alle Objekte müssen berührt werden
        </label>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Objekte (2–8)</label>
          {value.objects.length < 8 && (
            <button type="button" onClick={addObject} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Objekt
            </button>
          )}
        </div>
        {errors?.objects && <p className="text-sm text-red-600 mb-1">{errors.objects}</p>}
        <div className="space-y-2">
          {value.objects.map((obj, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={obj.label}
                  onChange={(e) => updateObject(i, { label: e.target.value })}
                  placeholder="Name"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
                <select
                  value={obj.animation}
                  onChange={(e) => updateObject(i, { animation: e.target.value as 'bounce' | 'spin' | 'flash' | 'grow' })}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="bounce">Hüpfen</option>
                  <option value="spin">Drehen</option>
                  <option value="flash">Blinken</option>
                  <option value="grow">Wachsen</option>
                </select>
                {value.objects.length > 2 && (
                  <button type="button" onClick={() => removeObject(i)} className="text-gray-400 hover:text-red-500 px-1">✕</button>
                )}
              </div>
              <AssetPicker
                value={obj.image_url}
                onChange={(url) => updateObject(i, { image_url: url })}
                label="Objekt-Bild"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
