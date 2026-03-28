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

      <LibraryBrowser
        isOpen={browserOpen}
        onClose={() => setBrowserOpen(false)}
        onSelect={handleLibrarySelect}
        miniGameType="picture_riddle"
      />
    </div>
  )
}
