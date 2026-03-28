import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import GameCompletionScreen from './GameCompletionScreen'

vi.mock('../../services/api', () => ({
  createGameProgress: vi.fn().mockResolvedValue({}),
}))

function renderCompletionScreen() {
  return render(
    <MemoryRouter initialEntries={['/play/game-1/complete']}>
      <Routes>
        <Route path="/play/:id/complete" element={<GameCompletionScreen />} />
        <Route path="/play/:id" element={<div>Player Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

test('renders congratulation text', () => {
  renderCompletionScreen()
  expect(screen.getByText(/Geschafft/)).toBeInTheDocument()
})

test('renders Nochmal spielen button', () => {
  renderCompletionScreen()
  expect(screen.getByText(/Nochmal spielen/)).toBeInTheDocument()
})

test('renders Zum Start button', () => {
  renderCompletionScreen()
  expect(screen.getByText(/Zum Start/)).toBeInTheDocument()
})

test('Zum Start navigates to home', async () => {
  renderCompletionScreen()
  fireEvent.click(screen.getByText(/Zum Start/))
  await screen.findByText('Home Page')
})

test('renders on mobile 375px viewport', () => {
  Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
  renderCompletionScreen()
  expect(screen.getByText(/Geschafft/)).toBeInTheDocument()
})
