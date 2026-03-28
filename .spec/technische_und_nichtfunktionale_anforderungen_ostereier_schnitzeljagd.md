# Technische und nichtfunktionale Anforderungen – Ostereier-Schnitzeljagd

## Ziel

Dieses Dokument ergänzt die bereits definierten fachlichen Anforderungen um:

1. präzise **technische Anforderungen** für die Implementierung,
2. präzise **nichtfunktionale Anforderungen**,
3. einen **empfohlenen Technologie-Stack**, der für eine AI-gestützte Implementierung besonders gut geeignet ist.

Der Fokus liegt auf einem **realistisch umsetzbaren MVP**, der lokal auf einem Mac betrieben wird und im Safari-Browser auf dem iPhone funktioniert.

---

## 1. Technische Leitentscheidung

Für die Implementierung wird eine **lokal gehostete Web-Anwendung mit getrenntem Frontend und Backend** empfohlen.

### Begründung

- Das Frontend benötigt eine saubere Touch-UI, lokale Navigation und Drag-and-Drop für das Puzzle.
- Das Backend wird für Bild-Upload, Bildspeicherung, Puzzle-Erzeugung, Konfigurationsspeicherung und Auslieferung der Spielinhalte benötigt.
- Eine klare API-Trennung ist für AI-gestützte Codegenerierung und spätere Erweiterungen deutlich robuster als eine monolithische „alles im Browser“-Lösung.
- Vite ist als aktuelles Frontend-Tooling für moderne Browser ausgelegt und optimiert die Entwicklungsgeschwindigkeit; es verwendet unter anderem esbuild für TypeScript-Transpilierung und sehr schnelles HMR. citeturn890583search0turn890583search8turn890583search16
- FastAPI ist ein modernes Python-Webframework auf Basis von Python-Type-Hints; das passt sehr gut zu stark typisierten Datenmodellen und AI-gestützter Implementierung. citeturn890583search5turn890583search9turn890583search13

---

## 2. Empfohlener Technologie-Stack

## 2.1 Frontend

### Vorgeschlagene Technologien
- **React** mit **TypeScript**
- **Vite** als Build- und Dev-Tool
- **Tailwind CSS** für UI-Styling
- **dnd-kit** für Drag-and-Drop im Puzzle
- **Howler.js** oder native Web-Audio-/HTML-Audio-Nutzung für Soundeffekte und Hintergrundmusik

### Begründung
- React mit TypeScript ist für komponentenbasierte Oberflächen, Zustandstrennung und testbare UI-Logik sehr gut geeignet.
- Vite ist schnell, leichtgewichtig und für React/TypeScript-Setups sehr gut dokumentiert. citeturn890583search0turn890583search8turn729951search13
- Tailwind ist utility-first und erlaubt eine schnelle, konsistente und AI-freundliche UI-Umsetzung ohne viel CSS-Streuverlust. citeturn729951search1turn729951search5
- dnd-kit stellt React-basierte Drag-and-Drop-Primitiven bereit und unterstützt auch Accessibility-relevante Konzepte; das passt gut zum Puzzle-Use-Case. citeturn729951search4turn729951search8turn729951search12turn729951search20

### Gherkin – Technologieentscheidung Frontend
```gherkin
Feature: Frontend-Technologiebasis

  Scenario: Frontend ist mit einem komponentenbasierten TypeScript-Stack umgesetzt
    Given das Frontend-Repository liegt vor
    When der Build-Prozess und die Projektkonfiguration geprüft werden
    Then muss React als UI-Framework verwendet werden
    And TypeScript muss für die Frontend-Implementierung aktiviert sein
    And Vite muss als Dev- und Build-Tool konfiguriert sein

  Scenario: Styling ist konsistent und komponentennah umsetzbar
    Given das Frontend-Repository liegt vor
    When die Styling-Konfiguration geprüft wird
    Then muss Tailwind CSS in den Frontend-Build integriert sein
```

---

## 2.2 Backend

