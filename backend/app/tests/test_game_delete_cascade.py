"""Tests for easter-1bm (cascade delete) and easter-sgs (restart via POST /progress)."""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base
from app.models.game import Game, GameProgress, GameStatus


@pytest.fixture
def engine():
    e = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(e)
    yield e
    e.dispose()


@pytest.fixture
def db(engine):
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    yield
    app.dependency_overrides.clear()


async def _create_started_game(client_fixture) -> str:
    """Helper: create a game, add a station with image, start it, create progress."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        game = (await ac.post("/api/games", json={"name": "Test"})).json()
        gid = game["id"]

        # Add puzzle station (treasure station is auto-created)
        st = (await ac.post(
            f"/api/games/{gid}/stations",
            json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": {"type": "puzzle", "grid_size": 4}},
        )).json()
        sid = st["id"]

        # Give it a fake image path so the game can start
        from app.models.game import Station
        station_obj = (
            client_fixture.query(Station).filter(Station.id == sid).first()
        )
        station_obj.image_path = "/media/fake.jpg"
        client_fixture.commit()

        # Start game
        await ac.post(f"/api/games/{gid}/start")
        # Create progress
        await ac.post(f"/api/games/{gid}/progress")
        return gid


# ── easter-1bm: DELETE cascade ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_draft_game(client, db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        game = (await ac.post("/api/games", json={"name": "Draft"})).json()
        gid = game["id"]

        resp = await ac.delete(f"/api/games/{gid}")
        assert resp.status_code == 204

        get_resp = await ac.get(f"/api/games/{gid}")
        assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_started_game_with_progress(client, db):
    gid = await _create_started_game(db)

    # Verify progress exists
    assert db.query(GameProgress).filter(GameProgress.game_id == gid).count() == 1

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(f"/api/games/{gid}")
        assert resp.status_code == 204

    # Progress must be gone (cascade)
    assert db.query(GameProgress).filter(GameProgress.game_id == gid).count() == 0


@pytest.mark.asyncio
async def test_delete_finished_game(client, db):
    gid = await _create_started_game(db)

    # Force finished status
    game_obj = db.query(Game).filter(Game.id == gid).first()
    game_obj.status = GameStatus.finished
    db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(f"/api/games/{gid}")
        assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_game(client, db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete("/api/games/does-not-exist")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_progress_is_idempotent(client, db):
    gid = await _create_started_game(db)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Second POST /progress should not create a duplicate
        resp2 = await ac.post(f"/api/games/{gid}/progress")
        assert resp2.status_code == 201

    count = db.query(GameProgress).filter(GameProgress.game_id == gid).count()
    assert count == 1, f"Expected 1 progress record, got {count}"


# ── easter-sgs: Restart (POST /progress resets finished game) ─────────────────

@pytest.mark.asyncio
async def test_create_progress_on_finished_game_resets_status(client, db):
    gid = await _create_started_game(db)

    # Force finished + completed stations
    game_obj = db.query(Game).filter(Game.id == gid).first()
    game_obj.status = GameStatus.finished
    progress_obj = db.query(GameProgress).filter(GameProgress.game_id == gid).first()
    progress_obj.stations_completed = [1, 2]
    db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(f"/api/games/{gid}/progress")
        assert resp.status_code == 201
        data = resp.json()
        assert data["stations_completed"] == []
        assert data["current_station"] == 1

    db.refresh(game_obj)
    assert game_obj.status == GameStatus.started


@pytest.mark.asyncio
async def test_create_progress_on_started_game_resets_progress(client, db):
    gid = await _create_started_game(db)

    # Advance progress
    progress_obj = db.query(GameProgress).filter(GameProgress.game_id == gid).first()
    progress_obj.stations_completed = [1]
    progress_obj.current_station = 2
    db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(f"/api/games/{gid}/progress")
        assert resp.status_code == 201
        data = resp.json()
        assert data["stations_completed"] == []
        assert data["current_station"] == 1

    # Still only 1 record
    assert db.query(GameProgress).filter(GameProgress.game_id == gid).count() == 1


@pytest.mark.asyncio
async def test_create_progress_on_new_game(client, db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        game = (await ac.post("/api/games", json={"name": "New"})).json()
        gid = game["id"]

        resp = await ac.post(f"/api/games/{gid}/progress")
        assert resp.status_code == 201
        data = resp.json()
        assert data["stations_completed"] == []
        assert data["current_station"] == 1

    assert db.query(GameProgress).filter(GameProgress.game_id == gid).count() == 1


@pytest.mark.asyncio
async def test_after_restart_current_station_is_1(client, db):
    gid = await _create_started_game(db)

    game_obj = db.query(Game).filter(Game.id == gid).first()
    game_obj.status = GameStatus.finished
    db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post(f"/api/games/{gid}/progress")
        get_resp = await ac.get(f"/api/games/{gid}/progress")
        assert get_resp.status_code == 200
        assert get_resp.json()["current_station"] == 1
