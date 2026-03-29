import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.exceptions import GameNotFoundError, StationLimitExceededError
from app.models.game import Game, GameStatus, MiniGameType, Station
from app.schemas.game import StationCreate, StationRead, StationReorder, StationUpdate
from app.services.maze import DIFFICULTY_SIZES, MazeGenerationService

router = APIRouter(prefix="/api/games", tags=["stations"])

MAX_STATIONS = 20


def _get_game_or_404(game_id: str, db: Session) -> Game:
    game = db.query(Game).filter(Game.id == game_id).first()
    if game is None:
        raise GameNotFoundError(game_id)
    return game


def _get_station_or_404(game_id: str, station_id: str, db: Session) -> Station:
    station = (
        db.query(Station)
        .filter(Station.id == station_id, Station.game_id == game_id)
        .first()
    )
    if station is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station {station_id} not found in game {game_id}",
        )
    return station


def _renumber_stations(game_id: str, db: Session) -> None:
    """Renumber stations ensuring treasure is always last."""
    stations = (
        db.query(Station)
        .filter(Station.game_id == game_id)
        .order_by(Station.position)
        .all()
    )
    non_treasure = [s for s in stations if s.mini_game_type != MiniGameType.treasure]
    treasure = [s for s in stations if s.mini_game_type == MiniGameType.treasure]
    ordered = non_treasure + treasure
    for idx, station in enumerate(ordered, start=1):
        station.position = idx
    db.flush()


@router.post("/{game_id}/stations", status_code=status.HTTP_201_CREATED, response_model=StationRead)
def create_station(
    game_id: str, body: StationCreate, db: Session = Depends(get_db)
) -> StationRead:
    _get_game_or_404(game_id, db)

    count = db.query(Station).filter(Station.game_id == game_id).count()
    if count >= MAX_STATIONS:
        raise StationLimitExceededError(game_id)

    config_data = body.mini_game_config
    if hasattr(config_data, "model_dump"):
        config_dict = config_data.model_dump()
    else:
        config_dict = dict(config_data)

    # Find treasure station position to insert before it
    treasure_station = (
        db.query(Station)
        .filter(Station.game_id == game_id, Station.mini_game_type == MiniGameType.treasure)
        .first()
    )
    if treasure_station is not None:
        insert_position = treasure_station.position
    else:
        insert_position = body.position

    station = Station(
        id=str(uuid.uuid4()),
        game_id=game_id,
        position=insert_position,
        image_path=body.image_path,
        mini_game_type=body.mini_game_type,
        mini_game_config=config_dict,
    )
    db.add(station)
    db.flush()
    _renumber_stations(game_id, db)
    db.commit()
    db.refresh(station)
    return StationRead.model_validate(station)


@router.get("/{game_id}/stations", response_model=list[StationRead])
def list_stations(game_id: str, db: Session = Depends(get_db)) -> list[StationRead]:
    _get_game_or_404(game_id, db)
    stations = (
        db.query(Station)
        .filter(Station.game_id == game_id)
        .order_by(Station.position)
        .all()
    )
    return [StationRead.model_validate(s) for s in stations]


@router.put("/{game_id}/stations/reorder", response_model=list[StationRead])
def reorder_stations(
    game_id: str, body: StationReorder, db: Session = Depends(get_db)
) -> list[StationRead]:
    _get_game_or_404(game_id, db)

    # Assign positions from the request order, but keep treasure last
    non_treasure_ids = [
        sid for sid in body.station_ids
        if (
            db.query(Station)
            .filter(Station.id == sid, Station.game_id == game_id)
            .first()
        ) is not None
        and db.query(Station)
        .filter(Station.id == sid, Station.game_id == game_id)
        .first()
        .mini_game_type != MiniGameType.treasure
    ]
    treasure_stations = (
        db.query(Station)
        .filter(Station.game_id == game_id, Station.mini_game_type == MiniGameType.treasure)
        .all()
    )

    for idx, station_id in enumerate(non_treasure_ids, start=1):
        station = (
            db.query(Station)
            .filter(Station.id == station_id, Station.game_id == game_id)
            .first()
        )
        if station is not None:
            station.position = idx

    # Place treasure stations at the end
    offset = len(non_treasure_ids) + 1
    for idx, treasure in enumerate(treasure_stations, start=offset):
        treasure.position = idx

    db.commit()

    stations = (
        db.query(Station)
        .filter(Station.game_id == game_id)
        .order_by(Station.position)
        .all()
    )
    return [StationRead.model_validate(s) for s in stations]