### Vorgeschlagene Technologien
- **Python 3.12+**
- **FastAPI** für HTTP-API und statische Auslieferung relevanter Assets
- **Pydantic** für Request-/Response-Modelle und Konfigurationsvalidierung
- **SQLAlchemy 2.x** für Persistenzzugriff
- **SQLite** als lokale Datenbank für den MVP
- **Pillow** für Bildverarbeitung des Puzzles

### Begründung
- FastAPI passt sehr gut zu einem lokalen JSON/API-zentrierten Backend mit klaren Typen. citeturn890583search5turn890583search17
- Pydantic eignet sich für validierte Datenmodelle und settings-basierte Konfiguration. citeturn729951search6turn729951search18
- SQLAlchemy 2.x ist die stabile Standardwahl für Python-Persistenz mit ORM/Core und unterstützt SQLite sauber. citeturn890583search6turn890583search10turn890583search18turn890583search22
- SQLAlchemy dokumentiert SQLite-Unterstützung einschließlich `pysqlite` und `aiosqlite`; für einen lokalen MVP reicht SQLite sehr gut aus. citeturn890583search2
- Pillow bietet Dateiformatunterstützung sowie grundlegende Bildoperationen wie Laden, Zuschneiden und Skalieren und ist daher für Puzzle-Kacheln geeignet. citeturn729951search3turn729951search7turn729951search11turn729951search19

### Gherkin – Technologieentscheidung Backend
```gherkin
Feature: Backend-Technologiebasis

  Scenario: Backend ist als Python-Webservice umgesetzt
    Given das Backend-Repository liegt vor
    When die Abhängigkeiten und die Startkonfiguration geprüft werden
    Then muss Python als Implementierungssprache verwendet werden
    And FastAPI muss als Web-Framework verwendet werden

  Scenario: Eingaben und Ausgaben sind typisiert und validiert
    Given das Backend-Repository liegt vor
    When die API-Modelle geprüft werden
    Then müssen Request- und Response-Modelle mit Pydantic definiert sein

  Scenario: Persistenz ist lokal realisiert
    Given das Backend-Repository liegt vor
    When die Persistenzschicht geprüft wird
    Then muss SQLite als lokale Datenbank unterstützt werden
    And der Datenzugriff muss über SQLAlchemy erfolgen

  Scenario: Puzzle-Bilder können serverseitig verarbeitet werden
    Given das Backend-Repository liegt vor
    When die Bildverarbeitungslogik geprüft wird
    Then muss eine Python-Bibliothek zur Bildverarbeitung eingebunden sein
    And Pillow muss für Zuschneiden, Skalieren oder Kachelerzeugung nutzbar sein
```

---

## 2.3 Tests und Qualitätssicherung

### Vorgeschlagene Technologien
- **pytest** für Backend-Tests
- **Vitest** für Frontend-Unit-Tests
- **Playwright** für End-to-End-Tests

### Begründung
- Playwright ist für moderne Web-Apps ausgelegt und unterstützt Chromium, Firefox und WebKit sowie Mobile-Safari-Emulation. Das ist für iPhone/Safari-Tests relevant. citeturn890583search3turn890583search7turn890583search19
- Playwright bringt Test-Runner, Assertions und Webserver-Integration mit, was lokale App-Tests im Heimnetz-Setup vereinfacht. citeturn890583search7turn890583search11turn890583search15

### Gherkin – Teststack
```gherkin
Feature: Testbarkeit der Implementierung

  Scenario: Backend-Logik ist automatisiert testbar
    Given das Backend-Repository liegt vor
    When die Testkonfiguration geprüft wird
    Then müssen automatisierte Backend-Tests vorhanden sein

  Scenario: Frontend-Komponenten sind automatisiert testbar
    Given das Frontend-Repository liegt vor
    When die Testkonfiguration geprüft wird
    Then müssen automatisierte Frontend-Tests vorhanden sein

  Scenario: Kritische Benutzerflüsse sind Ende-zu-Ende testbar
    Given das Gesamtprojekt liegt vor
    When die End-to-End-Testkonfiguration geprüft wird
    Then müssen automatisierte Browser-Tests vorhanden sein
    And mindestens WebKit oder Mobile-Safari-nahe Tests müssen unterstützt werden
```

---

## 2.4 Deployment und Betrieb

