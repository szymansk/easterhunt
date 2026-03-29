import { useState } from 'react'
import LibraryBrowser from '../ui/LibraryBrowser'
import type { LibraryTask, PictureRiddleAnswerOption, PictureRiddleConfig, PictureRiddleReferenceItem } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: PictureRiddleConfig
  onChange: (v: PictureRiddleConfig) => void
  errors?: { category?: string; reference_items?: string; answer_options?: string }
}

export default function PictureRiddleConfigForm({ value, onChange, errors }: Props) {
  const [browserOpen, setBrowserOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LibraryTask | null>(null)

  function handleLibrarySelect(task: LibraryTask) {
    setSelectedTask(task)
    const referenceItems: PictureRiddleReferenceItem[] = task.reference_items.map((item) => ({
      image_url: item.image_url ?? '',
      label: item.name,
      library_item_id: item.id,
    }))
    const answerOptions: PictureRiddleAnswerOption[] = task.answer_options.map((item) => ({
      image_url: item.image_url ?? '',
      label: item.name,
      is_correct: item.id === task.correct_answer?.id,
      library_item_id: item.id,
    }))
    onChange({
      type: MiniGameType.picture_riddle,
      category: task.category,
      reference_items: referenceItems,
      answer_options: answerOptions,
    })
  }

  const hasConfig = value.reference_items.length === 2 && value.answer_options.length === 4

  return (
    <div className="space-y-4">
      {selectedTask ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Bibliothek-Aufgabe ausgewählt: <strong>{selectedTask.category}</strong>
          {' '}({selectedTask.answer_options.length} Antwortoptionen,{' '}
          {selectedTask.reference_items.length} Referenzbilder)
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Noch keine Aufgabe ausgewählt. Wähle eine Aufgabe aus der Bibliothek.
        </div>
      )}

      {errors?.category && <p className="text-sm text-red-600">{errors.category}</p>}
      {errors?.reference_items && <p className="text-sm text-red-600">{errors.reference_items}</p>}
      {errors?.answer_options && <p className="text-sm text-red-600">{errors.answer_options}</p>}

      <button
        type="button"
        onClick={() => setBrowserOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {selectedTask ? 'Andere Aufgabe wählen' : 'Aus Bibliothek wählen'}
      </button>

      {/* Preview */}
      {hasConfig && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3" data-testid="riddle-preview">
          <p className="text-xs font-semibold text-blue-700 mb-2">Vorschau</p>
          <p className="text-xs text-center text-gray-600 mb-2 font-medium">Was gehört dazu?</p>

          {/* Reference images */}
          <div className="flex gap-2 justify-center mb-3">
            {value.reference_items.map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white rounded-lg overflow-hidden border border-gray-200">
                  <img src={item.image_url} alt={item.label} className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 text-center max-w-[56px] truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Answer options 2x2 */}
          <div className="grid grid-cols-4 gap-1">
            {value.answer_options.map((opt, i) => (
              <div
                key={i}
                className={`flex flex-col items-center p-1 rounded-lg border ${opt.is_correct ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="w-10 h-10 overflow-hidden">
                  <img src={opt.image_url} alt={opt.label} className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] text-gray-500 text-center leading-tight mt-0.5 truncate max-w-full">
                  {opt.label}
                </span>
                {opt.is_correct && (
                  <span className="text-[9px] text-green-600 font-bold">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <LibraryBrowser
        isOpen={browserOpen}
        onClose={() => setBrowserOpen(false)}
        onSelect={handleLibrarySelect}
        miniGameType="picture_riddle"
      />
    </div>
  )
}
