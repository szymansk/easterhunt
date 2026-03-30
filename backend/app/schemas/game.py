from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.game import GameStatus, MiniGameType

# Game schemas


class GameCreate(BaseModel):
    name: str


class GameRead(BaseModel):
    id: str
    name: str
    status: GameStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameUpdate(BaseModel):
    name: str | None = None
    status: GameStatus | None = None


class GameListItem(BaseModel):
    id: str
    name: str
    status: GameStatus
    station_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Mini-game config schemas


class PuzzleConfig(BaseModel):
    type: Literal["puzzle"]
    grid_size: int = Field(..., description="Must be one of 3, 4, 6, 9")

    def model_post_init(self, __context: object) -> None:
        if self.grid_size not in {3, 4, 6, 9}:
            raise ValueError("grid_size must be one of 3, 4, 6, 9")


class NumberRiddleConfig(BaseModel):
    type: Literal["number_riddle"]
    task_type: Literal["count", "assign", "plus_minus"]
    prompt_text: str
    prompt_image: str | None = None
    correct_answer: int = Field(..., ge=1, le=10)
    distractor_answers: list[int] = Field(..., min_length=2, max_length=4)

    @model_validator(mode="after")
    def validate_distractors(self) -> "NumberRiddleConfig":
        for d in self.distractor_answers:
            if d < 1 or d > 10:
                raise ValueError(f"distractor {d} must be in [1, 10]")
            if d == self.correct_answer:
                raise ValueError(f"distractor {d} must not equal correct_answer")
        return self


class MazeConfig(BaseModel):
    type: Literal["maze"]
    maze_data: dict


class TextRiddleOption(BaseModel):
    text: str
    is_correct: bool


class TextRiddleConfig(BaseModel):
    type: Literal["text_riddle"]
    question_text: str = Field(..., min_length=1)
    answer_mode: Literal["multiple_choice", "single_tap"]
    answer_options: list[TextRiddleOption] = Field(..., min_length=2, max_length=6)
    tts_enabled: bool = False

    @model_validator(mode="after")
    def validate_exactly_one_correct(self) -> "TextRiddleConfig":
        correct_count = sum(1 for opt in self.answer_options if opt.is_correct)
        if correct_count != 1:
            raise ValueError(
                f"TextRiddleConfig must have exactly 1 correct answer, got {correct_count}"
            )
        return self


class PictureRiddleReferenceItem(BaseModel):
    image_url: str
    label: str
    library_item_id: str | None = None


class PictureRiddleAnswerOption(BaseModel):
    image_url: str
    label: str
    is_correct: bool
    library_item_id: str | None = None


class PictureRiddleConfig(BaseModel):
    type: Literal["picture_riddle"]
    category: str
    reference_items: list[PictureRiddleReferenceItem] = Field(..., min_length=2, max_length=2)
    answer_options: list[PictureRiddleAnswerOption] = Field(..., min_length=4, max_length=4)
    question: str | None = None

    @model_validator(mode="after")
    def validate_exactly_one_correct(self) -> "PictureRiddleConfig":
        correct_count = sum(1 for opt in self.answer_options if opt.is_correct)
        if correct_count != 1:
            raise ValueError("Exactly one answer_option must be marked as correct")
        return self


class TreasureConfig(BaseModel):
    type: Literal["treasure"]


# New mini-game configs


class MemoryPair(BaseModel):
    id: str
    image_url: str
    label: str


class MemoryConfig(BaseModel):
    type: Literal["memory"]
    pairs: list[MemoryPair] = Field(..., min_length=4, max_length=12)
    grid_cols: int = Field(default=4)

    @model_validator(mode="after")
    def validate_pairs(self) -> "MemoryConfig":
        if len(self.pairs) % 2 != 0:
            raise ValueError("pairs count must be even")
        if self.grid_cols not in {2, 3, 4}:
            raise ValueError("grid_cols must be 2, 3, or 4")
        return self


class SoundMatchItem(BaseModel):
    image_url: str
    label: str


class SoundMatchConfig(BaseModel):
    type: Literal["sound_match"]
    sound_url: str
    correct_item: SoundMatchItem
    distractors: list[SoundMatchItem] = Field(..., min_length=2, max_length=3)


class ColorSortBucket(BaseModel):
    id: str
    color: str
    label: str
    item_ids: list[str]


class ColorSortItem(BaseModel):
    id: str
    color: str
    label: str
    emoji: str


