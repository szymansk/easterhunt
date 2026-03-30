import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpotDifferenceGame from './SpotDifferenceGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.spot_difference as const,
  image_url: 'https://example.com/img.jpg',
  prompt: 'Finde die Unterschiede!',
  targets: [
    { id: 't1', label: 'Blume', x_pct: 30, y_pct: 40, radius_pct: 10 },
    { id: 't2', label: 'Baum', x_pct: 70, y_pct: 60, radius_pct: 10 },
  ],
}

describe('SpotDifferenceGame', () => {
  it('renders prompt and image', () => {
    render(<SpotDifferenceGame config={config} />)
    expect(screen.getByText('Finde die Unterschiede!')).toBeTruthy()
    expect(screen.getByTestId('spot-diff-image')).toBeTruthy()
    expect(screen.getByText('0 von 2 gefunden')).toBeTruthy()
  })
})
