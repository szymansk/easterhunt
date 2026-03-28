import { useState } from 'react'
import LibraryBrowser from '../ui/LibraryBrowser'
import type { LibraryTask } from '../../types'
import type { PictureRiddleConfig } from '../../types'
import { MiniGameType } from '../../types'

interface Props {
  value: PictureRiddleConfig
  onChange: (v: PictureRiddleConfig) => void
  errors?: { question?: string }
}

export default function PictureRiddleConfigForm({ value, onChange, errors }: Props) {
  const [browserOpen, setBrowserOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<LibraryTask | null>(null)

  function handleLibrarySelect(task: LibraryTask) {
    setSelectedTask(task)
    onChange({ type: MiniGameType.picture_riddle, question: value.question, library_task_id: task.id } as PictureRiddleConfig & { library_task_id: string })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frage <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.question}
          onChange={(e) => onChange({ type: MiniGameType.picture_riddle, question: e.target.value })}
          placeholder="z.B. Was siehst du auf dem Bild?"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors?.question ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors?.question && <p className="text-sm text-red-600 mt-1">{errors.question}</p>}
      </div>

      {selectedTask && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Bibliothek-Aufgabe ausgewählt: <strong>{selectedTask.category}</strong>
          {' '}({selectedTask.answer_options.length} Antwortoptionen)
        </div>
      )}

      <button
        type="button"
        onClick={() => setBrowserOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Aus Bibliothek wählen
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
