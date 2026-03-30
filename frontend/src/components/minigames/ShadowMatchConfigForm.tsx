import type { ShadowMatchConfig } from '../../types'

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Silhouette-Bild URL</label>
        <input
          type="text"
          value={value.silhouette_image_url}
          onChange={(e) => update({ silhouette_image_url: e.target.value })}
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
              <input
                type="text"
                value={opt.image_url}
                onChange={(e) => updateOption(i, { image_url: e.target.value })}
                placeholder="Bild-URL"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
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
