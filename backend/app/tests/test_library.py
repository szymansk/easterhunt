"""Tests for Content Library API endpoints (easter-a9a.2)."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base, LibraryItem, LibraryTask
from app.models.game import MiniGameType


@pytest.fixture
async def client():
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

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
    test_engine.dispose()


@pytest.fixture
async def seeded_client(client):
    """Client with pre-seeded library data."""
    # Seed via the dependency override (use internal DB)
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()

    items = [
        LibraryItem(id="item-1", name="Ball", category="spielzeug", image_path="content/images/ball.svg", metadata_json={}),
        LibraryItem(id="item-2", name="Auto", category="spielzeug", image_path="content/images/car.svg", metadata_json={}),
        LibraryItem(id="item-3", name="Teddybär", category="spielzeug", image_path="content/images/teddy.svg", metadata_json={}),
        LibraryItem(id="item-4", name="Tasse", category="haushalt", image_path="content/images/cup.svg", metadata_json={}),
        LibraryItem(id="item-5", name="Apfel", category="essen", image_path="content/images/apple.svg", metadata_json={}),
    ]
    tasks = [
        LibraryTask(
            id="task-1",
            mini_game_type=MiniGameType.picture_riddle,
            category="spielzeug",
            reference_items_json=["item-1", "item-2"],
            correct_answer_id="item-3",
            distractor_ids_json=["item-4", "item-5"],
        ),
    ]
    for obj in items + tasks:
        db.add(obj)
    db.commit()

    # Override client's DB with seeded data
    def seeded_get_db():
        s = Session()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = seeded_get_db
    yield client
    app.dependency_overrides.clear()
    engine.dispose()


class TestLibraryCategories:
    async def test_get_categories_returns_list(self, seeded_client):
        resp = await seeded_client.get("/api/library/categories")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert "spielzeug" in data
        assert "haushalt" in data
        assert "essen" in data

    async def test_get_categories_sorted(self, seeded_client):
        resp = await seeded_client.get("/api/library/categories")
        data = resp.json()
        assert data == sorted(data)


class TestLibraryItems:
    async def test_list_all_items(self, seeded_client):
        resp = await seeded_client.get("/api/library/items")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 5

    async def test_list_items_filter_by_category(self, seeded_client):
        resp = await seeded_client.get("/api/library/items?category=spielzeug")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        assert all(item["category"] == "spielzeug" for item in data)

    async def test_list_items_unknown_category_returns_empty(self, seeded_client):
        resp = await seeded_client.get("/api/library/items?category=nonexistent")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_get_item_by_id(self, seeded_client):
        resp = await seeded_client.get("/api/library/items/item-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "item-1"
        assert data["name"] == "Ball"
        assert data["image_url"] == "/media/content/images/ball.svg"

    async def test_get_item_image_url_resolved(self, seeded_client):
        resp = await seeded_client.get("/api/library/items/item-1")
        data = resp.json()
        assert data["image_url"].startswith("/media/")

    async def test_get_item_not_found(self, seeded_client):
        resp = await seeded_client.get("/api/library/items/nonexistent")
        assert resp.status_code == 404


class TestLibraryTasks:
    async def test_list_tasks(self, seeded_client):
        resp = await seeded_client.get("/api/library/tasks")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1

    async def test_list_tasks_filter_by_mini_game_type(self, seeded_client):
        resp = await seeded_client.get("/api/library/tasks?mini_game_type=picture_riddle")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["mini_game_type"] == "picture_riddle"

    async def test_list_tasks_filter_by_category(self, seeded_client):
        resp = await seeded_client.get("/api/library/tasks?category=spielzeug")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1

    async def test_get_task_by_id(self, seeded_client):
        resp = await seeded_client.get("/api/library/tasks/task-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "task-1"
        assert data["mini_game_type"] == "picture_riddle"

    async def test_get_task_has_resolved_reference_items(self, seeded_client):
        resp = await seeded_client.get("/api/library/tasks/task-1")
        data = resp.json()
        assert len(data["reference_items"]) == 2
        for ref in data["reference_items"]:
            assert "image_url" in ref
            assert ref["image_url"].startswith("/media/")

    async def test_get_task_has_answer_options(self, seeded_client):
        resp = await seeded_client.get("/api/library/tasks/task-1")
        data = resp.json()
        assert len(data["answer_options"]) == 3  # correct + 2 distractors
        # correct answer is included
        assert data["correct_answer"]["id"] == "item-3"

    async def test_get_task_not_found(self, seeded_client):
        resp = await seeded_client.get("/api/library/tasks/nonexistent")
        assert resp.status_code == 404

    async def test_endpoints_are_read_only(self, seeded_client):
        resp_post = await seeded_client.post("/api/library/items", json={})
        resp_put = await seeded_client.put("/api/library/items/item-1", json={})
        resp_delete = await seeded_client.delete("/api/library/items/item-1")
        assert resp_post.status_code == 405
        assert resp_put.status_code == 405
        assert resp_delete.status_code == 405
