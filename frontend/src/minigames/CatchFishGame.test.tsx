import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CatchFishGame from './CatchFishGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.catch_fish as const,
  prompt: 'Fang die Fische!',
  target_count: 2,
  fish_emoji: '🐟',
  total_fish: 3,
  animation_speed: 'medium' as const,
}

describe('CatchFishGame', () => {
  it('renders fish and counter', () => {
    render(<CatchFishGame config={config} />)
    expect(screen.getByTestId('fish-counter')).toBeTruthy()
    expect(screen.getByTestId('fish-0')).toBeTruthy()
  })

  it('calls onComplete after catching enough', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<CatchFishGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('fish-0'))
    fireEvent.click(screen.getByTestId('fish-1'))
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
