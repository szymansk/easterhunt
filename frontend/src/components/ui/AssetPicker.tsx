import { useState, useEffect } from 'react'
import { listLibraryItems } from '../../services/api'
import type { LibraryItem } from '../../types'
import LoadingSpinner from './LoadingSpinner'

interface AssetPickerProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
}

export default function AssetPicker({ value, onChange, label, placeholder }: AssetPickerProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!open || fetched) return
    setLoading(true)
    setError('')
    listLibraryItems()
      .then((all) => {
        setItems(all.filter((i) => i.image_url !== null))
        setFetched(true)
      })
      .catch(() => setError('Bibliothek konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [open, fetched])

  return (
    <div>
      {label && (
        <label htmlFor="asset-picker-input" className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <input
        id="asset-picker-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'https://... oder /media/...'}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        Aus Bibliothek wählen {open ? '▴' : '▾'}
      </button>
      {open && (
        <div className="mt-2">
          {loading && <LoadingSpinner />}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div
              className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 border border-gray-200 rounded-lg bg-gray-50"
              data-testid="asset-grid"
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.name}
                  onClick={() => onChange(item.image_url!)}
                  className={`flex items-center justify-center p-1 rounded ${
                    value === item.image_url ? 'ring-2 ring-blue-500' : 'hover:bg-gray-200'
                  }`}
                >
                  <img
                    src={item.image_url!}
                    alt={item.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.opacity = '0.3'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 text-xs text-gray-500 hover:text-gray-700"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  )
}
