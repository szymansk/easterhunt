import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WhackAMoleGame from './WhackAMoleGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.whack_a_mole as const,
  duration_s: 30,
  grid_size: 3 as const,
  appear_ms: 800,
  mole_emoji: '🦔',
  target_score: 5,
}

describe('WhackAMoleGame', () => {
  it('renders score and timer', () => {
    vi.useFakeTimers()
    render(<WhackAMoleGame config={config} />)
    expect(screen.getByTestId('score-display')).toBeTruthy()
    expect(screen.getByTestId('timer-display')).toBeTruthy()
    vi.useRealTimers()
  })

  it('renders correct number of holes', () => {
    vi.useFakeTimers()
    render(<WhackAMoleGame config={config} />)
    expect(screen.getByTestId('hole-0')).toBeTruthy()
    expect(screen.getByTestId('hole-2')).toBeTruthy()
    vi.useRealTimers()
  })
})
