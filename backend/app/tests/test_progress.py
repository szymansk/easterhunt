import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base

PUZZLE_CONFIG = {"type": "puzzle", "grid_size": 4}


@pytest.fixture
def override_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def _get_test_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def client(override_db):
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _setup_game_with_stations(c, n_stations=3):
    game_resp = await c.post("/api/games", json={"name": "Progress Game"})
    game_id = game_resp.json()["id"]
    for i in range(n_stations):
        await c.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": i + 1,
                "image_path": f"/img/s{i+1}.jpg",
                "mini_game_type": "puzzle",
                "mini_game_config": PUZZLE_CONFIG,
            },
        )
    return game_id


async def test_create_progress(client):
    async with client as c:
        game_id = await _setup_game_with_stations(c)
        resp = await c.post(f"/api/games/{game_id}/progress")
    assert resp.status_code == 201
    data = resp.json()
    assert data["game_id"] == game_id
    assert data["current_station"] == 1
    assert data["stations_completed"] == []


async def test_create_progress_game_not_found(client):
    async with client as c:
        resp = await c.post("/api/games/nonexistent/progress")
    assert resp.status_code == 404


async def test_get_progress(client):
    async with client as c:
        game_id = await _setup_game_with_stations(c)
        await c.post(f"/api/games/{game_id}/progress")
        resp = await c.get(f"/api/games/{game_id}/progress")
    assert resp.status_code == 200
    assert resp.json()["current_station"] == 1


async def test_get_progress_not_found(client):
    async with client as c:
        game_id = await _setup_game_with_stations(c)
        resp = await c.get(f"/api/games/{game_id}/progress")
    assert resp.status_code == 404


async def test_complete_station_advances(client):
    async with client as c:
        game_id = await _setup_game_with_stations(c, n_stations=3)
        await c.post(f"/api/games/{game_id}/progress")
        resp = await c.put(f"/api/games/{game_id}/progress/complete-station")
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_station"] == 2
    assert 1 in data["stations_completed"]


async def test_complete_last_station_finishes_game(client):
    # n_stations=2 creates 2 puzzle + 1 auto-treasure = 3 total; completing all 3 finishes the game
    async with client as c:
        game_id = await _setup_game_with_stations(c, n_stations=2)
        await c.post(f"/api/games/{game_id}/progress")
        await c.put(f"/api/games/{game_id}/progress/complete-station")
        await c.put(f"/api/games/{game_id}/progress/complete-station")
        resp = await c.put(f"/api/games/{game_id}/progress/complete-station")
        game_resp = await c.get(f"/api/games/{game_id}")
    assert resp.status_code == 200
    assert game_resp.json()["status"] == "finished"


async def test_full_playthrough(client):
    # n_stations=2 creates 2 puzzle + 1 auto-treasure = 3 total
    async with client as c:
        game_id = await _setup_game_with_stations(c, n_stations=2)
        await c.post(f"/api/games/{game_id}/progress")
        for _ in range(3):
            resp = await c.put(f"/api/games/{game_id}/progress/complete-station")
            assert resp.status_code == 200
        game_resp = await c.get(f"/api/games/{game_id}")
    assert game_resp.json()["status"] == "finished"


async def test_progress_persists(client):
    async with client as c:
        game_id = await _setup_game_with_stations(c, n_stations=3)
        await c.post(f"/api/games/{game_id}/progress")
        await c.put(f"/api/games/{game_id}/progress/complete-station")
        resp = await c.get(f"/api/games/{game_id}/progress")
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_station"] == 2
    assert 1 in data["stations_completed"]