@router.get("/{game_id}/stations/{station_id}/mini-game")
def get_mini_game(game_id: str, station_id: str, db: Session = Depends(get_db)) -> dict:
    """Return the mini_game_config for a station."""
    station = _get_station_or_404(game_id, station_id, db)
    return station.mini_game_config


@router.get("/{game_id}/stations/{station_id}", response_model=StationRead)
def get_station(game_id: str, station_id: str, db: Session = Depends(get_db)) -> StationRead:
    station = _get_station_or_404(game_id, station_id, db)
    return StationRead.model_validate(station)


@router.put("/{game_id}/stations/{station_id}", response_model=StationRead)
def update_station(
    game_id: str,
    station_id: str,
    body: StationUpdate,
    db: Session = Depends(get_db),
) -> StationRead:
    station = _get_station_or_404(game_id, station_id, db)

    if body.image_path is not None:
        station.image_path = body.image_path
    if body.mini_game_type is not None:
        station.mini_game_type = body.mini_game_type
    if body.mini_game_config is not None:
        config_data = body.mini_game_config
        if hasattr(config_data, "model_dump"):
            new_config_dict = config_data.model_dump()
        else:
            new_config_dict = dict(config_data)

        # Preserve generated puzzle tiles when grid_size is unchanged
        if (
            body.mini_game_type == MiniGameType.puzzle
            and station.mini_game_type == MiniGameType.puzzle
        ):
            old_cfg = station.mini_game_config or {}
            if old_cfg.get("grid_size") == new_config_dict.get("grid_size"):
                # grid_size unchanged: preserve generated tiles and layout metadata
                if "tiles" in old_cfg:
                    new_config_dict["tiles"] = old_cfg["tiles"]
                if "grid" in old_cfg:
                    new_config_dict["grid"] = old_cfg["grid"]
                if "tile_width" in old_cfg:
                    new_config_dict["tile_width"] = old_cfg["tile_width"]
                if "tile_height" in old_cfg:
                    new_config_dict["tile_height"] = old_cfg["tile_height"]
            # else: grid_size changed, generated tiles are invalid — discard them

        station.mini_game_config = new_config_dict

    db.commit()
    db.refresh(station)
    return StationRead.model_validate(station)


@router.delete("/{game_id}/stations/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_station(
    game_id: str, station_id: str, db: Session = Depends(get_db)
) -> Response:
    game = _get_game_or_404(game_id, db)
    station = _get_station_or_404(game_id, station_id, db)
    if station.mini_game_type == MiniGameType.treasure:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Die Schatz-Station kann nicht gelöscht werden.",
        )
    if game.status != GameStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stationen können nur in Entwurf-Spielen gelöscht werden.",
        )
    db.delete(station)
    db.flush()
    _renumber_stations(game_id, db)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


class MazeGenerateRequest(BaseModel):
    difficulty: str


@router.post("/{game_id}/stations/{station_id}/maze/generate")
def generate_maze(
    game_id: str,
    station_id: str,
    body: MazeGenerateRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Generate a maze for a station and persist it in mini_game_config.

    Returns the generated maze JSON (walls, start, goal, rows, cols, difficulty).
    Raises 422 if difficulty is invalid.
    """
    if body.difficulty not in DIFFICULTY_SIZES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid difficulty {body.difficulty!r}. Must be one of {sorted(DIFFICULTY_SIZES)}.",
        )

    station = _get_station_or_404(game_id, station_id, db)

    maze_data = MazeGenerationService().generate(body.difficulty)
    station.mini_game_config = {"type": "maze", "maze_data": maze_data}
    station.mini_game_type = MiniGameType.maze
    db.commit()
    db.refresh(station)

    return maze_data
