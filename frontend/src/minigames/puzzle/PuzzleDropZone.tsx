import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

interface PuzzleDropZoneProps {
  slotIndex: number
  isOver: boolean
  children?: ReactNode
}

export default function PuzzleDropZone({ slotIndex, isOver, children }: PuzzleDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `slot-${slotIndex}`,
    data: { slotIndex },
  })

  return (
    <div
      ref={setNodeRef}
      data-testid={`slot-${slotIndex}`}
      data-slot-index={slotIndex}
      className={`
        relative aspect-square border-2 border-dashed rounded-md
        flex items-center justify-center transition-colors
        ${isOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-400 bg-gray-100'}
      `}
    >
      {children}
    </div>
  )
}
