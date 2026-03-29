import { useCallback, useRef, useState } from 'react'
import type { MazeData } from '../types'

interface MazeGameProps {
  mazeData: MazeData
  onComplete?: () => void
}

const CELL_SIZE = 28 // pixels per maze cell (2*N+1 wall grid cells of this size each)

/**
 * Convert a pointer/touch position (in SVG coordinate space) to the
 * nearest wall-grid column/row index.
 */
function toGridPos(svgX: number, svgY: number) {
  return {
    col: Math.round(svgX / CELL_SIZE),
    row: Math.round(svgY / CELL_SIZE),
  }
}

/**
 * Check whether moving from current position to an adjacent wall-grid cell is allowed.
 * Movement is one step in a cardinal direction; target must be a passage (not a wall).
 */
function canMove(
  walls: boolean[][],
  _fromRow: number,
  _fromCol: number,
  toRow: number,
  toCol: number,
): boolean {
  const height = walls.length
  const width = walls[0].length
  if (toRow < 0 || toRow >= height || toCol < 0 || toCol >= width) return false
  return !walls[toRow][toCol]
}

export default function MazeGame({ mazeData, onComplete }: MazeGameProps) {
  const { walls, start, goal } = mazeData

  const [avatarRow, setAvatarRow] = useState(start.row)
  const [avatarCol, setAvatarCol] = useState(start.col)
  const [completed, setCompleted] = useState(false)
  const [wallHit, setWallHit] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const lastGridPos = useRef({ row: start.row, col: start.col })
  const wallHitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const height = walls.length
  const width = walls[0].length
  const svgWidth = width * CELL_SIZE
  const svgHeight = height * CELL_SIZE

  function getSVGPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const scaleX = svgWidth / rect.width
    const scaleY = svgHeight / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (completed) return

      const pt = getSVGPoint(clientX, clientY)
      if (!pt) return

      const { row: targetRow, col: targetCol } = toGridPos(pt.x, pt.y)
      const { row: curRow, col: curCol } = lastGridPos.current

      if (targetRow === curRow && targetCol === curCol) return

      // Only allow single-step movement in cardinal directions
      const dRow = targetRow - curRow
      const dCol = targetCol - curCol
      if (Math.abs(dRow) + Math.abs(dCol) !== 1) return

      if (canMove(walls, curRow, curCol, targetRow, targetCol)) {
        lastGridPos.current = { row: targetRow, col: targetCol }
        setAvatarRow(targetRow)
        setAvatarCol(targetCol)

        if (targetRow === goal.row && targetCol === goal.col) {
          setCompleted(true)
          onComplete?.()
        }
      } else {
        // Show wall-hit feedback briefly
        if (wallHitTimer.current) clearTimeout(wallHitTimer.current)
        setWallHit(true)
        wallHitTimer.current = setTimeout(() => setWallHit(false), 150)
      }
    },
    [completed, walls, goal, onComplete],
  )

  function onTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    e.preventDefault()
    const touch = e.touches[0]
    handlePointerMove(touch.clientX, touch.clientY)
  }

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (e.buttons !== 1) return
    handlePointerMove(e.clientX, e.clientY)
  }

  // Render wall cells
  const wallRects: React.ReactNode[] = []
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (walls[r][c]) {
        wallRects.push(
          <rect
            key={`w-${r}-${c}`}
            x={c * CELL_SIZE}
            y={r * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill="#5b3a29"
          />,
        )
      }
    }
  }

  const cx = avatarCol * CELL_SIZE + CELL_SIZE / 2
  const cy = avatarRow * CELL_SIZE + CELL_SIZE / 2
  const goalCx = goal.col * CELL_SIZE + CELL_SIZE / 2
  const goalCy = goal.row * CELL_SIZE + CELL_SIZE / 2
  const r = CELL_SIZE * 0.4

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-4 text-center">
        <div className="text-3xl mb-2">🌿</div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Finde den Weg!</h2>

        <div className="flex justify-center overflow-hidden rounded-xl border-4 border-amber-700 bg-amber-50">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            style={{ touchAction: 'none', maxWidth: '100%', display: 'block' }}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
          >
            {/* Floor */}
            <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#fef3c7" />

            {/* Walls */}
            {wallRects}

            {/* Goal marker (Easter egg) */}
            <ellipse
              cx={goalCx}
              cy={goalCy}
              rx={r * 0.85}
              ry={r}
              fill="#f59e0b"
              stroke="#92400e"
              strokeWidth={1.5}
            />
            <text
              x={goalCx}
              y={goalCy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={CELL_SIZE * 0.6}
            >
              🥚
            </text>

            {/* Avatar (bunny) */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={wallHit ? '#ef4444' : '#86efac'}
              stroke={wallHit ? '#dc2626' : '#16a34a'}
              strokeWidth={1.5}
            />
            <text
              x={cx}
              y={cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={CELL_SIZE * 0.65}
            >
              🐰
            </text>
          </svg>
        </div>

        <p className="text-xs text-gray-400 mt-2">Ziehe den Hasen zum Osterei</p>

        {completed && (
          <div className="mt-3 text-green-600 font-bold text-lg">
            🎉 Geschafft!
          </div>
        )}
      </div>
    </div>
  )
}
