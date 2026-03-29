# Easter Hunt — Entwicklerdokumentation

## Architektur

```
easter/
├── backend/                 # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py          # App-Factory, Middleware, Routes, /media/ Endpoint
│   │   ├── models.py        # SQLAlchemy-Modelle (Game, Station, GameProgress, LibraryItem, LibraryTask)
│   │   ├── db.py            # Engine + Session (SQLite)
│   │   ├── exceptions.py    # Domain-Exceptions
│   │   ├── routers/
│   │   │   ├── games.py     # CRUD Spiele
│   │   │   ├── stations.py  # CRUD Stationen + Reorder
│   │   │   ├── progress.py  # Spielfortschritt
│   │   │   ├── images.py    # Bild-Upload, Puzzle-Generierung
│   │   │   └── library.py   # Content-Bibliothek (Read-Only)
│   │   └── tests/           # pytest-Tests
│   └── data/
│       ├── easter_hunt.db   # SQLite-Datenbank (gitignored)
│       ├── uploads/         # Hochgeladene Bilder
│       └── content/         # Vorinstallierter Content
│           ├── images/      # SVG-Bilder für die Bibliothek
│           └── manifest.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layouts/     # CreatorLayout, PlayerLayout
│   │   │   ├── minigames/   # Config-Formulare für den Creator
│   │   │   └── ui/          # Wiederverwendbare UI (BigButton, ErrorBoundary, Toast, …)
│   │   ├── hooks/           # useAudio, useTTS, useBackgroundMusic
│   │   ├── minigames/       # Spielbare Minispiel-Komponenten
│   │   │   └── puzzle/      # Puzzle-Komponenten (Board, Tile, Completion)
│   │   ├── pages/
│   │   │   ├── creator/     # GameListPage, GameEditorPage, StationEditorPage
│   │   │   └── play/        # PlayerPage, StationMiniGamePage, GameCompletionScreen
│   │   ├── services/api.ts  # Alle API-Calls (fetch-Wrapper mit ApiError)
│   │   └── types/index.ts   # TypeScript-Typen
│   └── e2e/                 # Playwright E2E-Tests
└── Makefile
```

### Datenfluss

```
Creator-UI → POST /api/games → GameEditorPage
                ↓
           POST /api/games/{id}/stations (mit MiniGameConfig)
                ↓
           POST /api/games/{id}/start  (Validierung)
                ↓
Player → GET /api/games/{id}          (Stationen laden)
      → GET /api/games/{id}/progress  (Fortschritt)
      → GET /api/games/{id}/stations/{sid}  (Minispiel-Config)
      → POST /api/games/{id}/stations/complete  (Station abschließen)
```

---

## Neues Minispiel hinzufügen

### Checkliste

- [ ] **1. Typ definieren** — `frontend/src/types/index.ts`
  - `MiniGameType`-Enum erweitern
  - Config-Interface ergänzen (z.B. `MyGameConfig`)
  - `MiniGameConfig` Union erweitern

- [ ] **2. Spielkomponente erstellen** — `frontend/src/minigames/MyGame.tsx`
  - Props: `onComplete?: () => void`, spielspezifische Konfigurationsfelder
  - `useAudio().play('success' | 'error')` für Audio-Feedback
  - Fehler graceful behandeln (kein Crash ohne `try/catch`)

- [ ] **3. Config-Formular erstellen** — `frontend/src/components/minigames/MyGameConfigForm.tsx`
  - Validierungsfeedback (inline Fehlermeldungen)
  - Vorschau-Funktion optional aber empfohlen

- [ ] **4. Router verdrahten** — `frontend/src/pages/play/StationMiniGamePage.tsx`
  - In `MiniGameRouter` neuen `case MiniGameType.my_game:` hinzufügen
  - Mit `<ErrorBoundary>` wrappen (bereits am äußeren Container)

