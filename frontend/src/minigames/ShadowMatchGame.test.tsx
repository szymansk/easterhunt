import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShadowMatchGame from './ShadowMatchGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.shadow_match as const,
  silhouette_image_url: 'https://example.com/shadow.png',
  prompt: 'Was ist das?',
  options: [
    { id: 'a', image_url: '', label: 'Katze', is_correct: true },
    { id: 'b', image_url: '', label: 'Hund', is_correct: false },
  ],
}

describe('ShadowMatchGame', () => {
  it('renders silhouette and options', () => {
    render(<ShadowMatchGame config={config} />)
    expect(screen.getByTestId('silhouette')).toBeTruthy()
    expect(screen.getByText('Katze')).toBeTruthy()
    expect(screen.getByText('Hund')).toBeTruthy()
  })

  it('calls onComplete on correct tap', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<ShadowMatchGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('shadow-option-a'))
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
