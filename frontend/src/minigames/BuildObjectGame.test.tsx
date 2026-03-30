import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BuildObjectGame from './BuildObjectGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.build_object as const,
  background_image: 'https://example.com/bg.jpg',
  prompt: 'Baue das Objekt!',
  parts: [
    { id: 'p1', image_url: '', label: 'Kopf', slot_x_pct: 50, slot_y_pct: 20, width_pct: 20, height_pct: 20 },
    { id: 'p2', image_url: '', label: 'Körper', slot_x_pct: 50, slot_y_pct: 60, width_pct: 30, height_pct: 30 },
  ],
}

describe('BuildObjectGame', () => {
  it('renders prompt and parts', () => {
    render(<BuildObjectGame config={config} />)
    expect(screen.getByText('Baue das Objekt!')).toBeTruthy()
    expect(screen.getByTestId('part-p1')).toBeTruthy()
    expect(screen.getByTestId('part-p2')).toBeTruthy()
  })
})
