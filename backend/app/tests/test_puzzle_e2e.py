"""
End-to-end regression tests for puzzle flow (easter-1jf).

Regression for easter-bl5: puzzle tiles must be persisted in station.mini_game_config
and survive DB re-reads.  Covers:
  1. Two-station puzzle flow (upload → generate → start → play)
  2. Tile persistence after "server restart" (fresh DB session, same data)
  3. Portrait JPEG with EXIF orientation=6 produces portrait tiles
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


def _make_jpeg_bytes(width: int = 400, height: int = 600) -> bytes:
    """Create a random-coloured JPEG."""
    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_jpeg_with_exif_orientation(width: int, height: int, orientation: int) -> bytes:
    """Create a JPEG with the given EXIF Orientation tag value."""
    img = Image.new("RGB", (width, height), color=(80, 160, 240))
    buf = io.BytesIO()
    exif = img.getexif()
    exif[0x0112] = orientation  # Orientation tag
    img.save(buf, format="JPEG", exif=exif.tobytes())
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

    import app.routers.images as images_module
    import app.main as main_module

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


@pytest.fixture
async def persistent_client(tmp_path: Path):
    """Like `client` but exposes the engine so a second session can be opened."""
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
        yield ac, test_engine, TestingSessionLocal

    app.dependency_overrides.clear()
    test_engine.dispose()
    images_module.DATA_DIR = orig_images_data_dir
    main_module.DATA_DIR = orig_main_data_dir


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _create_puzzle_station(
    client: AsyncClient,
    game_id: str,
    position: int,
) -> str:
    """Create a puzzle station and return its id."""
    resp = await client.post(
        f"/api/games/{game_id}/stations",
        json={
            "position": position,
            "mini_game_type": "puzzle",
            "mini_game_config": {"type": "puzzle", "grid_size": 4},
        },
    )
    assert resp.status_code == 201, f"Create station failed: {resp.text}"
    return resp.json()["id"]


async def _upload_jpeg(
    client: AsyncClient,
    game_id: str,
    station_id: str,
    jpeg_bytes: bytes,
) -> None:
    """Upload a JPEG to a station."""
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/image",
        files={"file": ("photo.jpg", jpeg_bytes, "image/jpeg")},
    )
    assert resp.status_code == 201, f"Upload failed: {resp.text}"


async def _generate_tiles(
    client: AsyncClient,
    game_id: str,
    station_id: str,
    grid_size: int = 4,
) -> None:
    """Generate puzzle tiles for a station."""
    resp = await client.post(
        f"/api/games/{game_id}/stations/{station_id}/puzzle/generate?grid_size={grid_size}"
    )
    assert resp.status_code == 200, f"Generate tiles failed: {resp.text}"


def _assert_tiles(tiles: list, expected_count: int = 4) -> None:
    """Assert tiles list is well-formed."""
    assert tiles is not None
    assert len(tiles) == expected_count, f"Expected {expected_count} tiles, got {len(tiles)}"
    for tile in tiles:
        assert "url" in tile, f"Tile missing 'url': {tile}"
        assert "index" in tile, f"Tile missing 'index': {tile}"
        assert "row" in tile, f"Tile missing 'row': {tile}"
        assert "col" in tile, f"Tile missing 'col': {tile}"
        assert "/media/" in tile["url"], f"Tile url missing '/media/': {tile['url']}"


# ---------------------------------------------------------------------------
# Test 1: Two-station puzzle flow (main regression for easter-bl5)
# ---------------------------------------------------------------------------


class TestTwoStationPuzzleFlow:
    """
    Upload images to two puzzle stations, generate tiles, start the game,
    then verify both stations have their tiles persisted in mini_game_config.
    """

    async def test_both_stations_have_tiles_after_game_start(self, client: AsyncClient) -> None:
        # Create game
        game_resp = await client.post("/api/games", json={"name": "Regression Hunt"})
        assert game_resp.status_code == 201
        game_id = game_resp.json()["id"]

        # Create two puzzle stations
        sid1 = await _create_puzzle_station(client, game_id, position=1)
        sid2 = await _create_puzzle_station(client, game_id, position=2)

        # Upload images and generate tiles for both stations
        await _upload_jpeg(client, game_id, sid1, _make_jpeg_bytes(400, 600))
        await _generate_tiles(client, game_id, sid1)

        await _upload_jpeg(client, game_id, sid2, _make_jpeg_bytes(400, 600))
        await _generate_tiles(client, game_id, sid2)

        # Start the game
        start_resp = await client.post(f"/api/games/{game_id}/start")
        assert start_resp.status_code == 200

        # Station 1: puzzle tiles must be present
        puzzle1 = await client.get(f"/api/games/{game_id}/stations/{sid1}/puzzle")
        assert puzzle1.status_code == 200, f"Station 1 puzzle endpoint failed: {puzzle1.text}"
        data1 = puzzle1.json()
        _assert_tiles(data1["tiles"], expected_count=4)

        # Station 2: puzzle tiles must be present
        puzzle2 = await client.get(f"/api/games/{game_id}/stations/{sid2}/puzzle")
        assert puzzle2.status_code == 200, f"Station 2 puzzle endpoint failed: {puzzle2.text}"
        data2 = puzzle2.json()
        _assert_tiles(data2["tiles"], expected_count=4)

    async def test_station_mini_game_config_contains_tiles(self, client: AsyncClient) -> None:
        """Tiles must be stored in station.mini_game_config so they survive reload."""
        game_resp = await client.post("/api/games", json={"name": "Config Hunt"})
        game_id = game_resp.json()["id"]

        sid = await _create_puzzle_station(client, game_id, position=1)
        await _upload_jpeg(client, game_id, sid, _make_jpeg_bytes(300, 300))
        await _generate_tiles(client, game_id, sid)

        # Check station endpoint returns mini_game_config with tiles
        station_resp = await client.get(f"/api/games/{game_id}/stations/{sid}")
        assert station_resp.status_code == 200
        config = station_resp.json().get("mini_game_config", {})
        assert "tiles" in config, f"mini_game_config missing 'tiles': {config}"
        _assert_tiles(config["tiles"], expected_count=4)

    async def test_tile_urls_contain_media_prefix(self, client: AsyncClient) -> None:
        game_resp = await client.post("/api/games", json={"name": "Media Hunt"})
        game_id = game_resp.json()["id"]
        sid = await _create_puzzle_station(client, game_id, position=1)
        await _upload_jpeg(client, game_id, sid, _make_jpeg_bytes(200, 200))
        await _generate_tiles(client, game_id, sid)

        puzzle = await client.get(f"/api/games/{game_id}/stations/{sid}/puzzle")
        tiles = puzzle.json()["tiles"]
        for tile in tiles:
            assert tile["url"].startswith("/media/"), (
                f"Expected /media/ prefix, got: {tile['url']}"
            )


# ---------------------------------------------------------------------------
# Test 2: Tile persistence after "server restart" (fresh DB session)
# ---------------------------------------------------------------------------


class TestTilePersistenceAfterRestart:
    """
    Simulate a server restart by re-opening the DB engine with a new session
    and verifying tiles are still present (regression: tiles not committed).
    """

    async def test_tiles_survive_new_db_session(
        self, persistent_client: tuple
    ) -> None:
        client, _, SessionLocal = persistent_client

        # Setup: create game, station, upload, generate
        game_resp = await client.post("/api/games", json={"name": "Persist Hunt"})
        game_id = game_resp.json()["id"]
        sid = await _create_puzzle_station(client, game_id, position=1)
        await _upload_jpeg(client, game_id, sid, _make_jpeg_bytes(400, 600))
        await _generate_tiles(client, game_id, sid)

        # "Restart": open a brand-new DB session and read station directly from ORM
        from app.models.game import Station

        new_session = SessionLocal()
        try:
            station = new_session.query(Station).filter(Station.id == sid).first()
            assert station is not None
            config = station.mini_game_config or {}
            assert "tiles" in config, f"Tiles missing after DB re-read: {config}"
            tiles = config["tiles"]
            assert len(tiles) == 4, f"Expected 4 tiles, got {len(tiles)}"
            for tile in tiles:
                assert "/media/" in tile["url"]
        finally:
            new_session.close()

        # Also verify via HTTP (same test_engine, same in-memory DB)
        puzzle_resp = await client.get(f"/api/games/{game_id}/stations/{sid}/puzzle")
        assert puzzle_resp.status_code == 200
        _assert_tiles(puzzle_resp.json()["tiles"], expected_count=4)


# ---------------------------------------------------------------------------
# Test 3: Portrait JPEG with EXIF orientation=6 produces portrait tiles
# ---------------------------------------------------------------------------


class TestExifOrientationPuzzle:
    """
    A landscape JPEG (width > height) with EXIF orientation=6 (90° CW) should
    be transposed to portrait (height > width) before tiling, so each tile
    is also portrait (height > width).
    """

    async def test_exif_rotated_portrait_tiles(self, client: AsyncClient) -> None:
        # Orientation 6 = 90° CW; stored as landscape 600×400,
        # after exif_transpose becomes portrait 400×600.
        jpeg_bytes = _make_jpeg_with_exif_orientation(width=600, height=400, orientation=6)

        game_resp = await client.post("/api/games", json={"name": "EXIF Hunt"})
        game_id = game_resp.json()["id"]
        sid1 = await _create_puzzle_station(client, game_id, position=1)
        sid2 = await _create_puzzle_station(client, game_id, position=2)

        await _upload_jpeg(client, game_id, sid1, jpeg_bytes)
        await _generate_tiles(client, game_id, sid1)
        await _upload_jpeg(client, game_id, sid2, _make_jpeg_bytes(400, 600))
        await _generate_tiles(client, game_id, sid2)

        # Verify tiles exist (orientation-correctness is validated by image dims below)
        puzzle = await client.get(f"/api/games/{game_id}/stations/{sid1}/puzzle")
        assert puzzle.status_code == 200
        tiles = puzzle.json()["tiles"]
        _assert_tiles(tiles, expected_count=4)

        # Verify tile image files are portrait (height > width) by opening them
        import app.routers.images as images_module
        data_dir = images_module.DATA_DIR
        for tile in tiles:
            rel = tile["url"].removeprefix("/media/")
            tile_path = data_dir / rel
            assert tile_path.exists(), f"Tile file not found: {tile_path}"
            with Image.open(tile_path) as img:
                w, h = img.size
                assert h > w, (
                    f"Tile should be portrait (h > w) after EXIF correction, "
                    f"got {w}×{h} for {tile_path.name}"
                )

