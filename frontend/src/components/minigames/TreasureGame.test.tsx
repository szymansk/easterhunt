import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TreasureGame from './TreasureGame'

test('renders treasure image when imageUrl is provided', () => {
  render(<TreasureGame imageUrl="/media/schatz.jpg" onComplete={vi.fn()} />)
  const img = screen.getByAltText('Schatz')
  expect(img).toBeInTheDocument()
  expect(img).toHaveAttribute('src', '/media/schatz.jpg')
})

test('renders gift emoji fallback when imageUrl is null', () => {
  render(<TreasureGame imageUrl={null} onComplete={vi.fn()} />)
  // The large emoji is rendered as text
  const emojis = screen.getAllByText('🎁')
  expect(emojis.length).toBeGreaterThanOrEqual(1)
})

test('renders the complete button', () => {
  render(<TreasureGame imageUrl={null} onComplete={vi.fn()} />)
  expect(screen.getByTestId('treasure-complete-btn')).toBeInTheDocument()
})

test('calls onComplete when button is clicked', () => {
  const onComplete = vi.fn()
  render(<TreasureGame imageUrl={null} onComplete={onComplete} />)
  fireEvent.click(screen.getByTestId('treasure-complete-btn'))
  expect(onComplete).toHaveBeenCalledOnce()
})
