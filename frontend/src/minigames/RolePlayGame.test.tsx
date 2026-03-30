import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RolePlayGame from './RolePlayGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.role_play as const,
  scene_image: 'https://example.com/scene.jpg',
  prompt: 'Fülle das Glas!',
  steps: [
    { id: 's1', object_image: '', object_label: 'Krug', action_label: 'Nehmen', x_pct: 30, y_pct: 40, sound: 'snap' as const },
    { id: 's2', object_image: '', object_label: 'Glas', action_label: 'Füllen', x_pct: 70, y_pct: 60, sound: null },
  ],
  ordered: false,
}

describe('RolePlayGame', () => {
  it('renders scene and steps', () => {
    render(<RolePlayGame config={config} />)
    expect(screen.getByTestId('roleplay-step-s1')).toBeTruthy()
    expect(screen.getByTestId('roleplay-step-s2')).toBeTruthy()
  })

  it('calls onComplete when all steps done', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<RolePlayGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('roleplay-step-s1'))
    fireEvent.click(screen.getByTestId('roleplay-step-s2'))
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
