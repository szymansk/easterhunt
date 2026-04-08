# language: de
Funktionalität: Stations-Editor

  Hintergrund:
    * ich bin im Stations-Editor für Station 1

  Szenario: Zurück zum Spiel-Editor
    Wenn ich auf '← Zurück' klicke
    Dann bin ich im Spiel-Editor

  Szenario: Minispiel-Typ wählen
    Wenn ich auf 'Puzzle' klicke
    Dann ist 'Puzzle' als aktiver Typ markiert
    Und die Puzzle-Konfiguration ist sichtbar

  Szenario: Minispiel-Typ wechseln mit Bestätigung
    * 'Puzzle' ist ausgewählt
    Wenn ich auf 'Zahlenrätsel' klicke
    Dann erscheint ein Bestätigungs-Dialog
    Wenn ich auf 'Wechseln' klicke
    Dann ist 'Zahlenrätsel' als aktiver Typ markiert

  Szenario: Minispiel-Typ wechseln abbrechen
    * 'Puzzle' ist ausgewählt
    Wenn ich auf 'Zahlenrätsel' klicke
    Und auf 'Abbrechen' klicke
    Dann ist 'Puzzle' immer noch ausgewählt

  Szenario: Bild hochladen öffnet Modal
    Wenn ich auf 'Bild hochladen' klicke
    Dann erscheint ein Modal mit dem Titel 'Bild hochladen'
    Und ich sehe die Option 'Fotomediathek'
    Und ich sehe die Option 'Kamera'

  Szenario: Bild-Modal schließen
    * das Bild-Upload-Modal ist geöffnet
    Wenn ich auf 'Abbrechen' klicke
    Dann ist das Modal nicht mehr sichtbar

  Szenario: Konfiguration speichern
    * ich habe 'Texträtsel' ausgewählt
    Und ich habe eine Frage eingegeben
    Und ich habe mindestens 2 Antwortoptionen eingegeben
    Wenn ich auf 'Speichern' klicke
    Dann sehe ich eine Erfolgsbestätigung
