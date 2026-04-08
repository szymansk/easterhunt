import React from 'react'

export type GridSize = 3 | 4 | 6 | 9

export interface PuzzleTile {
  id: string
  index: number // correct position in grid
  imageSrc: string
  placed: boolean
}

export interface PuzzleSlot {
  index: number
  occupiedBy: string | null // tile id
}

interface GridConfig {
  rows: number
  cols: number
}

export function getGridConfig(gridSize: GridSize): GridConfig {
  switch (gridSize) {
    case 3: return { rows: 1, cols: 3 }
    case 4: return { rows: 2, cols: 2 }
    case 6: return { rows: 2, cols: 3 }
    case 9: return { rows: 3, cols: 3 }
  }
}

interface PuzzleBoardProps {
  gridSize: GridSize
  tiles: PuzzleTile[]
  slots: PuzzleSlot[]
  dragOverSlot?: number | null
  children?: React.ReactNode
}

export default function PuzzleBoard({
  gridSize,
  tiles,
  slots,
  dragOverSlot,
  children,
}: PuzzleBoardProps) {
  const { rows, cols } = getGridConfig(gridSize)

  const trayTiles = tiles.filter((t) => !t.placed)

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-sm mx-auto">
      {/* Target grid (top) */}
      <div
        data-testid="puzzle-grid"
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: '4px',
        }}
      >
        {slots.map((slot) => {
          const placedTile = slot.occupiedBy
            ? tiles.find((t) => t.id === slot.occupiedBy)
            : null
          const isOver = dragOverSlot === slot.index

          return (
            <div
              key={slot.index}
              data-testid="puzzle-slot"
              data-slot-index={slot.index}
              data-filled={slot.occupiedBy ? 'true' : 'false'}
              className={`
                relative aspect-square border-2 border-dashed rounded-md
                flex items-center justify-center
                transition-colors
                ${isOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-400 bg-gray-100'}
              `}
            >
              {placedTile ? (
                <img
                  src={placedTile.imageSrc}
                  alt={`Puzzle Tile ${placedTile.index}`}
                  className="w-full h-full object-cover rounded-md"
                  draggable={false}
                />
              ) : (
                <span className="text-xs text-gray-300 select-none">{slot.index + 1}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Tile tray (bottom) */}
      <div
        data-testid="tile-tray"
        className="w-full min-h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 flex flex-wrap gap-2 justify-center"
      >
        {trayTiles.length === 0 ? (
          <p className="text-gray-300 text-sm self-center select-none">Ablage leer</p>
        ) : (
          trayTiles.map((tile) => (
            <div
              key={tile.id}
              data-testid="puzzle-piece"
              data-tile-id={tile.id}
              className="relative rounded-md overflow-hidden border-2 border-gray-300 cursor-grab active:cursor-grabbing"
              style={{ width: `calc(${100 / Math.max(cols, 3)}% - 8px)`, aspectRatio: '1' }}
            >
              <img
                src={tile.imageSrc}
                alt={`Puzzle Tile ${tile.index}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))
        )}
      </div>

      {children}
    </div>
  )
}
