// Enums
export enum MiniGameType {
  puzzle = 'puzzle',
  number_riddle = 'number_riddle',
  maze = 'maze',
  text_riddle = 'text_riddle',
  picture_riddle = 'picture_riddle',
}

export enum GameStatus {
  draft = 'draft',
  started = 'started',
  finished = 'finished',
}

// Mini game config types (discriminated union)
export interface PuzzleConfig {
  type: MiniGameType.puzzle
  image_path: string
  pieces: number
}

export interface NumberRiddleConfig {
  type: MiniGameType.number_riddle
  question: string
  answer: number
  hint?: string
}

export interface MazeConfig {
  type: MiniGameType.maze
  width: number
  height: number
  seed?: number
}

export interface TextRiddleConfig {
  type: MiniGameType.text_riddle
  question: string
  answer: string
  hint?: string
}

export interface PictureRiddleConfig {
  type: MiniGameType.picture_riddle
  image_path: string
  question: string
  answer: string
}

export type MiniGameConfig =
  | PuzzleConfig
  | NumberRiddleConfig
  | MazeConfig
  | TextRiddleConfig
  | PictureRiddleConfig

// Domain types
export interface Station {
  id: number
  game_id: number
  position: number
  image_path: string | null
  mini_game_type: MiniGameType
  mini_game_config: MiniGameConfig
}

export interface Game {
  id: number
  name: string
  status: GameStatus
  stations: Station[]
  created_at: string
  updated_at: string
}

export interface GameListItem {
  id: number
  name: string
  status: GameStatus
  station_count: number
  created_at: string
  updated_at: string
}

export interface GameProgress {
  id: number
  game_id: number
  current_station: number
  stations_completed: number[]
}
