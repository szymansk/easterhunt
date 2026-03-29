/**
 * Tests for easter-bmx: dynamic tile aspect ratio (no aspect-square crop).
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import PuzzleDropZone from './PuzzleDropZone'
import PuzzleTileView from './PuzzleTileView'
import type { PuzzleTile } from './PuzzleBoard'

const mockTile: PuzzleTile = {
  id: 'tile-0',
  index: 0,
  imageSrc: '/img/tile-0.png',
  placed: false,
}

// ─── Test 6: PuzzleDropZone uses tileAspectRatio instead of aspect-square ─────

describe('PuzzleDropZone: tileAspectRatio prop', () => {
  it('applies aspectRatio style from tileAspectRatio prop', () => {
    const { container } = render(
      <PuzzleDropZone slotIndex={0} isOver={false} tileAspectRatio={0.75} />,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.aspectRatio).toBe('0.75')
  })

  it('does NOT have aspect-square class when tileAspectRatio is provided', () => {
    const { container } = render(
      <PuzzleDropZone slotIndex={0} isOver={false} tileAspectRatio={0.75} />,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.className).not.toContain('aspect-square')
  })

  it('defaults to aspectRatio 1 when tileAspectRatio is not provided', () => {
    const { container } = render(<PuzzleDropZone slotIndex={0} isOver={false} />)
    const el = container.firstElementChild as HTMLElement
    // style.aspectRatio may be '1' or '' depending on rendering, but should not be non-square
    const ratio = el.style.aspectRatio
    expect(ratio === '1' || ratio === '').toBe(true)
  })
})

// ─── Test 7: PuzzleTileView uses tileAspectRatio ──────────────────────────────

describe('PuzzleTileView: tileAspectRatio prop', () => {
  it('applies aspectRatio style from tileAspectRatio prop', () => {
    const { container } = render(
      <PuzzleTileView
        tile={mockTile}
        colCount={3}
        isActive={false}
        isBouncing={false}
        tileAspectRatio={0.75}
      />,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.aspectRatio).toBe('0.75')
  })

  it('does NOT use aspectRatio "1" (old square value) when given 0.75', () => {
    const { container } = render(
      <PuzzleTileView
        tile={mockTile}
        colCount={3}
        isActive={false}
        isBouncing={false}
        tileAspectRatio={0.75}
      />,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.aspectRatio).not.toBe('1')
  })
})
