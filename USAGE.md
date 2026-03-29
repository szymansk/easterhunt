# Easter Hunt — Benutzerhandbuch

## Spiel erstellen (Creator Mode)

### 1. Creator öffnen

Browser auf http://localhost:5173 (Dev) oder `http://<LAN-IP>:8000` (Produktion) öffnen.

Auf **"Spiel erstellen"** klicken (oder direkt `/creator` aufrufen).

### 2. Neues Spiel erstellen

1. Auf **"+ Neues Spiel"** klicken
2. Das Spiel wird automatisch erstellt und der Editor öffnet sich
3. Spielname anklicken (Stift-Symbol) um ihn zu ändern

### 3. Stationen hinzufügen

1. Auf **"+ Station"** klicken
2. Die Station erscheint in der Liste
3. Auf **"Bearbeiten"** klicken um die Station zu konfigurieren

### 4. Station konfigurieren

Im Stationseditor:

1. **Stationsbild** (optional): Zeigt dem Kind, was es suchen muss
2. **Minispiel-Typ** wählen (Puzzle, Zahlenrätsel, Labyrinth, Texträtsel, Bilderrätsel)
3. **Minispiel konfigurieren** (je nach Typ, Felder ausfüllen)
4. Auf **"Zurück"** klicken um zum Spieleditor zurückzukehren

**Texträtsel konfigurieren:**
- Frage eingeben
- Antwortoptionen hinzufügen (2–6)
- Korrekte Antwort mit dem Radiobutton markieren

**Zahlenrätsel konfigurieren:**
- Aufgabentyp wählen (Zählen, Zuordnen, Plus/Minus)
- Frage/Prompt eingeben
- Richtige Zahl und Ablenkzahlen eingeben

### 5. Stationen anordnen

Stationen können per Drag-and-Drop neu geordnet werden (Griffpunkt links).

### 6. Spiel starten

1. Zurück zum Spieleditor navigieren
2. Auf **"▶ Spiel starten"** klicken
3. Das Spiel ist jetzt aktiv — Kinder können es spielen

> Hinweis: Alle Stationen müssen gültig konfiguriert sein, bevor das Spiel gestartet werden kann. Fehlermeldungen zeigen was fehlt.

---

## Spiel auf dem iPhone spielen (Player Mode)

### Vorbereitung

1. Backend mit `make serve` starten (oder `make dev` für Entwicklung)
2. LAN-IP ermitteln: `ipconfig getifaddr en0`
3. Auf dem iPhone Safari öffnen und `http://<LAN-IP>:8000` eingeben
4. Auf der Startseite **"Spiel spielen"** wählen oder direkten Link teilen

### Spielablauf

1. **Startseite**: Spiel-URL dem Kind mitteilen (`/play/<game-id>`)
2. **Stationskarte**: Zeigt alle Stationen; aktuelle Station ist hervorgehoben
3. **Station antippen**: Öffnet das Minispiel
4. **Minispiel lösen**: Je nach Typ tippen, ziehen, oder antworten
5. **Erfolg**: "Super gemacht!" — weiter zur nächsten Station
6. **Alle Stationen**: Erfolgsbildschirm "Geschafft! Frohe Ostern!"

### Tipps

- Hintergrundmusik kann mit dem 🎵-Button oben rechts ein- und ausgeschaltet werden
- Falsche Antworten können beliebig oft wiederholt werden
- Das Spiel merkt sich den Fortschritt (Browser-Session)

---

## Direkt-Link teilen

Jedes gestartete Spiel hat eine eindeutige ID in der URL:
```
http://<LAN-IP>:8000/play/<game-id>
```

Diesen Link als QR-Code erzeugen (z.B. mit [qr-code-generator.com](https://www.qr-code-generator.com)) und ausdrucken.
