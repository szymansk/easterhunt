class GameNotFoundError(Exception):
    def __init__(self, game_id: str):
        self.game_id = game_id
        super().__init__(f"Game {game_id} not found")


class StationLimitExceededError(Exception):
    def __init__(self, game_id: str):
        self.game_id = game_id
        super().__init__(f"Game {game_id} already has 20 stations")


class InvalidConfigurationError(Exception):
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")
