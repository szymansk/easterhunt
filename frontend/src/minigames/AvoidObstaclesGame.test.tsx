import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AvoidObstaclesGame from './AvoidObstaclesGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.avoid_obstacles as const,
  obstacle_speed: 2 as const,
  lives: 3,
  target_distance: 200,
  character_emoji: '🐰',
  obstacle_emoji: '🪨',
}

describe('AvoidObstaclesGame', () => {
  it('renders game canvas and HUD', () => {
    vi.useFakeTimers()
    render(<AvoidObstaclesGame config={config} />)
    expect(screen.getByTestId('game-canvas')).toBeTruthy()
    expect(screen.getByTestId('distance-display')).toBeTruthy()
    expect(screen.getByTestId('lives-display')).toBeTruthy()
    expect(screen.getByTestId('character')).toBeTruthy()
    vi.useRealTimers()
  })
})
