import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import PictureRiddleGame from './PictureRiddleGame'
import type { PictureRiddleAnswerOption, PictureRiddleReferenceItem } from '../types'

const refItems: PictureRiddleReferenceItem[] = [
  { image_url: '/media/toy1.svg', label: 'Spielzeug 1' },
  { image_url: '/media/toy2.svg', label: 'Spielzeug 2' },
]

const answerOptions: PictureRiddleAnswerOption[] = [
  { image_url: '/media/ball.svg', label: 'Ball', is_correct: true },
  { image_url: '/media/car.svg', label: 'Auto', is_correct: false },
  { image_url: '/media/doll.svg', label: 'Puppe', is_correct: false },
  { image_url: '/media/book.svg', label: 'Buch', is_correct: false },
]

describe('PictureRiddleGame', () => {
  it('renders prompt "Was gehört dazu?"', () => {
    render(
      <PictureRiddleGame
        referenceItems={refItems}
        answerOptions={answerOptions}
      />,
    )
    expect(screen.getByText('Was gehört dazu?')).toBeTruthy()
  })

  it('renders exactly 2 reference images', () => {
    render(
      <PictureRiddleGame
        referenceItems={refItems}
        answerOptions={answerOptions}
      />,
    )
    expect(screen.getByAltText('Spielzeug 1')).toBeTruthy()
    expect(screen.getByAltText('Spielzeug 2')).toBeTruthy()
  })

  it('renders exactly 4 answer options', () => {
    render(
      <PictureRiddleGame
        referenceItems={refItems}
        answerOptions={answerOptions}
      />,
    )
    expect(screen.getAllByTestId(/answer-option-/)).toHaveLength(4)
  })

  it('correct tap calls onComplete', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(
      <PictureRiddleGame
        referenceItems={refItems}
        answerOptions={answerOptions}
        onComplete={onComplete}
      />,
    )

    const correctButton = screen.getByTestId('answer-option-0') // Ball is correct
    fireEvent.click(correctButton)

    await act(async () => {
      vi.advanceTimersByTime(700)
    })
    expect(onComplete).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('wrong tap does not call onComplete', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(
      <PictureRiddleGame
        referenceItems={refItems}
        answerOptions={answerOptions}
        onComplete={onComplete}
      />,
    )

    const wrongButton = screen.getByTestId('answer-option-1') // Auto is wrong
    fireEvent.click(wrongButton)

    await act(async () => {
      vi.advanceTimersByTime(700)
    })
    expect(onComplete).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('wrong tap shows red feedback styling', () => {
    render(
      <PictureRiddleGame
        referenceItems={refItems}
        answerOptions={answerOptions}
      />,
    )

    const wrongButton = screen.getByTestId('answer-option-2') // Puppe is wrong
    fireEvent.click(wrongButton)
    expect(wrongButton.className).toContain('border-red-400')
  })

  it('correct tap shows green feedback styling', () => {
    vi.useFakeTimers()
    render(
      <PictureRiddleGame
        referenceItems={refItems}
        answerOptions={answerOptions}
      />,
    )

    const correctButton = screen.getByTestId('answer-option-0') // Ball is correct
    fireEvent.click(correctButton)
    expect(correctButton.className).toContain('border-green-400')
    vi.useRealTimers()
  })
})
