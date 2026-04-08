# language: de
Funktionalität: Spiel-Abschluss-Bildschirm

  Hintergrund:
    * alle Stationen sind abgeschlossen
    Und ich bin auf der Glückwunsch-Seite

  Szenario: Glückwunsch-Bildschirm zeigt Feierlichkeiten
    Dann sehe ich den Text 'Geschafft!'
    Und ich sehe den Text 'Du hast alle Stationen gefunden!'
    Und ich sehe den Button 'Nochmal spielen'
    Und ich sehe den Button 'Zum Start'

  Szenario: Nochmal spielen setzt Fortschritt zurück
    Wenn ich auf 'Nochmal spielen' klicke
    Dann bin ich auf der Player-Übersicht
    Und Station 1 ist wieder die aktuelle Station

  Szenario: Zum Start navigiert zur Startseite
    Wenn ich auf 'Zum Start' klicke
    Dann bin ich auf der Startseite '/'