### Vorgeschlagene Technologien
- **uv** oder **pip** für Python-Abhängigkeiten
- **pnpm** oder **npm** für Frontend-Abhängigkeiten
- lokaler Start per **Shell-Skript**, **Makefile** oder **docker compose**
- optional **Caddy** oder **Nginx** nur dann, wenn später Reverse Proxy / HTTPS im LAN nötig wird

### Empfehlung
Für den MVP ist die einfachste betriebsfähige Variante:
- Frontend-Build wird vom Backend als statische Dateien ausgeliefert
- Backend läuft auf dem Mac unter einer lokalen IP und einem festen Port
- SQLite-Datei und Bildverzeichnis liegen lokal auf dem Mac

### Gherkin – Deployment
```gherkin
Feature: Lokaler Betrieb im Heimnetz

  Scenario: Anwendung kann lokal auf einem Mac gestartet werden
    Given die Anwendung ist installiert
    When der definierte Startbefehl ausgeführt wird
    Then muss das Backend lokal starten
    And die Web-Anwendung muss über eine lokale URL erreichbar sein

  Scenario: Anwendung ist im Heimnetz vom iPhone erreichbar
    Given das Backend läuft auf dem Mac im Heimnetz
    When die lokale IP-Adresse des Macs im Safari-Browser des iPhones geöffnet wird
    Then muss die Startseite der Anwendung geladen werden
```

---

## 3. Technische Anforderungen

## 3.1 Frontend-Architektur

### Anforderungen
- Das Frontend muss als Single-Page-Application umgesetzt werden.
- Die UI muss in klar getrennte Komponenten zerlegt werden.
- Spiel-Erstellung und Spiel-Durchführung müssen in getrennten Ansichten umgesetzt werden.
- Minispiele müssen als eigenständige, austauschbare UI-Komponenten implementiert werden.
- Der Puzzle-Mechanismus muss als eigene wiederverwendbare Komponente implementiert werden.
- Das Frontend muss mit strikter Typisierung umgesetzt werden.
- Routing muss ohne serverseitige Seitenwechsel möglich sein.

### Gherkin
```gherkin
Feature: Frontend-Architektur

  Scenario: Spielmodi sind klar getrennt
    Given das Frontend wird ausgeführt
    When zwischen Erstellungsmodus und Spielmodus navigiert wird
    Then müssen beide Bereiche als getrennte Ansichten verfügbar sein

  Scenario: Minispiele sind modular austauschbar
    Given das Frontend-Repository liegt vor
    When die Implementierungsstruktur geprüft wird
    Then muss jedes Minispiel als eigenständige Komponente oder Modulfamilie implementiert sein

  Scenario: Frontend ist streng typisiert
    Given das Frontend-Repository liegt vor
    When die TypeScript-Konfiguration geprüft wird
    Then muss strikte Typprüfung aktiviert sein
```

---

## 3.2 Backend-Architektur

### Anforderungen
- Das Backend muss REST-basierte JSON-Endpunkte bereitstellen.
- Das Backend muss Endpunkte für Spiele, Stationen, Medien und Rätselbibliothek bereitstellen.
- Das Backend muss die Puzzle-Erzeugung serverseitig kapseln.
- Das Backend muss Eingabedaten validieren und fehlerhafte Requests mit geeigneten HTTP-Statuscodes ablehnen.
- Das Backend muss statische Medien lokal ausliefern können.
- Das Backend muss ohne externe Cloud-Dienste betriebsfähig sein.

### Gherkin
```gherkin
Feature: Backend-Architektur

  Scenario: Spiele können per API verwaltet werden
    Given das Backend läuft
    When ein Client die verfügbaren API-Endpunkte abfragt
    Then müssen Endpunkte zum Erstellen, Lesen, Aktualisieren und Laden von Spielen vorhanden sein

  Scenario: Ungültige Eingaben werden validiert
    Given das Backend läuft
    When ein Client eine ungültige Spielkonfiguration sendet
    Then darf die Konfiguration nicht gespeichert werden
    And das Backend muss einen Fehlerstatus zurückgeben

  Scenario: Puzzle-Generierung ist serverseitig gekapselt
    Given das Backend läuft
    When für ein Stationsbild ein Puzzle erzeugt wird
    Then muss die Zerlegung des Bildes im Backend erfolgen
```

