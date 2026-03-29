"""
Tests for puzzle tile URL reachability (easter-b79).

Verifies that after puzzle generation:
- tile URLs are reachable via GET /media/...
- GET /puzzle before generation returns 404
- GET /puzzle after generation returns tiles
- tile files exist on disk
"""
import io
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


def _make_jpeg_bytes(width: int = 200, height: int = 200) -> bytes:
    img = Image.new("RGB", (width, height), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
async def client(tmp_path: Path):
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

    import app.routers.images as images_module
    import app.main as main_module

    orig_images_data_dir = images_module.DATA_DIR
    orig_main_data_dir = main_module.DATA_DIR
    images_module.DATA_DIR = tmp_path
    main_module.DATA_DIR = tmp_path

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, tmp_path

    app.dependency_overrides.clear()
    test_engine.dispose()
    images_module.DATA_DIR = orig_images_data_dir
    main_module.DATA_DIR = orig_main_data_dir


async def _setup_game_and_station(client: AsyncClient) -> tuple[str, str]:
    game_resp = await client.post("/api/games", json={"name": "Tile Test Game"})
    assert game_resp.status_code == 201
    game_id = game_resp.json()["id"]

    station_resp = await client.post(
        f"/api/games/{game_id}/stations",
        json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": {"type": "puzzle", "grid_size": 4}},
    )
    assert station_resp.status_code == 201
    station_id = station_resp.json()["id"]
    return game_id, station_id


async def test_generate_puzzle_returns_valid_media_urls(client):
    ac, tmp_path = client
    game_id, station_id = await _setup_game_and_station(ac)

    upload_resp = await ac.post(
        f"/api/games/{game_id}/stations/{station_id}/image",
        files={"file": ("photo.jpg", _make_jpeg_bytes(), "image/jpeg")},
    )
    assert upload_resp.status_code == 201

    gen_resp = await ac.post(
        f"/api/games/{game_id}/stations/{station_id}/puzzle/generate?grid_size=4"
    )
    assert gen_resp.status_code == 200
    tiles = gen_resp.json()["tiles"]
    assert len(tiles) == 4

    for tile in tiles:
        url = tile["url"]
        assert url.startswith("/media/"), f"Tile URL must start with /media/: {url}"
        media_resp = await ac.get(url)
        assert media_resp.status_code == 200, f"Tile URL not reachable: {url}"


async def test_get_puzzle_before_generation_returns_404(client):
    ac, _ = client
    game_id, station_id = await _setup_game_and_station(ac)

    resp = await ac.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
    assert resp.status_code == 404


async def test_get_puzzle_after_generation_returns_tiles(client):
    ac, _ = client
    game_id, station_id = await _setup_game_and_station(ac)

    await ac.post(
        f"/api/games/{game_id}/stations/{station_id}/image",
        files={"file": ("photo.jpg", _make_jpeg_bytes(), "image/jpeg")},
    )
    await ac.post(f"/api/games/{game_id}/stations/{station_id}/puzzle/generate?grid_size=4")

    resp = await ac.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["tiles"]) == 4
    for tile in data["tiles"]:
        assert "url" in tile
        assert tile["url"].startswith("/media/")


async def test_tile_image_files_actually_exist_on_disk(client):
    ac, tmp_path = client
    game_id, station_id = await _setup_game_and_station(ac)

    await ac.post(
        f"/api/games/{game_id}/stations/{station_id}/image",
        files={"file": ("photo.jpg", _make_jpeg_bytes(), "image/jpeg")},
    )
    gen_resp = await ac.post(
        f"/api/games/{game_id}/stations/{station_id}/puzzle/generate?grid_size=4"
    )
    tiles = gen_resp.json()["tiles"]

    for tile in tiles:
        rel = tile["url"].removeprefix("/media/")
        tile_path = tmp_path / rel
        assert tile_path.exists(), f"Tile file not found on disk: {tile_path}"
        assert tile_path.stat().st_size > 0, f"Tile file is empty: {tile_path}"
