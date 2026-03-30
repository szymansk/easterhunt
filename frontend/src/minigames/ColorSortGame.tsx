import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core'
import type { ColorSortConfig, ColorSortBucket, ColorSortItem } from '../types'
import { useAudio } from '../hooks/useAudio'

interface ColorSortGameProps {
  config: ColorSortConfig
  onComplete?: () => void
}

function DraggableItem({ item, placed }: { item: ColorSortItem; placed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: placed,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: item.color, opacity: placed ? 0.3 : isDragging ? 0.5 : 1 }}
      {...listeners}
      {...attributes}
      data-testid={`color-item-${item.id}`}
      className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl cursor-grab active:cursor-grabbing select-none shadow border-2 border-white"
      aria-label={item.label}
    >
      {item.emoji}
    </div>
  )
}

function DroppableBucket({ bucket, isCorrect }: { bucket: ColorSortBucket; isCorrect?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.id })
  return (
    <div
      ref={setNodeRef}
      data-testid={`color-bucket-${bucket.id}`}
      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
        isCorrect ? 'border-green-400' : isOver ? 'border-blue-400' : 'border-gray-200'
      }`}
      style={{ background: isOver ? `${bucket.color}33` : `${bucket.color}22` }}
    >
      <div
        className="w-12 h-12 rounded-full border-4 border-white shadow"
        style={{ background: bucket.color }}
      />
      <span className="text-xs font-semibold text-gray-700">{bucket.label}</span>
    </div>
  )
}

export default function ColorSortGame({ config, onComplete }: ColorSortGameProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({}) // itemId → bucketId
  const audio = useAudio()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const itemId = String(active.id)
    const bucketId = String(over.id)

    const bucket = config.buckets.find((b) => b.id === bucketId)
    if (!bucket) return

    if (bucket.item_ids.includes(itemId)) {
      audio.play('snap')
      const next = { ...placements, [itemId]: bucketId }
      setPlacements(next)

      const allPlaced = config.items.every((item) => {
        const correctBucket = config.buckets.find((b) => b.item_ids.includes(item.id))
        return correctBucket && next[item.id] === correctBucket.id
      })
      if (allPlaced) {
        audio.play('success')
        setTimeout(() => onComplete?.(), 500)
      }
    } else {
      audio.play('error')
    }
  }

  const trayItems = config.items.filter((item) => !placements[item.id])

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-pink-50 flex flex-col p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Sortiere die Farben!</h2>

        {/* Buckets */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {config.buckets.map((bucket) => {
            const allItemsPlaced = bucket.item_ids.every((id) => placements[id] === bucket.id)
            return <DroppableBucket key={bucket.id} bucket={bucket} isCorrect={allItemsPlaced} />
          })}
        </div>

        {/* Tray */}
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow">
          <p className="text-sm text-gray-500 mb-3">Ziehe die Gegenstände in den richtigen Eimer:</p>
          <div className="flex flex-wrap gap-3">
            {trayItems.map((item) => (
              <DraggableItem key={item.id} item={item} placed={false} />
            ))}
            {trayItems.length === 0 && (
              <p className="text-sm text-gray-400 italic">Alle einsortiert!</p>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  )
}
