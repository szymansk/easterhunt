"""Tests for PuzzleTileService."""
import pytest
from pathlib import Path
from PIL import Image

from app.services.puzzle_tile import GRID_CONFIGS, PuzzleTileService


def _make_oriented_jpeg(tmp_path: Path, width: int, height: int, orientation: int) -> Path:
    """Create a JPEG with the given EXIF orientation tag."""
    img = Image.new("RGB", (width, height), color=(100, 149, 237))
    exif = img.getexif()
    exif[274] = orientation  # 274 = Orientation tag
    path = tmp_path / "oriented.jpg"
    img.save(path, format="JPEG", exif=exif.tobytes())
    return path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_test_image(tmp_path: Path, width: int = 300, height: int = 300) -> Path:
    """Create a small solid-colour JPEG for testing."""
    img = Image.new("RGB", (width, height), color=(100, 149, 237))
    path = tmp_path / "source.jpg"
    img.save(path, format="JPEG")
    return path


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestPuzzleTileServiceGridSizes:
    """Verify tile count and dimensions for each valid grid_size."""

    @pytest.mark.parametrize(
        "grid_size, expected_cols, expected_rows",
        [
            (3, 3, 1),
            (4, 2, 2),
            (6, 2, 3),
            (9, 3, 3),
        ],
    )
    def test_tile_count(
        self,
        tmp_path: Path,
        grid_size: int,
        expected_cols: int,
        expected_rows: int,
    ):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size)

        assert len(tiles) == grid_size, (
            f"Expected {grid_size} tiles, got {len(tiles)}"
        )

    @pytest.mark.parametrize(
        "grid_size, expected_cols, expected_rows",
        [
            (3, 3, 1),
            (4, 2, 2),
            (6, 2, 3),
            (9, 3, 3),
        ],
    )
    def test_tile_dimensions(
        self,
        tmp_path: Path,
        grid_size: int,
        expected_cols: int,
        expected_rows: int,
    ):
        width, height = 300, 300
        source = _make_test_image(tmp_path, width=width, height=height)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size)

        expected_tile_width = width // expected_cols
        expected_tile_height = height // expected_rows

        for tile in tiles:
            with Image.open(tile["path"]) as img:
                assert img.size == (expected_tile_width, expected_tile_height), (
                    f"Tile {tile['index']} has wrong size {img.size}, "
                    f"expected ({expected_tile_width}, {expected_tile_height})"
                )


class TestPuzzleTileServiceIndexing:
    """Verify row-major ordering and metadata."""

    def test_indices_are_sequential_from_zero(self, tmp_path: Path):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size=4)

        indices = [t["index"] for t in tiles]
        assert indices == list(range(4))

    def test_row_major_order(self, tmp_path: Path):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size=4)  # 2 cols x 2 rows

        expected_positions = [
            (0, 0),  # index 0 → row 0, col 0  (top-left)
            (0, 1),  # index 1 → row 0, col 1  (top-right)
            (1, 0),  # index 2 → row 1, col 0  (bottom-left)
            (1, 1),  # index 3 → row 1, col 1  (bottom-right)
        ]
        for tile, (expected_row, expected_col) in zip(tiles, expected_positions):
            assert tile["row"] == expected_row
            assert tile["col"] == expected_col

    def test_tile_zero_is_top_left(self, tmp_path: Path):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size=9)

        tile_zero = tiles[0]
        assert tile_zero["index"] == 0
        assert tile_zero["row"] == 0
        assert tile_zero["col"] == 0


class TestPuzzleTileServiceFilenames:
    """Verify filenames and output directory."""

    def test_filenames_contain_index(self, tmp_path: Path):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size=4)

        for tile in tiles:
            assert tile["path"].name == f"tile_{tile['index']}.jpg"

    def test_tiles_saved_in_puzzle_tiles_subdir(self, tmp_path: Path):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size=4)

        for tile in tiles:
            assert tile["path"].parent.name == "puzzle_tiles"
            assert tile["path"].parent.parent == tmp_path

    def test_output_directory_created_automatically(self, tmp_path: Path):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        output_dir = tmp_path / "puzzle_tiles"
        assert not output_dir.exists()

        service.generate_tiles(source, grid_size=4)

        assert output_dir.is_dir()

    def test_files_exist_on_disk(self, tmp_path: Path):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        tiles = service.generate_tiles(source, grid_size=9)

        for tile in tiles:
            assert tile["path"].exists(), f"{tile['path']} was not created"


class TestExifOrientation:
    def test_tiles_use_exif_corrected_dimensions(self, tmp_path: Path):
        """Puzzle tiles must be generated from the EXIF-transposed image.

        A 300×200 image tagged orientation=6 (rotate 90° CW) should be treated
        as 200×300 (portrait) so tiles are cut from the corrected portrait orientation.
        """
        # Stored: 300 wide × 200 tall; EXIF says display as 200 wide × 300 tall
        source = _make_oriented_jpeg(tmp_path, width=300, height=200, orientation=6)
        service = PuzzleTileService()

        # grid_size=4 → 2 cols × 2 rows; after transpose: 200×300
        # Each tile should be 100×150
        tiles = service.generate_tiles(source, grid_size=4)

        for tile in tiles:
            with Image.open(tile["path"]) as img:
                # width=100, height=150 (portrait tiles from portrait source)
                assert img.width < img.height, (
                    f"Tile {tile['index']} should come from portrait image, got {img.size}"
                )

    def test_orientation1_tiles_unchanged(self, tmp_path: Path):
        """Orientation=1 (no rotation) should produce tiles same as without EXIF."""
        source = _make_oriented_jpeg(tmp_path, width=300, height=300, orientation=1)
        service = PuzzleTileService()
        tiles = service.generate_tiles(source, grid_size=4)
        assert len(tiles) == 4


class TestPuzzleTileServiceInvalidInput:
    """Verify ValueError raised for unsupported grid sizes."""

    @pytest.mark.parametrize("bad_size", [0, 1, 2, 5, 7, 8, 10, 16])
    def test_invalid_grid_size_raises_value_error(self, tmp_path: Path, bad_size: int):
        source = _make_test_image(tmp_path)
        service = PuzzleTileService()

        with pytest.raises(ValueError, match=str(bad_size)):
            service.generate_tiles(source, grid_size=bad_size)
