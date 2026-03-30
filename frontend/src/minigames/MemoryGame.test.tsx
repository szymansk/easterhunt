import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MemoryGame from './MemoryGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.memory as const,
  pairs: [
    { id: 'p1', image_url: '', label: 'Katze' },
    { id: 'p2', image_url: '', label: 'Hund' },
    { id: 'p3', image_url: '', label: 'Vogel' },
    { id: 'p4', image_url: '', label: 'Fisch' },
  ],
  grid_cols: 4 as const,
}

describe('MemoryGame', () => {
  it('renders cards', () => {
    render(<MemoryGame config={config} />)
    const cards = screen.getAllByRole('button')
    expect(cards).toHaveLength(8)
  })

  it('renders 8 cards for 4 pairs', () => {
    const { getAllByRole } = render(<MemoryGame config={config} />)
    expect(getAllByRole('button').length).toBe(8)
  })

  it('shows question mark on hidden cards', () => {
    render(<MemoryGame config={config} />)
    const questionMarks = screen.getAllByText('?')
    expect(questionMarks.length).toBe(8)
  })
})
