import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MazeGame from './MazeGame'
import type { MazeData } from '../types'

// Minimal 2-cell maze: start (1,1) → goal (1,3)
// Wall grid (3 rows × 5 cols):
//  T T T T T
//  T F F F T
//  T T T T T
const SIMPLE_MAZE: MazeData = {
  walls: [
    [true, true, true, true, true],
    [true, false, false, false, true],
    [true, true, true, true, true],
  ],
  start: { row: 1, col: 1 },
  goal: { row: 1, col: 3 },
  rows: 1,
  cols: 2,
  difficulty: 'easy',
}

// 3-cell horizontal maze with a wall blocking col 3:
// T T T T T T T
// T F F W F F T   ← wall at (1,3)
// T T T T T T T
const BLOCKED_MAZE: MazeData = {
  walls: [
    [true, true, true, true, true, true, true],
    [true, false, false, true, false, false, true],
    [true, true, true, true, true, true, true],
  ],
  start: { row: 1, col: 1 },
  goal: { row: 1, col: 5 },
  rows: 1,
  cols: 3,
  difficulty: 'easy',
}

describe('MazeGame', () => {
  it('renders bunny emoji as avatar', () => {
    render(<MazeGame mazeData={SIMPLE_MAZE} />)
    expect(screen.getByText('🐰')).toBeTruthy()
  })

  it('renders egg emoji as goal marker', () => {
    render(<MazeGame mazeData={SIMPLE_MAZE} />)
    expect(screen.getByText('🥚')).toBeTruthy()
  })

  it('renders SVG element', () => {
    const { container } = render(<MazeGame mazeData={SIMPLE_MAZE} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('SVG has touch-action none to prevent scrolling', () => {
    const { container } = render(<MazeGame mazeData={SIMPLE_MAZE} />)
    const svg = container.querySelector('svg')
    expect(svg?.style.touchAction).toBe('none')
  })

  it('shows "Ziehe den Hasen zum Osterei" instruction', () => {
    render(<MazeGame mazeData={SIMPLE_MAZE} />)
    expect(screen.getByText('Ziehe den Hasen zum Osterei')).toBeTruthy()
  })

  it('does not call onComplete initially', () => {
    const onComplete = vi.fn()
    render(<MazeGame mazeData={SIMPLE_MAZE} onComplete={onComplete} />)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('calls onComplete when avatar reaches goal via mouse move', () => {
    const onComplete = vi.fn()
    const { container } = render(
      <MazeGame mazeData={SIMPLE_MAZE} onComplete={onComplete} />,
    )
    const svg = container.querySelector('svg')!

    // Simulate moving from start (1,1) → (1,2) → goal (1,3)
    // CELL_SIZE = 28, use exact grid coordinates: x = col * CELL_SIZE, y = row * CELL_SIZE
    // This ensures Math.round(x / CELL_SIZE) == col reliably
    const CELL_SIZE = 28

    // Mock getBoundingClientRect to map 1:1 (no scaling)
    svg.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: SIMPLE_MAZE.walls[0].length * CELL_SIZE,
      height: SIMPLE_MAZE.walls.length * CELL_SIZE,
      right: SIMPLE_MAZE.walls[0].length * CELL_SIZE,
      bottom: SIMPLE_MAZE.walls.length * CELL_SIZE,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }))

    // Move to (row=1, col=2) — intermediate open cell
    fireEvent.mouseMove(svg, {
      buttons: 1,
      clientX: 2 * CELL_SIZE, // col=2: round(56/28)=2 ✓
      clientY: 1 * CELL_SIZE, // row=1: round(28/28)=1 ✓
    })

    expect(onComplete).not.toHaveBeenCalled()

    // Move to goal (row=1, col=3)
    fireEvent.mouseMove(svg, {
      buttons: 1,
      clientX: 3 * CELL_SIZE, // col=3: round(84/28)=3 ✓
      clientY: 1 * CELL_SIZE, // row=1 ✓
    })

    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('does not call onComplete when moving into a wall', () => {
    const onComplete = vi.fn()
    const { container } = render(
      <MazeGame mazeData={BLOCKED_MAZE} onComplete={onComplete} />,
    )
    const svg = container.querySelector('svg')!
    const CELL_SIZE = 28

    svg.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: BLOCKED_MAZE.walls[0].length * CELL_SIZE,
      height: BLOCKED_MAZE.walls.length * CELL_SIZE,
      right: BLOCKED_MAZE.walls[0].length * CELL_SIZE,
      bottom: BLOCKED_MAZE.walls.length * CELL_SIZE,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }))

    // Move to (1,2) — open corridor
    fireEvent.mouseMove(svg, {
      buttons: 1,
      clientX: 2 * CELL_SIZE, // col=2
      clientY: 1 * CELL_SIZE, // row=1
    })
    // Try to move to (1,3) which is a wall → blocked
    fireEvent.mouseMove(svg, {
      buttons: 1,
      clientX: 3 * CELL_SIZE, // col=3 — wall
      clientY: 1 * CELL_SIZE,
    })

    expect(onComplete).not.toHaveBeenCalled()
  })
})
