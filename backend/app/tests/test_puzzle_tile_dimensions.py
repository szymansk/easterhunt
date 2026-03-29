"""Tests for tile_width / tile_height in PuzzleResponse (easter-bmx)."""
import io

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


def _make_jpeg_bytes(width: int, height: int) -> bytes:
    img = Image.new("RGB", (width, height), color=(120, 80, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------


@pytest.fixture
async def client(tmp_path):
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
# Helpers for test setup
# ---------------------------------------------------------------------------


async def _create_puzzle_station(client: AsyncClient, game_id: str) -> str:
    resp = await client.post(
        f"/api/games/{game_id}/stations",
        json={
            "position": 1,
            "mini_game_type": "puzzle",
            "mini_game_config": {"type": "puzzle", "grid_size": 9},
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _upload_jpeg(client: AsyncClient, game_id: str, station_id: str, jpeg_bytes: bytes) -> None:
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/image",
        files={"file": ("photo.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert resp.status_code == 201, resp.text


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestTileDimensions:
    async def test_puzzle_response_includes_tile_dimensions(self, client: AsyncClient) -> None:
        """Portrait image (3:4 ratio), grid=9 → tiles have portrait aspect ratio (tile_width < tile_height).

        The optimizer resizes to max 1200px on the longest side.
        1080x1440 → 900x1200 (longest=1440, scale=1200/1440).
        3×3 grid: tile_width=900//3=300, tile_height=1200//3=400.
        """
        game_resp = await client.post("/api/games", json={"name": "Dim Test"})
        assert game_resp.status_code == 201
        game_id = game_resp.json()["id"]
        sid = await _create_puzzle_station(client, game_id)
        await _upload_jpeg(client, game_id, sid, _make_jpeg_bytes(1080, 1440))

        resp = await client.post(
            f"/api/games/{game_id}/stations/{sid}/puzzle/generate?grid_size=9"
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()

        assert "tile_width" in data, f"tile_width missing from response: {data}"
        assert "tile_height" in data, f"tile_height missing from response: {data}"
        # Portrait source → portrait tiles: width < height
        assert data["tile_width"] < data["tile_height"], (
            f"Expected portrait tiles (width < height), got {data['tile_width']}x{data['tile_height']}"
        )
        # Aspect ratio should be preserved: 3:4
        ratio = data["tile_width"] / data["tile_height"]
        assert abs(ratio - 0.75) < 0.05, f"Expected ~0.75 ratio, got {ratio}"

    async def test_tile_dimensions_landscape(self, client: AsyncClient) -> None:
        """Landscape image (4:3 ratio), grid=9 → tiles have landscape aspect ratio (tile_width > tile_height).

        The optimizer resizes to max 1200px on the longest side.
        1440x1080 → 1200x900.
        3×3 grid: tile_width=1200//3=400, tile_height=900//3=300.
        """
        game_resp = await client.post("/api/games", json={"name": "Landscape Dim Test"})
        game_id = game_resp.json()["id"]
        sid = await _create_puzzle_station(client, game_id)
        await _upload_jpeg(client, game_id, sid, _make_jpeg_bytes(1440, 1080))

        resp = await client.post(
            f"/api/games/{game_id}/stations/{sid}/puzzle/generate?grid_size=9"
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()

        # Landscape source → landscape tiles: width > height
        assert data["tile_width"] > data["tile_height"], (
            f"Expected landscape tiles (width > height), got {data['tile_width']}x{data['tile_height']}"
        )
        # Aspect ratio should be preserved: 4:3
        ratio = data["tile_width"] / data["tile_height"]
        assert abs(ratio - 4 / 3) < 0.05, f"Expected ~1.33 ratio, got {ratio}"

    async def test_tile_dimensions_square(self, client: AsyncClient) -> None:
        """Square 600x600 image, grid=4 → tile_width=300, tile_height=300."""
        game_resp = await client.post("/api/games", json={"name": "Square Dim Test"})
        game_id = game_resp.json()["id"]
        sid = await _create_puzzle_station(client, game_id)
        await _upload_jpeg(client, game_id, sid, _make_jpeg_bytes(600, 600))

        resp = await client.post(
            f"/api/games/{game_id}/stations/{sid}/puzzle/generate?grid_size=4"
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()

        assert data["tile_width"] == 300, f"Expected 300, got {data['tile_width']}"
        assert data["tile_height"] == 300, f"Expected 300, got {data['tile_height']}"

    async def test_get_puzzle_returns_tile_dimensions(self, client: AsyncClient) -> None:
        """After generate, GET /puzzle must return the same tile_width/tile_height."""
        game_resp = await client.post("/api/games", json={"name": "GET Dim Test"})
        game_id = game_resp.json()["id"]
        sid = await _create_puzzle_station(client, game_id)
        await _upload_jpeg(client, game_id, sid, _make_jpeg_bytes(1080, 1440))

        # Generate first
        post_resp = await client.post(
            f"/api/games/{game_id}/stations/{sid}/puzzle/generate?grid_size=9"
        )
        assert post_resp.status_code == 200, post_resp.text
        post_data = post_resp.json()

        # Now GET — should return the stored dimensions
        get_resp = await client.get(f"/api/games/{game_id}/stations/{sid}/puzzle")
        assert get_resp.status_code == 200, get_resp.text
        get_data = get_resp.json()

        assert "tile_width" in get_data, f"tile_width missing from GET response: {get_data}"
        assert "tile_height" in get_data, f"tile_height missing from GET response: {get_data}"
        assert get_data["tile_width"] == post_data["tile_width"]
        assert get_data["tile_height"] == post_data["tile_height"]
