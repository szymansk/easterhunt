import type { MemoryConfig } from '../../types'
import { MiniGameType } from '../../types'
import { AssetPicker } from '../../components/ui'

interface Props {
  value: MemoryConfig
  onChange: (v: MemoryConfig) => void
  errors?: Record<string, string>
}

export default function MemoryConfigForm({ value, onChange, errors }: Props) {
  function update(patch: Partial<MemoryConfig>) {
    onChange({ ...value, ...patch })
  }

  function updatePair(index: number, patch: Partial<MemoryConfig['pairs'][0]>) {
    const pairs = value.pairs.map((p, i) => (i === index ? { ...p, ...patch } : p))
    update({ pairs })
  }

  function addPair() {
    if (value.pairs.length >= 12) return
    update({
      pairs: [...value.pairs, { id: `pair-${Date.now()}`, image_url: '', label: '' }],
    })
  }

  function removePair(index: number) {
    if (value.pairs.length <= 4) return
    update({ pairs: value.pairs.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Spalten</label>
        <select
          value={value.grid_cols}
          onChange={(e) => update({ grid_cols: Number(e.target.value) as 2 | 3 | 4, type: MiniGameType.memory })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={2}>2 Spalten</option>
          <option value={3}>3 Spalten</option>
          <option value={4}>4 Spalten</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Paare (4–12, gerade Anzahl) <span className="text-red-500">*</span>
          </label>
          {value.pairs.length < 12 && (
            <button
              type="button"
              onClick={addPair}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium min-h-[44px] px-2"
            >
              + Paar
            </button>
          )}
        </div>
        {errors?.pairs && <p className="text-sm text-red-600 mb-2">{errors.pairs}</p>}
        <div className="space-y-2">
          {value.pairs.map((pair, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex-1">
                <AssetPicker
                  value={pair.image_url}
                  onChange={(url) => updatePair(i, { image_url: url })}
                  label="Bild"
                />
              </div>
              <input
                type="text"
                value={pair.label}
                onChange={(e) => updatePair(i, { label: e.target.value })}
                placeholder="Bezeichnung"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {value.pairs.length > 4 && (
                <button
                  type="button"
                  onClick={() => removePair(i)}
                  className="text-gray-400 hover:text-red-500 px-2 min-h-[44px]"
                  aria-label="Entfernen"
                >
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
