import type { RolePlayConfig } from '../../types'

interface Props {
  value: RolePlayConfig
  onChange: (v: RolePlayConfig) => void
  errors?: Record<string, string>
}

export default function RolePlayConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<RolePlayConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateStep(index: number, patch: Partial<RolePlayConfig['steps'][0]>) {
    const steps = value.steps.map((s, i) => (i === index ? { ...s, ...patch } : s))
    update({ steps })
  }

  function addStep() {
    if (value.steps.length >= 6) return
    update({
      steps: [
        ...value.steps,
        { id: `step-${Date.now()}`, object_image: '', object_label: '', action_label: '', x_pct: 50, y_pct: 50, sound: null },
      ],
    })
  }

  function removeStep(index: number) {
    if (value.steps.length <= 2) return
    update({ steps: value.steps.filter((_, i) => i !== index) })
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
          placeholder="z.B. Fülle das Glas!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="ordered"
          checked={value.ordered}
          onChange={(e) => update({ ordered: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="ordered" className="text-sm font-medium text-gray-700">
          Reihenfolge einhalten
        </label>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Schritte (2–6)</label>
          {value.steps.length < 6 && (
            <button type="button" onClick={addStep} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Schritt
            </button>
          )}
        </div>
        {errors?.steps && <p className="text-sm text-red-600 mb-1">{errors.steps}</p>}
        <div className="space-y-2">
          {value.steps.map((step, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={step.object_label}
                  onChange={(e) => updateStep(i, { object_label: e.target.value })}
                  placeholder="Objekt-Name"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={step.action_label}
                  onChange={(e) => updateStep(i, { action_label: e.target.value })}
                  placeholder="Aktion"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
                {value.steps.length > 2 && (
                  <button type="button" onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500 px-1">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
