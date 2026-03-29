"""Image optimization service using Pillow."""
from pathlib import Path

from PIL import Image, ImageOps

MAX_DIMENSION = 1200
THUMBNAIL_SIZE = 300


class ImageOptimizationService:
    """Optimize images: resize, convert to JPEG, generate thumbnails."""

    def optimize(self, source_path: Path) -> tuple[Path, Path]:
        """Optimize an image file.

        Resizes to max 1200px on the longest side, converts to JPEG, and
        generates a 300px thumbnail. Saves both next to the source file.
        The original file is left intact.

        Returns:
            (optimized_path, thumbnail_path) as absolute Path objects.
        """
        img = self._open_image(source_path)
        img = self._to_rgb(img)
        img = self._resize_to_max(img, MAX_DIMENSION)

        stem = source_path.stem
        directory = source_path.parent

        optimized_path = directory / f"{stem}_optimized.jpg"
        img.save(optimized_path, format="JPEG", quality=85, optimize=True)

        thumbnail = self._resize_to_max(img, THUMBNAIL_SIZE)
        thumbnail_path = directory / f"{stem}_thumb.jpg"
        thumbnail.save(thumbnail_path, format="JPEG", quality=85, optimize=True)

        return optimized_path, thumbnail_path

    def _open_image(self, source_path: Path) -> Image.Image:
        """Open image, handling HEIC format if possible."""
        suffix = source_path.suffix.lower()
        if suffix in {".heic", ".heif"}:
            try:
                import pillow_heif  # type: ignore[import]

                pillow_heif.register_heif_opener()
            except ImportError as exc:
                raise ValueError(
                    f"HEIC/HEIF support requires pillow-heif to be installed: {exc}"
                ) from exc

        img = Image.open(source_path)
        return ImageOps.exif_transpose(img)

    def _to_rgb(self, img: Image.Image) -> Image.Image:
        """Convert image to RGB, compositing transparency onto a white background."""
        if img.mode == "RGB":
            return img

        if img.mode in {"RGBA", "LA", "P"}:
            # Ensure we work in RGBA for consistent compositing
            rgba = img.convert("RGBA")
            background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
            background.paste(rgba, mask=rgba.split()[3])
            return background.convert("RGB")

        return img.convert("RGB")

    def _resize_to_max(self, img: Image.Image, max_dim: int) -> Image.Image:
        """Resize image so the longest side is at most max_dim, preserving aspect ratio.

        Returns the original image object unchanged if it already fits.
        """
        width, height = img.size
        longest = max(width, height)
        if longest <= max_dim:
            return img

        scale = max_dim / longest
        new_width = max(1, round(width * scale))
        new_height = max(1, round(height * scale))
        return img.resize((new_width, new_height), Image.LANCZOS)
