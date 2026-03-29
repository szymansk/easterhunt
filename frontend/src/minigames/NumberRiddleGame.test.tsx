import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import NumberRiddleGame from './NumberRiddleGame'

const defaultProps = {
  taskType: 'plus_minus' as const,
  promptText: '2 + 3 = ?',
  correctAnswer: 5,
  distractorAnswers: [3, 7],
  onComplete: vi.fn(),
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runAllTimers()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('NumberRiddleGame', () => {
  it('renders prompt text', () => {
    render(<NumberRiddleGame {...defaultProps} />)
    expect(screen.getByText('2 + 3 = ?')).toBeInTheDocument()
  })

  it('renders buttons for correct answer and all distractors', () => {
    render(<NumberRiddleGame {...defaultProps} />)
    expect(screen.getByTestId('answer-btn-5')).toBeInTheDocument()
    expect(screen.getByTestId('answer-btn-3')).toBeInTheDocument()
    expect(screen.getByTestId('answer-btn-7')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('buttons have minimum 60x60px touch target', () => {
    render(<NumberRiddleGame {...defaultProps} />)
    const btn = screen.getByTestId('answer-btn-5')
    expect(btn).toHaveStyle({ minWidth: '60px', minHeight: '60px' })
  })

  it('tapping correct answer calls onComplete after 600ms', () => {
    const onComplete = vi.fn()
    render(<NumberRiddleGame {...defaultProps} onComplete={onComplete} />)

    fireEvent.click(screen.getByTestId('answer-btn-5'))

    expect(onComplete).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('tapping wrong answer does NOT call onComplete', () => {
    const onComplete = vi.fn()
    render(<NumberRiddleGame {...defaultProps} onComplete={onComplete} />)

    fireEvent.click(screen.getByTestId('answer-btn-3'))
    vi.advanceTimersByTime(1000)

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('tapping wrong answer shows red feedback and allows retry', () => {
    render(<NumberRiddleGame {...defaultProps} />)
    const wrongBtn = screen.getByTestId('answer-btn-3')

    act(() => {
      fireEvent.click(wrongBtn)
    })
    // After wrong tap the button should have red styling (border-red-400)
    expect(wrongBtn.className).toContain('border-red-400')

    // After 500ms the button resets to idle
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(wrongBtn.className).not.toContain('border-red-400')
  })

  it('tapping correct answer shows green feedback', () => {
    render(<NumberRiddleGame {...defaultProps} />)
    const correctBtn = screen.getByTestId('answer-btn-5')

    fireEvent.click(correctBtn)
    expect(correctBtn.className).toContain('border-green-400')
  })

  it('renders prompt image for count task type', () => {
    render(
      <NumberRiddleGame
        {...defaultProps}
        taskType="count"
        promptImage="/media/apples.svg"
      />
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/media/apples.svg')
  })

  it('does NOT render image for plus_minus task type even if promptImage provided', () => {
    render(
      <NumberRiddleGame
        {...defaultProps}
        taskType="plus_minus"
        promptImage="/media/apples.svg"
      />
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders all 5 options when 4 distractors provided', () => {
    render(
      <NumberRiddleGame
        {...defaultProps}
        distractorAnswers={[2, 4, 6, 8]}
      />
    )
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })
})
