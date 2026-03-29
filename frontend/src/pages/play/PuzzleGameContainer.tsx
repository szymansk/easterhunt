import { useEffect, useState } from 'react'
import { getPuzzleTiles } from '../../services/api'
import type { Station } from '../../types'
import type { PuzzleTile, GridSize } from '../../minigames/puzzle/PuzzleBoard'
import PuzzleGame from '../../minigames/puzzle/PuzzleGame'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

interface PuzzleGameContainerProps {
  station: Station
  onComplete: () => void
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PuzzleGameContainer({ station, onComplete }: PuzzleGameContainerProps) {
  const [tiles, setTiles] = useState<PuzzleTile[]>([])
  const [gridSize, setGridSize] = useState<GridSize>(4)
  const [tileAspectRatio, setTileAspectRatio] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPuzzleTiles(station.game_id, station.id)
      .then((data) => {
        const totalTiles = data.grid.rows * data.grid.cols
        const size = totalTiles as GridSize
        setGridSize(size)
        const ratio = data.tile_width && data.tile_height ? data.tile_width / data.tile_height : 1
        setTileAspectRatio(ratio)
        const mappedTiles = data.tiles.map((t) => ({
          id: String(t.index),
          index: t.index,
          imageSrc: t.url,
          placed: false,
        }))
        setTiles(shuffleArray(mappedTiles))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [station.game_id, station.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) return <ErrorMessage message={error} />

  return <PuzzleGame gridSize={gridSize} tiles={tiles} tileAspectRatio={tileAspectRatio} onComplete={onComplete} />
}
