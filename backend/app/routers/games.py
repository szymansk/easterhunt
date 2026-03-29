import uuid

from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.exceptions import GameNotFoundError
from app.models.game import Game, GameStatus
from app.schemas.game import (
    GameCreate,
    GameListItem,
    GameRead,
    GameReadWithStations,
    GameUpdate,
)

router = APIRouter(prefix="/api/games", tags=["games"])


def _get_game_or_404(game_id: str, db: Session) -> Game:
    game = db.query(Game).filter(Game.id == game_id).first()
    if game is None:
        raise GameNotFoundError(game_id)
    return game


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GameRead)
def create_game(body: GameCreate, db: Session = Depends(get_db)) -> GameRead:
    game = Game(
        id=str(uuid.uuid4()),
        name=body.name,
        status=GameStatus.draft,
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return GameRead.model_validate(game)


@router.get("", response_model=list[GameListItem])
def list_games(
    status: GameStatus | None = None, db: Session = Depends(get_db)
) -> list[GameListItem]:
    query = db.query(Game).order_by(Game.created_at.desc())
    if status is not None:
        query = query.filter(Game.status == status)
    games = query.all()
    return [
        GameListItem(
            id=g.id,
            name=g.name,
            status=g.status,
            station_count=len(g.stations),
            created_at=g.created_at,
        )
        for g in games
    ]


@router.get("/{game_id}", response_model=GameReadWithStations)
def get_game(game_id: str, db: Session = Depends(get_db)) -> GameReadWithStations:
    game = _get_game_or_404(game_id, db)
    return GameReadWithStations.model_validate(game)


@router.put("/{game_id}", response_model=GameRead)
def update_game(game_id: str, body: GameUpdate, db: Session = Depends(get_db)) -> GameRead:
    game = _get_game_or_404(game_id, db)
    if body.name is not None:
        game.name = body.name
    if body.status is not None:
        game.status = body.status
    db.commit()
    db.refresh(game)
    return GameRead.model_validate(game)


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(game_id: str, db: Session = Depends(get_db)) -> Response:
    game = _get_game_or_404(game_id, db)
    db.delete(game)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{game_id}/start", response_model=GameRead)
def start_game(game_id: str, db: Session = Depends(get_db)) -> GameRead:
    game = _get_game_or_404(game_id, db)

    stations = sorted(game.stations, key=lambda s: s.position)

    if not stations:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Cannot start game",
                "detail": "Game has no stations",
                "incomplete_stations": [],
            },
        )

    incomplete_positions = [s.position for s in stations if s.image_path is None]

    if incomplete_positions:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Cannot start game",
                "detail": "Some stations are incomplete",
                "incomplete_stations": incomplete_positions,
            },
        )

    game.status = GameStatus.started
    db.commit()
    db.refresh(game)
    return GameRead.model_validate(game)
