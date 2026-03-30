import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BalloonPopGame from './BalloonPopGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.balloon_pop as const,
  prompt: 'Platze die Ballons!',
  target_count: 2,
  balloon_emoji: '🎈',
  total_balloons: 3,
}

describe('BalloonPopGame', () => {
  it('renders balloons and counter', () => {
    render(<BalloonPopGame config={config} />)
    expect(screen.getByTestId('balloon-counter')).toBeTruthy()
    expect(screen.getByTestId('balloon-0')).toBeTruthy()
    expect(screen.getByTestId('balloon-2')).toBeTruthy()
  })

  it('calls onComplete after enough pops', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<BalloonPopGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('balloon-0'))
    fireEvent.click(screen.getByTestId('balloon-1'))
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
