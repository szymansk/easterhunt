import enum
import uuid

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class GameStatus(str, enum.Enum):
    draft = "draft"
    started = "started"
    finished = "finished"


class MiniGameType(str, enum.Enum):
    puzzle = "puzzle"
    number_riddle = "number_riddle"
    maze = "maze"
    text_riddle = "text_riddle"
    picture_riddle = "picture_riddle"


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[GameStatus] = mapped_column(
        Enum(GameStatus), nullable=False, default=GameStatus.draft
    )
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    stations: Mapped[list["Station"]] = relationship(
        "Station", back_populates="game", cascade="all, delete-orphan"
    )
    progress: Mapped[list["GameProgress"]] = relationship(
        "GameProgress", back_populates="game"
    )


class Station(Base):
    __tablename__ = "stations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id: Mapped[str] = mapped_column(
        String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    image_path: Mapped[str | None] = mapped_column(String, nullable=True)
    mini_game_type: Mapped[MiniGameType] = mapped_column(Enum(MiniGameType), nullable=False)
    mini_game_config: Mapped[dict] = mapped_column(JSON, nullable=False)

    game: Mapped["Game"] = relationship("Game", back_populates="stations")
    riddle_items: Mapped[list["RiddleItem"]] = relationship(
        "RiddleItem", back_populates="station", cascade="all, delete-orphan"
    )
    riddle_tasks: Mapped[list["RiddleTask"]] = relationship(
        "RiddleTask", back_populates="station", cascade="all, delete-orphan"
    )


class GameProgress(Base):
    __tablename__ = "game_progress"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id: Mapped[str] = mapped_column(
        String, ForeignKey("games.id"), nullable=False
    )
    current_station: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    stations_completed: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    game: Mapped["Game"] = relationship("Game", back_populates="progress")


class RiddleItem(Base):
    __tablename__ = "riddle_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id: Mapped[str] = mapped_column(
        String, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    image_path: Mapped[str | None] = mapped_column(String, nullable=True)

    station: Mapped["Station"] = relationship("Station", back_populates="riddle_items")


class RiddleTask(Base):
    __tablename__ = "riddle_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id: Mapped[str] = mapped_column(
        String, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(String, nullable=False)
    answer: Mapped[str] = mapped_column(String, nullable=False)

    station: Mapped["Station"] = relationship("Station", back_populates="riddle_tasks")
