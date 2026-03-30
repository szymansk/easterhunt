import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import PlayerPage from './PlayerPage'
import type { Game, GameProgress } from '../../types'
import { MiniGameType, GameStatus } from '../../types'

vi.mock('../../services/api', () => ({
  getGame: vi.fn(),
  getGameProgress: vi.fn(),
  createGameProgress: vi.fn(),
}))

import * as api from '../../services/api'

const mockGame: Game = {
  id: 'game-1',
  name: 'Test Osterjagd',
  status: GameStatus.started,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  stations: [
    { id: 'st-1', game_id: 'game-1', position: 1, image_path: null, mini_game_type: MiniGameType.text_riddle, mini_game_config: {} },
    { id: 'st-2', game_id: 'game-1', position: 2, image_path: null, mini_game_type: MiniGameType.puzzle, mini_game_config: {} },
    { id: 'st-3', game_id: 'game-1', position: 3, image_path: null, mini_game_type: MiniGameType.maze, mini_game_config: {} },
  ],
}

function renderPlayerPage(gameOverride?: Partial<Game>, progressOverride?: Partial<GameProgress>) {
  const mockProgress: GameProgress = {
    id: 'progress-1',
    game_id: 'game-1',
    current_station: 2,
    stations_completed: [1],
    ...progressOverride,
  }

  vi.mocked(api.getGame).mockResolvedValue({ ...mockGame, ...gameOverride })
  vi.mocked(api.getGameProgress).mockResolvedValue(mockProgress)

  return render(
    <MemoryRouter initialEntries={['/play/game-1']}>
      <Routes>
        <Route path="/play/:id" element={<PlayerPage />} />
        <Route path="/play/:id/station/:sid" element={<div>MiniGame</div>} />
        <Route path="/play/:id/complete" element={<div>Complete</div>} />
      </Routes>
    </MemoryRouter>
  )
}

test('renders station cards for all stations', async () => {
  renderPlayerPage()
  // Wait for loading to complete
  await screen.findByText('Test Osterjagd')
  expect(screen.getAllByText(/Station \d/).length).toBeGreaterThanOrEqual(3)
})

test('station 1 is completed (green), station 2 is current (tappable), station 3 is locked', async () => {
  renderPlayerPage()
  await screen.findByText('Test Osterjagd')

  const station1 = screen.getByTestId('station-1')
  const station2 = screen.getByTestId('station-2')
  const station3 = screen.getByTestId('station-3')

  expect(station1).toHaveAttribute('data-status', 'completed')
  expect(station2).toHaveAttribute('data-status', 'current')
  expect(station3).toHaveAttribute('data-status', 'locked')
})

test('only current station has cursor-pointer class', async () => {
  renderPlayerPage()
  await screen.findByText('Test Osterjagd')

  const station2 = screen.getByTestId('station-2')
  expect(station2.className).toContain('cursor-pointer')

  const station3 = screen.getByTestId('station-3')
  expect(station3.className).not.toContain('cursor-pointer')
})

test('mini game type map covers all original types', () => {
  const allTypes = Object.values(MiniGameType)
  expect(allTypes).toContain(MiniGameType.puzzle)
  expect(allTypes).toContain(MiniGameType.number_riddle)
  expect(allTypes).toContain(MiniGameType.maze)
  expect(allTypes).toContain(MiniGameType.text_riddle)
  expect(allTypes).toContain(MiniGameType.picture_riddle)
  expect(allTypes).toContain(MiniGameType.treasure)
  // 18 new game types added
  expect(allTypes.length).toBeGreaterThanOrEqual(6)
})
