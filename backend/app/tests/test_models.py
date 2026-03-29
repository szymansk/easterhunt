"""Tests for SQLAlchemy models: create tables and insert one row per model."""

from app.models import (
    Game,
    GameProgress,
    GameStatus,
    MiniGameType,
    RiddleItem,
    RiddleTask,
    Station,
)


def test_create_tables_and_insert_rows(db_session):
    """All tables are created and accept one row per model."""
    # Game
    game = Game(name="Easter Hunt 2026", status=GameStatus.draft)
    db_session.add(game)
    db_session.flush()
    assert game.id is not None
    assert game.status == GameStatus.draft

    # Station
    station = Station(
        game_id=game.id,
        position=1,
        mini_game_type=MiniGameType.puzzle,
        mini_game_config={"type": "puzzle", "grid_size": 4},
    )
    db_session.add(station)
    db_session.flush()
    assert station.id is not None
    assert station.game_id == game.id

    # GameProgress
    progress = GameProgress(
        game_id=game.id,
        current_station=1,
        stations_completed=[],
    )
    db_session.add(progress)
    db_session.flush()
    assert progress.id is not None

    # RiddleItem
    riddle_item = RiddleItem(
        station_id=station.id,
        label="Egg A",
    )
    db_session.add(riddle_item)
    db_session.flush()
    assert riddle_item.id is not None

    # RiddleTask
    riddle_task = RiddleTask(
        station_id=station.id,
        question="How many eggs?",
        answer="5",
    )
    db_session.add(riddle_task)
    db_session.flush()
    assert riddle_task.id is not None

    db_session.commit()

    # Verify rows exist after commit
    loaded_game = db_session.get(Game, game.id)
    assert loaded_game is not None
    assert loaded_game.name == "Easter Hunt 2026"

    loaded_station = db_session.get(Station, station.id)
    assert loaded_station is not None
    assert loaded_station.position == 1
    assert loaded_station.mini_game_config == {"type": "puzzle", "grid_size": 4}


def test_game_status_enum_values(db_session):
    """GameStatus enum has the three expected values."""
    for status in (GameStatus.draft, GameStatus.started, GameStatus.finished):
        game = Game(name=f"Game {status.value}", status=status)
        db_session.add(game)
    db_session.commit()


def test_mini_game_type_enum_values(db_session):
    """MiniGameType enum has all six expected values."""
    expected = {
        MiniGameType.puzzle,
        MiniGameType.number_riddle,
        MiniGameType.maze,
        MiniGameType.text_riddle,
        MiniGameType.picture_riddle,
        MiniGameType.treasure,
    }
    assert set(MiniGameType) == expected


def test_station_cascade_delete(db_session):
    """Deleting a Game cascades to its Stations, RiddleItems, and RiddleTasks."""
    game = Game(name="Cascade Test")
    db_session.add(game)
    db_session.flush()

    station = Station(
        game_id=game.id,
        position=1,
        mini_game_type=MiniGameType.maze,
        mini_game_config={"type": "maze", "maze_data": {}},
    )
    db_session.add(station)
    db_session.flush()

    riddle_item = RiddleItem(station_id=station.id, label="Item 1")
    riddle_task = RiddleTask(station_id=station.id, question="Q?", answer="A")
    db_session.add_all([riddle_item, riddle_task])
    db_session.commit()

    station_id = station.id
    riddle_item_id = riddle_item.id
    riddle_task_id = riddle_task.id

    db_session.delete(game)
    db_session.commit()

    assert db_session.get(Station, station_id) is None
    assert db_session.get(RiddleItem, riddle_item_id) is None
    assert db_session.get(RiddleTask, riddle_task_id) is None
