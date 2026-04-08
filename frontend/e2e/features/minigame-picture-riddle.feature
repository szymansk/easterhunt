# language: de
Funktionalität: Minispiel - Bilderrätsel 'Was gehört dazu?'

  Hintergrund:
    * ich bin im Bilderrätsel-Minispiel
    Und es werden 2 Referenzbilder angezeigt
    Und es werden 4 Antwortbilder im 2x2-Raster angezeigt

  Szenario: Rätsel-Layout wird korrekt angezeigt
    Dann sehe ich 2 Referenzbilder
    Und ich sehe 4 Antwortoptionen im Raster

  Szenario: Korrekte Bildoption auswählen
    Wenn ich auf das richtige Antwortbild tippe
    Dann wird das Bild grün umrandet
    Und die Station wird als abgeschlossen markiert

  Szenario: Falsche Bildoption auswählen
    Wenn ich auf ein falsches Antwortbild tippe
    Dann wird das Bild rot umrandet
    Und es erscheint eine Wackel-Animation
    Und nach kurzer Zeit sind alle Bilder wieder auswählbar

  Szenario: Antwortbilder sind mindestens 80px groß
    Dann haben alle Antwortbilder eine Mindestgröße von 80px