class ColorSortConfig(BaseModel):
    type: Literal["color_sort"]
    buckets: list[ColorSortBucket] = Field(..., min_length=2, max_length=4)
    items: list[ColorSortItem] = Field(..., min_length=4, max_length=8)


class SpotDiffTarget(BaseModel):
    id: str
    label: str
    x_pct: float
    y_pct: float
    radius_pct: float = Field(..., ge=1, le=30)


class SpotDifferenceConfig(BaseModel):
    type: Literal["spot_difference"]
    image_url: str
    prompt: str
    targets: list[SpotDiffTarget] = Field(..., min_length=1, max_length=8)


class ShadowMatchOption(BaseModel):
    id: str
    image_url: str
    label: str
    is_correct: bool


class ShadowMatchConfig(BaseModel):
    type: Literal["shadow_match"]
    silhouette_image_url: str
    prompt: str
    options: list[ShadowMatchOption] = Field(..., min_length=2, max_length=4)

    @model_validator(mode="after")
    def validate_exactly_one_correct(self) -> "ShadowMatchConfig":
        correct_count = sum(1 for o in self.options if o.is_correct)
        if correct_count != 1:
            raise ValueError("Exactly one option must be correct")
        return self


class BalloonPopConfig(BaseModel):
    type: Literal["balloon_pop"]
    prompt: str
    target_count: int
    balloon_emoji: str
    total_balloons: int = Field(..., ge=3, le=12)

    @model_validator(mode="after")
    def validate_counts(self) -> "BalloonPopConfig":
        if self.target_count > self.total_balloons:
            raise ValueError("target_count must be <= total_balloons")
        return self


class CatchFishConfig(BaseModel):
    type: Literal["catch_fish"]
    prompt: str
    target_count: int
    fish_emoji: str
    total_fish: int
    animation_speed: Literal["slow", "medium", "fast"]

    @model_validator(mode="after")
    def validate_counts(self) -> "CatchFishConfig":
        if self.target_count > self.total_fish:
            raise ValueError("target_count must be <= total_fish")
        return self


class WhackAMoleConfig(BaseModel):
    type: Literal["whack_a_mole"]
    duration_s: int = Field(..., ge=10, le=60)
    grid_size: int
    appear_ms: int = Field(..., ge=400, le=2000)
    mole_emoji: str
    target_score: int = Field(..., ge=1)

    @model_validator(mode="after")
    def validate_grid_size(self) -> "WhackAMoleConfig":
        if self.grid_size not in {3, 4, 6}:
            raise ValueError("grid_size must be 3, 4, or 6")
        return self


class BuildObjectPart(BaseModel):
    id: str
    image_url: str
    label: str
    slot_x_pct: float
    slot_y_pct: float
    width_pct: float
    height_pct: float


class BuildObjectConfig(BaseModel):
    type: Literal["build_object"]
    background_image: str
    parts: list[BuildObjectPart] = Field(..., min_length=2, max_length=8)
    prompt: str


class SequenceSortStep(BaseModel):
    id: str
    image_url: str
    label: str
    correct_order: int


class SequenceSortConfig(BaseModel):
    type: Literal["sequence_sort"]
    steps: list[SequenceSortStep] = Field(..., min_length=3, max_length=5)
    prompt: str


class DecorateSticker(BaseModel):
    id: str
    image_url: str
    label: str


class DecorateConfig(BaseModel):
    type: Literal["decorate"]
    base_image: str
    prompt: str
    stickers: list[DecorateSticker] = Field(..., min_length=2, max_length=12)
    colors: list[str] = Field(..., min_length=2, max_length=8)


class HiddenObjectTarget(BaseModel):
    id: str
    label: str
    x_pct: float
    y_pct: float
    radius_pct: float


class HiddenObjectConfig(BaseModel):
    type: Literal["hidden_object"]
    scene_image: str
    prompt: str
    targets: list[HiddenObjectTarget] = Field(..., min_length=2, max_length=8)


class ComparisonItem(BaseModel):
    image_url: str
    label: str
    value: int


class ComparisonConfig(BaseModel):
    type: Literal["comparison"]
    question: str
    left_item: ComparisonItem
    right_item: ComparisonItem
    correct_side: Literal["left", "right"]
    comparison_type: Literal["size", "count"]


class RhythmBeat(BaseModel):
    delay_ms: int


class RhythmConfig(BaseModel):
    type: Literal["rhythm"]
    pattern: list[RhythmBeat] = Field(..., min_length=2, max_length=5)
    prompt: str
    max_attempts: int
    tolerance_ms: int = Field(default=250, ge=100, le=500)


