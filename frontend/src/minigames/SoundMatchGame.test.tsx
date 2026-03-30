import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SoundMatchGame from './SoundMatchGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.sound_match as const,
  sound_url: 'https://example.com/cat.mp3',
  correct_item: { image_url: '', label: 'Katze' },
  distractors: [
    { image_url: '', label: 'Hund' },
    { image_url: '', label: 'Vogel' },
  ],
}

describe('SoundMatchGame', () => {
  it('renders play button', () => {
    render(<SoundMatchGame config={config} />)
    expect(screen.getByTestId('play-sound-btn')).toBeTruthy()
  })

  it('renders options', () => {
    render(<SoundMatchGame config={config} />)
    expect(screen.getByText('Katze')).toBeTruthy()
    expect(screen.getByText('Hund')).toBeTruthy()
    expect(screen.getByText('Vogel')).toBeTruthy()
  })

  it('calls onComplete on correct tap', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<SoundMatchGame config={config} onComplete={onComplete} />)
    const correct = screen.getByLabelText('Katze')
    fireEvent.click(correct)
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
