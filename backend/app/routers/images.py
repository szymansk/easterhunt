"""Image upload and puzzle tile API endpoints."""
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.game import Station
from app.services.image_optimization import ImageOptimizationService
from app.services.puzzle_tile import GRID_CONFIGS, PuzzleTileService

router = APIRouter(prefix="/api/games", tags=["images"])

DATA_DIR = Path(__file__).parent.parent.parent / "data"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/heic", "image/heif"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".heif"}

_optimization_service = ImageOptimizationService()
_puzzle_service = PuzzleTileService()


class ImageUploadResponse(BaseModel):
    image_path: str
    thumbnail_path: str


class TileInfo(BaseModel):
    url: str
    index: int
    row: int
    col: int


class GridInfo(BaseModel):
    rows: int
    cols: int


class PuzzleResponse(BaseModel):
    tiles: list[TileInfo]
    grid: GridInfo
    tile_width: int
    tile_height: int


def _get_station_or_404(game_id: str, station_id: str, db: Session) -> Station:
    station = (
        db.query(Station)
        .filter(Station.id == station_id, Station.game_id == game_id)
        .first()
    )
    if station is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station {station_id} not found in game {game_id}",
        )
    return station


def _station_upload_dir(game_id: str, station_id: str) -> Path:
    return DATA_DIR / "uploads" / "games" / game_id / "stations" / station_id


def _path_to_media_url(path: Path) -> str:
    """Convert an absolute data/ path to a /media/ URL."""
    relative = path.relative_to(DATA_DIR)
    return f"/media/{relative}"


@router.post(
    "/{game_id}/stations/{station_id}/image",
    status_code=status.HTTP_201_CREATED,
    response_model=ImageUploadResponse,
)
async def upload_station_image(
    game_id: str,
    station_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ImageUploadResponse:
    station = _get_station_or_404(game_id, station_id, db)

    # Validate file extension
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nur Bildformate erlaubt",
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Datei zu groß. Maximum: 20MB",
        )

    # Save original file
    upload_dir = _station_upload_dir(game_id, station_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    original_path = upload_dir / f"original{suffix}"
    original_path.write_bytes(content)

    # Optimize
    try:
        optimized_path, thumbnail_path = _optimization_service.optimize(original_path)
    except ValueError as exc:
        original_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # Update station
    image_url = _path_to_media_url(optimized_path)
    station.image_path = image_url
    db.commit()

    return ImageUploadResponse(
        image_path=image_url,
        thumbnail_path=_path_to_media_url(thumbnail_path),
    )


@router.post(
    "/{game_id}/stations/{station_id}/puzzle/generate",
    response_model=PuzzleResponse,
)
def generate_puzzle_tiles(
    game_id: str,
    station_id: str,
    grid_size: int,
    source_station_id: str | None = Query(None),
    db: Session = Depends(get_db),
) -> PuzzleResponse:
    """Generate puzzle tiles and store them in station_id's config.

    If source_station_id is provided, the image is taken from that station
    (useful when the puzzle at station N shows the image of station N+1).
    Tiles are always stored in station_id's mini_game_config.
    """
    station = _get_station_or_404(game_id, station_id, db)

    # Determine which station provides the source image
    if source_station_id and source_station_id != station_id:
        image_station = _get_station_or_404(game_id, source_station_id, db)
    else:
        image_station = station

    if not image_station.image_path:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Kein Stationsbild vorhanden",
        )

    if grid_size not in GRID_CONFIGS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Ungültige grid_size {grid_size}. Erlaubt: {sorted(GRID_CONFIGS)}",
        )

    # Resolve image path from URL to filesystem path
    image_rel = image_station.image_path.removeprefix("/media/")
    image_fs_path = DATA_DIR / image_rel
    if not image_fs_path.exists():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Bilddatei nicht gefunden",
        )

    # Remove old tiles if they exist (stored alongside the source image)
    tiles_dir = image_fs_path.parent / "puzzle_tiles"
    if tiles_dir.exists():
        shutil.rmtree(tiles_dir)

    try:
        tiles = _puzzle_service.generate_tiles(image_fs_path, grid_size)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    cols, rows = GRID_CONFIGS[grid_size]

    tile_infos = [
        TileInfo(
            url=_path_to_media_url(t["path"]),
            index=t["index"],
            row=t["row"],
            col=t["col"],
        )
        for t in tiles
    ]

    # Compute tile pixel dimensions from the (EXIF-corrected) image size
    from PIL import Image as _Image
    from PIL import ImageOps as _ImageOps
    with _Image.open(image_fs_path) as _img:
        _img = _ImageOps.exif_transpose(_img)
        img_width, img_height = _img.size
    tile_w = img_width // cols
    tile_h = img_height // rows

    # Persist tile metadata in the puzzle station's config (station_id, not source_station_id)
    station.mini_game_config = {
        **station.mini_game_config,
        "tiles": [t.model_dump() for t in tile_infos],
        "grid": {"rows": rows, "cols": cols},
        "tile_width": tile_w,
        "tile_height": tile_h,
    }
    db.commit()

    return PuzzleResponse(
        tiles=tile_infos,
        grid=GridInfo(rows=rows, cols=cols),
        tile_width=tile_w,
        tile_height=tile_h,
    )


