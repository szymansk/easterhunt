"""Tests for the ImageOptimizationService."""
import pytest
from pathlib import Path
from PIL import Image

from app.services.image_optimization import ImageOptimizationService, MAX_DIMENSION, THUMBNAIL_SIZE


def _make_jpeg_with_exif_orientation(tmp_path: Path, width: int, height: int, orientation: int) -> Path:
    """Create a JPEG with the given EXIF orientation tag."""
    img = Image.new("RGB", (width, height), color=(100, 149, 237))
    exif = img.getexif()
    exif[274] = orientation  # 274 = Orientation tag
    path = tmp_path / "oriented.jpg"
    img.save(path, format="JPEG", exif=exif.tobytes())
    return path


@pytest.fixture
def service():
    return ImageOptimizationService()


@pytest.fixture
def tmp_jpeg(tmp_path: Path) -> Path:
    """Create a 3000x2000 JPEG in a temp directory."""
    img = Image.new("RGB", (3000, 2000), color=(200, 100, 50))
    path = tmp_path / "photo.jpg"
    img.save(path, format="JPEG")
    return path


@pytest.fixture
def tmp_png_rgba(tmp_path: Path) -> Path:
    """Create a 800x600 RGBA PNG with transparency."""
    img = Image.new("RGBA", (800, 600), color=(0, 128, 255, 128))
    path = tmp_path / "transparent.png"
    img.save(path, format="PNG")
    return path


@pytest.fixture
def tmp_png_opaque(tmp_path: Path) -> Path:
    """Create a 500x500 opaque RGB PNG."""
    img = Image.new("RGB", (500, 500), color=(0, 200, 0))
    path = tmp_path / "opaque.png"
    img.save(path, format="PNG")
    return path


# ---------------------------------------------------------------------------
# Resize tests
# ---------------------------------------------------------------------------

class TestResizeToMax:
    def test_large_landscape_is_resized(self, service):
        img = Image.new("RGB", (3000, 2000))
        result = service._resize_to_max(img, MAX_DIMENSION)
        assert max(result.size) <= MAX_DIMENSION

    def test_aspect_ratio_preserved_landscape(self, service):
        img = Image.new("RGB", (4000, 3000))
        result = service._resize_to_max(img, MAX_DIMENSION)
        orig_ratio = 4000 / 3000
        new_ratio = result.width / result.height
        assert abs(orig_ratio - new_ratio) < 0.01

    def test_large_portrait_is_resized(self, service):
        img = Image.new("RGB", (800, 4000))
        result = service._resize_to_max(img, MAX_DIMENSION)
        assert result.height <= MAX_DIMENSION
        assert result.width <= MAX_DIMENSION

    def test_small_image_not_enlarged(self, service):
        img = Image.new("RGB", (600, 400))
        result = service._resize_to_max(img, MAX_DIMENSION)
        assert result.size == (600, 400)

    def test_exact_max_not_changed(self, service):
        img = Image.new("RGB", (MAX_DIMENSION, 800))
        result = service._resize_to_max(img, MAX_DIMENSION)
        assert result.size == (MAX_DIMENSION, 800)

    def test_thumbnail_size(self, service):
        img = Image.new("RGB", (1000, 800))
        result = service._resize_to_max(img, THUMBNAIL_SIZE)
        assert max(result.size) <= THUMBNAIL_SIZE


# ---------------------------------------------------------------------------
# _to_rgb tests
# ---------------------------------------------------------------------------

class TestToRgb:
    def test_rgb_image_unchanged_mode(self, service):
        img = Image.new("RGB", (100, 100), color=(10, 20, 30))
        result = service._to_rgb(img)
        assert result.mode == "RGB"

    def test_rgba_converted_to_rgb(self, service):
        img = Image.new("RGBA", (100, 100), color=(0, 0, 0, 128))
        result = service._to_rgb(img)
        assert result.mode == "RGB"

    def test_transparent_pixel_becomes_white(self, service):
        img = Image.new("RGBA", (10, 10), color=(0, 0, 0, 0))  # fully transparent
        result = service._to_rgb(img)
        pixel = result.getpixel((0, 0))
        assert pixel == (255, 255, 255), f"Expected white, got {pixel}"

    def test_palette_mode_converted(self, service):
        img = Image.new("P", (50, 50))
        result = service._to_rgb(img)
        assert result.mode == "RGB"


# ---------------------------------------------------------------------------
# optimize() integration tests
# ---------------------------------------------------------------------------

