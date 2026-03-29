# Easter Hunt — Osterschnitzeljagd

Eine digitale Osterschnitzeljagd für Kinder. Erwachsene erstellen Stationen mit verschiedenen Minispielen; Kinder spielen die Jagd auf dem iPhone durch.

![Backend Tests](https://img.shields.io/badge/backend_tests-308_passed-brightgreen)
![Frontend Tests](https://img.shields.io/badge/frontend_tests-187_passed-brightgreen)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Node](https://img.shields.io/badge/node-20+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **Creator Mode** — Spiele anlegen, Stationen konfigurieren, Fortschritt überwachen, zurücksetzen
- **Player Mode** — Stationen linear durchspielen, Minispiele lösen, Schatz finden
- **Installierbar als PWA** — Vollbild auf dem iPhone, kein Browser-Chrome

### Minispiele

| Typ | Beschreibung |
|---|---|
| Puzzle | Bild in Kacheln zerlegt, per Drag & Drop zusammensetzen |
| Zahlenrätsel | Zählen, Zuordnen oder Rechnen mit Zahlen 1–10 |
| Labyrinth | Hasen durch ein Labyrinth zum Ei navigieren |
| Texträtsel | Multiple-Choice-Fragen mit Text |
| Bilderrätsel | Bild-Multiple-Choice aus der Content-Bibliothek |

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Backend | Python 3.11 · FastAPI · SQLAlchemy 2.0 · SQLite |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · dnd-kit |
| Tests | pytest · httpx (Backend) · Vitest · Playwright (Frontend) |
| PWA | vite-plugin-pwa · Workbox |

---

## Voraussetzungen

- **Python 3.11+** mit [uv](https://github.com/astral-sh/uv)
- **Node.js 20+** mit [pnpm](https://pnpm.io)
- macOS oder Linux

---

## Quickstart

```bash
git clone <repo-url> easter && cd easter
make install
make dev
```

| URL | Beschreibung |
|---|---|
| http://localhost:5173 | Frontend (Vite Dev Server) |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | OpenAPI Dokumentation |

---

## Auf dem iPhone installieren (PWA)

```bash
# 1. Production Build erstellen und starten
make build && make serve

# 2. LAN-IP herausfinden
ipconfig getifaddr en0
```

Auf dem iPhone in Safari `http://<LAN-IP>:8000` öffnen →
**Teilen** → **Zum Home-Bildschirm** → als App installieren.

> iPhone und Mac müssen im gleichen WLAN sein.

---

## Alle Make-Befehle

```bash
make install   # Abhängigkeiten installieren (uv + pnpm)
make dev       # Backend (8000) + Frontend (5173) parallel starten
make build     # Frontend bauen → backend/dist/ kopieren
make serve     # Produktionsserver starten (Frontend + API auf Port 8000)
make test      # Alle Tests ausführen (pytest + vitest)
make lint      # Linter (ruff + eslint)
make clean     # Build-Artefakte löschen
```

---

## Tests

```bash
# Backend
cd backend && uv run pytest

# Frontend Unit-Tests
cd frontend && pnpm test

# E2E (benötigt laufenden Server auf Port 8000)
cd frontend && pnpm exec playwright test
```

---

## Projektstruktur

```
easter/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy Modelle
│   │   ├── routers/      # FastAPI Endpoints
│   │   ├── schemas/      # Pydantic Schemas
│   │   ├── services/     # Bildverarbeitung, Maze-Generator
│   │   └── db/           # Session, Engine, Seed-Script
│   └── data/
│       └── content/      # Bibliothek-Assets (SVG-Icons, manifest.json)
└── frontend/
    ├── src/
    │   ├── pages/        # Creator- und Player-Seiten
    │   ├── minigames/    # Minispiel-Komponenten
    │   ├── services/     # API Client
    │   └── types/        # TypeScript-Typen
    └── public/
        └── audio/        # Sound-Effekte und Hintergrundmusik
```

---

## Weiterführend

- [USAGE.md](USAGE.md) — Anleitung für Ersteller und Spieler
- [DEVELOPMENT.md](DEVELOPMENT.md) — Entwickler-Dokumentation, Architektur, ADRs

---

## Lizenz

[MIT](LICENSE)
