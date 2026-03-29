"""
Comprehensive pytest tests for the Easter Hunt backend API.

Covers:
- Model layer (ORM creation, cascade deletes, enum values)
- Schema layer (Pydantic validation, discriminated union)
- API integration (CRUD, game lifecycle, error handling)
"""

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base
from app.models.game import Game, GameProgress, GameStatus, MiniGameType, Station
from app.schemas.game import (
    MazeConfig,
    MiniGameConfig,
    NumberRiddleConfig,
    PictureRiddleConfig,
    PuzzleConfig,
    TextRiddleConfig,
    TextRiddleOption,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PUZZLE_CONFIG = {"type": "puzzle", "grid_size": 4}
NUMBER_RIDDLE_CONFIG = {
    "type": "number_riddle",
    "task_type": "plus_minus",
    "prompt_text": "2 + 3 = ?",
    "correct_answer": 5,
    "distractor_answers": [3, 7],
}
MAZE_CONFIG = {"type": "maze", "maze_data": {"rows": 5, "cols": 5}}
TEXT_RIDDLE_CONFIG = {
    "type": "text_riddle",
    "question_text": "Welche Farbe hat Gras?",
    "answer_mode": "multiple_choice",
    "answer_options": [
        {"text": "Rot", "is_correct": False},
        {"text": "Grün", "is_correct": True},
        {"text": "Blau", "is_correct": False},
    ],
}
PICTURE_RIDDLE_CONFIG = {
    "type": "picture_riddle",
    "category": "Spielzeug",
    "reference_items": [
        {"image_url": "/media/toy1.svg", "label": "Spielzeug 1"},
        {"image_url": "/media/toy2.svg", "label": "Spielzeug 2"},
    ],
    "answer_options": [
        {"image_url": "/media/ball.svg", "label": "Ball", "is_correct": True},
        {"image_url": "/media/car.svg", "label": "Auto", "is_correct": False},
        {"image_url": "/media/doll.svg", "label": "Puppe", "is_correct": False},
        {"image_url": "/media/book.svg", "label": "Buch", "is_correct": False},
    ],
}


def _station_body(position: int = 1, image_path: str | None = None) -> dict:
    """Return a minimal valid station creation payload."""
    body: dict = {
        "position": position,
        "mini_game_type": "puzzle",
        "mini_game_config": PUZZLE_CONFIG,
    }
    if image_path is not None:
        body["image_path"] = image_path
    return body


# ---------------------------------------------------------------------------
# Async HTTP client fixture
# ---------------------------------------------------------------------------

@pytest.fixture
async def client():
    """
    Function-scoped async HTTP client backed by a fresh in-memory SQLite DB.

    Creates all tables, overrides the `get_db` dependency, yields an
    AsyncClient, then cleans up the override and disposes the engine.
    """
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    test_engine.dispose()


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------

class TestModels:
    """Direct ORM / model-layer tests using the db_session fixture."""

    def test_create_game(self, db_session):
        game = Game(name="Spring Hunt", status=GameStatus.draft)
        db_session.add(game)
        db_session.commit()
        db_session.refresh(game)

        assert game.id is not None
        assert game.name == "Spring Hunt"
        assert game.status == GameStatus.draft
        assert game.created_at is not None

    def test_create_station(self, db_session):
        game = Game(name="Hunt", status=GameStatus.draft)
        db_session.add(game)
        db_session.commit()

        station = Station(
            game_id=game.id,
            position=1,
            mini_game_type=MiniGameType.puzzle,
            mini_game_config={"type": "puzzle", "grid_size": 4},
        )
        db_session.add(station)
        db_session.commit()
        db_session.refresh(station)

        assert station.id is not None
        assert station.game_id == game.id
        assert station.position == 1
        assert station.mini_game_type == MiniGameType.puzzle

    def test_create_game_progress(self, db_session):
        game = Game(name="Hunt", status=GameStatus.started)
        db_session.add(game)
        db_session.commit()

        progress = GameProgress(
            game_id=game.id,
            current_station=1,
            stations_completed=[],
        )
        db_session.add(progress)
        db_session.commit()
        db_session.refresh(progress)

        assert progress.id is not None
        assert progress.game_id == game.id
        assert progress.current_station == 1
        assert progress.stations_completed == []

    def test_cascade_delete_game_deletes_stations(self, db_session):
        game = Game(name="Hunt", status=GameStatus.draft)
        db_session.add(game)
        db_session.commit()

        for pos in range(1, 4):
            station = Station(
                game_id=game.id,
                position=pos,
                mini_game_type=MiniGameType.puzzle,
                mini_game_config={"type": "puzzle", "grid_size": 4},
            )
            db_session.add(station)
        db_session.commit()

        station_count_before = db_session.query(Station).filter(Station.game_id == game.id).count()
        assert station_count_before == 3

        db_session.delete(game)
        db_session.commit()

        station_count_after = db_session.query(Station).filter(Station.game_id == game.id).count()
        assert station_count_after == 0

    def test_game_status_enum_values(self):
        assert GameStatus.draft == "draft"
        assert GameStatus.started == "started"
        assert GameStatus.finished == "finished"
        assert set(GameStatus) == {GameStatus.draft, GameStatus.started, GameStatus.finished}

    def test_mini_game_type_enum_values(self):
        assert MiniGameType.puzzle == "puzzle"
        assert MiniGameType.number_riddle == "number_riddle"
        assert MiniGameType.maze == "maze"
        assert MiniGameType.text_riddle == "text_riddle"
        assert MiniGameType.picture_riddle == "picture_riddle"
        assert len(set(MiniGameType)) == 5


# ---------------------------------------------------------------------------
# Schema tests
# ---------------------------------------------------------------------------

class TestSchemas:
    """Pydantic schema validation tests."""

    # PuzzleConfig -----------------------------------------------------------

    @pytest.mark.parametrize("grid_size", [3, 4, 6, 9])
    def test_puzzle_config_valid_grid_sizes(self, grid_size):
        cfg = PuzzleConfig(type="puzzle", grid_size=grid_size)
        assert cfg.grid_size == grid_size

    @pytest.mark.parametrize("grid_size", [0, 1, 2, 5, 7, 8, 10, 16])
    def test_puzzle_config_invalid_grid_size_raises(self, grid_size):
        with pytest.raises(ValidationError):
            PuzzleConfig(type="puzzle", grid_size=grid_size)

    # NumberRiddleConfig -----------------------------------------------------

    @pytest.mark.parametrize("answer", [1, 5, 10])
    def test_number_riddle_config_valid_answer(self, answer):
        distractors = [d for d in [1, 3, 7, 9] if d != answer][:2]
        cfg = NumberRiddleConfig(
            type="number_riddle",
            task_type="count",
            prompt_text="Wie viele?",
            correct_answer=answer,
            distractor_answers=distractors,
        )
        assert cfg.correct_answer == answer

    @pytest.mark.parametrize("answer", [0, 11, -1, 100])
    def test_number_riddle_config_out_of_range_raises(self, answer):
        with pytest.raises(ValidationError):
            NumberRiddleConfig(
                type="number_riddle",
                task_type="count",
                prompt_text="Wie viele?",
                correct_answer=answer,
                distractor_answers=[3, 7],
            )

    # TextRiddleConfig -------------------------------------------------------

    def test_text_riddle_config_multiple_choice(self):
        opts = [
            TextRiddleOption(text="Rot", is_correct=False),
            TextRiddleOption(text="Grün", is_correct=True),
        ]
        cfg = TextRiddleConfig(
            type="text_riddle",
            question_text="Welche Farbe?",
            answer_mode="multiple_choice",
            answer_options=opts,
        )
        assert cfg.answer_mode == "multiple_choice"

    def test_text_riddle_config_single_tap(self):
        opts = [
            TextRiddleOption(text="Ja", is_correct=True),
            TextRiddleOption(text="Nein", is_correct=False),
        ]
        cfg = TextRiddleConfig(
            type="text_riddle",
            question_text="Stimmt das?",
            answer_mode="single_tap",
            answer_options=opts,
        )
        assert cfg.answer_mode == "single_tap"

    def test_text_riddle_config_invalid_answer_mode_raises(self):
        with pytest.raises(ValidationError):
            TextRiddleConfig(
                type="text_riddle",
                question_text="Q",
                answer_mode="free_text",  # invalid
                answer_options=[
                    {"text": "a", "is_correct": True},
                    {"text": "b", "is_correct": False},
                ],
            )

    def test_text_riddle_config_zero_correct_raises(self):
        with pytest.raises(ValidationError):
            TextRiddleConfig(
                type="text_riddle",
                question_text="Welche Farbe?",
                answer_mode="multiple_choice",
                answer_options=[
                    {"text": "Rot", "is_correct": False},
                    {"text": "Grün", "is_correct": False},
                ],
            )

    def test_text_riddle_config_two_correct_raises(self):
        with pytest.raises(ValidationError):
            TextRiddleConfig(
                type="text_riddle",
                question_text="Welche Farbe?",
                answer_mode="multiple_choice",
                answer_options=[
                    {"text": "Rot", "is_correct": True},
                    {"text": "Grün", "is_correct": True},
                ],
            )

    def test_text_riddle_config_too_few_options_raises(self):
        with pytest.raises(ValidationError):
            TextRiddleConfig(
                type="text_riddle",
                question_text="Welche Farbe?",
                answer_mode="multiple_choice",
                answer_options=[
                    {"text": "Rot", "is_correct": True},
                ],
            )

    def test_text_riddle_config_tts_enabled(self):
        cfg = TextRiddleConfig(
            type="text_riddle",
            question_text="Stimmt das?",
            answer_mode="multiple_choice",
            answer_options=[
                {"text": "Ja", "is_correct": True},
                {"text": "Nein", "is_correct": False},
            ],
            tts_enabled=True,
        )
        assert cfg.tts_enabled is True

    # MiniGameConfig discriminated union -------------------------------------

    def test_mini_game_config_discriminator_puzzle(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(MiniGameConfig)
        cfg = ta.validate_python({"type": "puzzle", "grid_size": 4})
        assert isinstance(cfg, PuzzleConfig)

    def test_mini_game_config_discriminator_number_riddle(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(MiniGameConfig)
        cfg = ta.validate_python(
            {
                "type": "number_riddle",
                "task_type": "count",
                "prompt_text": "Wie viele?",
                "correct_answer": 3,
                "distractor_answers": [1, 5],
            }
        )
        assert isinstance(cfg, NumberRiddleConfig)

    def test_mini_game_config_discriminator_maze(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(MiniGameConfig)
        cfg = ta.validate_python({"type": "maze", "maze_data": {}})
        assert isinstance(cfg, MazeConfig)

    def test_mini_game_config_discriminator_text_riddle(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(MiniGameConfig)
        cfg = ta.validate_python(
            {
                "type": "text_riddle",
                "question_text": "Stimmt das?",
                "answer_mode": "single_tap",
                "answer_options": [
                    {"text": "Ja", "is_correct": True},
                    {"text": "Nein", "is_correct": False},
                ],
            }
        )
        assert isinstance(cfg, TextRiddleConfig)

    def test_mini_game_config_discriminator_picture_riddle(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(MiniGameConfig)
        cfg = ta.validate_python({
            "type": "picture_riddle",
            "category": "Spielzeug",
            "reference_items": [
                {"image_url": "/media/a.svg", "label": "A"},
                {"image_url": "/media/b.svg", "label": "B"},
            ],
            "answer_options": [
                {"image_url": "/media/c.svg", "label": "C", "is_correct": True},
                {"image_url": "/media/d.svg", "label": "D", "is_correct": False},
                {"image_url": "/media/e.svg", "label": "E", "is_correct": False},
                {"image_url": "/media/f.svg", "label": "F", "is_correct": False},
            ],
        })
        assert isinstance(cfg, PictureRiddleConfig)

    def test_mini_game_config_unknown_type_raises(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(MiniGameConfig)
        with pytest.raises(ValidationError):
            ta.validate_python({"type": "unknown_type"})


# ---------------------------------------------------------------------------
# API Integration tests: Games
# ---------------------------------------------------------------------------

class TestGameCRUD:
    """CRUD operations on the /api/games endpoints."""

    async def test_create_game(self, client):
        response = await client.post("/api/games", json={"name": "Easter 2025"})
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == "Easter 2025"
        assert data["status"] == "draft"
        assert "created_at" in data

    async def test_list_games(self, client):
        await client.post("/api/games", json={"name": "Hunt One"})
        await client.post("/api/games", json={"name": "Hunt Two"})

        response = await client.get("/api/games")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

    async def test_list_games_empty(self, client):
        response = await client.get("/api/games")
        assert response.status_code == 200
        assert response.json() == []

    async def test_get_game_with_stations(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        response = await client.get(f"/api/games/{game_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == game_id
        assert data["stations"] == []

    async def test_get_game_not_found(self, client):
        response = await client.get("/api/games/nonexistent-id")
        assert response.status_code == 404

    async def test_update_game_name(self, client):
        create_resp = await client.post("/api/games", json={"name": "Old Name"})
        game_id = create_resp.json()["id"]

        response = await client.put(f"/api/games/{game_id}", json={"name": "New Name"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["id"] == game_id

    async def test_update_game_not_found(self, client):
        response = await client.put("/api/games/nonexistent-id", json={"name": "X"})
        assert response.status_code == 404

    async def test_delete_game(self, client):
        create_resp = await client.post("/api/games", json={"name": "To Delete"})
        game_id = create_resp.json()["id"]

        del_resp = await client.delete(f"/api/games/{game_id}")
        assert del_resp.status_code == 204

        get_resp = await client.get(f"/api/games/{game_id}")
        assert get_resp.status_code == 404

    async def test_delete_game_not_found(self, client):
        response = await client.delete("/api/games/nonexistent-id")
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# API Integration tests: Game start lifecycle
# ---------------------------------------------------------------------------

class TestGameStart:
    """Tests for POST /api/games/{id}/start."""

    async def test_start_game_no_stations(self, client):
        create_resp = await client.post("/api/games", json={"name": "Empty Game"})
        game_id = create_resp.json()["id"]

        response = await client.post(f"/api/games/{game_id}/start")
        assert response.status_code == 422
        data = response.json()
        assert "incomplete_stations" in data

    async def test_start_game_incomplete_station_no_image(self, client):
        create_resp = await client.post("/api/games", json={"name": "Incomplete"})
        game_id = create_resp.json()["id"]

        # Station without image_path
        await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=1, image_path=None),
        )

        response = await client.post(f"/api/games/{game_id}/start")
        assert response.status_code == 422
        data = response.json()
        assert "incomplete_stations" in data
        assert 1 in data["incomplete_stations"]

    async def test_start_game_success(self, client):
        create_resp = await client.post("/api/games", json={"name": "Ready Game"})
        game_id = create_resp.json()["id"]

        await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=1, image_path="/images/clue1.jpg"),
        )

        response = await client.post(f"/api/games/{game_id}/start")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "started"

    async def test_start_game_not_found(self, client):
        response = await client.post("/api/games/nonexistent-id/start")
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# API Integration tests: Stations
# ---------------------------------------------------------------------------

class TestStationCRUD:
    """CRUD operations on the /api/games/{id}/stations endpoints."""

    async def test_create_station(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        response = await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=1, image_path="/img/clue.jpg"),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["game_id"] == game_id
        assert data["position"] == 1
        assert data["mini_game_type"] == "puzzle"
        assert data["mini_game_config"]["grid_size"] == 4

    async def test_create_station_for_nonexistent_game(self, client):
        response = await client.post(
            "/api/games/nonexistent-id/stations",
            json=_station_body(position=1),
        )
        assert response.status_code == 404

    async def test_create_station_all_mini_game_types(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        configs = [
            ("puzzle", PUZZLE_CONFIG),
            ("number_riddle", NUMBER_RIDDLE_CONFIG),
            ("maze", MAZE_CONFIG),
            ("text_riddle", TEXT_RIDDLE_CONFIG),
            ("picture_riddle", PICTURE_RIDDLE_CONFIG),
        ]
        for pos, (game_type, config) in enumerate(configs, start=1):
            resp = await client.post(
                f"/api/games/{game_id}/stations",
                json={
                    "position": pos,
                    "mini_game_type": game_type,
                    "mini_game_config": config,
                },
            )
            assert resp.status_code == 201, f"Failed for type {game_type}: {resp.text}"
            assert resp.json()["mini_game_type"] == game_type

    async def test_create_station_max_limit(self, client):
        create_resp = await client.post("/api/games", json={"name": "Full Game"})
        game_id = create_resp.json()["id"]

        for pos in range(1, 21):  # Create exactly 20 stations
            resp = await client.post(
                f"/api/games/{game_id}/stations",
                json=_station_body(position=pos),
            )
            assert resp.status_code == 201

        # 21st station must be rejected
        response = await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=21),
        )
        assert response.status_code == 422

    async def test_list_stations_sorted_by_position(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        # Create out of order
        for pos in [3, 1, 2]:
            await client.post(
                f"/api/games/{game_id}/stations",
                json=_station_body(position=pos),
            )

        response = await client.get(f"/api/games/{game_id}/stations")
        assert response.status_code == 200
        positions = [s["position"] for s in response.json()]
        assert positions == sorted(positions)

    async def test_get_station(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        station_resp = await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=1),
        )
        station_id = station_resp.json()["id"]

        response = await client.get(f"/api/games/{game_id}/stations/{station_id}")
        assert response.status_code == 200
        assert response.json()["id"] == station_id

    async def test_get_station_not_found(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        response = await client.get(f"/api/games/{game_id}/stations/nonexistent-station")
        assert response.status_code == 404

    async def test_update_station_image_path(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        station_resp = await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=1),
        )
        station_id = station_resp.json()["id"]

        response = await client.put(
            f"/api/games/{game_id}/stations/{station_id}",
            json={"image_path": "/images/new-clue.jpg"},
        )
        assert response.status_code == 200
        assert response.json()["image_path"] == "/images/new-clue.jpg"

    async def test_update_station_not_found(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/games/{game_id}/stations/nonexistent-station",
            json={"image_path": "/x.jpg"},
        )
        assert response.status_code == 404

    async def test_delete_station_renumbers(self, client):
        """After deleting the middle station, remaining stations are renumbered 1, 2."""
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        station_ids = []
        for pos in range(1, 4):
            resp = await client.post(
                f"/api/games/{game_id}/stations",
                json=_station_body(position=pos),
            )
            station_ids.append(resp.json()["id"])

        # Delete middle station (position 2)
        del_resp = await client.delete(f"/api/games/{game_id}/stations/{station_ids[1]}")
        assert del_resp.status_code == 204

        list_resp = await client.get(f"/api/games/{game_id}/stations")
        assert list_resp.status_code == 200
        remaining = list_resp.json()
        assert len(remaining) == 2
        assert [s["position"] for s in remaining] == [1, 2]

    async def test_delete_station_not_found(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/games/{game_id}/stations/nonexistent-station"
        )
        assert response.status_code == 404

    async def test_reorder_stations(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        station_ids = []
        for pos in range(1, 4):
            resp = await client.post(
                f"/api/games/{game_id}/stations",
                json=_station_body(position=pos),
            )
            station_ids.append(resp.json()["id"])

        # Reverse the order
        reversed_ids = list(reversed(station_ids))
        response = await client.put(
            f"/api/games/{game_id}/stations/reorder",
            json={"station_ids": reversed_ids},
        )
        assert response.status_code == 200
        result = response.json()
        assert len(result) == 3
        # After reorder the station that was last should now be at position 1
        assert result[0]["id"] == reversed_ids[0]

    async def test_game_with_stations_shows_in_get_game(self, client):
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=1),
        )

        response = await client.get(f"/api/games/{game_id}")
        assert response.status_code == 200
        assert len(response.json()["stations"]) == 1


# ---------------------------------------------------------------------------
# API Integration tests: GameProgress
# ---------------------------------------------------------------------------

class TestGameProgress:
    """Tests for the /api/games/{id}/progress endpoints."""

    async def _create_started_game_with_stations(self, client, num_stations: int = 2):
        """Helper: create a game with N stations that have image_paths, then start it."""
        create_resp = await client.post("/api/games", json={"name": "Progress Test"})
        game_id = create_resp.json()["id"]

        for pos in range(1, num_stations + 1):
            await client.post(
                f"/api/games/{game_id}/stations",
                json=_station_body(position=pos, image_path=f"/img/{pos}.jpg"),
            )

        await client.post(f"/api/games/{game_id}/start")
        return game_id

    async def test_create_progress(self, client):
        game_id = await self._create_started_game_with_stations(client)

        response = await client.post(f"/api/games/{game_id}/progress")
        assert response.status_code == 201
        data = response.json()
        assert data["game_id"] == game_id
        assert data["current_station"] == 1
        assert data["stations_completed"] == []

    async def test_create_progress_for_nonexistent_game(self, client):
        response = await client.post("/api/games/nonexistent-id/progress")
        assert response.status_code == 404

    async def test_get_progress(self, client):
        game_id = await self._create_started_game_with_stations(client)
        await client.post(f"/api/games/{game_id}/progress")

        response = await client.get(f"/api/games/{game_id}/progress")
        assert response.status_code == 200
        data = response.json()
        assert data["game_id"] == game_id
        assert data["current_station"] == 1

    async def test_get_progress_not_found(self, client):
        """GET /progress for a game with no progress record returns 404."""
        create_resp = await client.post("/api/games", json={"name": "No Progress"})
        game_id = create_resp.json()["id"]

        response = await client.get(f"/api/games/{game_id}/progress")
        assert response.status_code == 404

    async def test_complete_station_advances_current_station(self, client):
        game_id = await self._create_started_game_with_stations(client, num_stations=3)
        await client.post(f"/api/games/{game_id}/progress")

        response = await client.put(f"/api/games/{game_id}/progress/complete-station")
        assert response.status_code == 200
        data = response.json()
        assert data["current_station"] == 2
        assert 1 in data["stations_completed"]

    async def test_complete_station_invalid_no_progress(self, client):
        """Completing a station when there is no progress record returns 404."""
        game_id = await self._create_started_game_with_stations(client)

        response = await client.put(f"/api/games/{game_id}/progress/complete-station")
        assert response.status_code == 404

    async def test_complete_last_station_finishes_game(self, client):
        """Completing the final station should set game status to finished."""
        game_id = await self._create_started_game_with_stations(client, num_stations=2)
        await client.post(f"/api/games/{game_id}/progress")

        # Complete station 1
        resp = await client.put(f"/api/games/{game_id}/progress/complete-station")
        assert resp.status_code == 200
        assert resp.json()["current_station"] == 2

        # Complete station 2 (last)
        resp = await client.put(f"/api/games/{game_id}/progress/complete-station")
        assert resp.status_code == 200
        progress_data = resp.json()
        assert 2 in progress_data["stations_completed"]

        # Game should now be finished
        game_resp = await client.get(f"/api/games/{game_id}")
        assert game_resp.status_code == 200
        assert game_resp.json()["status"] == "finished"

    async def test_complete_all_stations_sequentially(self, client):
        """Walk through all 3 stations and verify completed list grows each time."""
        game_id = await self._create_started_game_with_stations(client, num_stations=3)
        await client.post(f"/api/games/{game_id}/progress")

        for expected_current in [2, 3]:
            resp = await client.put(f"/api/games/{game_id}/progress/complete-station")
            assert resp.status_code == 200
            assert resp.json()["current_station"] == expected_current

        # Complete last station
        resp = await client.put(f"/api/games/{game_id}/progress/complete-station")
        assert resp.status_code == 200
        assert set(resp.json()["stations_completed"]) == {1, 2, 3}

    async def test_finish_progress_endpoint(self, client):
        game_id = await self._create_started_game_with_stations(client)
        await client.post(f"/api/games/{game_id}/progress")

        response = await client.put(f"/api/games/{game_id}/progress/finish")
        assert response.status_code == 200

        game_resp = await client.get(f"/api/games/{game_id}")
        assert game_resp.json()["status"] == "finished"


# ---------------------------------------------------------------------------
# API Integration tests: Error handling
# ---------------------------------------------------------------------------

class TestErrorHandling:
    """Tests focused on global error handler and edge-case HTTP responses."""

    async def test_health_endpoint(self, client):
        response = await client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    async def test_game_not_found_returns_404_json(self, client):
        response = await client.get("/api/games/does-not-exist")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data

    async def test_station_limit_returns_422_json(self, client):
        create_resp = await client.post("/api/games", json={"name": "Full"})
        game_id = create_resp.json()["id"]

        for pos in range(1, 21):
            await client.post(
                f"/api/games/{game_id}/stations",
                json=_station_body(position=pos),
            )

        response = await client.post(
            f"/api/games/{game_id}/stations",
            json=_station_body(position=21),
        )
        assert response.status_code == 422
        data = response.json()
        assert "error" in data

    async def test_invalid_json_body_returns_422(self, client):
        response = await client.post(
            "/api/games",
            content=b"not valid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422

    async def test_unhandled_exception_returns_500_without_traceback(self, client):
        """
        The global exception handler returns 500 with error/detail and no Python traceback.
        Verified by calling the handler function directly.
        """
        import json
        from unittest.mock import MagicMock

        from fastapi import Request

        from app.main import unhandled_exception_handler

        fake_request = MagicMock(spec=Request)
        fake_request.method = "GET"
        fake_request.url = "http://test/api/games"
        exc = RuntimeError("simulated crash")

        response = await unhandled_exception_handler(fake_request, exc)

        assert response.status_code == 500
        body = json.loads(response.body)
        assert "error" in body
        assert "Traceback" not in response.body.decode()
        assert "traceback" not in response.body.decode()

    async def test_create_station_invalid_puzzle_config_rejected(self, client):
        """A puzzle config with a disallowed grid_size is rejected at schema level."""
        create_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = create_resp.json()["id"]

        response = await client.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": 1,
                "mini_game_type": "puzzle",
                "mini_game_config": {"type": "puzzle", "grid_size": 5},  # invalid
            },
        )
        assert response.status_code == 422

    async def test_create_game_missing_name_returns_422(self, client):
        response = await client.post("/api/games", json={})
        assert response.status_code == 422
