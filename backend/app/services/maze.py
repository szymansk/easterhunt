"""Maze generation service using Recursive Backtracker algorithm."""
import random
from collections import deque


# Grid sizes by difficulty: (rows, cols) of cells
DIFFICULTY_SIZES: dict[str, tuple[int, int]] = {
    "easy": (5, 5),
    "medium": (6, 6),
    "hard": (8, 8),
}


def _generate_maze(rows: int, cols: int, seed: int | None = None) -> list[list[bool]]:
    """Generate a maze using the Recursive Backtracker (DFS) algorithm.

    Returns a 2D boolean grid of size (2*rows+1) x (2*cols+1) where True means wall.
    Cells are at odd indices; passages between cells open walls at even indices.

    Start cell: top-left (row=0, col=0) → grid position (1, 1)
    Goal cell:  bottom-right (row=rows-1, col=cols-1) → grid position (2*rows-1, 2*cols-1)
    """
    rng = random.Random(seed)

    height = 2 * rows + 1
    width = 2 * cols + 1

    # Initialize all walls as True
    grid: list[list[bool]] = [[True] * width for _ in range(height)]

    # Mark cell interiors as open (passages)
    for r in range(rows):
        for c in range(cols):
            grid[2 * r + 1][2 * c + 1] = False

    visited = [[False] * cols for _ in range(rows)]

    # Iterative DFS (avoids Python recursion limit on large grids)
    stack = [(0, 0)]
    visited[0][0] = True
    while stack:
        r, c = stack[-1]
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        rng.shuffle(directions)
        moved = False
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not visited[nr][nc]:
                visited[nr][nc] = True
                grid[r + nr + 1][c + nc + 1] = False
                stack.append((nr, nc))
                moved = True
                break
        if not moved:
            stack.pop()

    return grid


def _is_solvable(grid: list[list[bool]]) -> bool:
    """BFS check: start (1,1) can reach goal (height-2, width-2)."""
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


class MazeGenerationService:
    """Generates child-friendly mazes using the Recursive Backtracker algorithm."""

    def generate(self, difficulty: str, seed: int | None = None) -> dict:
        """Generate a maze for the given difficulty level.

        Args:
            difficulty: One of "easy", "medium", "hard".
            seed: Optional random seed for reproducibility.

        Returns:
            Dict with keys:
              - walls: 2D list of booleans (True = wall, False = passage)
              - start: {"row": int, "col": int} — top-left cell position in walls grid
              - goal:  {"row": int, "col": int} — bottom-right cell position in walls grid
              - rows: number of cell rows
              - cols: number of cell cols
              - difficulty: the difficulty string

        Raises:
            ValueError: If difficulty is not one of "easy", "medium", "hard".
        """
        if difficulty not in DIFFICULTY_SIZES:
            raise ValueError(
                f"Invalid difficulty {difficulty!r}. "
                f"Must be one of {sorted(DIFFICULTY_SIZES)}."
            )

        rows, cols = DIFFICULTY_SIZES[difficulty]
        grid = _generate_maze(rows, cols, seed=seed)

        height = 2 * rows + 1
        width = 2 * cols + 1

        return {
            "walls": grid,
            "start": {"row": 1, "col": 1},
            "goal": {"row": height - 2, "col": width - 2},
            "rows": rows,
            "cols": cols,
            "difficulty": difficulty,
        }
