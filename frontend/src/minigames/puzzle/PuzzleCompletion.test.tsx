import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import PuzzleGame from './PuzzleGame'
import type { PuzzleTile } from './PuzzleBoard'

function makeTiles(count: number, allPlaced = false): PuzzleTile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tile-${i}`,
    index: i,
    imageSrc: `/img/tile-${i}.png`,
    placed: allPlaced,
  }))
}

describe('Puzzle Completion Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call onComplete when no tiles are placed', () => {
    const onComplete = vi.fn()
    render(<PuzzleGame gridSize={4} tiles={makeTiles(4)} onComplete={onComplete} />)
    act(() => { vi.runAllTimers() })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('does not call onComplete when N-1 tiles are placed', () => {
    const onComplete = vi.fn()
    // 3 of 4 placed, 1 remaining
    const tiles: PuzzleTile[] = [
      { id: 'tile-0', index: 0, imageSrc: '/img/0.png', placed: true },
      { id: 'tile-1', index: 1, imageSrc: '/img/1.png', placed: true },
      { id: 'tile-2', index: 2, imageSrc: '/img/2.png', placed: true },
      { id: 'tile-3', index: 3, imageSrc: '/img/3.png', placed: false },
    ]
    render(<PuzzleGame gridSize={4} tiles={tiles} onComplete={onComplete} />)
    act(() => { vi.runAllTimers() })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('shows SuccessOverlay when all tiles are placed initially', () => {
    render(<PuzzleGame gridSize={4} tiles={makeTiles(4, true)} />)
    // The success overlay should appear since all tiles are placed
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('calls onComplete after 2.5s delay when all tiles placed', () => {
    const onComplete = vi.fn()
    render(<PuzzleGame gridSize={4} tiles={makeTiles(4, true)} onComplete={onComplete} />)

    // Not called yet
    expect(onComplete).not.toHaveBeenCalled()

    // After 2500ms delay
    act(() => { vi.advanceTimersByTime(2500) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('N-of-N correct tiles triggers completion', () => {
    const onComplete = vi.fn()
    // All 9 tiles placed
    render(<PuzzleGame gridSize={9} tiles={makeTiles(9, true)} onComplete={onComplete} />)

    act(() => { vi.advanceTimersByTime(2500) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('8-of-9 tiles placed does NOT trigger completion', () => {
    const onComplete = vi.fn()
    const tiles = makeTiles(9, true)
    tiles[8] = { ...tiles[8], placed: false }

    render(<PuzzleGame gridSize={9} tiles={tiles} onComplete={onComplete} />)

    act(() => { vi.runAllTimers() })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('tile tray is empty when all tiles are placed', () => {
    render(<PuzzleGame gridSize={4} tiles={makeTiles(4, true)} />)
    expect(screen.getByText('Ablage leer')).toBeTruthy()
  })
})
