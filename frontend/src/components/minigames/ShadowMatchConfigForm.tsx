import type { ShadowMatchConfig } from '../../types'
import { AssetPicker } from '../../components/ui'

interface Props {
  value: ShadowMatchConfig
  onChange: (v: ShadowMatchConfig) => void
  errors?: Record<string, string>
}

export default function ShadowMatchConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<ShadowMatchConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateOption(index: number, patch: Partial<ShadowMatchConfig['options'][0]>) {
    const options = value.options.map((o, i) => (i === index ? { ...o, ...patch } : o))
    update({ options })
  }

  function setCorrect(index: number) {
    const options = value.options.map((o, i) => ({ ...o, is_correct: i === index }))
    update({ options })
  }

  return (
    <div className="space-y-4">
      <div>
        <AssetPicker
          value={value.silhouette_image_url}
          onChange={(url) => update({ silhouette_image_url: url })}
          label="Silhouetten-Bild"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabe</label>
        <input
          type="text"
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="z.B. Was ist das?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Optionen (2–4)</label>
        {errors?.options && <p className="text-sm text-red-600 mb-1">{errors.options}</p>}
        <div className="space-y-2">
          {value.options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="radio"
                name="shadow-correct"
                checked={opt.is_correct}
                onChange={() => setCorrect(i)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <AssetPicker
                  value={opt.image_url}
                  onChange={(url) => updateOption(i, { image_url: url })}
                  label="Antwort-Bild"
                />
              </div>
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(i, { label: e.target.value })}
                placeholder="Bezeichnung"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
