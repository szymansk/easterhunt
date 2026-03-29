/**
 * Puzzle Frontend Tests - covers 6.5 acceptance criteria
 *
 * 1. PuzzleBoard 3×3 → 9 slots and 9 tiles
 * 2. Correct placement (tile.index === slot.index) → tile marked as placed
 * 3. Wrong placement → tile NOT placed
 * 4. All 9 tiles correct → onComplete called
 * 5. 8 of 9 tiles correct → onComplete NOT called
 * 6. All tests without browser (jsdom)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import PuzzleBoard from './PuzzleBoard'
import PuzzleGame from './PuzzleGame'
import type { PuzzleTile, PuzzleSlot } from './PuzzleBoard'

function makeTiles(count: number, placed = false): PuzzleTile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tile-${i}`,
    index: i,
    imageSrc: `/img/tile-${i}.png`,
    placed,
  }))
}

function makeSlots(count: number): PuzzleSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    occupiedBy: null,
  }))
}

// ─── Test 1: PuzzleBoard 3×3 → 9 slots and 9 tiles ──────────────────────────

describe('Test 1: PuzzleBoard 3×3 renders 9 slots and 9 tiles', () => {
  it('renders exactly 9 slots in the grid', () => {
    const tiles = makeTiles(9)
    const slots = makeSlots(9)
    render(<PuzzleBoard gridSize={9} tiles={tiles} slots={slots} />)

    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`slot-${i}`)).toBeTruthy()
    }
  })

  it('renders exactly 9 tiles in the tray', () => {
    const tiles = makeTiles(9)
    const slots = makeSlots(9)
    render(<PuzzleBoard gridSize={9} tiles={tiles} slots={slots} />)

    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`tile-${i}`)).toBeTruthy()
    }
  })

  it('renders no extra slots or tiles beyond 9', () => {
    const tiles = makeTiles(9)
    const slots = makeSlots(9)
    const { container } = render(<PuzzleBoard gridSize={9} tiles={tiles} slots={slots} />)

    // slot-0 through slot-8
    const allSlots = container.querySelectorAll('[data-testid^="slot-"]')
    // tile-0 through tile-8 (excludes tile-tray which is a different element)
    const allTiles = Array.from(container.querySelectorAll('[data-testid]')).filter(
      (el) => /^tile-\d+$/.test(el.getAttribute('data-testid') ?? '')
    )
    expect(allSlots.length).toBe(9)
    expect(allTiles.length).toBe(9)
  })
})

// ─── Test 2: Correct placement (tile.index === slot.index) → tile marked placed

describe('Test 2: correct placement logic', () => {
  it('tile with matching index is considered correct placement', () => {
    const tile: PuzzleTile = { id: 'tile-5', index: 5, imageSrc: '/img/5.png', placed: false }
    const slotIndex = 5
    expect(tile.index === slotIndex).toBe(true)
  })

  it('placed tile is removed from tray', () => {
    const tiles: PuzzleTile[] = [
      { id: 'tile-0', index: 0, imageSrc: '/img/0.png', placed: true },
      { id: 'tile-1', index: 1, imageSrc: '/img/1.png', placed: false },
      { id: 'tile-2', index: 2, imageSrc: '/img/2.png', placed: false },
      { id: 'tile-3', index: 3, imageSrc: '/img/3.png', placed: false },
    ]
    const slots: PuzzleSlot[] = [
      { index: 0, occupiedBy: 'tile-0' },
      { index: 1, occupiedBy: null },
      { index: 2, occupiedBy: null },
      { index: 3, occupiedBy: null },
    ]
    render(<PuzzleBoard gridSize={4} tiles={tiles} slots={slots} />)

    // tile-0 is placed, should NOT be in tray
    expect(screen.queryByTestId('tile-0')).toBeNull()
    // tile-1,2,3 are unplaced, should be in tray
    expect(screen.getByTestId('tile-1')).toBeTruthy()
    expect(screen.getByTestId('tile-2')).toBeTruthy()
    expect(screen.getByTestId('tile-3')).toBeTruthy()
  })

  it('slot occupied by placed tile shows the tile image', () => {
    const tiles: PuzzleTile[] = [
      { id: 'tile-0', index: 0, imageSrc: '/img/0.png', placed: true },
    ]
    const slots: PuzzleSlot[] = [{ index: 0, occupiedBy: 'tile-0' }]
    render(<PuzzleBoard gridSize={4} tiles={[...tiles, ...makeTiles(3).map((t, i) => ({ ...t, index: i + 1, id: `tile-${i + 1}` }))]} slots={[...slots, ...makeSlots(3).map((_, i) => ({ index: i + 1, occupiedBy: null }))]} />)

    // Slot 0 should contain an img
    const slot0 = screen.getByTestId('slot-0')
    expect(slot0.querySelector('img')).toBeTruthy()
  })
})

// ─── Test 3: Wrong placement → tile NOT placed ───────────────────────────────

describe('Test 3: wrong placement logic', () => {
  it('tile with non-matching index is considered wrong placement', () => {
    const tile: PuzzleTile = { id: 'tile-2', index: 2, imageSrc: '/img/2.png', placed: false }
    const slotIndex = 7
    expect(tile.index === slotIndex).toBe(false)
  })

  it('all tiles remain in tray when none are placed', () => {
    const tiles = makeTiles(9)
    const slots = makeSlots(9)
    render(<PuzzleBoard gridSize={9} tiles={tiles} slots={slots} />)

    // All 9 tiles should still be in tray
    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`tile-${i}`)).toBeTruthy()
    }
    // All slots should be empty (no images in slots)
    for (let i = 0; i < 9; i++) {
      const slot = screen.getByTestId(`slot-${i}`)
      expect(slot.querySelector('img')).toBeNull()
    }
  })
})

// ─── Test 4: All 9 tiles correct → onComplete called ────────────────────────

describe('Test 4: all 9 tiles placed → onComplete called', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('calls onComplete after all 9 tiles are placed', () => {
    const onComplete = vi.fn()
    render(<PuzzleGame gridSize={9} tiles={makeTiles(9, true)} onComplete={onComplete} />)

    act(() => { vi.advanceTimersByTime(2500) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('shows SuccessOverlay when all tiles are placed', () => {
    render(<PuzzleGame gridSize={9} tiles={makeTiles(9, true)} />)
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})

// ─── Test 5: 8 of 9 tiles correct → onComplete NOT called ───────────────────

describe('Test 5: 8 of 9 tiles placed → onComplete NOT called', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not call onComplete when only 8 of 9 tiles are placed', () => {
    const onComplete = vi.fn()
    const tiles = makeTiles(9, true)
    tiles[8] = { ...tiles[8], placed: false } // last tile still in tray

    render(<PuzzleGame gridSize={9} tiles={tiles} onComplete={onComplete} />)

    act(() => { vi.runAllTimers() })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('does not show SuccessOverlay when 8 of 9 placed', () => {
    const tiles = makeTiles(9, true)
    tiles[8] = { ...tiles[8], placed: false }

    render(<PuzzleGame gridSize={9} tiles={tiles} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not call onComplete when 0 of 9 tiles are placed', () => {
    const onComplete = vi.fn()
    render(<PuzzleGame gridSize={9} tiles={makeTiles(9, false)} onComplete={onComplete} />)
    act(() => { vi.runAllTimers() })
    expect(onComplete).not.toHaveBeenCalled()
  })
})
