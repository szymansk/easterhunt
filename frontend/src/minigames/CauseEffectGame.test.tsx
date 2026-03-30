import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CauseEffectGame from './CauseEffectGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.cause_effect as const,
  scene_image: 'https://example.com/scene.jpg',
  prompt: 'Tippe auf die Objekte!',
  objects: [
    { id: 'o1', x_pct: 30, y_pct: 40, image_url: '', label: 'Lampe', animation: 'bounce' as const, sound: 'snap' as const },
    { id: 'o2', x_pct: 70, y_pct: 60, image_url: '', label: 'Schalter', animation: 'spin' as const, sound: null },
  ],
  require_all_tapped: true,
}

describe('CauseEffectGame', () => {
  it('renders scene and objects', () => {
    render(<CauseEffectGame config={config} />)
    expect(screen.getByTestId('cause-obj-o1')).toBeTruthy()
    expect(screen.getByTestId('cause-obj-o2')).toBeTruthy()
  })

  it('calls onComplete when all objects tapped', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<CauseEffectGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('cause-obj-o1'))
    fireEvent.click(screen.getByTestId('cause-obj-o2'))
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
