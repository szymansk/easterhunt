import { AssetPicker } from '../../components/ui'
import type { ComparisonConfig } from '../../types'

interface Props {
  value: ComparisonConfig
  onChange: (v: ComparisonConfig) => void
  errors?: Record<string, string>
}

export default function ComparisonConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<ComparisonConfig>) {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Frage</label>
        <input
          type="text"
          value={value.question}
          onChange={(e) => update({ question: e.target.value })}
          placeholder="z.B. Was ist größer?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vergleichstyp</label>
          <select
            value={value.comparison_type}
            onChange={(e) => update({ comparison_type: e.target.value as 'size' | 'count' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="size">Größe</option>
            <option value="count">Anzahl</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Richtige Seite</label>
          <select
            value={value.correct_side}
            onChange={(e) => update({ correct_side: e.target.value as 'left' | 'right' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="left">Links</option>
            <option value="right">Rechts</option>
          </select>
        </div>
      </div>

      {(['left_item', 'right_item'] as const).map((side) => (
        <div key={side}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {side === 'left_item' ? 'Linkes Objekt' : 'Rechtes Objekt'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={value[side].label}
              onChange={(e) => update({ [side]: { ...value[side], label: e.target.value } })}
              placeholder="Bezeichnung"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <AssetPicker
              value={value[side].image_url}
              onChange={(url) => update({ [side]: { ...value[side], image_url: url } })}
              label={side === 'left_item' ? 'Linkes Objekt (Bild)' : 'Rechtes Objekt (Bild)'}
            />
            <input
              type="number"
              value={value[side].value}
              onChange={(e) => update({ [side]: { ...value[side], value: Number(e.target.value) } })}
              placeholder="Wert"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      ))}
      {errors?.question && <p className="text-sm text-red-600">{errors.question}</p>}
    </div>
  )
}
