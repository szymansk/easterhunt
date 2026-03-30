import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ComparisonGame from './ComparisonGame'
import { MiniGameType } from '../types'

const config = {
  type: MiniGameType.comparison as const,
  question: 'Was ist größer?',
  left_item: { image_url: '', label: 'Elefant', value: 10 },
  right_item: { image_url: '', label: 'Maus', value: 1 },
  correct_side: 'left' as const,
  comparison_type: 'size' as const,
}

describe('ComparisonGame', () => {
  it('renders both sides', () => {
    render(<ComparisonGame config={config} />)
    expect(screen.getByTestId('comparison-left')).toBeTruthy()
    expect(screen.getByTestId('comparison-right')).toBeTruthy()
    expect(screen.getByText('Was ist größer?')).toBeTruthy()
  })

  it('calls onComplete on correct tap', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<ComparisonGame config={config} onComplete={onComplete} />)
    fireEvent.click(screen.getByTestId('comparison-left'))
    vi.advanceTimersByTime(700)
    expect(onComplete).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