---

## 3.3 Datenmodell und Persistenz

### Anforderungen
- Spiele, Stationen, Minispielzuordnungen und Fortschritt müssen persistent gespeichert werden können.
- Wiederverwendbare Rätselbilder und Rätseldefinitionen müssen separat von spielindividuellen Stationsbildern verwaltet werden.
- Die Persistenz muss mindestens folgende fachliche Entitäten unterstützen:
  - Spiel
  - Station
  - Minispieltyp
  - Stationsbild
  - Rätseldefinition
  - Rätselbild
  - Spielstand
- Medienreferenzen und Metadaten müssen in der Datenbank gespeichert werden.
- Binärdateien dürfen im Dateisystem gespeichert werden, sofern in der Datenbank nur Referenzen abgelegt werden.

### Gherkin
```gherkin
Feature: Persistenz

  Scenario: Spielkonfiguration bleibt nach Neustart erhalten
    Given ein Spiel wurde gespeichert
    And die Anwendung wurde beendet
    When die Anwendung erneut gestartet wird
    Then muss das gespeicherte Spiel wieder geladen werden können

  Scenario: Rätselbibliothek ist von Spielspezifika getrennt
    Given vorbereitete Rätselbilder und Rätseldefinitionen sind gespeichert
    When ein neues Spiel angelegt wird
    Then dürfen die vorhandenen Rätseldefinitionen wiederverwendet werden
    And es dürfen keine neuen allgemeinen Rätselbilder erzeugt werden müssen
```

---

## 3.4 Medienverarbeitung

### Anforderungen
- Das Backend muss hochgeladene Stationsbilder validieren.
- Das Backend muss Bilder in ein webtaugliches Format überführen können.
- Das Backend muss aus einem Stationsbild Puzzle-Kacheln in konfigurierbaren Rastergrößen erzeugen können.
- Das Backend muss zu jedem Puzzle-Teil die korrekte Zielposition bereitstellen.
- Die App darf zur Laufzeit keine neuen allgemeinen Rätselbilder generieren.
- Allgemeine Rätselbilder müssen aus einer vorbereiteten Content-Bibliothek geladen werden.

### Gherkin
```gherkin
Feature: Medienverarbeitung

  Scenario: Stationsbild wird zu Puzzle-Teilen verarbeitet
    Given ein gültiges Stationsbild wurde hochgeladen
    When für dieses Bild ein 3x3-Puzzle angefordert wird
    Then müssen genau 9 Puzzle-Teile erzeugt werden
    And jedes Puzzle-Teil muss eine definierte Zielposition besitzen

  Scenario: Allgemeine Rätselbilder werden nicht zur Laufzeit generiert
    Given die Anwendung läuft im Spielbetrieb
    When ein Bilderrätsel gestartet wird
    Then müssen die verwendeten Rätselbilder aus der lokalen Rätselbibliothek geladen werden
    And es darf keine Bildgenerierung zur Laufzeit erforderlich sein
```

---

## 3.5 Puzzle-Interaktion

### Anforderungen
- Das Frontend muss Touch-basiertes Drag-and-Drop unterstützen.
- Puzzle-Teile müssen initial in einem Bereich unterhalb des Zielrasters angezeigt werden.
- Ein Teil muss bei korrekter Position einrasten.
- Ein Teil muss bei falscher Position in den Ausgangsbereich oder an die letzte gültige Position zurückkehren.
- Es dürfen nur unrotierte Puzzle-Teile unterstützt werden.
- Unterstützte Rastergrößen im MVP sollten auf 1x3, 2x2, 2x3 und 3x3 begrenzt werden.