@router.get(
    "/{game_id}/stations/{station_id}/puzzle",
    response_model=PuzzleResponse,
)
def get_puzzle_tiles(
    game_id: str,
    station_id: str,
    db: Session = Depends(get_db),
) -> PuzzleResponse:
    station = _get_station_or_404(game_id, station_id, db)

    config = station.mini_game_config or {}

    # Auto-generate tiles if not yet created but station is a puzzle with an image
    if ("tiles" not in config or "grid" not in config) and station.image_path and station.mini_game_type == "puzzle":
        grid_size = config.get("grid_size", 4)
        if grid_size not in GRID_CONFIGS:
            grid_size = 4

        image_rel = station.image_path.removeprefix("/media/")
        image_fs_path = DATA_DIR / image_rel

        if image_fs_path.exists():
            tiles_dir = image_fs_path.parent / "puzzle_tiles"
            if tiles_dir.exists():
                shutil.rmtree(tiles_dir)

            tiles = _puzzle_service.generate_tiles(image_fs_path, grid_size)
            cols, rows = GRID_CONFIGS[grid_size]
            tile_infos = [
                TileInfo(url=_path_to_media_url(t["path"]), index=t["index"], row=t["row"], col=t["col"])
                for t in tiles
            ]
            from PIL import Image as _Image
            from PIL import ImageOps as _ImageOps
            with _Image.open(image_fs_path) as _img:
                _img = _ImageOps.exif_transpose(_img)
                img_width, img_height = _img.size
            tile_w = img_width // cols
            tile_h = img_height // rows
            station.mini_game_config = {
                **config,
                "tiles": [t.model_dump() for t in tile_infos],
                "grid": {"rows": rows, "cols": cols},
                "tile_width": tile_w,
                "tile_height": tile_h,
            }
            db.commit()
            return PuzzleResponse(
                tiles=tile_infos,
                grid=GridInfo(rows=rows, cols=cols),
                tile_width=tile_w,
                tile_height=tile_h,
            )

    if "tiles" not in config or "grid" not in config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keine Puzzle-Daten vorhanden. Bitte zuerst generieren.",
        )

    grid_data = config["grid"]
    tile_infos = [TileInfo(**t) for t in config["tiles"]]
    tile_w = config.get("tile_width", grid_data.get("tile_width", 1))
    tile_h = config.get("tile_height", grid_data.get("tile_height", 1))
    return PuzzleResponse(
        tiles=tile_infos,
        grid=GridInfo(rows=grid_data["rows"], cols=grid_data["cols"]),
        tile_width=tile_w,
        tile_height=tile_h,
    )
