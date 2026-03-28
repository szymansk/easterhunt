import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PuzzleBoard, { getGridConfig } from './PuzzleBoard'
import type { PuzzleTile, PuzzleSlot } from './PuzzleBoard'

function makeTiles(count: number): PuzzleTile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tile-${i}`,
    index: i,
    imageSrc: `/img/tile-${i}.png`,
    placed: false,
  }))
}

function makeSlots(count: number): PuzzleSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    occupiedBy: null,
  }))
}

describe('getGridConfig', () => {
  it('returns 1x3 for gridSize 3', () => {
    expect(getGridConfig(3)).toEqual({ rows: 1, cols: 3 })
  })
  it('returns 2x2 for gridSize 4', () => {
    expect(getGridConfig(4)).toEqual({ rows: 2, cols: 2 })
  })
  it('returns 2x3 for gridSize 6', () => {
    expect(getGridConfig(6)).toEqual({ rows: 2, cols: 3 })
  })
  it('returns 3x3 for gridSize 9', () => {
    expect(getGridConfig(9)).toEqual({ rows: 3, cols: 3 })
  })
})

describe('PuzzleBoard', () => {
  it('renders 4 slots and 4 tiles for 2x2 config', () => {
    const tiles = makeTiles(4)
    const slots = makeSlots(4)
    render(<PuzzleBoard gridSize={4} tiles={tiles} slots={slots} />)

    const grid = screen.getByTestId('puzzle-grid')
    expect(grid).toBeTruthy()

    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`slot-${i}`)).toBeTruthy()
    }
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`tile-${i}`)).toBeTruthy()
    }
  })

  it('renders 9 slots and 9 tiles for 3x3 config', () => {
    const tiles = makeTiles(9)
    const slots = makeSlots(9)
    render(<PuzzleBoard gridSize={9} tiles={tiles} slots={slots} />)

    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`slot-${i}`)).toBeTruthy()
      expect(screen.getByTestId(`tile-${i}`)).toBeTruthy()
    }
  })

  it('renders 3 slots and 3 tiles for 1x3 config', () => {
    const tiles = makeTiles(3)
    const slots = makeSlots(3)
    render(<PuzzleBoard gridSize={3} tiles={tiles} slots={slots} />)

    for (let i = 0; i < 3; i++) {
      expect(screen.getByTestId(`slot-${i}`)).toBeTruthy()
      expect(screen.getByTestId(`tile-${i}`)).toBeTruthy()
    }
  })

  it('renders 6 slots and 6 tiles for 2x3 config', () => {
    const tiles = makeTiles(6)
    const slots = makeSlots(6)
    render(<PuzzleBoard gridSize={6} tiles={tiles} slots={slots} />)

    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`slot-${i}`)).toBeTruthy()
    }
  })

  it('placed tiles do not appear in tray', () => {
    const tiles: PuzzleTile[] = [
      { id: 'tile-0', index: 0, imageSrc: '/img/0.png', placed: true },
      { id: 'tile-1', index: 1, imageSrc: '/img/1.png', placed: false },
    ]
    const slots: PuzzleSlot[] = [
      { index: 0, occupiedBy: 'tile-0' },
      { index: 1, occupiedBy: null },
    ]
    render(<PuzzleBoard gridSize={4} tiles={tiles} slots={slots} />)

    // tile-1 should be in tray
    expect(screen.getByTestId('tile-1')).toBeTruthy()
    // tile-0 is placed, should not be in tray
    expect(screen.queryByTestId('tile-0')).toBeNull()
  })

  it('tile tray shows dashed slot outlines', () => {
    const tiles = makeTiles(4)
    const slots = makeSlots(4)
    const { container } = render(<PuzzleBoard gridSize={4} tiles={tiles} slots={slots} />)

    const dashedSlots = container.querySelectorAll('[class*="border-dashed"]')
    expect(dashedSlots.length).toBe(4)
  })
})