### Gherkin
```gherkin
Feature: Puzzle-Interaktion

  Scenario: Puzzle-Teile starten im Ablagebereich
    Given ein Puzzle wurde gestartet
    When die Puzzle-Ansicht geladen ist
    Then müssen alle Puzzle-Teile zunächst unterhalb des Zielbereichs sichtbar sein

  Scenario: Korrekt platzierte Teile rasten ein
    Given ein Puzzle wurde gestartet
    When ein Teil auf seine korrekte Zielposition gezogen wird
    Then muss das Teil an seiner Zielposition einrasten

  Scenario: Falsch platzierte Teile bleiben nicht dauerhaft falsch liegen
    Given ein Puzzle wurde gestartet
    When ein Teil auf eine falsche Position gezogen wird
    Then darf das Teil nicht dauerhaft an dieser falschen Position verbleiben
```

---

## 3.6 Audio und TTS

### Anforderungen
- Die App muss Soundeffekte für Erfolg und Fehlversuche unterstützen.
- Die App sollte optionale Hintergrundmusik unterstützen.
- Die App sollte Browser-basiertes Text-to-Speech für Rätseltexte unterstützen.
- Audio darf erst nach einer Nutzerinteraktion abgespielt werden, um Browser-Restriktionen einzuhalten.

### Gherkin
```gherkin
Feature: Audio-Unterstützung

  Scenario: Erfolgs-Sound wird nach richtiger Lösung abgespielt
    Given ein Minispiel ist aktiv
    When das Kind die richtige Lösung auswählt
    Then muss ein Erfolgs-Sound abgespielt werden

  Scenario: Audio startet erst nach Benutzerinteraktion
    Given die Spielansicht wurde neu geöffnet
    When noch keine Benutzerinteraktion erfolgt ist
    Then darf keine automatische Audiowiedergabe gestartet werden
```

---

## 3.7 Sicherheit und lokale Betriebsgrenzen

### Anforderungen
- Die Anwendung muss standardmäßig nur im lokalen Heimnetz betrieben werden können.
- Es dürfen im MVP keine extern erreichbaren Admin-Schnittstellen notwendig sein.
- Dateiuploads müssen serverseitig auf erlaubte Dateitypen und Größen geprüft werden.
- Pfadangaben und Dateinamen müssen serverseitig abgesichert werden.
- Fehler dürfen keine internen Stacktraces an Endnutzer ausliefern.

### Gherkin
```gherkin
Feature: Basissicherheit

  Scenario: Unerlaubte Dateitypen werden abgewiesen
    Given das Backend läuft
    When ein Client eine nicht erlaubte Datei als Stationsbild hochlädt
    Then darf die Datei nicht gespeichert werden
    And das Backend muss einen Fehlerstatus zurückgeben

  Scenario: Endnutzer sehen keine internen Stacktraces
    Given im Backend tritt ein unerwarteter Fehler auf
    When der Fehler an die UI zurückgegeben wird
    Then darf keine vollständige interne Stacktrace im Endnutzer-Frontend angezeigt werden
```

---

## 4. Nichtfunktionale Anforderungen

## 4.1 Benutzbarkeit

### Anforderungen
- Die Anwendung muss für Kinder im Alter von ca. 5 Jahren bedienbar sein.
- Interaktive Elemente müssen groß genug für Touch-Eingaben auf dem iPhone sein.
- Die Navigation muss linear und einfach verständlich sein.
- Ein Minispiel muss ohne Lesefähigkeit spielbar sein, sofern Audiohinweise aktiviert sind.
- Fehlbedienungen dürfen nicht zu Sackgassen führen.

### Gherkin
```gherkin
Feature: Benutzbarkeit

  Scenario: Kindgerechte Interaktion ist möglich
    Given ein Kind nutzt die Anwendung auf einem iPhone
    When es ein Minispiel bedient
    Then müssen alle wesentlichen Interaktionen per Touch möglich sein
    And es darf keine Maus- oder Tastatureingabe erforderlich sein

  Scenario: Fehlbedienung blockiert das Spiel nicht
    Given das Kind tippt oder zieht ein Element versehentlich falsch
    When die Eingabe verarbeitet wird
    Then muss das Spiel weiterhin benutzbar bleiben
    And das Kind muss weiter versuchen können
```

---

## 4.2 Performance

