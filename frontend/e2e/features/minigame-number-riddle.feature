# language: de
Funktionalität: Minispiel - Zahlenrätsel

  Hintergrund:
    Gegeben ich bin im Zahlenrätsel-Minispiel
    Und die Aufgabe lautet '3 + 2'
    Und die korrekte Antwort ist '5'
    Und die Distraktoren sind '3', '7'

  Szenario: Aufgabe und Zahlenbuttons werden angezeigt
    Dann sehe ich die Aufgabe '3 + 2'
    Und ich sehe Zahlenbuttons

  Szenario: Richtige Zahl auswählen
    Wenn ich auf '5' klicke
    Dann wird der Button grün markiert
    Und die Station wird als abgeschlossen markiert

  Szenario: Falsche Zahl auswählen
    Wenn ich auf '3' klicke
    Dann wird der Button rot markiert
    Und es erscheint eine Wackel-Animation
    Und die Antwortbuttons werden nach kurzer Zeit wieder aktiv

  Szenario: Buttons sind mindestens 60px groß
    Dann haben alle Zahlenbuttons eine Mindestgröße von 60px
