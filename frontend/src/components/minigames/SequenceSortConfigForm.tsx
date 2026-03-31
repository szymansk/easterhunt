import { AssetPicker } from '../../components/ui'
import type { SequenceSortConfig } from '../../types'

interface Props {
  value: SequenceSortConfig
  onChange: (v: SequenceSortConfig) => void
  errors?: Record<string, string>
}

export default function SequenceSortConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<SequenceSortConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateStep(index: number, patch: Partial<SequenceSortConfig['steps'][0]>) {
    const steps = value.steps.map((s, i) => (i === index ? { ...s, ...patch } : s))
    update({ steps })
  }

  function addStep() {
    if (value.steps.length >= 5) return
    update({
      steps: [...value.steps, { id: `step-${Date.now()}`, image_url: '', label: '', correct_order: value.steps.length }],
    })
  }

  function removeStep(index: number) {
    if (value.steps.length <= 3) return
    update({ steps: value.steps.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aufgabe</label>
        <input
          type="text"
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="z.B. Ordne die Schritte!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Schritte (3–5)</label>
          {value.steps.length < 5 && (
            <button type="button" onClick={addStep} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Schritt
            </button>
          )}
        </div>
        {errors?.steps && <p className="text-sm text-red-600 mb-1">{errors.steps}</p>}
        <div className="space-y-2">
          {value.steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-sm font-bold text-gray-500 w-6">{i + 1}.</span>
              <input
                type="text"
                value={step.label}
                onChange={(e) => updateStep(i, { label: e.target.value })}
                placeholder="Bezeichnung"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <AssetPicker value={step.image_url} onChange={(url) => updateStep(i, { image_url: url })} label="Bild" />
              {value.steps.length > 3 && (
                <button type="button" onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500 px-2">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
