# language: de
Funktionalität: Minispiel - Puzzle

  Hintergrund:
    Gegeben ich bin im Puzzle-Minispiel mit 4 Teilen (2x2)

  Szenario: Puzzle-Board wird angezeigt
    Dann sehe ich ein Zielraster mit 4 leeren Feldern
    Und ich sehe 4 Puzzleteile in der Ablage

  Szenario: Puzzleteil auf richtigen Platz ziehen
    Wenn ich Puzzleteil 1 auf Feld 1 ziehe
    Dann ist Puzzleteil 1 im Raster eingerastet
    Und ein Snap-Sound wird abgespielt

  Szenario: Puzzleteil auf falschen Platz ziehen
    Wenn ich Puzzleteil 1 auf Feld 2 ziehe
    Dann springt das Teil zurück in die Ablage

  Szenario: Alle Teile korrekt platziert schließt Puzzle ab
    Wenn ich alle 4 Puzzleteile korrekt platziere
    Dann erscheint eine Erfolgsmeldung 'Puzzle gelöst!'
    Und die Station wird als abgeschlossen markiert

  Szenario: Ablage zeigt leere Meldung wenn alle Teile platziert
    Wenn alle Puzzleteile im Raster sind
    Dann zeigt die Ablage 'Ablage leer'
