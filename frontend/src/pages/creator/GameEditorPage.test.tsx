/**
 * Tests for GameEditorPage covering:
 *   - easter-oz2 ACs: treasure station has no drag handle, no delete button
 *   - easter-z3k ACs: delete button in draft game, confirmation modal, API call
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Game } from '../../types'
import { MiniGameType, GameStatus } from '../../types'

vi.mock('../../services/api', () => ({
  getGame: vi.fn(),
  createStation: vi.fn(),
  deleteStation: vi.fn(),
  reorderStations: vi.fn(),
  startGame: vi.fn(),
  updateGame: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'game-1' }),
  }
})

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
  closestCenter: () => null,
  useSensor: () => ({}),
  useSensors: () => [],
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: (arr: unknown[]) => arr,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: () => ({}),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

import * as api from '../../services/api'
import GameEditorPage from './GameEditorPage'

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    name: 'Test Spiel',
    status: GameStatus.draft,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    stations: [
      {
        id: 'st-puzzle',
        game_id: 'game-1',
        position: 1,
        image_path: '/img/1.jpg',
        mini_game_type: MiniGameType.puzzle,
        mini_game_config: { type: 'puzzle', grid_size: 4 },
      },
      {
        id: 'st-treasure',
        game_id: 'game-1',
        position: 2,
        image_path: null,
        mini_game_type: MiniGameType.treasure,
        mini_game_config: { type: 'treasure' },
      },
    ],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/creator/game/game-1']}>
      <GameEditorPage />
    </MemoryRouter>,
  )
}

describe('GameEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // easter-oz2 AC7: treasure station badge visible, no drag handle
  it('treasure station shows 🎁 Schatz label and has no drag handle', async () => {
    vi.mocked(api.getGame).mockResolvedValue(makeGame())
    renderPage()
    await screen.findByText('Test Spiel')

    expect(screen.getByText('🎁 Schatz')).toBeInTheDocument()
    expect(screen.queryByTestId('drag-handle-st-treasure')).not.toBeInTheDocument()
    expect(screen.getByTestId('drag-handle-st-puzzle')).toBeInTheDocument()
  })

  // easter-oz2 AC7: treasure station has no delete button
  it('treasure station has no delete button', async () => {
    vi.mocked(api.getGame).mockResolvedValue(makeGame())
    renderPage()
    await screen.findByText('Test Spiel')

    expect(screen.queryByTestId('delete-btn-st-treasure')).not.toBeInTheDocument()
  })

  // easter-z3k AC1: delete button visible for non-treasure station in draft game
  it('shows delete button for non-treasure station in draft game', async () => {
    vi.mocked(api.getGame).mockResolvedValue(makeGame())
    renderPage()
    await screen.findByText('Test Spiel')

    expect(screen.getByTestId('delete-btn-st-puzzle')).toBeInTheDocument()
  })

  // easter-z3k AC5: no delete button in started game
  it('does not show delete button in started game', async () => {
    vi.mocked(api.getGame).mockResolvedValue(makeGame({ status: GameStatus.started }))
    renderPage()
    await screen.findByText('Test Spiel')

    expect(screen.queryByTestId('delete-btn-st-puzzle')).not.toBeInTheDocument()
  })

  // easter-z3k AC2+6: confirmation dialog appears on delete click
  it('shows confirmation dialog when delete button is clicked', async () => {
    vi.mocked(api.getGame).mockResolvedValue(makeGame())
    renderPage()
    await screen.findByText('Test Spiel')

    fireEvent.click(screen.getByTestId('delete-btn-st-puzzle'))
    expect(screen.getByText(/wirklich löschen/i)).toBeInTheDocument()
  })

  // easter-z3k AC3: confirm calls deleteStation
  it('calls deleteStation when confirmation is confirmed', async () => {
    vi.mocked(api.getGame).mockResolvedValue(makeGame())
    vi.mocked(api.deleteStation).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Test Spiel')

    fireEvent.click(screen.getByTestId('delete-btn-st-puzzle'))
    await screen.findByText(/wirklich löschen/i)

    // The confirm button in the modal
    const deleteBtns = screen.getAllByRole('button', { name: /löschen/i })
    // Last button with 'löschen' text is the confirm button in the modal
    fireEvent.click(deleteBtns[deleteBtns.length - 1])

    await waitFor(() => {
      expect(api.deleteStation).toHaveBeenCalledWith('game-1', 'st-puzzle')
    })
  })

  // easter-z3k AC4: cancel closes dialog without API call
  it('does not call deleteStation when cancel is clicked', async () => {
    vi.mocked(api.getGame).mockResolvedValue(makeGame())
    renderPage()
    await screen.findByText('Test Spiel')

    fireEvent.click(screen.getByTestId('delete-btn-st-puzzle'))
    await screen.findByText(/wirklich löschen/i)

    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }))

    expect(api.deleteStation).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByText(/wirklich löschen/i)).not.toBeInTheDocument()
    })
  })
})
