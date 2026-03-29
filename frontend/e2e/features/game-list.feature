# language: de
Funktionalität: Spielliste im Creator
  Hintergrund:
    Gegeben ich bin auf der Creator-Startseite "/creator"

  Szenario: Leere Spielliste
    Dann sehe ich die Überschrift "Meine Spiele"
    Und ich sehe den Button "+ Neues Spiel"

  Szenario: Neues Spiel erstellen
    Wenn ich auf "+ Neues Spiel" klicke
    Dann werde ich zum Spiel-Editor weitergeleitet
    Und das neue Spiel erscheint in der Liste

  Szenario: Spiel bearbeiten
    Gegeben es existiert ein Spiel "Ostern 2025"
    Wenn ich auf "Bearbeiten" klicke
    Dann bin ich im Spiel-Editor für "Ostern 2025"

  Szenario: Spiel löschen mit Bestätigung
    Gegeben es existiert ein Spiel "Test Spiel"
    Wenn ich auf "Löschen" klicke
    Dann erscheint ein Bestätigungs-Dialog
    Wenn ich auf "Bestätigen" klicke
    Dann ist "Test Spiel" nicht mehr in der Liste

  Szenario: Spiel löschen abbrechen
    Gegeben es existiert ein Spiel "Wichtiges Spiel"
    Wenn ich auf "Löschen" klicke
    Dann erscheint ein Bestätigungs-Dialog
    Wenn ich auf "Abbrechen" klicke
    Dann ist "Wichtiges Spiel" noch in der Liste

  Szenario: Status-Badge für Entwurf
    Gegeben es existiert ein Spiel im Status "Entwurf"
    Dann sehe ich ein Status-Badge mit "Entwurf"
