import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SequenceSortConfig, SequenceSortStep } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface SequenceSortGameProps {
  config: SequenceSortConfig
  onComplete?: () => void
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function SortableCard({ step, isWrong }: { step: SequenceSortStep; isWrong: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`step-card-${step.id}`}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 bg-white shadow cursor-grab active:cursor-grabbing ${
        isWrong ? 'border-red-400 bg-red-50' : 'border-gray-200'
      }`}
    >
      {step.image_url ? (
        <img src={step.image_url} alt={step.label} className="w-12 h-12 object-contain rounded-lg" />
      ) : (
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">📷</div>
      )}
      <span className="font-semibold text-gray-800">{step.label}</span>
    </div>
  )
}

export default function SequenceSortGame({ config, onComplete }: SequenceSortGameProps) {
  const [steps, setSteps] = useState<SequenceSortStep[]>(() => shuffleArray(config.steps))
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set())
  const audio = useAudio()
  const tts = useTTS()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)
    setSteps(arrayMove(steps, oldIndex, newIndex))
    setWrongIds(new Set())
  }

  function handleConfirm() {
    const sorted = [...config.steps].sort((a, b) => a.correct_order - b.correct_order)
    const wrong = new Set<string>()
    steps.forEach((step, i) => {
      if (step.id !== sorted[i]?.id) {
        wrong.add(step.id)
      }
    })

    if (wrong.size === 0) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 600)
    } else {
      audio.play('error')
      setWrongIds(wrong)
      setTimeout(() => setWrongIds(new Set()), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-4 w-full max-w-sm">
        <p className="flex-1 font-bold text-gray-800">{config.prompt}</p>
        {tts.isTTSAvailable() && (
          <button
            onClick={() => tts.speak(config.prompt)}
            aria-label="Aufgabe vorlesen"
            className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-lg"
          >
            🔊
          </button>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 w-full max-w-sm mb-6">
            {steps.map((step) => (
              <SortableCard key={step.id} step={step} isWrong={wrongIds.has(step.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleConfirm}
        data-testid="confirm-order-btn"
        className="w-full max-w-sm py-4 bg-indigo-500 text-white text-lg font-bold rounded-2xl active:scale-95 transition-transform shadow"
      >
        Reihenfolge bestätigen
      </button>
    </div>
  )
}
