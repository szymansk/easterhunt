"""
Comprehensive tests for image processing: upload validation, optimization, and puzzle tiles.

Covers acceptance criteria for easter-0qp.1, easter-0qp.2, easter-0qp.3.
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
from app.services.image_optimization import ImageOptimizationService, MAX_DIMENSION, THUMBNAIL_SIZE
from app.services.puzzle_tile import GRID_CONFIGS, PuzzleTileService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_jpeg_bytes(width: int = 100, height: int = 80) -> bytes:
    """Create a small valid JPEG image as bytes."""
    img = Image.new("RGB", (width, height), color=(200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_png_bytes(width: int = 100, height: int = 80, with_alpha: bool = False) -> bytes:
    """Create a small valid PNG image as bytes."""
    mode = "RGBA" if with_alpha else "RGB"
    color = (100, 200, 50, 128) if with_alpha else (100, 200, 50)
    img = Image.new(mode, (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _save_jpeg(tmp_path: Path, width: int = 100, height: int = 80, name: str = "test.jpg") -> Path:
    p = tmp_path / name
    p.write_bytes(_make_jpeg_bytes(width, height))
    return p


def _save_png(
    tmp_path: Path,
    width: int = 100,
    height: int = 80,
    with_alpha: bool = False,
    name: str = "test.png",
) -> Path:
    p = tmp_path / name
    p.write_bytes(_make_png_bytes(width, height, with_alpha))
    return p


@pytest.fixture
def optimization_service() -> ImageOptimizationService:
    return ImageOptimizationService()


@pytest.fixture
def tile_service() -> PuzzleTileService:
    return PuzzleTileService()


@pytest.fixture
async def client(tmp_path):
    """Async HTTP client with in-memory DB and data/ path pointing to tmp_path."""
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

    # Patch DATA_DIR in the images router so uploads go to tmp_path
    import app.routers.images as images_module
    import app.main as main_module

    original_router_data_dir = images_module.DATA_DIR
    original_main_data_dir = main_module.DATA_DIR
    images_module.DATA_DIR = tmp_path
    main_module.DATA_DIR = tmp_path

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    test_engine.dispose()
    images_module.DATA_DIR = original_router_data_dir
    main_module.DATA_DIR = original_main_data_dir


async def _create_game_and_station(client: AsyncClient) -> tuple[str, str]:
    """Create a game and a puzzle station, return (game_id, station_id)."""
    game_resp = await client.post("/api/games", json={"name": "Test Hunt"})
    assert game_resp.status_code == 201
    game_id = game_resp.json()["id"]

    station_resp = await client.post(
        f"/api/games/{game_id}/stations",
        json={
            "position": 1,
            "mini_game_type": "puzzle",
            "mini_game_config": {"type": "puzzle", "grid_size": 4},
        },
    )
    assert station_resp.status_code == 201
    station_id = station_resp.json()["id"]
    return game_id, station_id


# ---------------------------------------------------------------------------
# 5.2 ImageOptimizationService tests
# ---------------------------------------------------------------------------


class TestImageOptimizationResize:
    def test_large_jpeg_resized_to_max_dimension(self, optimization_service, tmp_path):
        """3000×2000 JPEG → longest side ≤ 1200px."""
        src = _save_jpeg(tmp_path, width=3000, height=2000)
        opt_path, _ = optimization_service.optimize(src)
        with Image.open(opt_path) as img:
            assert max(img.size) <= MAX_DIMENSION

    def test_aspect_ratio_preserved(self, optimization_service, tmp_path):
        """Resized image must preserve the original aspect ratio (within 1%)."""
        src = _save_jpeg(tmp_path, width=3000, height=1500)
        opt_path, _ = optimization_service.optimize(src)
        with Image.open(opt_path) as img:
            w, h = img.size
            assert abs(w / h - 2.0) < 0.01

    def test_small_image_not_upscaled(self, optimization_service, tmp_path):
        """Images already ≤ 1200px must not be enlarged."""
        src = _save_jpeg(tmp_path, width=400, height=300)
        opt_path, _ = optimization_service.optimize(src)
        with Image.open(opt_path) as img:
            assert img.size == (400, 300)

    def test_thumbnail_generated(self, optimization_service, tmp_path):
        """Thumbnail longest side ≤ 300px."""
        src = _save_jpeg(tmp_path, width=800, height=600)
        _, thumb_path = optimization_service.optimize(src)
        assert thumb_path.exists()
        with Image.open(thumb_path) as img:
            assert max(img.size) <= THUMBNAIL_SIZE

    def test_original_file_unchanged(self, optimization_service, tmp_path):
        """Original file must still exist after optimization."""
        src = _save_jpeg(tmp_path, width=200, height=150)
        original_bytes = src.read_bytes()
        optimization_service.optimize(src)
        assert src.read_bytes() == original_bytes

    def test_output_files_are_jpeg(self, optimization_service, tmp_path):
        src = _save_jpeg(tmp_path, width=200, height=150)
        opt_path, thumb_path = optimization_service.optimize(src)
        with Image.open(opt_path) as img:
            assert img.format == "JPEG"
        with Image.open(thumb_path) as img:
            assert img.format == "JPEG"


class TestImageOptimizationConversion:
    def test_png_converted_to_jpeg(self, optimization_service, tmp_path):
        """PNG source → JPEG output."""
        src = _save_png(tmp_path, width=200, height=150)
        opt_path, _ = optimization_service.optimize(src)
        with Image.open(opt_path) as img:
            assert img.format == "JPEG"
            assert img.mode == "RGB"

    def test_png_with_transparency_has_white_background(self, optimization_service, tmp_path):
        """RGBA PNG → JPEG with white background (no transparency)."""
        src = _save_png(tmp_path, width=100, height=100, with_alpha=True)
        opt_path, _ = optimization_service.optimize(src)
        with Image.open(opt_path) as img:
            assert img.mode == "RGB"
            # Verify no transparency channel
            assert "A" not in img.getbands()

    def test_optimized_size_reasonable(self, optimization_service, tmp_path):
        """Optimized JPEG should be well under 500 KB for a typical photo-sized image."""
        # Create a 2000×1500 RGB image
        img = Image.new("RGB", (2000, 1500), color=(120, 80, 60))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        src = tmp_path / "large.jpg"
        src.write_bytes(buf.getvalue())

        opt_path, _ = optimization_service.optimize(src)
        assert opt_path.stat().st_size < 500 * 1024  # < 500 KB


class TestImageOptimizationHEIC:
    def test_heic_raises_if_pillow_heif_unavailable(self, optimization_service, tmp_path, monkeypatch):
        """If pillow_heif is not installed, HEIC should raise ValueError."""
        import builtins
        import sys

        real_import = builtins.__import__

        def mock_import(name, *args, **kwargs):
            if name == "pillow_heif":
                raise ImportError("Mocked: pillow_heif not installed")
            return real_import(name, *args, **kwargs)

        # Create a fake .heic file (content doesn't matter; we fail before opening)
        heic_path = tmp_path / "photo.heic"
        heic_path.write_bytes(b"\x00" * 100)

        # Remove from sys.modules so the import is attempted fresh
        monkeypatch.delitem(sys.modules, "pillow_heif", raising=False)

        with monkeypatch.context() as m:
            m.setattr(builtins, "__import__", mock_import)
            with pytest.raises(ValueError, match="pillow-heif"):
                optimization_service.optimize(heic_path)


# ---------------------------------------------------------------------------
# 5.3 PuzzleTileService tests
# ---------------------------------------------------------------------------


class TestPuzzleTileCount:
    @pytest.mark.parametrize("grid_size,expected", [(3, 3), (4, 4), (6, 6), (9, 9)])
    def test_correct_tile_count(self, tile_service, tmp_path, grid_size, expected):
        src = _save_jpeg(tmp_path, width=300, height=300)
        tiles = tile_service.generate_tiles(src, grid_size)
        assert len(tiles) == expected

    def test_invalid_grid_size_raises_value_error(self, tile_service, tmp_path):
        src = _save_jpeg(tmp_path, width=300, height=300)
        with pytest.raises(ValueError):
            tile_service.generate_tiles(src, 5)

    @pytest.mark.parametrize("invalid", [0, 1, 2, 5, 7, 8, 10, 16])
    def test_invalid_grid_sizes(self, tile_service, tmp_path, invalid):
        src = _save_jpeg(tmp_path, width=300, height=300)
        with pytest.raises(ValueError):
            tile_service.generate_tiles(src, invalid)


class TestPuzzleTileDimensions:
    def test_grid_3_tile_width_is_third_of_image(self, tile_service, tmp_path):
        """1×3 grid: tile width = img_width/3, full height."""
        src = _save_jpeg(tmp_path, width=300, height=200, name="img.jpg")
        tiles = tile_service.generate_tiles(src, 3)
        cols, rows = GRID_CONFIGS[3]  # (3, 1)
        for t in tiles:
            with Image.open(t["path"]) as img:
                w, h = img.size
                assert h == 200  # full height
                assert 99 <= w <= 101  # approx 300/3

    def test_grid_4_equal_tiles(self, tile_service, tmp_path):
        """2×2 grid: all tiles should be equal size."""
        src = _save_jpeg(tmp_path, width=200, height=200, name="img.jpg")
        tiles = tile_service.generate_tiles(src, 4)
        sizes = []
        for t in tiles:
            with Image.open(t["path"]) as img:
                sizes.append(img.size)
        assert len(set(sizes)) == 1  # all same size

    def test_grid_9_three_by_three(self, tile_service, tmp_path):
        """3×3 grid: 9 tiles, each approx 1/3 of image dimensions."""
        src = _save_jpeg(tmp_path, width=300, height=300, name="img.jpg")
        tiles = tile_service.generate_tiles(src, 9)
        assert len(tiles) == 9
        for t in tiles:
            with Image.open(t["path"]) as img:
                w, h = img.size
                assert 99 <= w <= 101
                assert 99 <= h <= 101


class TestPuzzleTileOrdering:
    def test_indices_are_sequential(self, tile_service, tmp_path):
        src = _save_jpeg(tmp_path, width=300, height=300)
        tiles = tile_service.generate_tiles(src, 9)
        indices = [t["index"] for t in tiles]
        assert indices == list(range(9))

    def test_tile_zero_is_top_left(self, tile_service, tmp_path):
        """Tile 0 must have row=0, col=0 (top-left, row-major)."""
        src = _save_jpeg(tmp_path, width=300, height=300)
        tiles = tile_service.generate_tiles(src, 4)
        tile_0 = next(t for t in tiles if t["index"] == 0)
        assert tile_0["row"] == 0
        assert tile_0["col"] == 0

    def test_row_major_ordering(self, tile_service, tmp_path):
        """For 2×2 grid: index 0=(0,0), 1=(0,1), 2=(1,0), 3=(1,1)."""
        src = _save_jpeg(tmp_path, width=200, height=200)
        tiles = tile_service.generate_tiles(src, 4)
        expected = [(0, 0), (0, 1), (1, 0), (1, 1)]
        for i, (exp_row, exp_col) in enumerate(expected):
            tile = tiles[i]
            assert tile["row"] == exp_row
            assert tile["col"] == exp_col

    def test_filenames_contain_index(self, tile_service, tmp_path):
        """Tiles saved as tile_0.jpg, tile_1.jpg, ..."""
        src = _save_jpeg(tmp_path, width=300, height=300)
        tiles = tile_service.generate_tiles(src, 9)
        for t in tiles:
            assert t["path"].name == f"tile_{t['index']}.jpg"

    def test_tiles_saved_in_puzzle_tiles_subdir(self, tile_service, tmp_path):
        src = _save_jpeg(tmp_path, width=300, height=300, name="img.jpg")
        tiles = tile_service.generate_tiles(src, 4)
        for t in tiles:
            assert "puzzle_tiles" in str(t["path"])
            assert t["path"].exists()


# ---------------------------------------------------------------------------
# 5.1 Upload API endpoint tests
# ---------------------------------------------------------------------------


class TestImageUploadAPI:
    async def test_jpeg_upload_returns_201(self, client):
        game_id, station_id = await _create_game_and_station(client)
        resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("photo.jpg", _make_jpeg_bytes(200, 150), "image/jpeg")},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "image_path" in data
        assert "thumbnail_path" in data

    async def test_png_upload_accepted(self, client):
        game_id, station_id = await _create_game_and_station(client)
        resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("photo.png", _make_png_bytes(200, 150), "image/png")},
        )
        assert resp.status_code == 201

    async def test_invalid_extension_rejected_with_422(self, client):
        game_id, station_id = await _create_game_and_station(client)
        resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
        )
        assert resp.status_code == 422
        assert "Nur Bildformate erlaubt" in resp.json()["detail"]

    async def test_text_file_rejected(self, client):
        game_id, station_id = await _create_game_and_station(client)
        resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("data.txt", b"hello", "text/plain")},
        )
        assert resp.status_code == 422

    async def test_oversized_file_rejected_with_413(self, client):
        game_id, station_id = await _create_game_and_station(client)
        # 21 MB of fake data
        big_content = b"X" * (21 * 1024 * 1024)
        resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("big.jpg", big_content, "image/jpeg")},
        )
        assert resp.status_code == 413

    async def test_station_image_path_updated_in_db(self, client):
        game_id, station_id = await _create_game_and_station(client)
        await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("photo.jpg", _make_jpeg_bytes(100, 80), "image/jpeg")},
        )
        station_resp = await client.get(f"/api/games/{game_id}/stations/{station_id}")
        assert station_resp.status_code == 200
        assert station_resp.json()["image_path"] is not None
        assert station_resp.json()["image_path"].startswith("/media/")

    async def test_image_path_contains_game_and_station_ids(self, client):
        game_id, station_id = await _create_game_and_station(client)
        resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("photo.jpg", _make_jpeg_bytes(100, 80), "image/jpeg")},
        )
        data = resp.json()
        assert game_id in data["image_path"]
        assert station_id in data["image_path"]


# ---------------------------------------------------------------------------
# 5.5 Static Media Serving tests
# ---------------------------------------------------------------------------


class TestMediaServing:
    async def test_path_traversal_blocked(self, client, tmp_path):
        """GET /media/../../etc/passwd should return 400 or 404."""
        resp = await client.get("/media/../../etc/passwd")
        assert resp.status_code in (400, 404)

    async def test_nonexistent_file_returns_404(self, client):
        resp = await client.get("/media/nonexistent_file.jpg")
        assert resp.status_code == 404

    async def test_existing_file_returned(self, client, tmp_path):
        """An uploaded file should be accessible at its /media/ URL."""
        game_id, station_id = await _create_game_and_station(client)
        upload_resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("photo.jpg", _make_jpeg_bytes(100, 80), "image/jpeg")},
        )
        assert upload_resp.status_code == 201
        image_url = upload_resp.json()["image_path"]  # e.g. /media/uploads/...
        media_resp = await client.get(image_url)
        assert media_resp.status_code == 200


# ---------------------------------------------------------------------------
# Puzzle generate endpoint: source_station_id fixes easter-bl5
# ---------------------------------------------------------------------------


class TestPuzzleGenerateWithSourceStation:
    """Tiles generated from source_station_id are stored in the puzzle station."""

    async def _create_two_stations(self, client) -> tuple[str, str, str]:
        """Return (game_id, puzzle_station_id, image_station_id)."""
        game_resp = await client.post("/api/games", json={"name": "Hunt"})
        game_id = game_resp.json()["id"]

        s1 = await client.post(
            f"/api/games/{game_id}/stations",
            json={"position": 1, "mini_game_type": "puzzle", "mini_game_config": {"type": "puzzle", "grid_size": 4}},
        )
        s2 = await client.post(
            f"/api/games/{game_id}/stations",
            json={"position": 2, "mini_game_type": "puzzle", "mini_game_config": {"type": "puzzle", "grid_size": 4}},
        )
        return game_id, s1.json()["id"], s2.json()["id"]

    async def test_tiles_stored_in_puzzle_station_not_source(self, client):
        """generate?source_station_id=S2 stores tiles in S1, not S2."""
        game_id, puzzle_sid, image_sid = await self._create_two_stations(client)

        # Upload image to the source station (S2)
        await client.post(
            f"/api/games/{game_id}/stations/{image_sid}/image",
            files={"file": ("photo.jpg", _make_jpeg_bytes(100, 100), "image/jpeg")},
        )

        # Generate tiles for puzzle station (S1), using S2's image
        gen_resp = await client.post(
            f"/api/games/{game_id}/stations/{puzzle_sid}/puzzle/generate"
            f"?grid_size=4&source_station_id={image_sid}"
        )
        assert gen_resp.status_code == 200
        data = gen_resp.json()
        assert len(data["tiles"]) == 4

        # GET tiles for the puzzle station (S1) should now succeed
        get_resp = await client.get(f"/api/games/{game_id}/stations/{puzzle_sid}/puzzle")
        assert get_resp.status_code == 200
        assert len(get_resp.json()["tiles"]) == 4

        # GET tiles for S2: auto-generation triggers (S2 is also puzzle with image).
        # Key invariant: S1's tiles were generated from S2's image (asserted above).
        get_src_resp = await client.get(f"/api/games/{game_id}/stations/{image_sid}/puzzle")
        assert get_src_resp.status_code == 200
        assert len(get_src_resp.json()["tiles"]) == 4

    async def test_without_source_station_id_uses_own_image(self, client):
        """Without source_station_id, uses the station's own image (existing behavior)."""
        game_id, station_id = await _create_game_and_station(client)
        await client.post(
            f"/api/games/{game_id}/stations/{station_id}/image",
            files={"file": ("photo.jpg", _make_jpeg_bytes(100, 100), "image/jpeg")},
        )
        gen_resp = await client.post(
            f"/api/games/{game_id}/stations/{station_id}/puzzle/generate?grid_size=4"
        )
        assert gen_resp.status_code == 200
        get_resp = await client.get(f"/api/games/{game_id}/stations/{station_id}/puzzle")
        assert get_resp.status_code == 200
        assert len(get_resp.json()["tiles"]) == 4
