import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RhythmGame from './RhythmGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.rhythm as const,
  prompt: 'Tippe den Rhythmus nach!',
  pattern: [
    { delay_ms: 0 },
    { delay_ms: 500 },
    { delay_ms: 500 },
  ],
  max_attempts: 3,
  tolerance_ms: 250,
}

describe('RhythmGame', () => {
  it('renders tap button and prompt', () => {
    render(<RhythmGame config={config} />)
    expect(screen.getByTestId('rhythm-tap-btn')).toBeTruthy()
    expect(screen.getByText('Tippe den Rhythmus nach!')).toBeTruthy()
  })

  it('shows idle hint text', () => {
    render(<RhythmGame config={config} />)
    expect(screen.getByText(/Tippe auf den Kreis/)).toBeTruthy()
  })
})
