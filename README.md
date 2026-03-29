# Easter Hunt — Osterschnitzeljagd

Eine digitale Osterschnitzeljagd für Kinder. Ersteller konfigurieren Stationen mit verschiedenen Minispielen; Kinder spielen die Jagd auf dem iPhone.

## Überblick

- **Creator Mode** (Desktop/Tablet): Spiele erstellen, Stationen konfigurieren, Starten
- **Player Mode** (iPhone, Portrait): Stationen abarbeiten, Minispiele lösen, Ostereier finden

### Minispieltypen

| Typ | Beschreibung |
|---|---|
| Puzzle | Bild in NxN Teile zerlegt, muss gelegt werden |
| Zahlenrätsel | Zählen, Zuordnen oder Rechnen mit Zahlen |
| Labyrinth | Hasen zum Ei navigieren |
| Texträtsel | Multiple-Choice-Fragen mit Text |
| Bilderrätsel | Bild-Multiple-Choice aus der Content-Bibliothek |

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Backend | FastAPI + SQLAlchemy 2.0 + SQLite (Python 3.11) |
| Frontend | React 18 + TypeScript (strict) + Vite + Tailwind CSS |
| Testing | pytest + httpx (Backend), Vitest + Playwright (Frontend) |

## Voraussetzungen

- Python 3.11+ mit [uv](https://github.com/astral-sh/uv)
- Node.js 20+ mit [pnpm](https://pnpm.io)
- macOS / Linux

## Setup (< 10 Minuten)

```bash
# 1. Repository klonen
git clone <repo-url> easter
cd easter

# 2. Abhängigkeiten installieren
make install

# 3. Entwicklungsserver starten
make dev
```

Nach `make dev`:
- **Frontend Dev**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API-Dokumentation**: http://localhost:8000/docs

## Auf dem iPhone spielen (LAN)

```bash
# LAN-IP ermitteln
ipconfig getifaddr en0

# Production Build erstellen und starten
make build
make serve
```

Dann auf dem iPhone: `http://<LAN-IP>:8000` aufrufen.

## Alle Befehle

```bash
make install   # Abhängigkeiten installieren
make dev       # Backend (8000) + Frontend (5173) parallel starten
make test      # Alle Tests ausführen (pytest + vitest)
make build     # Frontend bauen, in backend/dist/ kopieren
make serve     # Backend mit eingebautem Frontend starten
make lint      # Linter ausführen (ruff + eslint)
make clean     # Build-Artefakte löschen
```

## Tests

```bash
# Backend-Tests
cd backend && uv run pytest

# Frontend Unit-Tests
cd frontend && pnpm test

# E2E-Tests (Playwright, benötigt laufenden Server)
cd frontend && pnpm exec playwright test
```

Weitere Informationen: [USAGE.md](USAGE.md) · [DEVELOPMENT.md](DEVELOPMENT.md)
