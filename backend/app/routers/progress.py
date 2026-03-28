import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.exceptions import GameNotFoundError
from app.models.game import Game, GameProgress, GameStatus, Station
from app.schemas.game import GameProgressRead

router = APIRouter(prefix="/api/games", tags=["progress"])


def _get_game_or_404(game_id: str, db: Session) -> Game:
    game = db.query(Game).filter(Game.id == game_id).first()
    if game is None:
        raise GameNotFoundError(game_id)
    return game


def _get_progress_or_404(game_id: str, db: Session) -> GameProgress:
    progress = (
        db.query(GameProgress).filter(GameProgress.game_id == game_id).first()
    )
    if progress is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No progress found for game {game_id}",
        )
    return progress


@router.post("/{game_id}/progress", status_code=status.HTTP_201_CREATED, response_model=GameProgressRead)
def create_progress(game_id: str, db: Session = Depends(get_db)) -> GameProgressRead:
    _get_game_or_404(game_id, db)

    progress = GameProgress(
        id=str(uuid.uuid4()),
        game_id=game_id,
        current_station=1,
        stations_completed=[],
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return GameProgressRead.model_validate(progress)


@router.get("/{game_id}/progress", response_model=GameProgressRead)
def get_progress(game_id: str, db: Session = Depends(get_db)) -> GameProgressRead:
    _get_game_or_404(game_id, db)
    progress = _get_progress_or_404(game_id, db)
    return GameProgressRead.model_validate(progress)


@router.put("/{game_id}/progress/complete-station", response_model=GameProgressRead)
def complete_station(game_id: str, db: Session = Depends(get_db)) -> GameProgressRead:
    game = _get_game_or_404(game_id, db)
    progress = _get_progress_or_404(game_id, db)

    current = progress.current_station

    # Validate station exists
    station = (
        db.query(Station)
        .filter(Station.game_id == game_id, Station.position == current)
        .first()
    )
    if station is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Station at position {current} does not exist in game {game_id}",
        )

    # Mark station as completed
    completed = list(progress.stations_completed)
    if current not in completed:
        completed.append(current)
    progress.stations_completed = completed

    # Determine total number of stations
    total_stations = db.query(Station).filter(Station.game_id == game_id).count()

    if current >= total_stations:
        # Last station completed — finish the game
        game.status = GameStatus.finished
        progress.current_station = current
    else:
        progress.current_station = current + 1

    db.commit()
    db.refresh(progress)
    return GameProgressRead.model_validate(progress)


@router.put("/{game_id}/progress/finish", response_model=GameProgressRead)
def finish_progress(game_id: str, db: Session = Depends(get_db)) -> GameProgressRead:
    game = _get_game_or_404(game_id, db)
    progress = _get_progress_or_404(game_id, db)

    game.status = GameStatus.finished
    db.commit()
    db.refresh(progress)
    return GameProgressRead.model_validate(progress)