class TestOptimize:
    def test_returns_two_paths(self, service, tmp_jpeg):
        optimized, thumb = service.optimize(tmp_jpeg)
        assert isinstance(optimized, Path)
        assert isinstance(thumb, Path)

    def test_output_files_exist(self, service, tmp_jpeg):
        optimized, thumb = service.optimize(tmp_jpeg)
        assert optimized.exists()
        assert thumb.exists()

    def test_original_file_intact(self, service, tmp_jpeg):
        original_size = tmp_jpeg.stat().st_size
        service.optimize(tmp_jpeg)
        assert tmp_jpeg.exists()
        assert tmp_jpeg.stat().st_size == original_size

    def test_optimized_filename_convention(self, service, tmp_jpeg):
        optimized, thumb = service.optimize(tmp_jpeg)
        assert optimized.name == "photo_optimized.jpg"
        assert thumb.name == "photo_thumb.jpg"

    def test_outputs_saved_next_to_original(self, service, tmp_jpeg):
        optimized, thumb = service.optimize(tmp_jpeg)
        assert optimized.parent == tmp_jpeg.parent
        assert thumb.parent == tmp_jpeg.parent

    def test_3000px_image_resized_to_1200(self, service, tmp_jpeg):
        """AC-7: A 3000px image must produce an output with longest side <= 1200px."""
        optimized, _ = service.optimize(tmp_jpeg)
        result_img = Image.open(optimized)
        assert max(result_img.size) <= MAX_DIMENSION

    def test_thumbnail_max_300px(self, service, tmp_jpeg):
        _, thumb = service.optimize(tmp_jpeg)
        thumb_img = Image.open(thumb)
        assert max(thumb_img.size) <= THUMBNAIL_SIZE

    def test_output_is_jpeg(self, service, tmp_jpeg):
        optimized, thumb = service.optimize(tmp_jpeg)
        assert Image.open(optimized).format == "JPEG"
        assert Image.open(thumb).format == "JPEG"

    def test_png_with_transparency_converted_to_jpeg(self, service, tmp_png_rgba):
        optimized, thumb = service.optimize(tmp_png_rgba)
        assert optimized.exists()
        assert Image.open(optimized).format == "JPEG"
        assert Image.open(optimized).mode == "RGB"

    def test_opaque_png_converted_to_jpeg(self, service, tmp_png_opaque):
        optimized, _ = service.optimize(tmp_png_opaque)
        assert Image.open(optimized).format == "JPEG"

    def test_small_image_not_enlarged(self, service, tmp_png_opaque):
        """A 500x500 image should remain at or below 500x500 after optimization."""
        optimized, _ = service.optimize(tmp_png_opaque)
        result_img = Image.open(optimized)
        assert result_img.width <= 500
        assert result_img.height <= 500


# ---------------------------------------------------------------------------
# HEIC fallback test
# ---------------------------------------------------------------------------

class TestExifOrientation:
    def test_portrait_jpeg_with_exif_rotation6_is_transposed(self, service, tmp_path):
        """A landscape JPEG tagged as orientation=6 (rotate 90° CW) must be opened
        as portrait after _open_image applies exif_transpose."""
        # Stored as landscape (200×100) but EXIF says display as portrait (100×200)
        source = _make_jpeg_with_exif_orientation(tmp_path, width=200, height=100, orientation=6)
        img = service._open_image(source)
        # After transpose the width should be the short side
        assert img.width < img.height, (
            f"Expected portrait orientation after exif_transpose, got {img.size}"
        )

    def test_optimize_respects_exif_orientation(self, service, tmp_path):
        """optimize() must apply EXIF transpose so the output image has correct proportions."""
        source = _make_jpeg_with_exif_orientation(tmp_path, width=200, height=100, orientation=6)
        optimized, _ = service.optimize(source)
        result = Image.open(optimized)
        assert result.width < result.height, (
            f"Optimized image should be portrait after EXIF correction, got {result.size}"
        )


class TestHeicFallback:
    def test_heic_raises_valueerror_without_pillow_heif(self, service, tmp_path, monkeypatch):
        """When pillow_heif is not importable, opening a HEIC raises ValueError."""
        import builtins
        import sys

        real_import = builtins.__import__

        def mock_import(name, *args, **kwargs):
            if name == "pillow_heif":
                raise ImportError("No module named 'pillow_heif'")
            return real_import(name, *args, **kwargs)

        # Create a dummy .heic file (content doesn't matter for this test)
        heic_path = tmp_path / "photo.heic"
        heic_path.write_bytes(b"\x00" * 16)

        # Remove from sys.modules so the import is attempted fresh
        monkeypatch.delitem(sys.modules, "pillow_heif", raising=False)
        monkeypatch.setattr(builtins, "__import__", mock_import)

        with pytest.raises(ValueError, match="pillow-heif"):
            service._open_image(heic_path)
