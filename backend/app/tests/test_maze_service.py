"""Tests for MazeGenerationService."""
from collections import deque

import pytest

from app.services.maze import DIFFICULTY_SIZES, MazeGenerationService


def bfs_solvable(grid: list[list[bool]]) -> bool:
    """BFS from top-left cell to bottom-right cell."""
    height = len(grid)
    width = len(grid[0])
    start = (1, 1)
    goal = (height - 2, width - 2)
    visited: set[tuple[int, int]] = {start}
    queue: deque[tuple[int, int]] = deque([start])
    while queue:
        r, c = queue.popleft()
        if (r, c) == goal:
            return True
        for dr, dc in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            nr, nc = r + dr, c + dc
            if (
                0 <= nr < height
                and 0 <= nc < width
                and not grid[nr][nc]
                and (nr, nc) not in visited
            ):
                visited.add((nr, nc))
                queue.append((nr, nc))
    return False


class TestMazeGenerationServiceDifficulty:
    """Verify correct grid dimensions for each difficulty."""

    @pytest.mark.parametrize(
        "difficulty, rows, cols",
        [
            ("easy", 5, 5),
            ("medium", 6, 6),
            ("hard", 8, 8),
        ],
    )
    def test_maze_dimensions(self, difficulty: str, rows: int, cols: int):
        service = MazeGenerationService()
        result = service.generate(difficulty)

        walls = result["walls"]
        expected_height = 2 * rows + 1
        expected_width = 2 * cols + 1

        assert len(walls) == expected_height
        assert all(len(row) == expected_width for row in walls)
        assert result["rows"] == rows
        assert result["cols"] == cols
        assert result["difficulty"] == difficulty

    def test_invalid_difficulty_raises_value_error(self):
        service = MazeGenerationService()
        with pytest.raises(ValueError, match="extreme"):
            service.generate("extreme")


class TestMazeGenerationServiceOutput:
    """Verify output structure and content."""

    def test_output_keys(self):
        service = MazeGenerationService()
        result = service.generate("easy")
        assert set(result.keys()) == {"walls", "start", "goal", "rows", "cols", "difficulty"}

    def test_start_is_top_left_cell(self):
        service = MazeGenerationService()
        result = service.generate("easy")
        assert result["start"] == {"row": 1, "col": 1}

    def test_goal_is_bottom_right_cell(self):
        service = MazeGenerationService()
        result = service.generate("easy")
        rows, cols = DIFFICULTY_SIZES["easy"]
        assert result["goal"] == {"row": 2 * rows - 1, "col": 2 * cols - 1}

    def test_walls_is_2d_boolean_list(self):
        service = MazeGenerationService()
        result = service.generate("easy")
        walls = result["walls"]
        for row in walls:
            for cell in row:
                assert isinstance(cell, bool)

    def test_start_and_goal_cells_are_passages(self):
        service = MazeGenerationService()
        result = service.generate("easy")
        walls = result["walls"]
        start = result["start"]
        goal = result["goal"]
        assert walls[start["row"]][start["col"]] is False
        assert walls[goal["row"]][goal["col"]] is False

    def test_seed_produces_deterministic_output(self):
        service = MazeGenerationService()
        result1 = service.generate("easy", seed=42)
        result2 = service.generate("easy", seed=42)
        assert result1["walls"] == result2["walls"]

    def test_different_seeds_produce_different_mazes(self):
        service = MazeGenerationService()
        result1 = service.generate("easy", seed=1)
        result2 = service.generate("easy", seed=2)
        # Very unlikely to match (but not impossible for tiny grids)
        # We use hard difficulty for a more reliable assertion
        result3 = service.generate("hard", seed=100)
        result4 = service.generate("hard", seed=999)
        assert result3["walls"] != result4["walls"]


class TestMazeGenerationServiceSolvability:
    """Verify all generated mazes are solvable."""

    def test_easy_maze_is_solvable(self):
        service = MazeGenerationService()
        result = service.generate("easy", seed=0)
        assert bfs_solvable(result["walls"]), "Easy maze is not solvable"

    def test_medium_maze_is_solvable(self):
        service = MazeGenerationService()
        result = service.generate("medium", seed=0)
        assert bfs_solvable(result["walls"]), "Medium maze is not solvable"

    def test_hard_maze_is_solvable(self):
        service = MazeGenerationService()
        result = service.generate("hard", seed=0)
        assert bfs_solvable(result["walls"]), "Hard maze is not solvable"

    def test_100_random_mazes_all_solvable(self):
        """Generate 100 random mazes across all difficulties and verify solvability."""
        service = MazeGenerationService()
        difficulties = ["easy", "medium", "hard"]
        failures = []

        for i in range(100):
            difficulty = difficulties[i % len(difficulties)]
            result = service.generate(difficulty, seed=i)
            if not bfs_solvable(result["walls"]):
                failures.append((i, difficulty))

        assert not failures, f"Unsolvable mazes found: {failures}"
