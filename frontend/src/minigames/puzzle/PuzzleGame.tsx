import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import PuzzleBoard from './PuzzleBoard'
import PuzzleTileView from './PuzzleTileView'
import PuzzleDropZone from './PuzzleDropZone'
import type { PuzzleTile, PuzzleSlot, GridSize } from './PuzzleBoard'

interface PuzzleGameProps {
  gridSize: GridSize
  tiles: PuzzleTile[]
  onComplete?: () => void
}

export default function PuzzleGame({ gridSize, tiles: initialTiles, onComplete }: PuzzleGameProps) {
  const [tiles, setTiles] = useState<PuzzleTile[]>(initialTiles)
  const [slots, setSlots] = useState<PuzzleSlot[]>(
    Array.from({ length: initialTiles.length }, (_, i) => ({ index: i, occupiedBy: null }))
  )
  const [activeTileId, setActiveTileId] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  // Track tiles bouncing back (for animation)
  const [bouncingTiles, setBouncingTiles] = useState<Set<string>>(new Set())

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 50, tolerance: 5 },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveTileId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id
    if (overId != null && typeof overId === 'string' && overId.startsWith('slot-')) {
      const slotIndex = parseInt(overId.replace('slot-', ''), 10)
      setDragOverSlot(slotIndex)
    } else {
      setDragOverSlot(null)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTileId(null)
      setDragOverSlot(null)

      if (!over) return

      const tileId = active.id as string
      const overId = over.id as string

      if (!overId.startsWith('slot-')) return

      const slotIndex = parseInt(overId.replace('slot-', ''), 10)
      const tile = tiles.find((t) => t.id === tileId)
      if (!tile) return

      // Don't allow placing on already-occupied slot
      const targetSlot = slots[slotIndex]
      if (targetSlot?.occupiedBy !== null) {
        triggerBounceBack(tileId)
        return
      }

      if (tile.index === slotIndex) {
        // Correct placement: snap into slot
        setTiles((prev) =>
          prev.map((t) => (t.id === tileId ? { ...t, placed: true } : t))
        )
        setSlots((prev) =>
          prev.map((s) => (s.index === slotIndex ? { ...s, occupiedBy: tileId } : s))
        )

        // Check completion on next render
        setTimeout(() => {
          setTiles((currentTiles) => {
            const allPlaced = currentTiles.every((t) => t.placed || t.id === tileId)
            // Re-check with the just-placed tile
            const updatedTiles = currentTiles.map((t) =>
              t.id === tileId ? { ...t, placed: true } : t
            )
            if (updatedTiles.every((t) => t.placed)) {
              onComplete?.()
            }
            return currentTiles
          })
        }, 0)
      } else {
        // Wrong placement: bounce back
        triggerBounceBack(tileId)
      }
    },
    [tiles, slots, onComplete]
  )

  const triggerBounceBack = useCallback((tileId: string) => {
    setBouncingTiles((prev) => new Set(prev).add(tileId))
    setTimeout(() => {
      setBouncingTiles((prev) => {
        const next = new Set(prev)
        next.delete(tileId)
        return next
      })
    }, 400)
  }, [])

  const activeTile = tiles.find((t) => t.id === activeTileId)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center gap-4 p-4 w-full max-w-sm mx-auto">
        {/* Target grid */}
        <div
          data-testid="puzzle-grid"
          className="w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${getGridCols(gridSize)}, 1fr)`,
            gap: '4px',
          }}
        >
          {slots.map((slot) => (
            <PuzzleDropZone
              key={slot.index}
              slotIndex={slot.index}
              isOver={dragOverSlot === slot.index}
            >
              {slot.occupiedBy ? (
                (() => {
                  const placedTile = tiles.find((t) => t.id === slot.occupiedBy)
                  return placedTile ? (
                    <img
                      src={placedTile.imageSrc}
                      alt={`Tile ${placedTile.index}`}
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : null
                })()
              ) : (
                <span className="text-xs text-gray-300 select-none">{slot.index + 1}</span>
              )}
            </PuzzleDropZone>
          ))}
        </div>

        {/* Tile tray */}
        <div
          data-testid="tile-tray"
          className="w-full min-h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 flex flex-wrap gap-2 justify-center"
        >
          {tiles.filter((t) => !t.placed).map((tile) => (
            <PuzzleTileView
              key={tile.id}
              tile={tile}
              colCount={getGridCols(gridSize)}
              isActive={tile.id === activeTileId}
              isBouncing={bouncingTiles.has(tile.id)}
            />
          ))}
          {tiles.every((t) => t.placed) && (
            <p className="text-gray-300 text-sm self-center select-none">Ablage leer</p>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTile ? (
          <img
            src={activeTile.imageSrc}
            alt={`Tile ${activeTile.index}`}
            className="rounded-md border-2 border-blue-400 shadow-lg opacity-90"
            style={{ width: 80, height: 80, objectFit: 'cover' }}
            draggable={false}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function getGridCols(gridSize: GridSize): number {
  switch (gridSize) {
    case 3: return 3
    case 4: return 2
    case 6: return 3
    case 9: return 3
  }
}
