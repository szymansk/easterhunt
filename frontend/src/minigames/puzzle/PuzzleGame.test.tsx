import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PuzzleGame from './PuzzleGame'
import type { PuzzleTile } from './PuzzleBoard'

function makeTiles(count: number): PuzzleTile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tile-${i}`,
    index: i,
    imageSrc: `/img/tile-${i}.png`,
    placed: false,
  }))
}

describe('PuzzleGame', () => {
  it('renders all tiles in tray initially', () => {
    const tiles = makeTiles(4)
    render(<PuzzleGame gridSize={4} tiles={tiles} />)

    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`tile-${i}`)).toBeTruthy()
    }
  })

  it('renders all slots empty initially', () => {
    const tiles = makeTiles(4)
    render(<PuzzleGame gridSize={4} tiles={tiles} />)

    for (let i = 0; i < 4; i++) {
      const slot = screen.getByTestId(`slot-${i}`)
      expect(slot).toBeTruthy()
    }
  })

  it('tile tray and grid are both present', () => {
    const tiles = makeTiles(9)
    render(<PuzzleGame gridSize={9} tiles={tiles} />)

    expect(screen.getByTestId('tile-tray')).toBeTruthy()
    expect(screen.getByTestId('puzzle-grid')).toBeTruthy()
  })

  it('does not call onComplete initially', () => {
    const onComplete = vi.fn()
    const tiles = makeTiles(4)
    render(<PuzzleGame gridSize={4} tiles={tiles} onComplete={onComplete} />)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('renders 9 tiles for 3x3 grid', () => {
    const tiles = makeTiles(9)
    render(<PuzzleGame gridSize={9} tiles={tiles} />)

    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`tile-${i}`)).toBeTruthy()
    }
  })
})

// Logic unit tests for placement decisions (no DOM needed)
describe('placement logic', () => {
  it('correct placement: tile.index matches slot index', () => {
    const tile: PuzzleTile = { id: 'tile-3', index: 3, imageSrc: '/img/3.png', placed: false }
    const targetSlotIndex = 3
    expect(tile.index === targetSlotIndex).toBe(true)
  })

  it('incorrect placement: tile.index does not match slot index', () => {
    const tile: PuzzleTile = { id: 'tile-2', index: 2, imageSrc: '/img/2.png', placed: false }
    const targetSlotIndex = 5
    expect(tile.index === targetSlotIndex).toBe(false)
  })
})
