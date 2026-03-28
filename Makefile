.PHONY: dev build serve test lint clean install

BACKEND_DIR := backend
FRONTEND_DIR := frontend

# Install all dependencies
install:
	cd $(BACKEND_DIR) && uv sync --extra dev
	cd $(FRONTEND_DIR) && pnpm install

# Start backend (port 8000) and frontend (port 5173) simultaneously
dev:
	@echo "Starting backend and frontend..."
	cd $(BACKEND_DIR) && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
	cd $(FRONTEND_DIR) && pnpm dev

# Build frontend and copy to backend/dist
build:
	cd $(FRONTEND_DIR) && pnpm build
	cp -r $(FRONTEND_DIR)/dist $(BACKEND_DIR)/dist

# Serve: backend serves frontend build as static files
serve:
	cp -r $(FRONTEND_DIR)/dist $(BACKEND_DIR)/dist
	cd $(BACKEND_DIR) && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run all tests (pytest + vitest)
test:
	cd $(BACKEND_DIR) && uv run python -m pytest app/tests/ -v; BACKEND_EXIT=$$?; \
	cd ../$(FRONTEND_DIR) && pnpm test --run; FRONTEND_EXIT=$$?; \
	exit $$((BACKEND_EXIT + FRONTEND_EXIT))

# Lint
lint:
	cd $(BACKEND_DIR) && uv run ruff check .
	cd $(FRONTEND_DIR) && pnpm lint

# Clean build artifacts
clean:
	rm -rf $(FRONTEND_DIR)/dist
	rm -rf $(BACKEND_DIR)/dist
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
