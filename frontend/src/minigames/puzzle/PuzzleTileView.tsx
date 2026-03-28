import { useDraggable } from '@dnd-kit/core'
import type { PuzzleTile } from './PuzzleBoard'

interface PuzzleTileViewProps {
  tile: PuzzleTile
  colCount: number
  isActive: boolean
  isBouncing: boolean
}

export default function PuzzleTileView({
  tile,
  colCount,
  isActive,
  isBouncing,
}: PuzzleTileViewProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tile.id,
    data: { tile },
  })

  return (
    <div
      ref={setNodeRef}
      data-testid={`tile-${tile.index}`}
      data-tile-id={tile.id}
      data-bouncing={isBouncing ? 'true' : undefined}
      className={`
        relative rounded-md overflow-hidden border-2 cursor-grab active:cursor-grabbing
        transition-transform select-none
        ${isDragging ? 'opacity-30 border-blue-300' : 'border-gray-300'}
        ${isBouncing ? 'animate-bounce border-red-300' : ''}
        ${isActive ? 'border-blue-400' : ''}
      `}
      style={{
        width: `calc(${100 / Math.max(colCount, 3)}% - 8px)`,
        aspectRatio: '1',
      }}
      {...listeners}
      {...attributes}
    >
      <img
        src={tile.imageSrc}
        alt={`Puzzle Tile ${tile.index}`}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  )
}
