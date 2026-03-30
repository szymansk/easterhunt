import type { ColorSortConfig } from '../../types'

interface Props {
  value: ColorSortConfig
  onChange: (v: ColorSortConfig) => void
  errors?: Record<string, string>
}

export default function ColorSortConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<ColorSortConfig>) {
    onChange({ ...value, ...patch })
  }

  function updateBucket(index: number, patch: Partial<ColorSortConfig['buckets'][0]>) {
    const buckets = value.buckets.map((b, i) => (i === index ? { ...b, ...patch } : b))
    update({ buckets })
  }

  function updateItem(index: number, patch: Partial<ColorSortConfig['items'][0]>) {
    const items = value.items.map((it, i) => (i === index ? { ...it, ...patch } : it))
    update({ items })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Eimer (2–4)</label>
        {errors?.buckets && <p className="text-sm text-red-600 mb-1">{errors.buckets}</p>}
        <div className="space-y-2">
          {value.buckets.map((bucket, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={bucket.label}
                onChange={(e) => updateBucket(i, { label: e.target.value })}
                placeholder="Bezeichnung"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="color"
                value={bucket.color}
                onChange={(e) => updateBucket(i, { color: e.target.value })}
                className="rounded-lg border border-gray-300 h-9"
              />
              <input
                type="text"
                value={bucket.item_ids.join(',')}
                onChange={(e) => updateBucket(i, { item_ids: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Item-IDs (komma-getrennt)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gegenstände (4–8)</label>
        {errors?.items && <p className="text-sm text-red-600 mb-1">{errors.items}</p>}
        <div className="space-y-2">
          {value.items.map((item, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input
                type="text"
                value={item.id}
                onChange={(e) => updateItem(i, { id: e.target.value })}
                placeholder="ID"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(i, { label: e.target.value })}
                placeholder="Bezeichnung"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={item.emoji}
                onChange={(e) => updateItem(i, { emoji: e.target.value })}
                placeholder="Emoji"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="color"
                value={item.color}
                onChange={(e) => updateItem(i, { color: e.target.value })}
                className="rounded-lg border border-gray-300 h-9"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