### Anforderungen
- Die Startseite der Anwendung sollte im lokalen WLAN in weniger als 3 Sekunden sichtbar sein.
- Ein Stationswechsel sollte bei bereits geladenen Assets in weniger als 2 Sekunden erfolgen.
- Puzzle-Generierung aus einem typischen iPhone-Foto sollte für MVP-konforme Rastergrößen in akzeptabler Zeit erfolgen.
- Bilder müssen in einer für mobile Endgeräte optimierten Größe ausgeliefert werden.

### Gherkin
```gherkin
Feature: Performance

  Scenario: Stationswechsel erfolgt ohne störende Wartezeit
    Given die Anwendung läuft im lokalen WLAN
    And die Assets der nächsten Station sind verfügbar
    When eine Station erfolgreich abgeschlossen wird
    Then soll die nächste Station innerhalb von 2 Sekunden sichtbar sein

  Scenario: Bilder werden optimiert ausgeliefert
    Given ein Stationsbild wurde hochgeladen
    When das Bild im Spielbetrieb ausgeliefert wird
    Then muss eine für mobile Nutzung optimierte Variante verwendet werden
```

---

## 4.3 Zuverlässigkeit und Robustheit

### Anforderungen
- Die Anwendung muss bei falschen Eingaben stabil bleiben.
- Temporäre Fehler bei Audio oder optionalen Komfortfunktionen dürfen den Spielfortschritt nicht blockieren.
- Gespeicherte Spiele müssen nach Neustart des Systems weiterhin verfügbar sein.
- Das System muss bei unvollständigen Konfigurationen verständliche Fehlermeldungen anzeigen.

### Gherkin
```gherkin
Feature: Robustheit

  Scenario: Komfortfunktion fällt aus, Kernspiel bleibt nutzbar
    Given die Vorlesefunktion ist nicht verfügbar
    When ein Rätsel gestartet wird
    Then muss das Rätsel weiterhin angezeigt werden
    And der Spielfluss darf nicht abbrechen

  Scenario: Ungültige Konfiguration wird verständlich gemeldet
    Given ein Spiel ist unvollständig konfiguriert
    When der Nutzer versucht das Spiel zu starten
    Then darf das Spiel nicht starten
    And es muss eine verständliche Fehlermeldung angezeigt werden
```

---

## 4.4 Wartbarkeit

### Anforderungen
- Frontend und Backend müssen getrennt versionierbar sein.
- Fachliche Regeln müssen möglichst zentral und typisiert modelliert werden.
- Minispiele müssen erweiterbar sein, ohne bestehende Minispiele grundlegend umzubauen.
- Die Rätselbibliothek muss pflegbar und versionierbar abgelegt werden.
- Der Build- und Startprozess muss dokumentiert und reproduzierbar sein.

### Gherkin
```gherkin
Feature: Wartbarkeit

  Scenario: Neues Minispiel kann modular ergänzt werden
    Given die bestehende Anwendung unterstützt mehrere Minispiele
    When ein weiteres Minispiel implementiert wird
    Then darf die bestehende Architektur nicht grundlegend umgebaut werden müssen

  Scenario: Projekt ist reproduzierbar startbar
    Given ein neuer Entwickler erhält den Quellcode
    When er der Projektdokumentation folgt
    Then muss die Anwendung mit den dokumentierten Schritten lokal startbar sein
```

---

## 4.5 Testbarkeit

### Anforderungen
- Alle zentralen Spielregeln müssen automatisiert testbar sein.
- Die Puzzle-Zerlegung muss automatisiert testbar sein.
- Die Auswahl-Logik von Rätseln muss automatisiert testbar sein.
- Die App muss mindestens mit Unit-, Integrations- und End-to-End-Tests abgesichert werden.

### Gherkin
```gherkin
Feature: Testbarkeit

  Scenario: Kernlogik ist automatisiert abgesichert
    Given das Projekt liegt vor
    When die Testsuite ausgeführt wird
    Then müssen automatisierte Tests für Spielregeln vorhanden sein
    And automatisierte Tests für Puzzle-Erzeugung müssen vorhanden sein
    And automatisierte Tests für Rätselauswahl müssen vorhanden sein
```

---

## 4.6 Offline- und Netzwerkverhalten

