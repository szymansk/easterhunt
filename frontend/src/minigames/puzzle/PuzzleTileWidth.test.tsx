/**
 * Tests for easter-fgg: tile width uses colCount directly (no Math.max(colCount, 3)).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PuzzleTileView from './PuzzleTileView'
import PuzzleGame from './PuzzleGame'
import type { PuzzleTile } from './PuzzleBoard'

function makeTile(index: number): PuzzleTile {
  return { id: `tile-${index}`, index, imageSrc: `/img/${index}.png`, placed: false }
}

function makeTiles(count: number): PuzzleTile[] {
  return Array.from({ length: count }, (_, i) => makeTile(i))
}

// ─── Test 1: colCount=2 → ~50% width ──────────────────────────────────────────

describe('PuzzleTileView: width calculation uses colCount directly', () => {
  it('colCount=2 → width contains "50%" (not "33%")', () => {
    const { container } = render(
      <PuzzleTileView
        tile={makeTile(0)}
        colCount={2}
        isActive={false}
        isBouncing={false}
      />,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.width).toContain('50%')
    expect(el.style.width).not.toContain('33%')
  })

  it('colCount=3 → width contains "33%"', () => {
    const { container } = render(
      <PuzzleTileView
        tile={makeTile(0)}
        colCount={3}
        isActive={false}
        isBouncing={false}
      />,
    )
    const el = container.firstElementChild as HTMLElement
    // 100 / 3 = 33.333...
    expect(el.style.width).toContain('33.')
  })

  it('colCount=2 → calc expression uses 50 not 33', () => {
    const { container } = render(
      <PuzzleTileView
        tile={makeTile(0)}
        colCount={2}
        isActive={false}
        isBouncing={false}
      />,
    )
    const el = container.firstElementChild as HTMLElement
    // The calc expression should be based on 100/2=50, not 100/3≈33
    expect(el.style.width).toMatch(/50/)
  })
})

// ─── Test 4: PuzzleGame tray with gridSize=4 (2×2) uses 2-column width ────────

describe('PuzzleGame: tray tiles for 2×2 grid use 2-column width', () => {
  it('gridSize=4 tray tiles have width based on 2 columns (50%), not 3 (33%)', () => {
    const { container } = render(
      <PuzzleGame gridSize={4} tiles={makeTiles(4)} />,
    )
    const tileEl = container.querySelector('[data-testid="tile-0"]') as HTMLElement | null
    expect(tileEl).not.toBeNull()
    if (tileEl) {
      expect(tileEl.style.width).toContain('50%')
      expect(tileEl.style.width).not.toContain('33%')
    }
  })
})
