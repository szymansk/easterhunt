# language: de
Funktionalität: Minispiel - Texträtsel

  Hintergrund:
    Gegeben ich bin im Texträtsel-Minispiel mit der Frage 'Was legt die Henne?'
    Und die Antwortoptionen sind 'Ei', 'Milch', 'Wolle'
    Und die korrekte Antwort ist 'Ei'

  Szenario: Frage wird angezeigt
    Dann sehe ich die Frage 'Was legt die Henne?'
    Und ich sehe 3 Antwortbuttons

  Szenario: Richtige Antwort führt zum Abschluss
    Wenn ich auf 'Ei' klicke
    Dann wird der Button grün markiert
    Und die Station wird als abgeschlossen markiert

  Szenario: Falsche Antwort zeigt Fehler-Feedback
    Wenn ich auf 'Milch' klicke
    Dann wird der Button rot markiert
    Und ich sehe eine Wackel-Animation
    Und die Station bleibt unabgeschlossen

  Szenario: Nach falscher Antwort kann erneut versucht werden
    Wenn ich auf 'Milch' klicke
    Und die Fehler-Animation abgeschlossen ist
    Dann sind die Antwortbuttons wieder anklickbar

  Szenario: TTS-Button liest Frage vor (wenn aktiviert)
    Gegeben TTS ist aktiviert
    Dann sehe ich einen Vorlesen-Button
    Wenn ich auf den Vorlesen-Button klicke
    Dann wird die Frage vorgelesen
