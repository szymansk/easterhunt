import type { Game, GameListItem, GameProgress, Station } from '../types'

export interface TileInfo {
  url: string
  index: number
  row: number
  col: number
}

export interface PuzzleApiResponse {
  tiles: TileInfo[]
  grid: { rows: number; cols: number }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    let message = res.statusText
    let body: unknown
    try {
      body = await res.json()
      const b = body as { detail?: string }
      if (b.detail) message = b.detail
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(res.status, message, body)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

// Games
export function listGames(): Promise<GameListItem[]> {
  return request<GameListItem[]>('/api/games')
}

export function createGame(name: string): Promise<Game> {
  return request<Game>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function getGame(id: string): Promise<Game> {
  return request<Game>(`/api/games/${id}`)
}

export function updateGame(id: string, data: { name?: string }): Promise<Game> {
  return request<Game>(`/api/games/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function startGame(id: string): Promise<Game> {
  return request<Game>(`/api/games/${id}/start`, { method: 'POST' })
}

export function deleteGame(id: string): Promise<void> {
  return request<void>(`/api/games/${id}`, { method: 'DELETE' })
}

// Stations
export function listStations(gameId: string): Promise<Station[]> {
  return request<Station[]>(`/api/games/${gameId}/stations`)
}

export function getStation(gameId: string, stationId: string): Promise<Station> {
  return request<Station>(`/api/games/${gameId}/stations/${stationId}`)
}

export function createStation(
  gameId: string,
  data: Omit<Station, 'id' | 'game_id'>,
): Promise<Station> {
  return request<Station>(`/api/games/${gameId}/stations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateStation(
  gameId: string,
  stationId: string,
  data: Partial<Omit<Station, 'id' | 'game_id'>>,
): Promise<Station> {
  return request<Station>(`/api/games/${gameId}/stations/${stationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function reorderStations(gameId: string, stationIds: string[]): Promise<Station[]> {
  return request<Station[]>(`/api/games/${gameId}/stations/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ station_ids: stationIds }),
  })
}

export function deleteStation(gameId: string, stationId: string): Promise<void> {
  return request<void>(`/api/games/${gameId}/stations/${stationId}`, { method: 'DELETE' })
}

// Puzzle tile generation
export function generatePuzzleTiles(
  gameId: string,
  stationId: string,
  gridSize: number,
): Promise<PuzzleApiResponse> {
  return request<PuzzleApiResponse>(
    `/api/games/${gameId}/stations/${stationId}/puzzle/generate?grid_size=${gridSize}`,
    { method: 'POST' },
  )
}

export function getPuzzleTiles(
  gameId: string,
  stationId: string,
): Promise<PuzzleApiResponse> {
  return request<PuzzleApiResponse>(`/api/games/${gameId}/stations/${stationId}/puzzle`)
}

// Game Progress
export function getGameProgress(gameId: string): Promise<GameProgress> {
  return request<GameProgress>(`/api/games/${gameId}/progress`)
}

export function updateGameProgress(
  gameId: string,
  data: Partial<Pick<GameProgress, 'current_station' | 'stations_completed'>>,
): Promise<GameProgress> {
  return request<GameProgress>(`/api/games/${gameId}/progress`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
