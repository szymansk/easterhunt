// Enums
export enum MiniGameType {
  puzzle = 'puzzle',
  number_riddle = 'number_riddle',
  maze = 'maze',
  text_riddle = 'text_riddle',
  picture_riddle = 'picture_riddle',
  treasure = 'treasure',
  memory = 'memory',
  sound_match = 'sound_match',
  color_sort = 'color_sort',
  spot_difference = 'spot_difference',
  shadow_match = 'shadow_match',
  balloon_pop = 'balloon_pop',
  catch_fish = 'catch_fish',
  whack_a_mole = 'whack_a_mole',
  build_object = 'build_object',
  sequence_sort = 'sequence_sort',
  decorate = 'decorate',
  hidden_object = 'hidden_object',
  comparison = 'comparison',
  rhythm = 'rhythm',
  cause_effect = 'cause_effect',
  avoid_obstacles = 'avoid_obstacles',
  role_play = 'role_play',
  logic_puzzle = 'logic_puzzle',
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
  task_type: 'count' | 'assign' | 'plus_minus'
  prompt_text: string
  prompt_image?: string | null
  correct_answer: number // 1-10
  distractor_answers: number[] // 2-4 values in [1-10], all != correct_answer
}

export interface MazeData {
  walls: boolean[][]
  start: { row: number; col: number }
  goal: { row: number; col: number }
  rows: number
  cols: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface MazeConfig {
  type: MiniGameType.maze
  maze_data: MazeData | Record<string, unknown>
}

export interface TextRiddleOption {
  text: string
  is_correct: boolean
}

export interface TextRiddleConfig {
  type: MiniGameType.text_riddle
  question_text: string
  answer_mode: 'multiple_choice' | 'single_tap'
  answer_options: TextRiddleOption[]
  tts_enabled: boolean
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

export interface TreasureConfig {
  type: MiniGameType.treasure
}

// New mini-game config types

export interface MemoryPair {
  id: string
  image_url: string
  label: string
}

export interface MemoryConfig {
  type: MiniGameType.memory
  pairs: MemoryPair[]
  grid_cols: 2 | 3 | 4
}

export interface SoundMatchItem {
  image_url: string
  label: string
}

export interface SoundMatchConfig {
  type: MiniGameType.sound_match
  sound_url: string
  correct_item: SoundMatchItem
  distractors: SoundMatchItem[]
}

export interface ColorSortBucket {
  id: string
  color: string
  label: string
  item_ids: string[]
}

export interface ColorSortItem {
  id: string
  color: string
  label: string
  emoji: string
}

export interface ColorSortConfig {
  type: MiniGameType.color_sort
  buckets: ColorSortBucket[]
  items: ColorSortItem[]
}

export interface SpotDiffTarget {
  id: string
  label: string
  x_pct: number
  y_pct: number
  radius_pct: number
}

export interface SpotDifferenceConfig {
  type: MiniGameType.spot_difference
  image_url: string
  prompt: string
  targets: SpotDiffTarget[]
}

export interface ShadowMatchOption {
  id: string
  image_url: string
  label: string
  is_correct: boolean
}

export interface ShadowMatchConfig {
  type: MiniGameType.shadow_match
  silhouette_image_url: string
  prompt: string
  options: ShadowMatchOption[]
}

export interface BalloonPopConfig {
  type: MiniGameType.balloon_pop
  prompt: string
  target_count: number
  balloon_emoji: string
  total_balloons: number
}

export interface CatchFishConfig {
  type: MiniGameType.catch_fish
  prompt: string
  target_count: number
  fish_emoji: string
  total_fish: number
  animation_speed: 'slow' | 'medium' | 'fast'
}

export interface WhackAMoleConfig {
  type: MiniGameType.whack_a_mole
  duration_s: number
  grid_size: 3 | 4 | 6
  appear_ms: number
  mole_emoji: string
  target_score: number
}

export interface BuildObjectPart {
  id: string
  image_url: string
  label: string
  slot_x_pct: number
  slot_y_pct: number
  width_pct: number
  height_pct: number
}

export interface BuildObjectConfig {
  type: MiniGameType.build_object
  background_image: string
  parts: BuildObjectPart[]
  prompt: string
}

export interface SequenceSortStep {
  id: string
  image_url: string
  label: string
  correct_order: number
}

export interface SequenceSortConfig {
  type: MiniGameType.sequence_sort
  steps: SequenceSortStep[]
  prompt: string
}

export interface DecorateSticker {
  id: string
  image_url: string
  label: string
}

export interface DecorateConfig {
  type: MiniGameType.decorate
  base_image: string
  prompt: string
  stickers: DecorateSticker[]
  colors: string[]
}

export interface HiddenObjectTarget {
  id: string
  label: string
  x_pct: number
  y_pct: number
  radius_pct: number
}

export interface HiddenObjectConfig {
  type: MiniGameType.hidden_object
  scene_image: string
  prompt: string
  targets: HiddenObjectTarget[]
}

export interface ComparisonItem {
  image_url: string
  label: string
  value: number
}

export interface ComparisonConfig {
  type: MiniGameType.comparison
  question: string
  left_item: ComparisonItem
  right_item: ComparisonItem
  correct_side: 'left' | 'right'
  comparison_type: 'size' | 'count'
}

export interface RhythmBeat {
  delay_ms: number
}

export interface RhythmConfig {
  type: MiniGameType.rhythm
  pattern: RhythmBeat[]
  prompt: string
  max_attempts: number
  tolerance_ms: number
}

export interface CauseEffectObject {
  id: string
  x_pct: number
  y_pct: number
  image_url: string
  label: string
  animation: 'bounce' | 'spin' | 'flash' | 'grow'
  sound: 'snap' | 'success' | null
}

export interface CauseEffectConfig {
  type: MiniGameType.cause_effect
  scene_image: string
  prompt: string
  objects: CauseEffectObject[]
  require_all_tapped: boolean
}

export interface AvoidObstaclesConfig {
  type: MiniGameType.avoid_obstacles
  obstacle_speed: 1 | 2 | 3
  lives: number
  target_distance: number
  character_emoji: string
  obstacle_emoji: string
}

export interface RolePlayStep {
  id: string
  object_image: string
  object_label: string
  action_label: string
  x_pct: number
  y_pct: number
  sound: 'snap' | 'success' | null
}

export interface RolePlayConfig {
  type: MiniGameType.role_play
  scene_image: string
  prompt: string
  steps: RolePlayStep[]
  ordered: boolean
}

export interface LogicElement {
  id: string
  type: 'switch' | 'button'
  x_pct: number
  y_pct: number
  image_off: string
  image_on: string
  label: string
}

export interface LogicPuzzleConfig {
  type: MiniGameType.logic_puzzle
  scene_image: string
  prompt: string
  elements: LogicElement[]
  solution: string[]
}

export type MiniGameConfig =
  | PuzzleConfig
  | NumberRiddleConfig
  | MazeConfig
  | TextRiddleConfig
  | PictureRiddleConfig
  | TreasureConfig
  | MemoryConfig
  | SoundMatchConfig
  | ColorSortConfig
  | SpotDifferenceConfig
  | ShadowMatchConfig
  | BalloonPopConfig
  | CatchFishConfig
  | WhackAMoleConfig
  | BuildObjectConfig
  | SequenceSortConfig
  | DecorateConfig
  | HiddenObjectConfig
  | ComparisonConfig
  | RhythmConfig
  | CauseEffectConfig
  | AvoidObstaclesConfig
  | RolePlayConfig
  | LogicPuzzleConfig

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
