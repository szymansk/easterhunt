# language: de
Funktionalität: Puzzle Regression — Bild hochladen, Puzzle konfigurieren und spielen
  Als Erwachsener möchte ich zwei Puzzle-Stationen mit eigenen Bildern anlegen
  damit das Kind sie im Spiel lösen kann

  Hintergrund:
    * ich habe ein neues Spiel erstellt
    Und ich bin im Spiel-Editor

  Szenario: Zwei Puzzles anlegen und im Spiel lösen
    # --- Station 1 anlegen ---
    Wenn ich auf "+ Station" klicke
    Und ich auf "Bearbeiten" bei Station 1 klicke
    Dann bin ich im Stations-Editor für Station 1
    Wenn ich auf "Bild hochladen" klicke
    Und ich ein zufälliges JPEG über "Fotomediathek" hochlade
    Und ich sehe eine Bildvorschau in der Station
    Wenn ich "Puzzle" als Minispiel-Typ wähle
    Und ich die Rastergröße "4" auswähle
    Und ich auf "Speichern" klicke
    Dann sehe ich eine Erfolgsbestätigung

    # --- Station 2 anlegen ---
    Wenn ich auf "← Zurück" klicke
    Und ich auf "+ Station" klicke
    Und ich auf "Bearbeiten" bei Station 2 klicke
    Dann bin ich im Stations-Editor für Station 2
    Wenn ich auf "Bild hochladen" klicke
    Und ich ein zweites zufälliges JPEG über "Fotomediathek" hochlade
    Und ich sehe eine Bildvorschau in der Station
    Wenn ich "Puzzle" als Minispiel-Typ wähle
    Und ich die Rastergröße "4" auswähle
    Und ich auf "Speichern" klicke
    Dann sehe ich eine Erfolgsbestätigung

    # --- Spiel starten ---
    Wenn ich auf "← Zurück" klicke
    Und ich auf "Spiel starten" klicke
    Dann bin ich auf der Player-Übersicht
    Und sehe ich 2 Stationskarten
    Und Station 1 ist als aktuell markiert

    # --- Kind löst Puzzle 1 ---
    Wenn ich auf Station 1 klicke
    Dann bin ich im Minispiel von Station 1
    Und ich sehe das Puzzle-Board
    Und ich sehe 4 Puzzle-Teile in der Ablage
    Und ich sehe keinen Text "Keine Puzzle-Daten vorhanden"
    Wenn ich alle 4 Puzzle-Teile korrekt platziere
    Dann erscheint eine Erfolgsmeldung "Puzzle gelöst!"
    Und ich sehe das Vorschaubild von Station 2

    # --- Kind löst Puzzle 2 ---
    Wenn ich auf "Weiter" klicke
    Dann bin ich auf der Player-Übersicht
    Und Station 2 ist jetzt die aktuelle Station
    Wenn ich auf Station 2 klicke
    Dann bin ich im Minispiel von Station 2
    Und ich sehe das Puzzle-Board
    Und ich sehe 4 Puzzle-Teile in der Ablage
    Und ich sehe keinen Text "Keine Puzzle-Daten vorhanden"
    Wenn ich alle 4 Puzzle-Teile korrekt platziere
    Dann erscheint eine Erfolgsmeldung "Puzzle gelöst!"
    Und ich sehe die Glückwunsch-Seite

  Szenario: Puzzle-Tiles überstehen Seitenreload
    * ich habe zwei Puzzle-Stationen mit Bildern angelegt und gespeichert
    Wenn ich die Seite neu lade
    Und ich Station 1 öffne
    Und ich sehe das Puzzle-Board
    Und ich sehe 4 Puzzle-Teile in der Ablage
    Und ich sehe keinen Text "Keine Puzzle-Daten vorhanden"

  Szenario: Portrait-Foto (EXIF rotiert) wird korrekt ausgerichtet
    * ich habe zwei Stationen angelegt
    Und Station 1 hat ein Portrait-JPEG mit EXIF-Rotation 90° als Bild
    Wenn das Puzzle generiert wird
    Dann sind alle Puzzle-Teile hochkant (Höhe > Breite)
    Und ich sehe keinen Text "Keine Puzzle-Daten vorhanden"
