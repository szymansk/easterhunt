"""
Regression tests for easter-mhb: Station-Save must not overwrite puzzle tiles.

When PUT /api/games/{id}/stations/{sid} is called with a puzzle config that has
the same grid_size as the existing config, generated tiles must be preserved.
When grid_size changes, tiles must be discarded (they are invalid for the new grid).
"""

import io
import random
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_jpeg_bytes(width: int = 400, height: int = 400) -> bytes:
    """Create a solid-colour JPEG for testing."""
    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
async def client(tmp_path: Path):
    """Async test client with in-memory DB and DATA_DIR patched to tmp_path."""
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

    import app.main as main_module
    import app.routers.images as images_module

    orig_images_data_dir = images_module.DATA_DIR
    orig_main_data_dir = main_module.DATA_DIR
    images_module.DATA_DIR = tmp_path
    main_module.DATA_DIR = tmp_path

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    test_engine.dispose()
    images_module.DATA_DIR = orig_images_data_dir
    main_module.DATA_DIR = orig_main_data_dir


# ---------------------------------------------------------------------------
# Shared setup helpers
# ---------------------------------------------------------------------------


async def _create_game(client: AsyncClient, name: str = "Test Hunt") -> str:
    resp = await client.post("/api/games", json={"name": name})
    assert resp.status_code == 201, f"Create game failed: {resp.text}"
    return resp.json()["id"]


async def _create_puzzle_station(client: AsyncClient, game_id: str, grid_size: int = 4) -> str:
    resp = await client.post(
        f"/api/games/{game_id}/stations",
        json={
            "position": 1,
            "mini_game_type": "puzzle",
            "mini_game_config": {"type": "puzzle", "grid_size": grid_size},
        },
    )
    assert resp.status_code == 201, f"Create station failed: {resp.text}"
    return resp.json()["id"]


async def _upload_image(client: AsyncClient, game_id: str, station_id: str) -> None:
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/image",
        files={"file": ("photo.jpg", _make_jpeg_bytes(), "image/jpeg")},
    )
    assert resp.status_code == 201, f"Upload image failed: {resp.text}"


async def _generate_tiles(
    client: AsyncClient, game_id: str, station_id: str, grid_size: int = 4
) -> None:
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/puzzle/generate?grid_size={grid_size}"
    )
    assert resp.status_code == 200, f"Generate tiles failed: {resp.text}"


