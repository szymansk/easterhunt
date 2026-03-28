import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base

PUZZLE_CONFIG = {"type": "puzzle", "grid_size": 4}
NUMBER_CONFIG = {"type": "number_riddle", "correct_answer": 5, "question": "2+3?"}


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


async def _create_game(client) -> str:
    resp = await client.post("/api/games", json={"name": "Test"})
    return resp.json()["id"]


async def test_create_station(client):
    async with client as c:
        game_id = await _create_game(c)
        resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
    assert resp.status_code == 201
    data = resp.json()
    assert data["position"] == 1
    assert data["mini_game_type"] == "puzzle"
    assert data["game_id"] == game_id


async def test_create_station_game_not_found(client):
    async with client as c:
        resp = await c.post(
            "/api/games/nonexistent/stations",
            json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
    assert resp.status_code == 404


async def test_create_station_max_limit(client):
    async with client as c:
        game_id = await _create_game(c)
        for i in range(20):
            await c.post(
                f"/api/games/{game_id}/stations",
                json={
                    "position": i + 1,
                    "mini_game_type": "number_riddle",
                    "mini_game_config": NUMBER_CONFIG,
                },
            )
        resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": 21,
                "mini_game_type": "number_riddle",
                "mini_game_config": NUMBER_CONFIG,
            },
        )
    assert resp.status_code == 422


async def test_list_stations_sorted(client):
    async with client as c:
        game_id = await _create_game(c)
        await c.post(
            f"/api/games/{game_id}/stations",
            json={"position": 2, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
        await c.post(
            f"/api/games/{game_id}/stations",
            json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
        resp = await c.get(f"/api/games/{game_id}/stations")
    assert resp.status_code == 200
    positions = [s["position"] for s in resp.json()]
    assert positions == sorted(positions)


async def test_get_station(client):
    async with client as c:
        game_id = await _create_game(c)
        create_resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
        station_id = create_resp.json()["id"]
        resp = await c.get(f"/api/games/{game_id}/stations/{station_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == station_id


async def test_get_station_not_found(client):
    async with client as c:
        game_id = await _create_game(c)
        resp = await c.get(f"/api/games/{game_id}/stations/nonexistent")
    assert resp.status_code == 404


async def test_update_station(client):
    async with client as c:
        game_id = await _create_game(c)
        create_resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
        station_id = create_resp.json()["id"]
        resp = await c.put(
            f"/api/games/{game_id}/stations/{station_id}",
            json={
                "mini_game_type": "number_riddle",
                "mini_game_config": NUMBER_CONFIG,
            },
        )
    assert resp.status_code == 200
    assert resp.json()["mini_game_type"] == "number_riddle"


async def test_delete_station_renumbers(client):
    async with client as c:
        game_id = await _create_game(c)
        s1 = (
            await c.post(
                f"/api/games/{game_id}/stations",
                json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
            )
        ).json()["id"]
        await c.post(
            f"/api/games/{game_id}/stations",
            json={"position": 2, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
        await c.post(
            f"/api/games/{game_id}/stations",
            json={"position": 3, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
        )
        del_resp = await c.delete(f"/api/games/{game_id}/stations/{s1}")
        list_resp = await c.get(f"/api/games/{game_id}/stations")
    assert del_resp.status_code == 204
    positions = [s["position"] for s in list_resp.json()]
    assert positions == [1, 2]


async def test_reorder_stations(client):
    async with client as c:
        game_id = await _create_game(c)
        s1 = (
            await c.post(
                f"/api/games/{game_id}/stations",
                json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
            )
        ).json()["id"]
        s2 = (
            await c.post(
                f"/api/games/{game_id}/stations",
                json={"position": 2, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
            )
        ).json()["id"]
        resp = await c.put(
            f"/api/games/{game_id}/stations/reorder",
            json={"station_ids": [s2, s1]},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["id"] == s2
    assert data[0]["position"] == 1
    assert data[1]["id"] == s1
    assert data[1]["position"] == 2
