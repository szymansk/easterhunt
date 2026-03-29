import { useState } from 'react'
import type { PuzzleConfig } from '../../types'
import { MiniGameType } from '../../types'
import { generatePuzzleTiles, getPuzzleTiles } from '../../services/api'
import type { TileInfo } from '../../services/api'

interface Props {
  value: PuzzleConfig
  onChange: (v: PuzzleConfig) => void
  errors?: Partial<Record<keyof PuzzleConfig, string>>
  /** ID of the game this station belongs to */
  gameId?: string
  /** ID of the current puzzle station (tiles are stored here) */
  stationId?: string
  /**
   * ID of the station whose image should be used as the puzzle source.
   * For station N, this should be station N+1's ID (the "next station").
   * For the last station, pass the current station ID as fallback.
   */
  generateStationId?: string
}

const GRID_OPTIONS: { value: PuzzleConfig['grid_size']; label: string; cols: number; rows: number }[] = [
  { value: 3, label: '1×3', cols: 3, rows: 1 },
  { value: 4, label: '2×2', cols: 2, rows: 2 },
  { value: 6, label: '2×3', cols: 3, rows: 2 },
  { value: 9, label: '3×3', cols: 3, rows: 3 },
]

export default function PuzzleConfigForm({ value, onChange, errors, gameId, stationId, generateStationId }: Props) {
  const [tiles, setTiles] = useState<TileInfo[]>([])
  const [tileAspectRatio, setTileAspectRatio] = useState<number>(1)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  async function handleGenerate() {
    if (!gameId || !stationId || !generateStationId) return
    setGenerating(true)
    setGenerateError('')
    setTiles([])
    try {
      const result = await generatePuzzleTiles(gameId, stationId, value.grid_size, generateStationId)
      setTiles(result.tiles)
      if (result.tile_width && result.tile_height) {
        setTileAspectRatio(result.tile_width / result.tile_height)
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Fehler beim Generieren')
    } finally {
      setGenerating(false)
    }
  }

  async function handleLoadExisting() {
    if (!gameId || !stationId) return
    try {
      const result = await getPuzzleTiles(gameId, stationId)
      setTiles(result.tiles)
      if (result.tile_width && result.tile_height) {
        setTileAspectRatio(result.tile_width / result.tile_height)
      }
    } catch {
      // No tiles yet, that's fine
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Rastergröße</label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GRID_OPTIONS.map((opt) => {
          const selected = value.grid_size === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange({ type: MiniGameType.puzzle, grid_size: opt.value })
                setTiles([])
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Visual grid preview */}
              <div
                className="gap-0.5"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${opt.cols}, 1fr)`,
                  width: 40,
                }}
              >
                {Array.from({ length: opt.value }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${selected ? 'bg-blue-400' : 'bg-gray-300'}`}
                    style={{ height: 40 / opt.rows }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">{opt.label}</span>
            </button>
          )
        })}
      </div>
      {errors?.grid_size && (
        <p className="text-sm text-red-600">{errors.grid_size}</p>
      )}

      {/* Generate button - only shown when game/station context available */}
      {gameId && stationId && generateStationId && (
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 py-2 px-4 rounded-xl border-2 border-blue-500 text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generiere…' : tiles.length > 0 ? '🔄 Neu generieren' : '🧩 Puzzle generieren'}
            </button>
            {tiles.length === 0 && !generating && (
              <button
                type="button"
                onClick={handleLoadExisting}
                className="py-2 px-3 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                title="Vorhandene Kacheln laden"
              >
                Laden
              </button>
            )}
          </div>

          {generateError && (
            <p className="text-sm text-red-600">{generateError}</p>
          )}

          {/* Tile preview */}
          {tiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Vorschau ({tiles.length} Kacheln):</p>
              <div
                className="w-full rounded-lg overflow-hidden border border-gray-200"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${GRID_OPTIONS.find(o => o.value === value.grid_size)?.cols ?? 2}, 1fr)`,
                  gap: 2,
                }}
              >
                {tiles
                  .slice()
                  .sort((a, b) => a.index - b.index)
                  .map((tile) => (
                    <img
                      key={tile.index}
                      src={tile.url}
                      alt={`Kachel ${tile.index}`}
                      className="w-full object-cover"
                      style={{ aspectRatio: tileAspectRatio }}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