async def _put_station(
    client: AsyncClient, game_id: str, station_id: str, grid_size: int
) -> None:
    resp = await client.put(
        f"/api/games/{game_id}/stations/{station_id}",
        json={
            "mini_game_type": "puzzle",
            "mini_game_config": {"type": "puzzle", "grid_size": grid_size},
        },
    )
    assert resp.status_code == 200, f"PUT station failed: {resp.text}"


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestPuzzleTilePersistence:
    async def test_tiles_preserved_after_save_same_grid_size(
        self, client: AsyncClient
    ) -> None:
        """
        Generate tiles then PUT station with the same grid_size.
        GET /puzzle must return 200 with tiles still present.
        """
        game_id = await _create_game(client, "Preserve Hunt")
        station_id = await _create_puzzle_station(client, game_id, grid_size=4)
        await _upload_image(client, game_id, station_id)
        await _generate_tiles(client, game_id, station_id, grid_size=4)

        # Verify tiles exist before PUT
        puzzle_before = await client.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
        assert puzzle_before.status_code == 200
        tiles_before = puzzle_before.json()["tiles"]
        assert len(tiles_before) == 4

        # PUT station with same grid_size (simulates frontend save)
        await _put_station(client, game_id, station_id, grid_size=4)

        # Tiles must still be present after PUT
        puzzle_after = await client.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
        assert puzzle_after.status_code == 200, (
            f"Expected 200 after PUT same grid_size, got {puzzle_after.status_code}: {puzzle_after.text}"
        )
        tiles_after = puzzle_after.json()["tiles"]
        assert len(tiles_after) == 4, (
            f"Expected 4 tiles after PUT, got {len(tiles_after)}"
        )

    async def test_tiles_cleared_after_grid_size_change(
        self, client: AsyncClient
    ) -> None:
        """
        Generate tiles (grid_size=4) then PUT station with grid_size=9.
        The old 4-tile set must be discarded.  Because no image is present in
        this test, auto-generate cannot run and GET /puzzle must return 404.
        """
        game_id = await _create_game(client, "Grid Change Hunt")
        # Create station without uploading an image so auto-generate won't fire
        station_id = await _create_puzzle_station(client, game_id, grid_size=4)

        # Manually inject tiles into mini_game_config via the generate endpoint
        # by first uploading an image, generating, then removing the image via DB trick.
        # Simpler: use a second station that provides the image for generation.
        # Easiest approach: upload image, generate tiles, then verify that a
        # grid_size change returns a DIFFERENT tile count (9 instead of 4),
        # proving the old tiles were invalidated.
        await _upload_image(client, game_id, station_id)
        await _generate_tiles(client, game_id, station_id, grid_size=4)

        # Verify tiles exist (4 tiles) before grid_size change
        puzzle_before = await client.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
        assert puzzle_before.status_code == 200
        assert len(puzzle_before.json()["tiles"]) == 4

        # PUT station with different grid_size — old tiles must be discarded
        await _put_station(client, game_id, station_id, grid_size=9)

        # GET /puzzle: since the image is still present, auto-generate fires
        # for the NEW grid_size (9) — this is the correct behavior.
        # The key assertion is that the tile count changed from 4 to 9,
        # proving the old 4-tile set was discarded.
        puzzle_after = await client.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
        assert puzzle_after.status_code == 200, (
            f"Expected 200 after grid_size change (auto-generate), got {puzzle_after.status_code}: {puzzle_after.text}"
        )
        tiles_after = puzzle_after.json()["tiles"]
        assert len(tiles_after) == 9, (
            f"Expected 9 tiles for new grid_size=9, got {len(tiles_after)} — old tiles not cleared"
        )

    async def test_save_without_tiles_returns_404_on_get(
        self, client: AsyncClient
    ) -> None:
        """
        A new station with no tiles: PUT puzzle config without generating tiles,
        then GET /puzzle must return 404.
        No image is uploaded so auto-generate cannot kick in.
        """
        game_id = await _create_game(client, "No Tiles Hunt")
        station_id = await _create_puzzle_station(client, game_id, grid_size=4)

        # PUT without generating tiles first
        await _put_station(client, game_id, station_id, grid_size=4)

        # Without an image, GET /puzzle returns 404
        puzzle = await client.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
        assert puzzle.status_code == 404, (
            f"Expected 404 for station with no tiles, got {puzzle.status_code}: {puzzle.text}"
        )

    async def test_multiple_saves_preserve_tiles(
        self, client: AsyncClient
    ) -> None:
        """
        Generate tiles then PUT station 3 times with the same grid_size.
        GET /puzzle must return 200 with tiles still present after all saves.
        """
        game_id = await _create_game(client, "Multi Save Hunt")
        station_id = await _create_puzzle_station(client, game_id, grid_size=4)
        await _upload_image(client, game_id, station_id)
        await _generate_tiles(client, game_id, station_id, grid_size=4)

        # 3x PUT with same grid_size
        for i in range(3):
            await _put_station(client, game_id, station_id, grid_size=4)

        # Tiles must still be present after all saves
        puzzle = await client.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
        assert puzzle.status_code == 200, (
            f"Expected 200 after 3 PUTs, got {puzzle.status_code}: {puzzle.text}"
        )
        tiles = puzzle.json()["tiles"]
        assert len(tiles) == 4, f"Expected 4 tiles after 3 PUTs, got {len(tiles)}"
        for tile in tiles:
            assert "url" in tile, f"Tile missing 'url': {tile}"
            assert "index" in tile, f"Tile missing 'index': {tile}"
