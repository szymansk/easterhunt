"""Tests for Maze Generation API endpoints."""
from collections import deque

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base

MAZE_CONFIG = {"type": "maze", "maze_data": {}}


@pytest.fixture
async def client():
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
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
    test_engine.dispose()


async def _create_game(client: AsyncClient) -> str:
    resp = await client.post("/api/games", json={"name": "Test"})
    return resp.json()["id"]


async def _create_maze_station(client: AsyncClient, game_id: str) -> str:
    resp = await client.post(
        f"/api/games/{game_id}/stations",
        json={"position": 1, "mini_game_type": "maze", "mini_game_config": MAZE_CONFIG},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def bfs_solvable(walls: list[list[bool]]) -> bool:
    height = len(walls)
    width = len(walls[0])
    start = (1, 1)
    goal = (height - 2, width - 2)
    visited = {start}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        if (r, c) == goal:
            return True
        for dr, dc in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            nr, nc = r + dr, c + dc
            if (
                0 <= nr < height
                and 0 <= nc < width
                and not walls[nr][nc]
                and (nr, nc) not in visited
            ):
                visited.add((nr, nc))
                queue.append((nr, nc))
    return False


async def test_generate_easy_returns_200(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "easy"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["difficulty"] == "easy"
    assert data["rows"] == 5
    assert data["cols"] == 5


async def test_generate_medium_returns_6x6(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "medium"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["rows"] == 6
    assert data["cols"] == 6
    assert len(data["walls"]) == 13


async def test_generate_hard_returns_8x8(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "hard"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["rows"] == 8
    assert data["cols"] == 8
    assert len(data["walls"]) == 17


async def test_generate_invalid_difficulty_returns_422(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "extreme"},
    )
    assert resp.status_code == 422


async def test_generate_persists_maze_in_mini_game_config(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "easy"},
    )
    resp = await client.get(f"/api/games/{game_id}/stations/{station_id}/mini-game")
    assert resp.status_code == 200
    config = resp.json()
    assert config["type"] == "maze"
    assert "maze_data" in config
    assert config["maze_data"]["difficulty"] == "easy"


async def test_generate_maze_is_solvable(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "hard"},
    )
    data = resp.json()
    assert bfs_solvable(data["walls"]), "Generated hard maze is not solvable"


async def test_generate_response_has_start_and_goal(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "medium"},
    )
    data = resp.json()
    assert data["start"] == {"row": 1, "col": 1}
    assert data["goal"] == {"row": 11, "col": 11}


async def test_generate_station_not_found_returns_404(client):
    game_id = await _create_game(client)
    resp = await client.post(
        f"/api/games/{game_id}/stations/nonexistent/maze/generate",
        json={"difficulty": "easy"},
    )
    assert resp.status_code == 404


async def test_get_mini_game_returns_stored_maze(client):
    game_id = await _create_game(client)
    station_id = await _create_maze_station(client, game_id)
    gen_resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/maze/generate",
        json={"difficulty": "easy"},
    )
    get_resp = await client.get(f"/api/games/{game_id}/stations/{station_id}/mini-game")
    assert get_resp.status_code == 200
    config = get_resp.json()
    maze_data = config["maze_data"]
    assert maze_data["rows"] == gen_resp.json()["rows"]
    assert maze_data["walls"] == gen_resp.json()["walls"]
