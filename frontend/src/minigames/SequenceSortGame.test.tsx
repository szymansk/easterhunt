import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SequenceSortGame from './SequenceSortGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.sequence_sort as const,
  prompt: 'Ordne die Schritte!',
  steps: [
    { id: 's1', image_url: '', label: 'Schritt 1', correct_order: 0 },
    { id: 's2', image_url: '', label: 'Schritt 2', correct_order: 1 },
    { id: 's3', image_url: '', label: 'Schritt 3', correct_order: 2 },
  ],
}

describe('SequenceSortGame', () => {
  it('renders prompt and confirm button', () => {
    render(<SequenceSortGame config={config} />)
    expect(screen.getByText('Ordne die Schritte!')).toBeTruthy()
    expect(screen.getByTestId('confirm-order-btn')).toBeTruthy()
  })

  it('renders all step cards', () => {
    render(<SequenceSortGame config={config} />)
    expect(screen.getByText('Schritt 1')).toBeTruthy()
    expect(screen.getByText('Schritt 2')).toBeTruthy()
    expect(screen.getByText('Schritt 3')).toBeTruthy()
  })
})
