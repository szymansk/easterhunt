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


MiniGameConfig = Annotated[
    Union[
        PuzzleConfig,
        NumberRiddleConfig,
        MazeConfig,
        TextRiddleConfig,
        PictureRiddleConfig,
        TreasureConfig,
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