- [ ] **5. StationEditorPage** — `frontend/src/pages/creator/StationEditorPage.tsx`
  - `MINI_GAME_TYPES`-Array: neuen Eintrag hinzufügen
  - `defaultConfig()`-Switch: Default-Config ergänzen
  - `validateConfig()`-Switch: Validierung ergänzen
  - Config-Formular in Render-Bereich einbinden

- [ ] **6. Backend-Modell** — `backend/app/models.py`
  - Falls benötigt: Hilfsdaten (z.B. generierte Inhalte) als JSON in `mini_game_config` speichern
  - Kein neues DB-Schema nötig für Config-only-Typen

- [ ] **7. Tests schreiben**
  - `frontend/src/minigames/MyGame.test.tsx` (Vitest)
  - `frontend/e2e/player-mode.spec.ts` ergänzen (Playwright)
  - Backend-Tests in `backend/app/tests/` falls API-Logik hinzukommt

### Beispiel: Minimale Spielkomponente

```tsx
// frontend/src/minigames/MyGame.tsx
import { useAudio } from '../hooks/useAudio'

interface MyGameProps {
  question: string
  onComplete?: () => void
}

export default function MyGame({ question, onComplete }: MyGameProps) {
  const audio = useAudio()

  function handleAnswer(correct: boolean) {
    if (correct) {
      audio.play('success')
      setTimeout(() => onComplete?.(), 1000)
    } else {
      audio.play('error')
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-4">
      <p className="text-xl font-bold text-gray-800 mb-6">{question}</p>
      <button
        onClick={() => handleAnswer(true)}
        style={{ minHeight: '60px' }}
        className="px-8 py-3 bg-green-500 text-white rounded-2xl font-bold text-lg active:scale-95"
      >
        Antwort
      </button>
    </div>
  )
}
```

---

## Content hinzufügen (Bibliothek)

Die Content-Bibliothek wird per Seed-Skript befüllt.

### Dateistruktur

```
backend/data/content/
├── manifest.json          # Deklariert alle Items und Tasks
└── images/                # SVG-Bilder (empfohlen: 200×200px)
    ├── ball.svg
    └── …
```

### manifest.json Format

```json
{
  "items": [
    {
      "name": "Ball",
      "category": "Spielzeug",
      "image_file": "ball.svg"
    }
  ],
  "tasks": [
    {
      "category": "Spielzeug",
      "task_type": "picture_riddle",
      "reference_item_names": ["Ball", "Auto"],
      "correct_answer_name": "Ball",
      "answer_option_names": ["Ball", "Auto", "Puppe", "Würfel"]
    }
  ]
}
```

### Seeding ausführen

```bash
cd backend
uv run python -m app.seed_content
```

Das Skript ist idempotent — kann beliebig oft ausgeführt werden ohne Duplikate zu erzeugen.

---

## API-Dokumentation

Interaktive API-Docs (Swagger UI) unter: http://localhost:8000/docs

ReDoc (alternativ): http://localhost:8000/redoc

---

## Qualitätssicherung

```bash
# TypeScript-Typen prüfen (ohne Build)
cd frontend && pnpm exec tsc --noEmit

# Frontend linter
cd frontend && pnpm lint

# Backend linter
cd backend && uv run ruff check .

# Unit-Tests
cd frontend && pnpm test         # Vitest (144 Tests)
cd backend && uv run pytest      # pytest (218 Tests)

# E2E-Tests (benötigt laufenden Server)
cd frontend && pnpm exec playwright test --project=webkit
cd frontend && pnpm exec playwright test --project=chromium

# Responsive-Tests
cd frontend && pnpm exec playwright test e2e/responsive.spec.ts
```

## Fehlerbehandlung (Architekturprinzipien)

- **ErrorBoundary** wraps every minigame in `StationMiniGamePage` — Crashes zeigen Fallback statt White Screen
- **Toast** (`useToast`) für nicht-kritische Netzwerkfehler — App bleibt bedienbar
- **AudioFehler** werden in `useAudio` und `useBackgroundMusic` stumm geschluckt — Spiel läuft weiter
- **ApiError** in `services/api.ts` enthält `status`, `message`, `body` — Unterscheidung 4xx/5xx möglich