### Anforderungen
- Der Kernspielbetrieb muss ohne Internetverbindung funktionieren, solange iPhone und Mac im gleichen Heimnetz sind.
- Externe Cloud-Dienste dürfen für den Kernbetrieb nicht erforderlich sein.
- Optionale spätere Erweiterungen dürfen Internet benötigen, der MVP jedoch nicht.

### Gherkin
```gherkin
Feature: Lokaler Offline-naher Betrieb

  Scenario: Kernspiel funktioniert ohne Internet
    Given der Mac und das iPhone befinden sich im gleichen Heimnetz
    And der Internetzugang ist unterbrochen
    When ein bereits konfiguriertes Spiel gestartet wird
    Then muss das Spiel weiterhin spielbar sein
```

---

## 5. Warum dieser Stack für AI besonders gut implementierbar ist

Der vorgeschlagene Stack ist nicht „cool“, sondern praktisch.

### Dafür spricht konkret:
- **Klare Trennung von Frontend und Backend**: AI kann Aufgaben sauber entlang der API-Grenze bearbeiten.
- **TypeScript im Frontend**: reduziert Missverständnisse bei Props, Zuständen und Datenstrukturen.
- **Python/FastAPI im Backend**: AI erzeugt dafür in der Praxis häufig brauchbaren, gut lesbaren Code.
- **Pydantic-Modelle**: validierte Schemas reduzieren Fehler in der Schnittstelle.
- **SQLite**: lokal, einfach, ohne externen Infrastrukturballast.
- **Pillow**: ausreichend für Puzzle-Zuschnitt, ohne Overengineering.
- **Playwright**: erlaubt es, von AI erzeugte Benutzerflüsse automatisiert zu prüfen, auch in WebKit-nahen Szenarien. citeturn890583search3turn890583search7turn890583search19

### Klare Entscheidung gegen unnötige Komplexität
Für den MVP **nicht** empfohlen:
- Next.js
- Microservices
- Kubernetes
- Cloud-Datenbanken
- serverlose Architekturen
- Laufzeit-AI für Rätselbilder
- Canvas-basierte Spezial-Game-Engine

Der Grund ist einfach: Für dieses Produkt bringen diese Optionen mehr Komplexität als Nutzen.

### Gherkin – AI-freundliche Implementierbarkeit
```gherkin
Feature: AI-freundliche Implementierungsstruktur

  Scenario: Architektur besitzt klar getrennte Verantwortlichkeiten
    Given die Projektstruktur liegt vor
    When Frontend, Backend und Persistenz geprüft werden
    Then müssen die Verantwortlichkeiten klar getrennt sein
    And die Datenflüsse müssen über typisierte Schnittstellen beschrieben sein

  Scenario: Kernlogik ist nicht in schwer testbaren UI-Skripten versteckt
    Given das Projekt liegt vor
    When die Implementierung geprüft wird
    Then müssen Spielregeln und Persistenzlogik außerhalb rein visueller UI-Komponenten testbar gekapselt sein
```

---

## 6. Konkreter Stack-Vorschlag

## Pflicht für MVP
- Frontend: **React + TypeScript + Vite + Tailwind CSS + dnd-kit**
- Backend: **Python 3.12 + FastAPI + Pydantic + SQLAlchemy + SQLite + Pillow**
- Tests: **Vitest + pytest + Playwright**
- Betrieb: **lokal auf Mac im Heimnetz**

## Optional später
- PWA-Support
- Docker Compose
- Caddy/Nginx als Reverse Proxy
- Audio-Asset-Pipeline
- separates Content-Management für Rätselbibliothek

---

## 7. Klare Empfehlung

Wenn du es effizient und AI-tauglich umsetzen willst, nimm genau diesen Stack:

- **React + TypeScript + Vite** für das Frontend
- **FastAPI + Pydantic + SQLAlchemy + SQLite + Pillow** für das Backend
- **dnd-kit** für das Puzzle
- **Playwright** für echte Browser-Tests

Das ist klein genug für einen MVP, stark genug für saubere Erweiterungen und strukturiert genug, dass AI damit produktiv arbeiten kann.
