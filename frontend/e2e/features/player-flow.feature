# language: de
Funktionalität: Player-Ansicht und Stationsfortschritt

  Hintergrund:
    Gegeben es gibt ein gestartetes Spiel mit 3 Stationen

  Szenario: Stationsliste zeigt Fortschritt
    Wenn ich das Spiel öffne
    Dann sehe ich 3 Stationskarten
    Und Station 1 ist als aktuell markiert
    Und Station 2 ist gesperrt
    Und Station 3 ist gesperrt

  Szenario: Gesperrte Station ist nicht anklickbar
    Wenn ich auf Station 2 klicke
    Dann bleibe ich auf der Player-Übersicht

  Szenario: Aktuelle Station öffnen
    Wenn ich auf Station 1 klicke
    Dann bin ich im Minispiel von Station 1

  Szenario: Nach Abschluss wird nächste Station freigeschaltet
    Gegeben ich habe Station 1 abgeschlossen
    Dann ist Station 1 als abgeschlossen markiert
    Und Station 2 ist jetzt die aktuelle Station
    Und Station 3 ist noch gesperrt

  Szenario: Musik-Toggle
    Wenn ich auf den Musik-Button klicke
    Dann ändert sich das Musik-Icon

  Szenario: Alle Stationen abschließen leitet zu Glückwunsch-Seite
    Gegeben ich habe alle 3 Stationen abgeschlossen
    Dann sehe ich die Glückwunsch-Seite
