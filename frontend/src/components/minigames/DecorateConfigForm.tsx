import type { DecorateConfig } from '../../types'

interface Props {
  value: DecorateConfig
  onChange: (v: DecorateConfig) => void
  errors?: Record<string, string>
}

export default function DecorateConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<DecorateConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateSticker(index: number, patch: Partial<DecorateConfig['stickers'][0]>) {
    const stickers = value.stickers.map((s, i) => (i === index ? { ...s, ...patch } : s))
    update({ stickers })
  }

  function addSticker() {
    if (value.stickers.length >= 12) return
    update({ stickers: [...value.stickers, { id: `sticker-${Date.now()}`, image_url: '', label: '' }] })
  }

  function removeSticker(index: number) {
    if (value.stickers.length <= 2) return
    update({ stickers: value.stickers.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Basisbild-URL</label>
        <input
          type="text"
          value={value.base_image}
          onChange={(e) => update({ base_image: e.target.value })}
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
          placeholder="z.B. Dekoriere das Ei!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Farben (komma-getrennt als CSS-Farben)</label>
        <input
          type="text"
          value={value.colors.join(', ')}
          onChange={(e) =>
            update({ colors: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) })
          }
          placeholder="z.B. #ff0000, #00ff00, #0000ff"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Sticker (2–12)</label>
          {value.stickers.length < 12 && (
            <button type="button" onClick={addSticker} className="text-sm text-blue-600 font-medium min-h-[44px] px-2">
              + Sticker
            </button>
          )}
        </div>
        {errors?.stickers && <p className="text-sm text-red-600 mb-1">{errors.stickers}</p>}
        <div className="space-y-2">
          {value.stickers.map((sticker, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={sticker.image_url}
                onChange={(e) => updateSticker(i, { image_url: e.target.value })}
                placeholder="Bild-URL"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={sticker.label}
                onChange={(e) => updateSticker(i, { label: e.target.value })}
                placeholder="Bezeichnung"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {value.stickers.length > 2 && (
                <button type="button" onClick={() => removeSticker(i)} className="text-gray-400 hover:text-red-500 px-2">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
