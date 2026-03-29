import { useState } from 'react'
import type { MazeConfig, MazeData } from '../../types'
import { MiniGameType } from '../../types'
import { generateMaze } from '../../services/api'

interface Props {
  value: MazeConfig
  onChange: (v: MazeConfig) => void
  gameId?: string
  stationId?: string
}

const DIFFICULTIES: { value: 'easy' | 'medium' | 'hard'; label: string; desc: string }[] = [
  { value: 'easy', label: 'Einfach', desc: '5×5 Zellen' },
  { value: 'medium', label: 'Mittel', desc: '6×6 Zellen' },
  { value: 'hard', label: 'Schwer', desc: '8×8 Zellen' },
]

const CELL_SIZE = 6 // px per wall-grid cell in preview SVG

function MazePreview({ mazeData }: { mazeData: MazeData }) {
  const { walls } = mazeData
  const height = walls.length
  const width = walls[0].length
  const svgWidth = width * CELL_SIZE
  const svgHeight = height * CELL_SIZE

  const wallRects: React.ReactNode[] = []
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (walls[r][c]) {
        wallRects.push(
          <rect
            key={`${r}-${c}`}
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

  const startCx = mazeData.start.col * CELL_SIZE + CELL_SIZE / 2
  const startCy = mazeData.start.row * CELL_SIZE + CELL_SIZE / 2
  const goalCx = mazeData.goal.col * CELL_SIZE + CELL_SIZE / 2
  const goalCy = mazeData.goal.row * CELL_SIZE + CELL_SIZE / 2

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      style={{ display: 'block' }}
      aria-label="Labyrinth Vorschau"
    >
      <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#fef3c7" />
      {wallRects}
      <circle cx={startCx} cy={startCy} r={CELL_SIZE * 0.45} fill="#86efac" stroke="#16a34a" strokeWidth={0.5} />
      <circle cx={goalCx} cy={goalCy} r={CELL_SIZE * 0.45} fill="#fbbf24" stroke="#92400e" strokeWidth={0.5} />
    </svg>
  )
}

export default function MazeConfigForm({ value, onChange, gameId, stationId }: Props) {
  const mazeData = value.maze_data as MazeData | undefined
  const currentDifficulty = (mazeData?.difficulty ?? 'easy') as 'easy' | 'medium' | 'hard'

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  async function handleGenerate(difficulty: 'easy' | 'medium' | 'hard') {
    if (!gameId || !stationId) {
      // Without API context, just update difficulty locally
      onChange({ type: MiniGameType.maze, maze_data: { difficulty } as unknown as MazeData })
      return
    }
    setGenerating(true)
    setGenerateError('')
    try {
      const generated = await generateMaze(gameId, stationId, difficulty)
      onChange({ type: MiniGameType.maze, maze_data: generated })
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Fehler beim Generieren')
    } finally {
      setGenerating(false)
    }
  }

  function selectDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    if (difficulty === currentDifficulty && mazeData?.walls) return
    handleGenerate(difficulty)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Schwierigkeit</label>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((opt) => {
            const selected = currentDifficulty === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectDifficulty(opt.value)}
                disabled={generating}
                className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } disabled:opacity-60`}
              >
                <span className="text-base font-semibold text-gray-800">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {generateError && (
        <p className="text-sm text-red-600">{generateError}</p>
      )}

      {generating && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          Labyrinth wird generiert…
        </div>
      )}

      {mazeData?.walls && !generating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Vorschau</span>
            <button
              type="button"
              onClick={() => handleGenerate(currentDifficulty)}
              disabled={generating || !gameId || !stationId}
              className="text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium disabled:opacity-40 min-h-[44px] px-2"
            >
              🔄 Neu generieren
            </button>
          </div>
          <div className="border rounded-xl overflow-hidden bg-amber-50" style={{ maxWidth: 240 }}>
            <MazePreview mazeData={mazeData} />
          </div>
        </div>
      )}

      {!mazeData?.walls && !generating && gameId && stationId && (
        <button
          type="button"
          onClick={() => handleGenerate(currentDifficulty)}
          className="w-full py-2 bg-green-500 text-white rounded-xl font-medium text-sm hover:bg-green-600 active:scale-95 transition-transform"
        >
          Labyrinth generieren
        </button>
      )}
    </div>
  )
}
