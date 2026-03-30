import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DecorateGame from './DecorateGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.decorate as const,
  base_image: 'https://example.com/egg.jpg',
  prompt: 'Dekoriere das Ei!',
  stickers: [
    { id: 's1', image_url: '', label: 'Blume' },
    { id: 's2', image_url: '', label: 'Stern' },
  ],
  colors: ['#ff0000', '#00ff00', '#0000ff'],
}

describe('DecorateGame', () => {
  it('renders canvas and controls', () => {
    render(<DecorateGame config={config} />)
    expect(screen.getByTestId('decorate-canvas')).toBeTruthy()
    expect(screen.getByTestId('decorate-done-btn')).toBeTruthy()
    expect(screen.getByTestId('color-0')).toBeTruthy()
    expect(screen.getByTestId('sticker-s1')).toBeTruthy()
  })

  it('calls onComplete when done button clicked', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<DecorateGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('decorate-done-btn'))
    vi.advanceTimersByTime(500)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
