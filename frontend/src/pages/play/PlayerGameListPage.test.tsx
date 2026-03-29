import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../../services/api', () => ({
  listGames: vi.fn(),
}))

import * as api from '../../services/api'
import PlayerGameListPage from './PlayerGameListPage'
import { GameStatus } from '../../types'
import type { GameListItem } from '../../types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <PlayerGameListPage />
    </MemoryRouter>,
  )
}

describe('PlayerGameListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt gestartete Spiele als Karten', async () => {
    const games: GameListItem[] = [
      { id: '1', name: 'Ostersuche', status: GameStatus.started, station_count: 3, created_at: '2026-01-01T00:00:00Z' },
    ]
    vi.mocked(api.listGames).mockResolvedValue(games)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Ostersuche')).toBeInTheDocument()
    })
    expect(api.listGames).toHaveBeenCalledWith('started')
  })

  it('zeigt Leer-Meldung wenn keine Spiele vorhanden', async () => {
    vi.mocked(api.listGames).mockResolvedValue([])

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Noch kein Spiel gestartet/)).toBeInTheDocument()
    })
  })

  it('navigiert zu /play/:id bei Klick auf Spielkarte', async () => {
    const games: GameListItem[] = [
      { id: 'abc', name: 'Osterjagd', status: GameStatus.started, station_count: 2, created_at: '2026-01-01T00:00:00Z' },
    ]
    vi.mocked(api.listGames).mockResolvedValue(games)

    renderPage()

    const card = await screen.findByTestId('game-card-abc')
    fireEvent.click(card)

    expect(mockNavigate).toHaveBeenCalledWith('/play/abc')
  })
})
