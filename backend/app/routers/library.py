"""Read-only Content Library API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.game import LibraryItem, LibraryTask
from app.schemas.game import LibraryItemRead, LibraryTaskRead

router = APIRouter(prefix="/api/library", tags=["library"])

_MEDIA_PREFIX = "/media/"


def _item_to_read(item: LibraryItem) -> LibraryItemRead:
    return LibraryItemRead(
        id=item.id,
        name=item.name,
        category=item.category,
        image_url=_MEDIA_PREFIX + item.image_path if item.image_path else None,
        metadata_json=item.metadata_json or {},
    )


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)) -> list[str]:
    rows = db.query(LibraryItem.category).distinct().all()
    return sorted(row[0] for row in rows)


@router.get("/items", response_model=list[LibraryItemRead])
def list_items(
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[LibraryItemRead]:
    q = db.query(LibraryItem)
    if category is not None:
        q = q.filter(LibraryItem.category == category)
    return [_item_to_read(item) for item in q.all()]


@router.get("/items/{item_id}", response_model=LibraryItemRead)
def get_item(item_id: str, db: Session = Depends(get_db)) -> LibraryItemRead:
    item = db.get(LibraryItem, item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Library item {item_id} not found",
        )
    return _item_to_read(item)


@router.get("/tasks", response_model=list[LibraryTaskRead])
def list_tasks(
    mini_game_type: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[LibraryTaskRead]:
    q = db.query(LibraryTask)
    if mini_game_type is not None:
        q = q.filter(LibraryTask.mini_game_type == mini_game_type)
    if category is not None:
        q = q.filter(LibraryTask.category == category)
    return [_build_task_read(task, db) for task in q.all()]


@router.get("/tasks/{task_id}", response_model=LibraryTaskRead)
def get_task(task_id: str, db: Session = Depends(get_db)) -> LibraryTaskRead:
    task = db.get(LibraryTask, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Library task {task_id} not found",
        )
    return _build_task_read(task, db)


def _build_task_read(task: LibraryTask, db: Session) -> LibraryTaskRead:
    """Resolve item IDs to full LibraryItemRead objects."""

    def _fetch(item_id: str) -> LibraryItemRead | None:
        item = db.get(LibraryItem, item_id)
        return _item_to_read(item) if item else None

    reference_items = [r for ref_id in task.reference_items_json if (r := _fetch(ref_id))]
    correct_answer = _fetch(task.correct_answer_id)
    distractors = [r for did in task.distractor_ids_json if (r := _fetch(did))]

    # answer_options = correct + distractors (order: correct first, then distractors)
    answer_options = ([correct_answer] if correct_answer else []) + distractors

    return LibraryTaskRead(
        id=task.id,
        mini_game_type=task.mini_game_type,
        category=task.category,
        reference_items=reference_items,
        correct_answer=correct_answer,
        answer_options=answer_options,
        question=task.question,
        options_json=task.options_json,
    )
