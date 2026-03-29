import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import PuzzleConfigForm from './PuzzleConfigForm'
import { MiniGameType } from '../../types'
import type { PuzzleConfig } from '../../types'

vi.mock('../../services/api', () => ({
  generatePuzzleTiles: vi.fn(),
  getPuzzleTiles: vi.fn(),
}))

import * as api from '../../services/api'

const defaultConfig: PuzzleConfig = { type: MiniGameType.puzzle, grid_size: 4 }

function renderForm(overrides = {}) {
  return render(
    <PuzzleConfigForm
      value={defaultConfig}
      onChange={vi.fn()}
      gameId="game-1"
      stationId="sta-1"
      generateStationId="sta-2"
      {...overrides}
    />,
  )
}

describe('PuzzleConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt Tiles nach erfolgreicher Generierung', async () => {
    vi.mocked(api.generatePuzzleTiles).mockResolvedValue({
      tiles: [
        { url: '/media/t0.jpg', index: 0, row: 0, col: 0 },
        { url: '/media/t1.jpg', index: 1, row: 0, col: 1 },
        { url: '/media/t2.jpg', index: 2, row: 1, col: 0 },
        { url: '/media/t3.jpg', index: 3, row: 1, col: 1 },
      ],
      grid: { rows: 2, cols: 2 },
    })

    renderForm()

    const generateBtn = screen.getByText('🧩 Puzzle generieren')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images.length).toBe(4)
    })
  })

  it('zeigt Fehlermeldung wenn Generierung fehlschlägt', async () => {
    const err = new Error('Kein Stationsbild vorhanden')
    vi.mocked(api.generatePuzzleTiles).mockRejectedValue(err)

    renderForm()

    const generateBtn = screen.getByText('🧩 Puzzle generieren')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText('Kein Stationsbild vorhanden')).toBeInTheDocument()
    })
  })
})
