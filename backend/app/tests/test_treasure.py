"""
AC tests for easter-oz2: Treasure/end station behavior.

Covers:
  1. new_game_has_treasure_station  — POST /api/games auto-creates treasure
  2. delete_treasure_station_returns_409 — treasure cannot be deleted
  3. reorder_always_puts_treasure_last — reorder keeps treasure last
  4. start_game_without_treasure_image — treasure doesn't need image to start
  5. complete_treasure_station_finishes_game — completing last station finishes game
"""

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
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    test_engine.dispose()


async def test_new_game_has_treasure_station(client):
    """Test 1: POST /api/games auto-creates exactly one treasure station."""
    create_resp = await client.post("/api/games", json={"name": "Treasure Test"})
    assert create_resp.status_code == 201
    game_id = create_resp.json()["id"]

    stations_resp = await client.get(f"/api/games/{game_id}/stations")
    assert stations_resp.status_code == 200
    stations = stations_resp.json()
    assert len(stations) == 1
    assert stations[0]["mini_game_type"] == "treasure"


async def test_delete_treasure_station_returns_409(client):
    """Test 2: Attempting to delete the treasure station returns 409."""
    create_resp = await client.post("/api/games", json={"name": "Delete Treasure Test"})
    game_id = create_resp.json()["id"]

    stations_resp = await client.get(f"/api/games/{game_id}/stations")
    treasure_id = stations_resp.json()[0]["id"]

    del_resp = await client.delete(f"/api/games/{game_id}/stations/{treasure_id}")
    assert del_resp.status_code == 409


async def test_reorder_always_puts_treasure_last(client):
    """Test 3: Reordering with treasure placed first still ends up last."""
    create_resp = await client.post("/api/games", json={"name": "Reorder Treasure Test"})
    game_id = create_resp.json()["id"]

    s1 = (await client.post(
        f"/api/games/{game_id}/stations",
        json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
    )).json()["id"]
    s2 = (await client.post(
        f"/api/games/{game_id}/stations",
        json={"position": 2, "mini_game_type": "puzzle", "mini_game_config": PUZZLE_CONFIG},
    )).json()["id"]

    stations_resp = await client.get(f"/api/games/{game_id}/stations")
    treasure_id = next(
        s["id"] for s in stations_resp.json() if s["mini_game_type"] == "treasure"
    )

    # Try to put treasure first in the reorder request
    reorder_resp = await client.put(
        f"/api/games/{game_id}/stations/reorder",
        json={"station_ids": [treasure_id, s1, s2]},
    )
    assert reorder_resp.status_code == 200
    result = reorder_resp.json()
    assert result[-1]["mini_game_type"] == "treasure"
    assert result[-1]["position"] == len(result)


async def test_start_game_without_treasure_image(client):
    """Test 4: Game can start with treasure having no image, as long as puzzle stations have images."""
    create_resp = await client.post("/api/games", json={"name": "Start Without Treasure Image"})
    game_id = create_resp.json()["id"]

    # Add a puzzle station with an image (the only non-treasure requirement)
    await client.post(
        f"/api/games/{game_id}/stations",
        json={
            "position": 1,
            "mini_game_type": "puzzle",
            "mini_game_config": PUZZLE_CONFIG,
            "image_path": "/img/clue1.jpg",
        },
    )

    # Treasure station has no image — game should still start
    start_resp = await client.post(f"/api/games/{game_id}/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "started"


async def test_complete_treasure_station_finishes_game(client):
    """Test 5: Completing the treasure station (last position) sets game status to finished."""
    create_resp = await client.post("/api/games", json={"name": "Finish via Treasure"})
    game_id = create_resp.json()["id"]

    # Add a puzzle station with image; game already has treasure auto-created
    await client.post(
        f"/api/games/{game_id}/stations",
        json={
            "position": 1,
            "mini_game_type": "puzzle",
            "mini_game_config": PUZZLE_CONFIG,
            "image_path": "/img/clue1.jpg",
        },
    )

    # Start game: puzzle@1, treasure@2
    await client.post(f"/api/games/{game_id}/start")
    await client.post(f"/api/games/{game_id}/progress")

    # Complete station 1 (puzzle) — advances to position 2 (treasure)
    resp1 = await client.put(f"/api/games/{game_id}/progress/complete-station")
    assert resp1.status_code == 200
    assert resp1.json()["current_station"] == 2

    # Complete station 2 (treasure, last) — should finish the game
    resp2 = await client.put(f"/api/games/{game_id}/progress/complete-station")
    assert resp2.status_code == 200

    game_resp = await client.get(f"/api/games/{game_id}")
    assert game_resp.json()["status"] == "finished"
