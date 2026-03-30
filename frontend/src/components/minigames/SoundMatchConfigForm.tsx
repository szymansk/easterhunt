import type { SoundMatchConfig } from '../../types'

interface Props {
  value: SoundMatchConfig
  onChange: (v: SoundMatchConfig) => void
  errors?: Record<string, string>
}

export default function SoundMatchConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<SoundMatchConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateDistractor(index: number, patch: Partial<{ image_url: string; label: string }>) {
    const distractors = value.distractors.map((d, i) => (i === index ? { ...d, ...patch } : d))
    update({ distractors })
  }

  function addDistractor() {
    if (value.distractors.length >= 3) return
    update({ distractors: [...value.distractors, { image_url: '', label: '' }] })
  }

  function removeDistractor(index: number) {
    if (value.distractors.length <= 2) return
    update({ distractors: value.distractors.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Geräusch-URL <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.sound_url}
          onChange={(e) => update({ sound_url: e.target.value })}
          placeholder="https://..."
          className={`w-full rounded-lg border px-3 py-2 text-sm ${errors?.sound_url ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Richtiges Objekt</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.correct_item.image_url}
            onChange={(e) => update({ correct_item: { ...value.correct_item, image_url: e.target.value } })}
            placeholder="Bild-URL"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={value.correct_item.label}
            onChange={(e) => update({ correct_item: { ...value.correct_item, label: e.target.value } })}
            placeholder="Bezeichnung"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Ablenker (2–3)</label>
          {value.distractors.length < 3 && (
            <button type="button" onClick={addDistractor} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Hinzufügen
            </button>
          )}
        </div>
        <div className="space-y-2">
          {value.distractors.map((d, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={d.image_url}
                onChange={(e) => updateDistractor(i, { image_url: e.target.value })}
                placeholder="Bild-URL"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={d.label}
                onChange={(e) => updateDistractor(i, { label: e.target.value })}
                placeholder="Bezeichnung"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {value.distractors.length > 2 && (
                <button type="button" onClick={() => removeDistractor(i)} className="text-gray-400 hover:text-red-500 px-2 min-h-[44px]">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
