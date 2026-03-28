"""Tests for content library seed script."""

import json

from app.db.seed_content import MANIFEST_PATH, seed
from app.models import LibraryItem, LibraryTask


def test_seed_inserts_items_and_tasks(db_session):
    counts = seed(db_session)
    assert counts["items"] >= 10
    assert counts["tasks"] >= 5


def test_seed_items_queryable(db_session):
    seed(db_session)
    items = db_session.query(LibraryItem).all()
    assert len(items) >= 10
    # Each item has required fields
    for item in items:
        assert item.id
        assert item.name
        assert item.category
        assert item.metadata_json is not None


def test_seed_tasks_queryable(db_session):
    seed(db_session)
    tasks = db_session.query(LibraryTask).all()
    assert len(tasks) >= 5
    for task in tasks:
        assert task.id
        assert task.mini_game_type
        assert task.category
        assert isinstance(task.reference_items_json, list)
        assert task.correct_answer_id
        assert isinstance(task.distractor_ids_json, list)


def test_seed_idempotent(db_session):
    """Running seed twice should not create duplicates."""
    counts_first = seed(db_session)
    counts_second = seed(db_session)

    # Second run inserts nothing
    assert counts_second["items"] == 0
    assert counts_second["tasks"] == 0

    # Total counts unchanged
    items = db_session.query(LibraryItem).count()
    tasks = db_session.query(LibraryTask).count()
    assert items == counts_first["items"]
    assert tasks == counts_first["tasks"]


def test_seed_categories(db_session):
    seed(db_session)
    categories = {item.category for item in db_session.query(LibraryItem).all()}
    expected = {"spielzeug", "haushalt", "kita", "essen", "basteln", "kleidung"}
    assert expected.issubset(categories)


def test_manifest_valid_json():
    """Manifest file is valid JSON."""
    assert MANIFEST_PATH.exists(), f"Manifest not found at {MANIFEST_PATH}"
    with MANIFEST_PATH.open() as f:
        data = json.load(f)
    assert "items" in data
    assert "tasks" in data
    assert len(data["items"]) >= 10
    assert len(data["tasks"]) >= 5
