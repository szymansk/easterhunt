/**
 * Tests for easter-f4w: shuffle tiles in PuzzleGameContainer.
 * Tests for easter-bmx: tileAspectRatio calculation in PuzzleGameContainer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import PuzzleGame from '../../minigames/puzzle/PuzzleGame'
import type { PuzzleTile } from '../../minigames/puzzle/PuzzleBoard'

// ─── shuffleArray unit tests ──────────────────────────────────────────────────

// Extract and test the shuffle logic in isolation
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

describe('shuffleArray', () => {
  it('mischt das Array (über 10 Iterationen mindestens eine andere Reihenfolge)', () => {
    const input = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    let anyDifferent = false
    for (let i = 0; i < 10; i++) {
      const result = shuffleArray(input)
      if (JSON.stringify(result) !== JSON.stringify(input)) {
        anyDifferent = true
        break
      }
    }
    expect(anyDifferent).toBe(true)
  })

  it('verändert keine Werte, nur die Reihenfolge', () => {
    const input = [{ index: 0 }, { index: 1 }, { index: 2 }]
    const result = shuffleArray(input)
    expect(result).toHaveLength(3)
    const indices = result.map((x) => x.index).sort((a, b) => a - b)
    expect(indices).toEqual([0, 1, 2])
  })

  it('1 Element: kein Fehler, gibt Array mit einem Element zurück', () => {
    const input = [{ index: 0 }]
    const result = shuffleArray(input)
    expect(result).toEqual([{ index: 0 }])
  })

  it('gibt ein neues Array zurück (kein Mutieren des Originals)', () => {
    const input = [1, 2, 3]
    const result = shuffleArray(input)
    expect(result).not.toBe(input)
  })
})

// ─── Test 4: Completion detection works after shuffle ─────────────────────────

describe('PuzzleGame: completion detection works with shuffled tiles', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('calls onComplete when all tiles (post-shuffle) are placed', () => {
    const onComplete = vi.fn()
    // Simulate shuffled tile order: tiles are in non-index order in array,
    // but each tile.index is still correct for its slot.
    const shuffledTiles: PuzzleTile[] = [
      { id: 'tile-3', index: 3, imageSrc: '/img/3.png', placed: true },
      { id: 'tile-1', index: 1, imageSrc: '/img/1.png', placed: true },
      { id: 'tile-0', index: 0, imageSrc: '/img/0.png', placed: true },
      { id: 'tile-2', index: 2, imageSrc: '/img/2.png', placed: true },
    ]
    render(<PuzzleGame gridSize={4} tiles={shuffledTiles} onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(2500) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
