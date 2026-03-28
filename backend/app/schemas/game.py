from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

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
    correct_answer: int = Field(..., ge=1, le=10)
    question: str


class MazeConfig(BaseModel):
    type: Literal["maze"]
    maze_data: dict


class TextRiddleConfig(BaseModel):
    type: Literal["text_riddle"]
    question: str
    answer_mode: Literal["multiple_choice", "single_tap"]
    options: list[str]


class PictureRiddleConfig(BaseModel):
    type: Literal["picture_riddle"]
    question: str


MiniGameConfig = Annotated[
    Union[
        PuzzleConfig,
        NumberRiddleConfig,
        MazeConfig,
        TextRiddleConfig,
        PictureRiddleConfig,
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
