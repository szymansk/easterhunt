import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HiddenObjectGame from './HiddenObjectGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.hidden_object as const,
  scene_image: 'https://example.com/scene.jpg',
  prompt: 'Finde alle Gegenstände!',
  targets: [
    { id: 't1', label: 'Schlüssel', x_pct: 30, y_pct: 40, radius_pct: 8 },
    { id: 't2', label: 'Münze', x_pct: 70, y_pct: 60, radius_pct: 8 },
  ],
}

describe('HiddenObjectGame', () => {
  it('renders scene and targets', () => {
    render(<HiddenObjectGame config={config} />)
    expect(screen.getByTestId('hidden-object-scene')).toBeTruthy()
    expect(screen.getByTestId('target-t1')).toBeTruthy()
    expect(screen.getByTestId('target-t2')).toBeTruthy()
    expect(screen.getByText('Schlüssel')).toBeTruthy()
    expect(screen.getByText('Münze')).toBeTruthy()
  })
})
