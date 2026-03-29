"""Puzzle tile generation service."""
from pathlib import Path

from PIL import Image, ImageOps

# Maps grid_size (total number of tiles) to (cols, rows)
GRID_CONFIGS: dict[int, tuple[int, int]] = {
    3: (3, 1),  # 3 cols, 1 row  → tile width = img/3, full height
    4: (2, 2),  # 2 cols, 2 rows
    6: (2, 3),  # 2 cols, 3 rows
    9: (3, 3),  # 3 cols, 3 rows
}


class PuzzleTileService:
    def generate_tiles(
        self, source_path: Path, grid_size: int
    ) -> list[dict]:
        """Split image into puzzle tiles.

        Args:
            source_path: Path to the source image file.
            grid_size: Total number of tiles (3, 4, 6, or 9).

        Returns:
            List of dicts sorted by index (row-major order).
            Each dict contains: {path, index, row, col}.

        Raises:
            ValueError: If grid_size is not one of 3, 4, 6, or 9.
        """
        if grid_size not in GRID_CONFIGS:
            raise ValueError(
                f"Invalid grid_size {grid_size!r}. "
                f"Must be one of {sorted(GRID_CONFIGS)}."
            )

        cols, rows = GRID_CONFIGS[grid_size]

        output_dir = source_path.parent / "puzzle_tiles"
        output_dir.mkdir(parents=True, exist_ok=True)

        with Image.open(source_path) as raw_img:
            img = ImageOps.exif_transpose(raw_img)
            img_width, img_height = img.size

            tile_width = img_width // cols
            tile_height = img_height // rows

            tiles: list[dict] = []
            index = 0

            for row in range(rows):
                for col in range(cols):
                    left = col * tile_width
                    upper = row * tile_height
                    # Use full remaining width/height for last column/row
                    # to avoid gaps caused by integer division.
                    right = img_width if col == cols - 1 else left + tile_width
                    lower = img_height if row == rows - 1 else upper + tile_height

                    tile = img.crop((left, upper, right, lower))

                    tile_path = output_dir / f"tile_{index}.jpg"
                    tile.convert("RGB").save(tile_path, format="JPEG")

                    tiles.append(
                        {
                            "path": tile_path,
                            "index": index,
                            "row": row,
                            "col": col,
                        }
                    )
                    index += 1

        return tiles
