import { listGames, createGame, ApiError } from './api'
import type { GameListItem, Game } from '../types'
import { GameStatus } from '../types'

const mockGame: Game = {
  id: 'test-uuid-1',
  name: 'Ostersuche',
  status: GameStatus.draft,
  stations: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockGameListItem: GameListItem = {
  id: 'test-uuid-1',
  name: 'Ostersuche',
  status: GameStatus.draft,
  station_count: 0,
  created_at: '2026-01-01T00:00:00Z',
}

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('listGames calls GET /api/games', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockGameListItem]),
    } as Response)

    const result = await listGames()
    expect(fetch).toHaveBeenCalledWith('/api/games', expect.objectContaining({}))
    expect(result).toEqual([mockGameListItem])
  })

  test('createGame sends POST with name in body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGame),
    } as Response)

    const result = await createGame('Ostersuche')
    expect(fetch).toHaveBeenCalledWith(
      '/api/games',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ostersuche' }),
      }),
    )
    expect(result).toEqual(mockGame)
  })

  test('throws ApiError on non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ detail: 'Spiel nicht gefunden' }),
    } as Response)

    const err = await listGames().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(404)
    expect((err as ApiError).message).toBe('Spiel nicht gefunden')
  })
})
