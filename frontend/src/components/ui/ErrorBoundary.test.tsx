import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>OK</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress expected error output in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('OK')).toBeTruthy()
  })

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/Ups, da ist etwas schiefgelaufen/i)).toBeTruthy()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Benutzerdefinierter Fehler</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Benutzerdefinierter Fehler')).toBeTruthy()
  })

  it('retry button is rendered and clickable without crash', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/Ups/i)).toBeTruthy()

    const retryBtn = screen.getByRole('button', { name: /erneut versuchen/i })
    // After click the boundary resets; the child throws again and boundary catches it again
    expect(() => fireEvent.click(retryBtn)).not.toThrow()
    // Boundary should still show fallback (child still throws)
    expect(screen.getByText(/Ups/i)).toBeTruthy()
  })
})
