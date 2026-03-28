import { useEffect, useState } from 'react'
import { listLibraryCategories, listLibraryTasks } from '../../services/api'
import type { LibraryTask } from '../../types'
import Modal from './Modal'

interface LibraryBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (task: LibraryTask) => void
  miniGameType?: string
}

export default function LibraryBrowser({
  isOpen,
  onClose,
  onSelect,
  miniGameType,
}: LibraryBrowserProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [tasks, setTasks] = useState<LibraryTask[]>([])
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<LibraryTask | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    listLibraryCategories().then((cats) => {
      setCategories(cats)
      setActiveCategory((prev) => (prev === null && cats.length > 0 ? cats[0] : prev))
    })
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    listLibraryTasks({
      mini_game_type: miniGameType,
      category: activeCategory ?? undefined,
    })
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [isOpen, activeCategory, miniGameType])

  const filtered = tasks.filter((task) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      task.category.toLowerCase().includes(q) ||
      task.reference_items.some((it) => it.name.toLowerCase().includes(q)) ||
      (task.correct_answer?.name.toLowerCase().includes(q) ?? false)
    )
  })

  function handleConfirm() {
    if (!preview) return
    onSelect(preview)
    onClose()
    setPreview(null)
  }

  function handleClose() {
    setPreview(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bibliothek">
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen…"
          aria-label="Suchen"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => {
                setActiveCategory(cat)
                setPreview(null)
              }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Task grid */}
        {loading ? (
          <p className="text-center text-sm text-gray-500 py-4">Laden…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-4">Keine Ergebnisse</p>
        ) : (
          <div
            className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto"
            role="listbox"
            aria-label="Aufgaben"
          >
            {filtered.map((task) => {
              const thumb = task.reference_items[0]?.image_url
              return (
                <button
                  key={task.id}
                  role="option"
                  aria-selected={preview?.id === task.id}
                  onClick={() => setPreview(task)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                    preview?.id === task.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
                      ?
                    </div>
                  )}
                  <span className="text-center leading-tight line-clamp-2">{task.category}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700">Vorschau</p>
            <div className="flex gap-2 flex-wrap">
              {preview.answer_options.map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-0.5">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-10 h-10 object-contain" />
                  )}
                  <span
                    className={`text-xs ${
                      item.id === preview.correct_answer?.id
                        ? 'font-bold text-green-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!preview}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Auswählen
          </button>
        </div>
      </div>
    </Modal>
  )
}
