# language: de
Funktionalität: Spielliste im Creator
  Hintergrund:
    * ich bin auf der Creator-Startseite "/creator"

  Szenario: Leere Spielliste
    Dann sehe ich die Überschrift "Meine Spiele"
    Und ich sehe den Button "+ Neues Spiel"

  Szenario: Neues Spiel erstellen
    Wenn ich auf "+ Neues Spiel" klicke
    Dann werde ich zum Spiel-Editor weitergeleitet
    Und das neue Spiel erscheint in der Liste

  Szenario: Spiel bearbeiten
    * es existiert ein Spiel "Ostern 2025"
    Wenn ich bei "Ostern 2025" auf "Bearbeiten" klicke
    Dann bin ich im Spiel-Editor für "Ostern 2025"

  Szenario: Spiel löschen mit Bestätigung
    * es existiert ein Spiel "Test Spiel"
    Wenn ich bei "Test Spiel" auf "Löschen" klicke
    Dann erscheint ein Bestätigungs-Dialog
    Wenn ich auf "Löschen" klicke
    Dann ist "Test Spiel" nicht mehr in der Liste

  Szenario: Spiel löschen abbrechen
    * es existiert ein Spiel "Wichtiges Spiel"
    Wenn ich bei "Wichtiges Spiel" auf "Löschen" klicke
    Dann erscheint ein Bestätigungs-Dialog
    Wenn ich auf "Abbrechen" klicke
    Dann ist "Wichtiges Spiel" noch in der Liste

  Szenario: Status-Badge für Entwurf
    * es existiert ein Spiel im Status "Entwurf"
    Dann sehe ich ein Status-Badge mit "Entwurf"
