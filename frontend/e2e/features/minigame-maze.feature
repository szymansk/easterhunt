# language: de
Funktionalität: Minispiel - Labyrinth

  Hintergrund:
    Gegeben ich bin im Labyrinth-Minispiel

  Szenario: Labyrinth wird angezeigt
    Dann sehe ich einen SVG-Spielbereich
    Und ich sehe den Hasen (Avatar)
    Und ich sehe das Osterei (Ziel)
    Und ich sehe den Text 'Finde den Weg!'

  Szenario: Avatar bewegt sich durch das Labyrinth
    Wenn ich den Hasen in Richtung Osterei ziehe
    Dann bewegt sich der Hase

  Szenario: Ziel erreichen schließt Station ab
    Wenn der Hase das Osterei erreicht
    Dann erscheint eine Erfolgsmeldung
    Und die Station wird als abgeschlossen markiert

  Szenario: Wand-Kollision blockiert Bewegung
    Wenn ich den Hasen gegen eine Wand ziehe
    Dann bleibt der Hase an seiner Position
