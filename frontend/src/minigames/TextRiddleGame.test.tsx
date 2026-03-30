import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import TextRiddleGame from './TextRiddleGame'
import type { TextRiddleOption } from '../types'

vi.mock('../hooks/useTTS', () => ({
  useTTS: vi.fn(() => ({ isTTSAvailable: () => false, speak: vi.fn(), stop: vi.fn() })),
}))

const answerOptions: TextRiddleOption[] = [
  { text: 'Grün', is_correct: true },
  { text: 'Rot', is_correct: false },
  { text: 'Blau', is_correct: false },
]

describe('TextRiddleGame', () => {
  it('renders question text large (font-size >= 18px)', () => {
    render(
      <TextRiddleGame
        questionText="Welche Farbe hat Gras?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

      />,
    )
    const questionEl = screen.getByText('Welche Farbe hat Gras?')
    expect(questionEl).toBeTruthy()
    const style = (questionEl as HTMLElement).style.fontSize
    if (style) {
      expect(parseInt(style)).toBeGreaterThanOrEqual(18)
    }
  })

  it('renders all answer options', () => {
    render(
      <TextRiddleGame
        questionText="Welche Farbe hat Gras?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

      />,
    )
    expect(screen.getByText('Grün')).toBeTruthy()
    expect(screen.getByText('Rot')).toBeTruthy()
    expect(screen.getByText('Blau')).toBeTruthy()
  })

  it('TTS button hidden when isTTSAvailable returns false', async () => {
    const { useTTS } = await import('../hooks/useTTS')
    vi.mocked(useTTS).mockReturnValue({ isTTSAvailable: () => false, speak: vi.fn(), stop: vi.fn() })
    render(
      <TextRiddleGame
        questionText="Q?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}
      />,
    )
    expect(screen.queryByTestId('tts-button')).toBeNull()
  })

  it('TTS button shown when isTTSAvailable returns true', async () => {
    const { useTTS } = await import('../hooks/useTTS')
    vi.mocked(useTTS).mockReturnValue({ isTTSAvailable: () => true, speak: vi.fn(), stop: vi.fn() })
    render(
      <TextRiddleGame
        questionText="Q?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}
      />,
    )
    expect(screen.getByTestId('tts-button')).toBeTruthy()
  })

  it('correct answer calls onComplete after 1s', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(
      <TextRiddleGame
        questionText="Welche Farbe hat Gras?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

        onComplete={onComplete}
      />,
    )

    const correctButton = screen.getByTestId('answer-option-0') // Grün is correct
    fireEvent.click(correctButton)

    await act(async () => {
      vi.advanceTimersByTime(1100)
    })
    expect(onComplete).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('wrong answer does not call onComplete', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(
      <TextRiddleGame
        questionText="Welche Farbe hat Gras?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

        onComplete={onComplete}
      />,
    )

    const wrongButton = screen.getByTestId('answer-option-1') // Rot is wrong
    fireEvent.click(wrongButton)

    await act(async () => {
      vi.advanceTimersByTime(1100)
    })
    expect(onComplete).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('correct answer shows green highlight', () => {
    vi.useFakeTimers()
    render(
      <TextRiddleGame
        questionText="Welche Farbe hat Gras?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

      />,
    )

    const correctButton = screen.getByTestId('answer-option-0')
    fireEvent.click(correctButton)
    expect(correctButton.className).toContain('border-green-400')
    vi.useRealTimers()
  })

  it('wrong answer shows red highlight', () => {
    render(
      <TextRiddleGame
        questionText="Welche Farbe hat Gras?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

      />,
    )

    const wrongButton = screen.getByTestId('answer-option-1') // Rot
    fireEvent.click(wrongButton)
    expect(wrongButton.className).toContain('border-red-400')
  })

  it('no input type=text in the component (no free-text input)', () => {
    const { container } = render(
      <TextRiddleGame
        questionText="Q?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

      />,
    )
    expect(container.querySelector('input[type="text"]')).toBeNull()
    expect(container.querySelector('input')).toBeNull()
  })

  it('answer card min height is 60px', () => {
    render(
      <TextRiddleGame
        questionText="Q?"
        answerMode="multiple_choice"
        answerOptions={answerOptions}

      />,
    )
    const card = screen.getByTestId('answer-option-0')
    expect(card.style.minHeight).toBe('60px')
  })
})
