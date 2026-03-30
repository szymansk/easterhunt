import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ColorSortGame from './ColorSortGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.color_sort as const,
  buckets: [
    { id: 'red', color: '#ff0000', label: 'Rot', item_ids: ['apple', 'tomato'] },
    { id: 'blue', color: '#0000ff', label: 'Blau', item_ids: ['sky', 'ocean'] },
  ],
  items: [
    { id: 'apple', color: '#ff0000', label: 'Apfel', emoji: '🍎' },
    { id: 'tomato', color: '#ff0000', label: 'Tomate', emoji: '🍅' },
    { id: 'sky', color: '#0000ff', label: 'Himmel', emoji: '🌤' },
    { id: 'ocean', color: '#0000ff', label: 'Ozean', emoji: '🌊' },
  ],
}

describe('ColorSortGame', () => {
  it('renders buckets and items', () => {
    render(<ColorSortGame config={config} />)
    expect(screen.getByText('Rot')).toBeTruthy()
    expect(screen.getByText('Blau')).toBeTruthy()
    expect(screen.getByTestId('color-item-apple')).toBeTruthy()
    expect(screen.getByTestId('color-item-sky')).toBeTruthy()
  })
})
