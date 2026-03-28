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

// Mini game config types matching backend schemas
export interface PuzzleConfig {
  type: MiniGameType.puzzle
  /** Must be one of 3, 4, 6, 9 (maps to 1x3, 2x2, 2x3, 3x3) */
  grid_size: 3 | 4 | 6 | 9
}

export interface NumberRiddleConfig {
  type: MiniGameType.number_riddle
  question: string
  correct_answer: number // 1-10
}

export interface MazeConfig {
  type: MiniGameType.maze
  maze_data: {
    difficulty?: 'easy' | 'medium' | 'hard'
    rows?: number
    cols?: number
    [key: string]: unknown
  }
}

export interface TextRiddleConfig {
  type: MiniGameType.text_riddle
  question: string
  answer_mode: 'multiple_choice' | 'single_tap'
  options: string[]
}

export interface PictureRiddleReferenceItem {
  image_url: string
  label: string
  library_item_id?: string | null
}

export interface PictureRiddleAnswerOption {
  image_url: string
  label: string
  is_correct: boolean
  library_item_id?: string | null
}

export interface PictureRiddleConfig {
  type: MiniGameType.picture_riddle
  category: string
  reference_items: PictureRiddleReferenceItem[]
  answer_options: PictureRiddleAnswerOption[]
  question?: string | null
}

export type MiniGameConfig =
  | PuzzleConfig
  | NumberRiddleConfig
  | MazeConfig
  | TextRiddleConfig
  | PictureRiddleConfig

// Domain types (IDs are string UUIDs)
export interface Station {
  id: string
  game_id: string
  position: number
  image_path: string | null
  mini_game_type: MiniGameType
  mini_game_config: Record<string, unknown>
}

export interface Game {
  id: string
  name: string
  status: GameStatus
  stations: Station[]
  created_at: string
  updated_at: string
}

export interface GameListItem {
  id: string
  name: string
  status: GameStatus
  station_count: number
  created_at: string
}

export interface GameProgress {
  id: string
  game_id: string
  current_station: number
  stations_completed: number[]
}

// Start game error response
export interface StartGameError {
  error: string
  detail: string
  incomplete_stations: number[]
}

// Content Library types
export interface LibraryItem {
  id: string
  name: string
  category: string
  image_url: string | null
  metadata_json: Record<string, unknown>
}

export interface LibraryTask {
  id: string
  mini_game_type: MiniGameType
  category: string
  reference_items: LibraryItem[]
  correct_answer: LibraryItem | null
  answer_options: LibraryItem[]
  question: string | null
  options_json: string[] | null
}
