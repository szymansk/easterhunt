# language: de
Funktionalität: Spiel-Editor

  Hintergrund:
    * ich habe ein neues Spiel erstellt
    Und ich bin im Spiel-Editor

  Szenario: Spielname bearbeiten
    Wenn ich auf den Spielnamen klicke
    Dann erscheint ein Eingabefeld mit dem aktuellen Namen
    Wenn ich den Namen auf 'Ostersuche 2025' ändere
    Und auf 'Speichern' klicke
    Dann zeigt die Überschrift 'Ostersuche 2025'

  Szenario: Spielname-Bearbeitung abbrechen
    Wenn ich auf den Spielnamen klicke
    Und den Namen ändere
    Und Escape drücke
    Dann zeigt die Überschrift den ursprünglichen Namen

  Szenario: Station hinzufügen
    Wenn ich auf '+ Station' klicke
    Dann erscheint eine neue Station in der Liste
    Und die Stationsanzahl erhöht sich um 1

  Szenario: Spiel starten ohne Stationen ist deaktiviert
    Dann ist der Button '▶ Spiel starten' deaktiviert

  Szenario: Spiel starten mit unvollständiger Station zeigt Fehler
    * ich habe eine Station ohne Bild hinzugefügt
    Wenn ich auf '▶ Spiel starten' klicke
    Dann sehe ich eine Fehlermeldung über fehlende Bilder

  Szenario: Station bearbeiten öffnet Editor
    * ich habe eine Station hinzugefügt
    Wenn ich auf 'Bearbeiten' bei der Station klicke
    Dann bin ich im Stations-Editor

  Szenario: Maximale Stationsanzahl (20)
    * ich habe 20 Stationen hinzugefügt
    Dann ist der Button '+ Station' deaktiviert
