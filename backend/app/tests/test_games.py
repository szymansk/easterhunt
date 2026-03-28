import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base


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


async def test_create_game(client):
    async with client as c:
        response = await c.post("/api/games", json={"name": "Ostern 2025"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Ostern 2025"
    assert data["status"] == "draft"
    assert "id" in data


async def test_list_games_empty(client):
    async with client as c:
        response = await c.get("/api/games")
    assert response.status_code == 200
    assert response.json() == []


async def test_list_games(client):
    async with client as c:
        await c.post("/api/games", json={"name": "Game 1"})
        await c.post("/api/games", json={"name": "Game 2"})
        response = await c.get("/api/games")
    assert response.status_code == 200
    assert len(response.json()) == 2


async def test_get_game(client):
    async with client as c:
        create_resp = await c.post("/api/games", json={"name": "My Game"})
        game_id = create_resp.json()["id"]
        response = await c.get(f"/api/games/{game_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == game_id
    assert data["stations"] == []


async def test_get_game_not_found(client):
    async with client as c:
        response = await c.get("/api/games/nonexistent-id")
    assert response.status_code == 404


async def test_update_game(client):
    async with client as c:
        create_resp = await c.post("/api/games", json={"name": "Original"})
        game_id = create_resp.json()["id"]
        response = await c.put(f"/api/games/{game_id}", json={"name": "Updated"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated"


async def test_update_game_not_found(client):
    async with client as c:
        response = await c.put("/api/games/nonexistent-id", json={"name": "X"})
    assert response.status_code == 404


async def test_delete_game(client):
    async with client as c:
        create_resp = await c.post("/api/games", json={"name": "To Delete"})
        game_id = create_resp.json()["id"]
        del_response = await c.delete(f"/api/games/{game_id}")
        get_response = await c.get(f"/api/games/{game_id}")
    assert del_response.status_code == 204
    assert get_response.status_code == 404


async def test_delete_game_not_found(client):
    async with client as c:
        response = await c.delete("/api/games/nonexistent-id")
    assert response.status_code == 404


async def test_start_game_no_stations(client):
    async with client as c:
        create_resp = await c.post("/api/games", json={"name": "Empty Game"})
        game_id = create_resp.json()["id"]
        response = await c.post(f"/api/games/{game_id}/start")
    assert response.status_code == 422


async def test_start_game_not_found(client):
    async with client as c:
        response = await c.post("/api/games/nonexistent-id/start")
    assert response.status_code == 404
