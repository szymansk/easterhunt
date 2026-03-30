import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core'
import type { BuildObjectConfig, BuildObjectPart } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface BuildObjectGameProps {
  config: BuildObjectConfig
  onComplete?: () => void
}

function DraggablePart({ part, placed }: { part: BuildObjectPart; placed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: part.id,
    disabled: placed,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: placed ? 0.3 : isDragging ? 0.6 : 1 }}
      {...listeners}
      {...attributes}
      data-testid={`part-${part.id}`}
      aria-label={part.label}
      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none"
    >
      <img
        src={part.image_url}
        alt={part.label}
        className="w-16 h-16 object-contain rounded-lg border-2 border-gray-200 bg-white shadow"
      />
      <span className="text-xs text-gray-600">{part.label}</span>
    </div>
  )
}

function DroppableSlot({
  part,
  isPlaced,
}: {
  part: BuildObjectPart
  isPlaced: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${part.id}` })
  return (
    <div
      ref={setNodeRef}
      data-testid={`slot-${part.id}`}
      className={`absolute rounded border-2 transition-colors ${
        isPlaced
          ? 'border-green-400 bg-green-50'
          : isOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-dashed border-gray-400 bg-white/50'
      }`}
      style={{
        left: `${part.slot_x_pct}%`,
        top: `${part.slot_y_pct}%`,
        width: `${part.width_pct}%`,
        height: `${part.height_pct}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {isPlaced && (
        <img src={part.image_url} alt={part.label} className="w-full h-full object-contain" />
      )}
    </div>
  )
}

export default function BuildObjectGame({ config, onComplete }: BuildObjectGameProps) {
  const [placements, setPlacements] = useState<Set<string>>(new Set())
  const audio = useAudio()
  const tts = useTTS()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const partId = String(active.id)
    const overId = String(over.id)

    if (overId === `slot-${partId}`) {
      audio.play('snap')
      const next = new Set(placements)
      next.add(partId)
      setPlacements(next)

      if (next.size === config.parts.length) {
        audio.play('success')
        setTimeout(() => onComplete?.(), 600)
      }
    } else {
      audio.play('error')
    }
  }

  const trayParts = config.parts.filter((p) => !placements.has(p.id))

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-amber-50 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="flex-1 font-bold text-gray-800">{config.prompt}</p>
          {tts.isTTSAvailable() && (
            <button
              onClick={() => tts.speak(config.prompt)}
              aria-label="Aufgabe vorlesen"
              className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-lg"
            >
              🔊
            </button>
          )}
        </div>

        {/* Scene with drop slots */}
        <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg mb-4">
          <img src={config.background_image} alt="Szene" className="w-full object-contain" />
          {config.parts.map((part) => (
            <DroppableSlot key={part.id} part={part} isPlaced={placements.has(part.id)} />
          ))}
        </div>

        {/* Parts tray */}
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow">
          <p className="text-xs text-gray-500 mb-3">Ziehe die Teile ins Bild:</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {trayParts.map((part) => (
              <DraggablePart key={part.id} part={part} placed={false} />
            ))}
            {trayParts.length === 0 && (
              <p className="text-sm text-gray-400 italic">Alle Teile platziert!</p>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  )
}
