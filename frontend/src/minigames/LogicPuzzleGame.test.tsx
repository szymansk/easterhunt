import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LogicPuzzleGame from './LogicPuzzleGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.logic_puzzle as const,
  scene_image: 'https://example.com/scene.jpg',
  prompt: 'Drücke die Schalter in der richtigen Reihenfolge!',
  elements: [
    { id: 'e1', type: 'switch' as const, x_pct: 30, y_pct: 40, image_off: '', image_on: '', label: 'Schalter A' },
    { id: 'e2', type: 'button' as const, x_pct: 70, y_pct: 60, image_off: '', image_on: '', label: 'Schalter B' },
  ],
  solution: ['e1', 'e2'],
}

describe('LogicPuzzleGame', () => {
  it('renders elements', () => {
    render(<LogicPuzzleGame config={config} />)
    expect(screen.getByTestId('logic-element-e1')).toBeTruthy()
    expect(screen.getByTestId('logic-element-e2')).toBeTruthy()
  })

  it('calls onComplete when solution matched', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<LogicPuzzleGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('logic-element-e1'))
    fireEvent.click(screen.getByTestId('logic-element-e2'))
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
