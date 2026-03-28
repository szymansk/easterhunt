import { render, screen } from '@testing-library/react'
import ErrorMessage from './ErrorMessage'

test('renders error message text', () => {
  render(<ErrorMessage message="Etwas ist schiefgelaufen" />)
  expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument()
})

test('renders nothing when message is empty string', () => {
  const { container } = render(<ErrorMessage message="" />)
  expect(container.firstChild).toBeNull()
})

test('has alert role', () => {
  render(<ErrorMessage message="Fehler!" />)
  expect(screen.getByRole('alert')).toBeInTheDocument()
})
