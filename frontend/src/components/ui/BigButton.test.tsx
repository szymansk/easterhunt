import { render, screen, fireEvent } from '@testing-library/react'
import BigButton from './BigButton'

test('renders label text', () => {
  render(<BigButton>Spiel erstellen</BigButton>)
  expect(screen.getByText('Spiel erstellen')).toBeInTheDocument()
})

test('calls onClick when clicked', () => {
  const onClick = vi.fn()
  render(<BigButton onClick={onClick}>Klick mich</BigButton>)
  fireEvent.click(screen.getByText('Klick mich'))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('is disabled when disabled prop is true', () => {
  render(<BigButton disabled>Gesperrt</BigButton>)
  expect(screen.getByText('Gesperrt')).toBeDisabled()
})

test('has minimum touch target size', () => {
  render(<BigButton>Touch Target</BigButton>)
  const btn = screen.getByText('Touch Target')
  expect(btn.style.minHeight).toBe('60px')
  expect(btn.style.minWidth).toBe('120px')
})