class CauseEffectObject(BaseModel):
    id: str
    x_pct: float
    y_pct: float
    image_url: str
    label: str
    animation: Literal["bounce", "spin", "flash", "grow"]
    sound: Literal["snap", "success"] | None = None


class CauseEffectConfig(BaseModel):
    type: Literal["cause_effect"]
    scene_image: str
    prompt: str
    objects: list[CauseEffectObject] = Field(..., min_length=2, max_length=8)
    require_all_tapped: bool


class AvoidObstaclesConfig(BaseModel):
    type: Literal["avoid_obstacles"]
    obstacle_speed: int
    lives: int = Field(..., ge=1, le=3)
    target_distance: int = Field(..., ge=100, le=1000)
    character_emoji: str
    obstacle_emoji: str

    @model_validator(mode="after")
    def validate_speed(self) -> "AvoidObstaclesConfig":
        if self.obstacle_speed not in {1, 2, 3}:
            raise ValueError("obstacle_speed must be 1, 2, or 3")
        return self


class RolePlayStep(BaseModel):
    id: str
    object_image: str
    object_label: str
    action_label: str
    x_pct: float
    y_pct: float
    sound: Literal["snap", "success"] | None = None


class RolePlayConfig(BaseModel):
    type: Literal["role_play"]
    scene_image: str
    prompt: str
    steps: list[RolePlayStep] = Field(..., min_length=2, max_length=6)
    ordered: bool


class LogicElement(BaseModel):
    id: str
    type: Literal["switch", "button"]
    x_pct: float
    y_pct: float
    image_off: str
    image_on: str
    label: str


class LogicPuzzleConfig(BaseModel):
    type: Literal["logic_puzzle"]
    scene_image: str
    prompt: str
    elements: list[LogicElement] = Field(..., min_length=2, max_length=6)
    solution: list[str]

    @model_validator(mode="after")
    def validate_solution(self) -> "LogicPuzzleConfig":
        if len(self.solution) != len(self.elements):
            raise ValueError("solution length must equal elements length")
        return self


MiniGameConfig = Annotated[
    Union[
        PuzzleConfig,
        NumberRiddleConfig,
        MazeConfig,
        TextRiddleConfig,
        PictureRiddleConfig,
        TreasureConfig,
        MemoryConfig,
        SoundMatchConfig,
        ColorSortConfig,
        SpotDifferenceConfig,
        ShadowMatchConfig,
        BalloonPopConfig,
        CatchFishConfig,
        WhackAMoleConfig,
        BuildObjectConfig,
        SequenceSortConfig,
        DecorateConfig,
        HiddenObjectConfig,
        ComparisonConfig,
        RhythmConfig,
        CauseEffectConfig,
        AvoidObstaclesConfig,
        RolePlayConfig,
        LogicPuzzleConfig,
    ],
    Field(discriminator="type"),
]


# Station schemas


class StationCreate(BaseModel):
    position: int
    image_path: str | None = None
    mini_game_type: MiniGameType
    mini_game_config: MiniGameConfig


class StationRead(BaseModel):
    id: str
    game_id: str
    position: int
    image_path: str | None
    mini_game_type: MiniGameType
    mini_game_config: dict

    model_config = ConfigDict(from_attributes=True)


class StationUpdate(BaseModel):
    image_path: str | None = None
    mini_game_type: MiniGameType | None = None
    mini_game_config: MiniGameConfig | None = None


class StationReorder(BaseModel):
    station_ids: list[str]


# Game with stations


class GameReadWithStations(GameRead):
    stations: list[StationRead] = []


# Game progress schemas


class GameProgressCreate(BaseModel):
    game_id: str


class GameProgressRead(BaseModel):
    id: str
    game_id: str
    current_station: int
    stations_completed: list

    model_config = ConfigDict(from_attributes=True)


# Content Library schemas


class LibraryItemRead(BaseModel):
    id: str
    name: str
    category: str
    image_url: str | None
    metadata_json: dict

    model_config = ConfigDict(from_attributes=True)


class LibraryTaskRead(BaseModel):
    id: str
    mini_game_type: MiniGameType
    category: str
    reference_items: list["LibraryItemRead"]
    correct_answer: "LibraryItemRead | None"
    answer_options: list["LibraryItemRead"]
    question: str | None = None
    options_json: list | None = None

    model_config = ConfigDict(from_attributes=True)
