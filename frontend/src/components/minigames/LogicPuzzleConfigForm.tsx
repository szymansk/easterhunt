import type { LogicPuzzleConfig } from '../../types'

interface Props {
  value: LogicPuzzleConfig
  onChange: (v: LogicPuzzleConfig) => void
  errors?: Record<string, string>
}

export default function LogicPuzzleConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<LogicPuzzleConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateElement(index: number, patch: Partial<LogicPuzzleConfig['elements'][0]>) {
    const elements = value.elements.map((e, i) => (i === index ? { ...e, ...patch } : e))
    update({ elements })
  }

  function addElement() {
    if (value.elements.length >= 6) return
    const newElement = {
      id: `el-${Date.now()}`,
      type: 'switch' as const,
      x_pct: 50,
      y_pct: 50,
      image_off: '',
      image_on: '',
      label: '',
    }
    update({
      elements: [...value.elements, newElement],
      solution: [...value.solution, newElement.id],
    })
  }

  function removeElement(index: number) {
    if (value.elements.length <= 2) return
    const removed = value.elements[index]
    update({
      elements: value.elements.filter((_, i) => i !== index),
      solution: value.solution.filter((id) => id !== removed.id),
    })
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
          placeholder="z.B. Drücke die Schalter richtig!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lösung (IDs komma-getrennt in Reihenfolge)
        </label>
        <input
          type="text"
          value={value.solution.join(', ')}
          onChange={(e) =>
            update({ solution: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="z.B. el-1, el-2, el-3"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {errors?.solution && <p className="text-sm text-red-600 mt-1">{errors.solution}</p>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Elemente (2–6)</label>
          {value.elements.length < 6 && (
            <button type="button" onClick={addElement} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Element
            </button>
          )}
        </div>
        {errors?.elements && <p className="text-sm text-red-600 mb-1">{errors.elements}</p>}
        <div className="space-y-2">
          {value.elements.map((el, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500 font-mono">{el.id}</span>
                <input
                  type="text"
                  value={el.label}
                  onChange={(e) => updateElement(i, { label: e.target.value })}
                  placeholder="Name"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
                {value.elements.length > 2 && (
                  <button type="button" onClick={() => removeElement(i)} className="text-gray-400 hover:text-red-500 px-1">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
