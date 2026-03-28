import type { Game, GameListItem, GameProgress, Station } from '../types'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
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
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) message = body.detail
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(res.status, message)
  }
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

export function getGame(id: number): Promise<Game> {
  return request<Game>(`/api/games/${id}`)
}

export function startGame(id: number): Promise<Game> {
  return request<Game>(`/api/games/${id}/start`, { method: 'POST' })
}

export function deleteGame(id: number): Promise<void> {
  return request<void>(`/api/games/${id}`, { method: 'DELETE' })
}

// Stations
export function listStations(gameId: number): Promise<Station[]> {
  return request<Station[]>(`/api/games/${gameId}/stations`)
}

export function createStation(
  gameId: number,
  data: Omit<Station, 'id' | 'game_id'>,
): Promise<Station> {
  return request<Station>(`/api/games/${gameId}/stations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateStation(
  gameId: number,
  stationId: number,
  data: Partial<Omit<Station, 'id' | 'game_id'>>,
): Promise<Station> {
  return request<Station>(`/api/games/${gameId}/stations/${stationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteStation(gameId: number, stationId: number): Promise<void> {
  return request<void>(`/api/games/${gameId}/stations/${stationId}`, { method: 'DELETE' })
}

// Game Progress
export function getGameProgress(gameId: number): Promise<GameProgress> {
  return request<GameProgress>(`/api/games/${gameId}/progress`)
}

export function updateGameProgress(
  gameId: number,
  data: Partial<Pick<GameProgress, 'current_station' | 'stations_completed'>>,
): Promise<GameProgress> {
  return request<GameProgress>(`/api/games/${gameId}/progress`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
