"""Seed the content library from data/content/manifest.json.

Run with:
    python -m app.db.seed_content

The script is idempotent: existing items/tasks (matched by id) are skipped.
"""

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.engine import engine
from app.models import Base, LibraryItem, LibraryTask, MiniGameType

MANIFEST_PATH = Path(__file__).parent.parent.parent / "data" / "content" / "manifest.json"


def _validate_manifest(manifest: dict) -> None:
    """Raise ValueError if any picture_riddle task has reference/answer overlap."""
    for task in manifest.get("tasks", []):
        if task.get("mini_game_type") != "picture_riddle":
            continue
        refs = set(task.get("reference_item_ids", []))
        answers = {task["correct_answer_id"]} | set(task.get("distractor_ids", []))
        overlap = refs & answers
        if overlap:
            raise ValueError(
                f"Task {task['id']}: reference_item_ids and answer set overlap: {overlap}"
            )


def seed(db: Session, manifest_path: Path = MANIFEST_PATH) -> dict[str, int]:
    """Seed library items and tasks from manifest. Returns counts of inserted records."""
    with manifest_path.open() as f:
        manifest = json.load(f)

    _validate_manifest(manifest)

    items_inserted = 0
    for item_data in manifest.get("items", []):
        existing = db.get(LibraryItem, item_data["id"])
        if existing is None:
            db.add(
                LibraryItem(
                    id=item_data["id"],
                    name=item_data["name"],
                    category=item_data["category"],
                    image_path=item_data.get("image_path"),
                    metadata_json=item_data.get("metadata", {}),
                )
            )
            items_inserted += 1

    tasks_inserted = 0
    for task_data in manifest.get("tasks", []):
        existing = db.get(LibraryTask, task_data["id"])
        if existing is None:
            db.add(
                LibraryTask(
                    id=task_data["id"],
                    mini_game_type=MiniGameType(task_data["mini_game_type"]),
                    category=task_data["category"],
                    reference_items_json=task_data.get("reference_item_ids", []),
                    correct_answer_id=task_data.get("correct_answer_id"),
                    distractor_ids_json=task_data.get("distractor_ids", []),
                    question=task_data.get("question"),
                    options_json=task_data.get("options"),
                )
            )
            tasks_inserted += 1

    db.commit()
    return {"items": items_inserted, "tasks": tasks_inserted}


def main() -> None:
    Base.metadata.create_all(engine)
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        counts = seed(db)
        print(f"Seeded {counts['items']} items and {counts['tasks']} tasks.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
