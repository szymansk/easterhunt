"""Tests for PictureRiddleConfig validation and station API (easter-ngj.1)."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Base
from app.schemas.game import PictureRiddleConfig

# ── Schema-level unit tests ──────────────────────────────────────────────────

REF_ITEM = {"image_url": "/media/toy.svg", "label": "Spielzeug"}
CORRECT_OPT = {"image_url": "/media/ball.svg", "label": "Ball", "is_correct": True}
WRONG_OPT = {"image_url": "/media/car.svg", "label": "Auto", "is_correct": False}


def _make_config(reference_items=None, answer_options=None, category="Spielzeug"):
    return {
        "type": "picture_riddle",
        "category": category,
        "reference_items": reference_items if reference_items is not None else [REF_ITEM, REF_ITEM],
        "answer_options": answer_options
        if answer_options is not None
        else [CORRECT_OPT, WRONG_OPT, WRONG_OPT, WRONG_OPT],
    }


def test_valid_picture_riddle_config():
    cfg = PictureRiddleConfig(**_make_config())
    assert cfg.category == "Spielzeug"
    assert len(cfg.reference_items) == 2
    assert len(cfg.answer_options) == 4
    correct = [o for o in cfg.answer_options if o.is_correct]
    assert len(correct) == 1


def test_too_few_reference_items_raises():
    with pytest.raises(Exception):
        PictureRiddleConfig(**_make_config(reference_items=[REF_ITEM]))


def test_too_many_reference_items_raises():
    with pytest.raises(Exception):
        PictureRiddleConfig(**_make_config(reference_items=[REF_ITEM, REF_ITEM, REF_ITEM]))


def test_too_few_answer_options_raises():
    with pytest.raises(Exception):
        PictureRiddleConfig(**_make_config(answer_options=[CORRECT_OPT, WRONG_OPT, WRONG_OPT]))


def test_too_many_answer_options_raises():
    with pytest.raises(Exception):
        PictureRiddleConfig(
            **_make_config(
                answer_options=[CORRECT_OPT, WRONG_OPT, WRONG_OPT, WRONG_OPT, WRONG_OPT]
            )
        )


def test_zero_correct_answers_raises():
    opts = [WRONG_OPT, WRONG_OPT, WRONG_OPT, WRONG_OPT]
    with pytest.raises(Exception):
        PictureRiddleConfig(**_make_config(answer_options=opts))


def test_two_correct_answers_raises():
    opts = [CORRECT_OPT, CORRECT_OPT, WRONG_OPT, WRONG_OPT]
    with pytest.raises(Exception):
        PictureRiddleConfig(**_make_config(answer_options=opts))


def test_library_item_id_optional():
    ref = {**REF_ITEM, "library_item_id": "lib-item-123"}
    opt_c = {**CORRECT_OPT, "library_item_id": "lib-item-456"}
    cfg = PictureRiddleConfig(
        **_make_config(
            reference_items=[ref, REF_ITEM],
            answer_options=[opt_c, WRONG_OPT, WRONG_OPT, WRONG_OPT],
        )
    )
    assert cfg.reference_items[0].library_item_id == "lib-item-123"
    assert cfg.answer_options[0].library_item_id == "lib-item-456"


def test_question_optional():
    cfg = PictureRiddleConfig(**_make_config())
    assert cfg.question is None
    cfg2 = PictureRiddleConfig(**{**_make_config(), "question": "Was gehört dazu?"})
    assert cfg2.question == "Was gehört dazu?"


# ── HTTP integration tests ───────────────────────────────────────────────────

VALID_CONFIG = _make_config()


@pytest.fixture
def override_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def _get_test_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def client(override_db):
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _create_game(client) -> str:
    resp = await client.post("/api/games", json={"name": "Test"})
    return resp.json()["id"]


async def test_create_picture_riddle_station_valid(client):
    async with client as c:
        game_id = await _create_game(c)
        resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": 1,
                "mini_game_type": "picture_riddle",
                "mini_game_config": VALID_CONFIG,
            },
        )
    assert resp.status_code == 201
    data = resp.json()
    assert data["mini_game_type"] == "picture_riddle"
    cfg = data["mini_game_config"]
    assert cfg["category"] == "Spielzeug"
    assert len(cfg["reference_items"]) == 2
    assert len(cfg["answer_options"]) == 4


async def test_create_picture_riddle_station_3_answers_returns_422(client):
    bad_config = _make_config(answer_options=[CORRECT_OPT, WRONG_OPT, WRONG_OPT])
    async with client as c:
        game_id = await _create_game(c)
        resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": 1,
                "mini_game_type": "picture_riddle",
                "mini_game_config": bad_config,
            },
        )
    assert resp.status_code == 422


async def test_create_picture_riddle_station_2_correct_returns_422(client):
    bad_opts = [CORRECT_OPT, CORRECT_OPT, WRONG_OPT, WRONG_OPT]
    bad_config = _make_config(answer_options=bad_opts)
    async with client as c:
        game_id = await _create_game(c)
        resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": 1,
                "mini_game_type": "picture_riddle",
                "mini_game_config": bad_config,
            },
        )
    assert resp.status_code == 422


async def test_create_picture_riddle_station_1_reference_returns_422(client):
    bad_config = _make_config(reference_items=[REF_ITEM])
    async with client as c:
        game_id = await _create_game(c)
        resp = await c.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": 1,
                "mini_game_type": "picture_riddle",
                "mini_game_config": bad_config,
            },
        )
    assert resp.status_code == 422


async def test_get_picture_riddle_station_returns_image_urls(client):
    """GET mini-game returns resolved image_url fields in response."""
    async with client as c:
        game_id = await _create_game(c)
        await c.post(
            f"/api/games/{game_id}/stations",
            json={
                "position": 1,
                "mini_game_type": "picture_riddle",
                "mini_game_config": VALID_CONFIG,
            },
        )
        resp = await c.get(f"/api/games/{game_id}/stations")
    assert resp.status_code == 200
    stations = resp.json()
    cfg = stations[0]["mini_game_config"]
    assert all("image_url" in item for item in cfg["reference_items"])
    assert all("image_url" in opt for opt in cfg["answer_options"])
