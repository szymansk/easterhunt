# language: de
Funktionalität: Home Page
  Hintergrund:
    Gegeben die App ist geöffnet

  Szenario: Startseite zeigt Willkommenstext
    Dann sehe ich den Text "Willkommen zur Osterschnitzeljagd!"
    Und ich sehe den Button "Spiel erstellen"
    Und ich sehe den Button "Spiel spielen"

  Szenario: Navigation zum Creator
    Wenn ich auf "Spiel erstellen" klicke
    Dann bin ich auf der Seite "/creator"

  Szenario: Navigation zum Player
    Wenn ich auf "Spiel spielen" klicke
    Dann bin ich auf der Seite "/play"

  Szenario: 404-Seite bei unbekannter Route
    Wenn ich die URL "/unbekannte-seite" aufrufe
    Dann sehe ich den Text "Seite nicht gefunden"
    Und ich sehe den Button "Zur Startseite"

  Szenario: Zurück zur Startseite von 404
    Gegeben ich bin auf der 404-Seite
    Wenn ich auf "Zur Startseite" klicke
    Dann bin ich auf der Seite "/"
