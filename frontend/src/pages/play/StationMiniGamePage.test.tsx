/**
 * Tests for StationMiniGamePage — next station preview (easter-ha2)
 *
 * 1. NextStationPreview renders image and "Weiter" button when station is not last
 * 2. Not shown for last station — navigates to /complete instead
 */
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import StationMiniGamePage from './StationMiniGamePage'
import type { Station } from '../../types'
import { MiniGameType } from '../../types'

// Mock API
vi.mock('../../services/api', () => ({
  getStation: vi.fn(),
  listStations: vi.fn(),
  completeStation: vi.fn(),
}))

// Mock all mini games to a simple "Complete" button — avoids internal timers
vi.mock('../../minigames/TextRiddleGame', () => ({
  default: ({ onComplete }: { onComplete?: () => void }) => (
    <button data-testid="game-complete-btn" onClick={() => onComplete?.()}>
      Spiel abschließen
    </button>
  ),
}))
vi.mock('../../minigames/NumberRiddleGame', () => ({
  default: ({ onComplete }: { onComplete?: () => void }) => (
    <button data-testid="game-complete-btn" onClick={() => onComplete?.()}>
      Spiel abschließen
    </button>
  ),
}))
vi.mock('../../minigames/MazeGame', () => ({
  default: ({ onComplete }: { onComplete?: () => void }) => (
    <button data-testid="game-complete-btn" onClick={() => onComplete?.()}>
      Spiel abschließen
    </button>
  ),
}))
vi.mock('./PuzzleGameContainer', () => ({
  default: ({ onComplete }: { onComplete?: () => void }) => (
    <button data-testid="game-complete-btn" onClick={() => onComplete?.()}>
      Spiel abschließen
    </button>
  ),
}))

import * as api from '../../services/api'

function makeStation(overrides: Partial<Station> = {}): Station {
  return {
    id: 'st-1',
    game_id: 'game-1',
    position: 1,
    image_path: '/media/img1.jpg',
    mini_game_type: MiniGameType.text_riddle,
    mini_game_config: {
      type: 'text_riddle',
      question_text: 'Test?',
      answer_mode: 'multiple_choice',
      answer_options: [],
      tts_enabled: false,
    },
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/play/game-1/station/st-1']}>
      <Routes>
        <Route path="/play/:id/station/:sid" element={<StationMiniGamePage />} />
        <Route path="/play/:id" element={<div data-testid="station-list">Stationsliste</div>} />
        <Route path="/play/:id/complete" element={<div data-testid="complete-screen">Fertig</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ─── Unit tests: next-station detection logic ────────────────────────────────

describe('next station detection logic', () => {
  it('finds the next station by position', () => {
    const stations: Station[] = [
      makeStation({ id: 'st-1', position: 1 }),
      makeStation({ id: 'st-2', position: 2, image_path: '/media/img2.jpg' }),
      makeStation({ id: 'st-3', position: 3, image_path: '/media/img3.jpg' }),
    ]
    const current = stations[0]
    const sorted = [...stations].sort((a, b) => a.position - b.position)
    const next = sorted.find((s) => s.position > current.position)
    expect(next?.id).toBe('st-2')
    expect(next?.image_path).toBe('/media/img2.jpg')
  })

  it('returns undefined when current is the last station', () => {
    const stations: Station[] = [
      makeStation({ id: 'st-1', position: 1 }),
      makeStation({ id: 'st-2', position: 2 }),
    ]
    const current = stations[1]
    const sorted = [...stations].sort((a, b) => a.position - b.position)
    const next = sorted.find((s) => s.position > current.position)
    expect(next).toBeUndefined()
  })

  it('handles a single-station game (no next)', () => {
    const stations: Station[] = [makeStation({ id: 'st-1', position: 1 })]
    const sorted = [...stations].sort((a, b) => a.position - b.position)
    const next = sorted.find((s) => s.position > 1)
    expect(next).toBeUndefined()
  })
})

// ─── Integration tests: StationMiniGamePage renders preview ─────────────────

describe('StationMiniGamePage: next station preview', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(api.completeStation).mockResolvedValue({
      id: 'prog-1',
      game_id: 'game-1',
      current_station: 2,
      stations_completed: [1],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  async function completeGame(currentStation: Station, allStations: Station[]) {
    vi.mocked(api.getStation).mockResolvedValue(currentStation)
    vi.mocked(api.listStations).mockResolvedValue(allStations)

    renderPage()

    // Step 1: wait for initial API calls to resolve
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const completeBtn = screen.getByTestId('game-complete-btn')

    // Step 2: click the game-complete button → handleComplete starts
    await act(async () => {
      fireEvent.click(completeBtn)
    })

    // Step 3: let completeStation promise resolve (microtasks) and register the setTimeout
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    // Step 4: fire the 2500ms success-overlay timer
    act(() => {
      vi.advanceTimersByTime(2500)
    })
  }

  it('shows next-station preview image and Weiter button after completing a non-last station', async () => {
    const currentStation = makeStation({ id: 'st-1', position: 1 })
    const nextStation = makeStation({ id: 'st-2', position: 2, image_path: '/media/next.jpg' })

    await completeGame(currentStation, [currentStation, nextStation])

    // NextStationPreview should now be visible
    expect(screen.getByTestId('next-station-preview')).toBeTruthy()
    expect(screen.getByText('Such das hier:')).toBeTruthy()
    expect(screen.getByAltText('Nächste Station')).toHaveAttribute('src', '/media/next.jpg')
    expect(screen.getByTestId('next-station-weiter')).toBeTruthy()
  })

  it('does not show preview for last station — navigates to complete screen', async () => {
    const currentStation = makeStation({ id: 'st-1', position: 1 })

    await completeGame(currentStation, [currentStation])

    // Preview should NOT be shown
    expect(screen.queryByTestId('next-station-preview')).toBeNull()
    // Should have navigated to complete screen
    expect(screen.getByTestId('complete-screen')).toBeTruthy()
  })

  it('does not show preview when next station has no image', async () => {
    const currentStation = makeStation({ id: 'st-1', position: 1 })
    const nextStation = makeStation({ id: 'st-2', position: 2, image_path: null })

    await completeGame(currentStation, [currentStation, nextStation])

    // No preview (next station has no image), go to complete
    expect(screen.queryByTestId('next-station-preview')).toBeNull()
    expect(screen.getByTestId('complete-screen')).toBeTruthy()
  })
})
