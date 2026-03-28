# Anforderungen – Ostereier-Schnitzeljagd Web-App

## 1. Ziel und Scope

Die Anwendung ermöglicht einer erwachsenen Person, eine kindgerechte digitale Ostereier-Schnitzeljagd auf Basis eigener Stationsbilder zu erstellen, lokal zu speichern und auf einem iPhone im Heimnetzwerk durchzuführen.

Die Schnitzeljagd besteht aus einer linearen Folge von Stationen. Jede Station enthält genau ein Minispiel. Nach erfolgreichem Abschluss einer Station wird ausschließlich die nächste Station freigeschaltet.

Die Anwendung verwendet zwei Arten von Bildern:

1. **Stationsbilder**
   - werden pro Spiel individuell aufgenommen oder hochgeladen
   - repräsentieren reale Orte der Schnitzeljagd
   - werden in der App ausschließlich für das Minispiel **Puzzle** dynamisch verarbeitet

2. **Rätselbilder**
   - werden einmalig vorbereitet und kuratiert
   - sind lokal gespeichert
   - werden in der App mehrfach wiederverwendet
   - werden zur Laufzeit nicht neu erzeugt

---

## 2. Rollen

### 2.1 Spiel-Ersteller
Eine erwachsene Person, die ein Spiel anlegt, Stationsbilder aufnimmt oder hochlädt, Minispiele je Station konfiguriert und das Spiel startet.

### 2.2 Kind als Spieler
Ein Kind im Alter von ca. 5 Jahren, das die Stationen nacheinander löst.

---

## 3. Fachliche Anforderungen

### FR-001 – Neues Spiel anlegen
Das System muss dem Spiel-Ersteller ermöglichen, ein neues Spiel anzulegen.

#### Gherkin
```gherkin
Feature: Neues Spiel anlegen

  Scenario: Leeres Spiel wird angelegt
    Given der Spiel-Ersteller befindet sich in der Verwaltungsansicht
    When der Spiel-Ersteller ein neues Spiel anlegt
    Then wird ein leeres Spiel mit eindeutiger ID erzeugt
    And das Spiel enthält zunächst keine Stationen
    And das Spiel befindet sich im Status "Entwurf"
```

---

### FR-002 – Stationsbilder hochladen oder aufnehmen
Das System muss dem Spiel-Ersteller ermöglichen, pro Station genau ein Stationsbild per Datei-Upload oder Kameraaufnahme bereitzustellen.

#### Gherkin
```gherkin
Feature: Stationsbild bereitstellen

  Scenario: Stationsbild per Upload hinterlegen
    Given ein Spiel im Status "Entwurf" existiert
    And eine Station ohne Stationsbild existiert
    When der Spiel-Ersteller ein Bilddatei im unterstützten Format auswählt
    Then wird das Bild der Station zugeordnet
    And die Station enthält genau ein Stationsbild

  Scenario: Stationsbild per Kameraaufnahme hinterlegen
    Given ein Spiel im Status "Entwurf" existiert
    And eine Station ohne Stationsbild existiert
    And das Endgerät unterstützt Kameraaufnahme im Browser
    When der Spiel-Ersteller ein Foto mit der Kamera aufnimmt und bestätigt
    Then wird das aufgenommene Bild der Station zugeordnet
    And die Station enthält genau ein Stationsbild
```

---

### FR-003 – Anzahl und Reihenfolge der Stationen
Das System muss eine Schnitzeljagd mit mindestens 1 und höchstens 20 Stationen unterstützen. Die Reihenfolge der Stationen muss durch den Spiel-Ersteller festgelegt werden können.

#### Gherkin
```gherkin
Feature: Stationen verwalten

  Scenario: Station innerhalb des erlaubten Bereichs hinzufügen
    Given ein Spiel im Status "Entwurf" existiert
    And das Spiel enthält 3 Stationen
    When der Spiel-Ersteller eine weitere Station hinzufügt
    Then enthält das Spiel 4 Stationen

  Scenario: Mehr als 20 Stationen verhindern
    Given ein Spiel im Status "Entwurf" existiert
    And das Spiel enthält 20 Stationen
    When der Spiel-Ersteller eine weitere Station hinzufügen will
    Then wird die Aktion abgelehnt
    And das System zeigt eine verständliche Fehlermeldung an

  Scenario: Reihenfolge der Stationen ändern
    Given ein Spiel im Status "Entwurf" enthält mindestens 2 Stationen
    When der Spiel-Ersteller die Reihenfolge zweier Stationen tauscht
    Then speichert das System die neue Stationsreihenfolge
```

---

### FR-004 – Genau ein Minispiel pro Station
Das System muss jeder Station genau ein Minispiel zuordnen.

#### Gherkin
```gherkin
Feature: Minispiel zuordnen

  Scenario: Genau ein Minispiel wird einer Station zugeordnet
    Given ein Spiel im Status "Entwurf" existiert
    And eine Station existiert
    When der Spiel-Ersteller für die Station den Minispieltyp "Puzzle" auswählt
    Then ist der Station genau ein Minispieltyp zugeordnet

  Scenario: Zweites Minispiel wird nicht zusätzlich gespeichert
    Given eine Station hat bereits den Minispieltyp "Puzzle"
    When der Spiel-Ersteller den Minispieltyp auf "Labyrinth" ändert
    Then ist der Station genau ein Minispieltyp zugeordnet
    And der Minispieltyp der Station ist "Labyrinth"
```

---

### FR-005 – Spiel nur bei vollständiger Konfiguration startbar
Ein Spiel darf nur gestartet werden, wenn jede Station vollständig konfiguriert ist.

Vollständig konfiguriert bedeutet mindestens:
- Stationsbild vorhanden
- Minispieltyp vorhanden
- notwendige minispielspezifische Daten vorhanden

#### Gherkin
```gherkin
Feature: Spielstart validieren

  Scenario: Vollständig konfiguriertes Spiel starten
    Given ein Spiel enthält 3 Stationen
    And jede Station hat ein Stationsbild
    And jede Station hat genau einen Minispieltyp
    And alle minispielspezifischen Pflichtdaten sind vorhanden
    When der Spiel-Ersteller das Spiel startet
    Then wechselt das Spiel in den Status "Gestartet"

  Scenario: Unvollständiges Spiel nicht starten
    Given ein Spiel enthält 3 Stationen
    And eine Station hat keinen Minispieltyp
    When der Spiel-Ersteller das Spiel startet
    Then wird der Start verhindert
    And das System zeigt an, welche Station unvollständig ist
```

---

### FR-006 – Spiel speichern und erneut laden
Das System muss Spiele lokal speichern und erneut laden können.

#### Gherkin
```gherkin
Feature: Spiel speichern und laden

  Scenario: Spiel speichern
    Given ein Spiel im Status "Entwurf" existiert
    And das Spiel enthält mindestens eine konfigurierte Station
    When der Spiel-Ersteller das Spiel speichert
    Then werden Spielmetadaten, Stationen, Minispielzuordnungen und Bildreferenzen lokal gespeichert

  Scenario: Gespeichertes Spiel laden
    Given ein zuvor lokal gespeichertes Spiel existiert
    When der Spiel-Ersteller das gespeicherte Spiel lädt
    Then werden die gespeicherten Stationen in der gespeicherten Reihenfolge angezeigt
    And alle gespeicherten Minispielzuordnungen sind wiederhergestellt
```

---

### FR-007 – Linearer Spielablauf
Das System muss das Spiel streng linear abspielen. Zu Beginn ist nur Station 1 freigeschaltet. Nach erfolgreichem Abschluss einer Station wird ausschließlich die direkt folgende Station freigeschaltet.

#### Gherkin
```gherkin
Feature: Linearer Spielablauf

  Scenario: Nur erste Station ist zu Beginn freigeschaltet
    Given ein vollständig konfiguriertes Spiel wurde gestartet
    When das Kind die Spielansicht öffnet
    Then ist Station 1 spielbar
    And Station 2 ist gesperrt

  Scenario: Nächste Station wird nach Erfolg freigeschaltet
    Given Station 1 ist spielbar
    And Station 2 ist gesperrt
    When das Kind Station 1 erfolgreich abschließt
    Then ist Station 1 als gelöst markiert
    And Station 2 ist spielbar
    And keine weitere Station außer Station 2 wird zusätzlich freigeschaltet
```

---

### FR-008 – Stationsabschluss
Eine Station gilt als abgeschlossen, wenn das zugeordnete Minispiel korrekt gelöst wurde.

#### Gherkin
```gherkin
Feature: Stationsabschluss

  Scenario: Station nach korrekter Lösung abschließen
    Given eine Station ist spielbar
    And das zugeordnete Minispiel wurde korrekt gelöst
    When das System die Lösung auswertet
    Then wird die Station als "gelöst" markiert
    And der Fortschritt des Spiels wird aktualisiert
```

---

### FR-009 – Spielabschluss
Nach erfolgreichem Abschluss der letzten Station muss das System das Spiel als beendet markieren und eine Abschlussbelohnung anzeigen.

#### Gherkin
```gherkin
Feature: Spielabschluss

  Scenario: Letzte Station abschließen
    Given die letzte Station eines Spiels ist spielbar
    When das Kind die letzte Station erfolgreich abschließt
    Then markiert das System das Spiel als "beendet"
    And das System zeigt eine Abschlussbelohnung an
```

---

### FR-010 – Kindgerechte Benutzeroberfläche
Die Benutzeroberfläche muss für Kinder im Alter von ca. 5 Jahren bedienbar sein.

Mindestanforderungen:
- große Touch-Ziele
- einfache lineare Navigation
- reduzierte Textmenge
- klare visuelle Rückmeldungen

#### Gherkin
```gherkin
Feature: Kindgerechte Bedienung

  Scenario: Bedienung per Touch
    Given das Kind verwendet die Anwendung auf einem iPhone
    When das Kind ein interaktives UI-Element antippen will
    Then ist das UI-Element per Touch bedienbar

  Scenario: Keine komplexe Navigation während des Spiels
    Given das Kind befindet sich im laufenden Spiel
    When das Kind eine Station spielt
    Then werden nur für den aktuellen Schritt relevante Navigationselemente angezeigt
```

---

### FR-011 – Unbegrenzte Wiederholungsversuche
Das Kind muss bei falschen Antworten oder Fehlversuchen ein Minispiel unbegrenzt erneut versuchen können.

#### Gherkin
```gherkin
Feature: Wiederholungsversuche

  Scenario: Falsche Antwort verhindert keinen weiteren Versuch
    Given eine Station ist spielbar
    When das Kind eine falsche Antwort gibt
    Then bleibt die Station ungelöst
    And das Kind kann das Minispiel erneut versuchen
```

---

### FR-012 – Visuelles und akustisches Erfolgsfeedback
Das System muss bei korrekter Lösung einer Station visuelles und akustisches Erfolgsfeedback geben.

#### Gherkin
```gherkin
Feature: Erfolgsfeedback

  Scenario: Erfolgsfeedback nach korrekter Lösung
    Given eine Station ist spielbar
    When das Kind das Minispiel korrekt löst
    Then zeigt das System eine visuelle Erfolgsrückmeldung an
    And das System spielt einen positiven Soundeffekt ab
```

---

### FR-013 – Hintergrundmusik optional
Das System soll optionale Hintergrundmusik unterstützen.

#### Gherkin
```gherkin
Feature: Hintergrundmusik

  Scenario: Hintergrundmusik ist aktiviert
    Given die Hintergrundmusik ist in den Einstellungen aktiviert
    And das Kind hat mindestens eine Benutzerinteraktion durchgeführt
    When das Spiel startet
    Then beginnt die Hintergrundmusik in Schleife zu spielen

  Scenario: Hintergrundmusik ist deaktiviert
    Given die Hintergrundmusik ist in den Einstellungen deaktiviert
    When das Spiel startet
    Then wird keine Hintergrundmusik abgespielt
```

---

### FR-014 – Vorlesefunktion optional
Das System soll für geeignete Rätsel und Anweisungen eine optionale Vorlesefunktion unterstützen.

#### Gherkin
```gherkin
Feature: Vorlesefunktion

  Scenario: Rätseltext vorlesen
    Given eine Station mit textbasiertem Rätsel ist spielbar
    And die Vorlesefunktion ist aktiviert
    When das Kind oder der Spiel-Ersteller die Vorlesefunktion auslöst
    Then wird der Rätseltext per Text-to-Speech ausgegeben
```

---

## 4. Minispiel-Anforderungen

### FR-020 – Minispiel Puzzle aus Stationsbild
Das System muss aus dem Bild der nächsten Station automatisch ein Puzzle erzeugen.

#### Präzisierung
- Es werden nur Stationsbilder dynamisch in Puzzleteile zerlegt.
- Das Puzzle verwendet das Bild der nächsten Station als visuellen Hinweis.
- Für die letzte Station muss konfigurierbar sein, ob ein Abschlussbild gepuzzelt wird oder ein anderes Minispiel verwendet wird.

#### Gherkin
```gherkin
Feature: Puzzle aus Stationsbild

  Scenario: Puzzle aus Bild der nächsten Station erzeugen
    Given Station 1 ist spielbar
    And Station 2 besitzt ein Stationsbild
    And Station 1 hat den Minispieltyp "Puzzle"
    When Station 1 geladen wird
    Then erzeugt das System ein Puzzle aus dem Stationsbild von Station 2

  Scenario: Letzte Station mit Abschlussbild
    Given die letzte Station hat den Minispieltyp "Puzzle"
    And ein Abschlussbild ist konfiguriert
    When die letzte Station geladen wird
    Then erzeugt das System ein Puzzle aus dem Abschlussbild
```

---

### FR-021 – Puzzle mit 3 bis 9 Teilen
Das System muss Puzzle mit 3 bis 9 Teilen unterstützen. Für den MVP werden die Rasterkonfigurationen 3, 4, 6 und 9 Teile unterstützt.

#### Gherkin
```gherkin
Feature: Anzahl der Puzzleteile

  Scenario Outline: Unterstützte Puzzlegrößen erzeugen
    Given ein Puzzle-Minispiel ist für <teile> Teile konfiguriert
    When das Puzzle erzeugt wird
    Then erzeugt das System genau <teile> Puzzleteile

    Examples:
      | teile |
      | 3     |
      | 4     |
      | 6     |
      | 9     |

  Scenario: Nicht unterstützte Puzzlegröße verhindern
    Given ein Puzzle-Minispiel ist für 5 Teile konfiguriert
    When das Puzzle gespeichert oder gestartet werden soll
    Then wird die Konfiguration abgelehnt
    And das System zeigt eine verständliche Fehlermeldung an
```

---

### FR-022 – Puzzleteile starten unterhalb des Zielbereichs
Alle Puzzleteile müssen zu Beginn in einem separaten Bereich unterhalb des Zielbildbereichs angezeigt werden.

#### Gherkin
```gherkin
Feature: Startposition der Puzzleteile

  Scenario: Puzzleteile starten im unteren Ablagebereich
    Given ein Puzzle wurde geladen
    When das Minispiel angezeigt wird
    Then befinden sich alle Puzzleteile im Ablagebereich unterhalb des Zielbereichs
    And kein Puzzleteil befindet sich zu Beginn korrekt platziert im Zielbereich
```

---

### FR-023 – Puzzleteile per Drag-and-Drop bewegen
Das Kind muss Puzzleteile per Drag-and-Drop mit Touch-Eingabe in den Zielbereich bewegen können.

#### Gherkin
```gherkin
Feature: Puzzle per Drag-and-Drop bedienen

  Scenario: Puzzleteil mit Touch verschieben
    Given ein Puzzle ist spielbar
    And ein Puzzleteil befindet sich im unteren Ablagebereich
    When das Kind das Puzzleteil per Touch in Richtung Zielbereich zieht
    Then folgt das Puzzleteil der Touch-Bewegung
```

---

### FR-024 – Puzzleteile sind korrekt rotiert
Alle Puzzleteile müssen bei Start korrekt orientiert sein. Eine Rotation durch das Kind wird nicht unterstützt.

#### Gherkin
```gherkin
Feature: Orientierung der Puzzleteile

  Scenario: Puzzleteile benötigen keine Rotation
    Given ein Puzzle wurde erzeugt
    When das Minispiel angezeigt wird
    Then sind alle Puzzleteile korrekt orientiert
    And es wird keine Funktion zum Rotieren angezeigt
```

---

### FR-025 – Korrektes Einrasten von Puzzleteilen
Das System muss erkennen, ob ein Puzzleteil an der richtigen Position abgelegt wurde. Korrekt abgelegte Teile müssen an ihrer Zielposition einrasten.

#### Gherkin
```gherkin
Feature: Puzzleteil einrasten

  Scenario: Puzzleteil korrekt platzieren
    Given ein Puzzle ist spielbar
    And ein Puzzleteil wird nahe seiner korrekten Zielposition abgelegt
    When das Kind das Puzzleteil loslässt
    Then rastet das Puzzleteil an der korrekten Zielposition ein
    And das Puzzleteil ist danach als korrekt platziert markiert
```

---

### FR-026 – Falsch platzierte Puzzleteile springen zurück
Ein falsch abgelegtes Puzzleteil darf nicht dauerhaft falsch platziert bleiben.

#### Gherkin
```gherkin
Feature: Falsch platzierte Puzzleteile zurücksetzen

  Scenario: Falsch abgelegtes Puzzleteil springt zurück
    Given ein Puzzle ist spielbar
    And ein Puzzleteil wird nicht nahe seiner korrekten Zielposition abgelegt
    When das Kind das Puzzleteil loslässt
    Then wird das Puzzleteil in den unteren Ablagebereich zurückgesetzt
    And das Puzzleteil ist nicht als korrekt platziert markiert
```

---

### FR-027 – Puzzle gilt als gelöst, wenn alle Teile korrekt platziert sind
Eine Puzzle-Station gilt als erfolgreich gelöst, wenn alle Puzzleteile korrekt platziert wurden.

#### Gherkin
```gherkin
Feature: Puzzle abschließen

  Scenario: Alle Teile korrekt platziert
    Given ein Puzzle ist spielbar
    And alle Puzzleteile bis auf eines sind korrekt platziert
    When das letzte Puzzleteil korrekt einrastet
    Then gilt das Puzzle als gelöst
    And die Station wird erfolgreich abgeschlossen
```

---

### FR-030 – Zahlenrätsel im Zahlenraum 1 bis 10
Das System muss Zahlenrätsel im Zahlenraum 1 bis 10 unterstützen.

Unterstützte Aufgabentypen im MVP:
- Objekte zählen
- Zahl einer Menge zuordnen
- einfache Plus-/Minus-Aufgaben mit Ergebnis im Zahlenraum 1 bis 10

#### Gherkin
```gherkin
Feature: Zahlenrätsel

  Scenario Outline: Unterstützten Aufgabentyp laden
    Given eine Station mit dem Minispieltyp "Zahlenrätsel" existiert
    And die Aufgabe hat den Typ <typ>
    When die Station geladen wird
    Then wird die Aufgabe erfolgreich angezeigt

    Examples:
      | typ                  |
      | Objekte zählen       |
      | Zahl zuordnen        |
      | PlusMinus            |

  Scenario: Genau eine richtige Lösung vorhanden
    Given ein Zahlenrätsel wird angezeigt
    When die Antwortoptionen geladen werden
    Then existiert genau eine richtige Lösung
```

---

### FR-031 – Antworten im Zahlenrätsel per große Auswahlfelder
Antworten in Zahlenrätseln müssen über große antippbare Auswahlfelder erfolgen.

#### Gherkin
```gherkin
Feature: Zahlenrätsel bedienen

  Scenario: Antwort über Touch auswählen
    Given ein Zahlenrätsel wird angezeigt
    When das Kind eine Antwortoption antippt
    Then wertet das System die ausgewählte Antwort aus
```

---

### FR-040 – Einfaches Labyrinth
Das System muss einfache visuelle Labyrinthe für Kinder im Alter von ca. 5 Jahren unterstützen.

#### Gherkin
```gherkin
Feature: Labyrinth

  Scenario: Labyrinth anzeigen
    Given eine Station mit dem Minispieltyp "Labyrinth" ist spielbar
    When die Station geladen wird
    Then wird ein Labyrinth mit Startpunkt und Zielpunkt angezeigt
```

---

### FR-041 – Labyrinth per Touch bedienbar
Das Labyrinth muss per Touch bedienbar sein.

#### Gherkin
```gherkin
Feature: Labyrinth per Touch steuern

  Scenario: Weg im Labyrinth mit Touch verfolgen
    Given ein Labyrinth ist spielbar
    When das Kind den Weg per Touch vom Start in Richtung Ziel verfolgt
    Then reagiert das Labyrinth auf die Touch-Bewegung
```

---

### FR-042 – Labyrinth gilt als gelöst, wenn das Ziel erreicht ist
Eine Labyrinth-Station gilt als erfolgreich gelöst, wenn das Ziel erreicht wurde.

#### Gherkin
```gherkin
Feature: Labyrinth abschließen

  Scenario: Zielpunkt erreichen
    Given ein Labyrinth ist spielbar
    When das Kind den Zielpunkt gültig erreicht
    Then gilt das Labyrinth als gelöst
    And die Station wird erfolgreich abgeschlossen
```

---

### FR-050 – Text-/Audio-Rätsel
Das System muss textbasierte Rätsel unterstützen.

#### Gherkin
```gherkin
Feature: Textbasiertes Rätsel

  Scenario: Text-Rätsel anzeigen
    Given eine Station mit dem Minispieltyp "TextAudioRätsel" ist spielbar
    When die Station geladen wird
    Then wird ein textbasiertes Rätsel angezeigt
```

---

### FR-051 – Text-/Audio-Rätsel mit Multiple Choice oder Einzelwahl
Antworten bei Text-/Audio-Rätseln dürfen im MVP nur als Multiple Choice oder als einzelner Tap auf eine richtige Option erfolgen. Freitext wird nicht unterstützt.

#### Gherkin
```gherkin
Feature: Antwortmodus im Text-/Audio-Rätsel

  Scenario Outline: Unterstützte Antwortform laden
    Given eine Station mit dem Minispieltyp "TextAudioRätsel" ist spielbar
    And die Aufgabe verwendet den Antwortmodus <modus>
    When die Station geladen wird
    Then wird der Antwortmodus <modus> angezeigt

    Examples:
      | modus          |
      | MultipleChoice |
      | Einzelwahl     |

  Scenario: Freitext ist nicht unterstützt
    Given eine Station mit dem Minispieltyp "TextAudioRätsel" existiert
    When eine Aufgabe mit dem Antwortmodus "Freitext" gespeichert werden soll
    Then wird die Konfiguration abgelehnt
```

---

### FR-060 – Bilderrätsel „Was fehlt denn hier?“
Das System muss ein Bilderrätsel bereitstellen, bei dem 2 Gegenstände als Vorgabe angezeigt werden und aus 4 Antwortoptionen genau 1 Gegenstand ausgewählt werden muss, der logisch zu den beiden Vorgaben passt.

#### Gherkin
```gherkin
Feature: Bilderrätsel Was fehlt denn hier

  Scenario: Aufgabe mit zwei Vorgaben und vier Antwortoptionen anzeigen
    Given eine Station mit dem Minispieltyp "WasFehltDennHier" ist spielbar
    When die Station geladen wird
    Then werden genau 2 Vorgabe-Gegenstände angezeigt
    And es werden genau 4 Antwortoptionen angezeigt
    And genau 1 Antwortoption ist als korrekt hinterlegt
```

---

### FR-061 – Eindeutige Aufgabenlogik im Bilderrätsel
Die richtige Lösung muss die beiden vorgegebenen Gegenstände sinnvoll ergänzen. Es darf keine Aufgabe verwendet werden, bei der mehrere Antwortoptionen plausibel richtig sein könnten.

#### Gherkin
```gherkin
Feature: Eindeutigkeit der Bilderrätsel-Aufgabe

  Scenario: Nur eindeutige Aufgabe verwenden
    Given eine Bilderrätsel-Aufgabe ist im Aufgabenpool vorhanden
    When die Aufgabe für ein Spiel verwendet wird
    Then ist genau eine Antwortoption fachlich korrekt
    And keine weitere Antwortoption ist plausibel gleichwertig korrekt
```

---

### FR-062 – Alltagskontext für Kinder im Bilderrätsel
Die Gegenstände im Bilderrätsel müssen aus dem Alltag eines Kindes stammen.

Unterstützte Themenwelten mindestens:
- Spielzeug
- Haushalt
- KiTa / Kindergarten
- Essen und Trinken
- Malen und Basteln
- Kleidung

#### Gherkin
```gherkin
Feature: Kindgerechte Themenwelten im Bilderrätsel

  Scenario Outline: Aufgabe gehört zu unterstützter Themenwelt
    Given eine Bilderrätsel-Aufgabe ist im Aufgabenpool vorhanden
    When die Aufgabe validiert wird
    Then gehört die Aufgabe zur Themenwelt <themenwelt>

    Examples:
      | themenwelt          |
      | Spielzeug           |
      | Haushalt            |
      | KiTaKindergarten    |
      | EssenUndTrinken     |
      | MalenUndBasteln     |
      | Kleidung            |
```

---

### FR-063 – Auswahl per Tap im Bilderrätsel
Die Auswahl der Antwort im Bilderrätsel muss per Tap erfolgen.

#### Gherkin
```gherkin
Feature: Bilderrätsel per Tap bedienen

  Scenario: Antwortoption antippen
    Given ein Bilderrätsel wird angezeigt
    When das Kind eine der 4 Antwortoptionen antippt
    Then wertet das System die ausgewählte Antwort aus
```

---

### FR-064 – Bilderrätsel bei korrekter Auswahl erfolgreich abschließen
Eine Station mit dem Bilderrätsel gilt als erfolgreich gelöst, wenn der richtige Gegenstand ausgewählt wurde.

#### Gherkin
```gherkin
Feature: Bilderrätsel abschließen

  Scenario: Richtige Antwort auswählen
    Given ein Bilderrätsel wird angezeigt
    And eine der 4 Antwortoptionen ist korrekt
    When das Kind die korrekte Antwortoption antippt
    Then gilt das Bilderrätsel als gelöst
    And die Station wird erfolgreich abgeschlossen
```

---

## 5. Anforderungen an Inhalte und Bildquellen

### FR-070 – Trennung von Stationsbildern und Rätselbildern
Das System muss zwischen spielindividuellen Stationsbildern und wiederverwendbaren Rätselbildern unterscheiden.

#### Gherkin
```gherkin
Feature: Bildquellen trennen

  Scenario: Stationsbild wird als spielindividueller Inhalt behandelt
    Given ein Spiel enthält eine Station mit Stationsbild
    When das Spiel gespeichert wird
    Then wird das Stationsbild als spielindividueller Inhalt referenziert oder gespeichert

  Scenario: Rätselbild wird als wiederverwendbarer Inhalt behandelt
    Given ein Rätselbild gehört zur Rätsel-Content-Bibliothek
    When ein Spiel mit einem Bilderrätsel gespeichert wird
    Then wird das Rätselbild nicht dupliziert pro Spiel gespeichert
    And das Spiel referenziert den wiederverwendbaren Inhalt
```

---

### FR-071 – Rätselbilder werden vorab erzeugt und wiederverwendet
Rätselbilder für Minispiele außerhalb des Puzzles müssen einmalig vorbereitet und anschließend in der App wiederholt verwendet werden.

#### Gherkin
```gherkin
Feature: Wiederverwendbare Rätselbilder

  Scenario: Rätselbild mehrfach verwenden
    Given ein Rätselbild ist in der Rätsel-Content-Bibliothek vorhanden
    When zwei verschiedene Spiele dieselbe Bilderrätsel-Aufgabe verwenden
    Then referenzieren beide Spiele dasselbe vorbereitete Rätselbild
```

---

### FR-072 – Nur das Puzzle wird in der App dynamisch aus Stationsbildern erzeugt
In der App selbst darf nur das Puzzle aus dem jeweiligen Stationsbild dynamisch erzeugt werden.

#### Gherkin
```gherkin
Feature: Dynamische Bildverarbeitung beschränken

  Scenario: Puzzle wird dynamisch erzeugt
    Given eine Station mit dem Minispieltyp "Puzzle" ist spielbar
    When die Station geladen wird
    Then erzeugt die App Puzzleteile dynamisch aus einem Stationsbild oder Abschlussbild

  Scenario: Anderes Minispiel verwendet keine dynamische Bildgenerierung
    Given eine Station mit dem Minispieltyp "WasFehltDennHier" ist spielbar
    When die Station geladen wird
    Then verwendet die App ausschließlich vorbereitete Rätselbilder
    And es wird keine neue Bildvariante zur Laufzeit erzeugt
```

---

### FR-073 – Keine generische AI-Bildgenerierung in der App-Laufzeit
Die App selbst muss keine generische AI-Bildgenerierung für Minispiele wie „Was fehlt denn hier?“ unterstützen.

#### Gherkin
```gherkin
Feature: Keine AI-Bildgenerierung zur Laufzeit

  Scenario: Laufzeitbetrieb ohne AI-Bildgenerierung
    Given das Spiel läuft lokal im Heimnetzwerk
    When ein Nicht-Puzzle-Minispiel gestartet wird
    Then wird keine AI-Bildgenerierung zur Laufzeit aufgerufen
```

---

### FR-074 – Lokale Bibliothek für wiederverwendbare Rätselinhalte
Das System muss eine lokale Bibliothek für wiederverwendbare Rätselinhalte unterstützen.

Die Bibliothek muss mindestens enthalten:
- Bilddateien für kindgerechte Gegenstände
- Metadaten zu Kategorien
- Aufgabenkonfigurationen
- Zuordnung von richtigen Lösungen und Distraktoren

#### Gherkin
```gherkin
Feature: Rätsel-Content-Bibliothek

  Scenario: Wiederverwendbare Rätselinhalte lokal laden
    Given eine lokale Rätsel-Content-Bibliothek ist vorhanden
    When die Anwendung eine Bilderrätsel-Aufgabe lädt
    Then werden Bilddateien, Kategorien, korrekte Lösung und Distraktoren aus der Bibliothek geladen
```

---

## 6. Technische Anforderungen

### TR-001 – Web-App für iPhone Safari
Die Anwendung muss als Web-App im Safari-Browser auf dem iPhone lauffähig sein.

#### Gherkin
```gherkin
Feature: Zielplattform iPhone Safari

  Scenario: Anwendung in iPhone Safari öffnen
    Given die Anwendung läuft auf einem Mac im Heimnetzwerk
    When der Nutzer die URL der Anwendung im Safari-Browser auf dem iPhone öffnet
    Then wird die Anwendung geladen
    And die Kernfunktionen sind nutzbar
```

---

### TR-002 – Lokaler Betrieb auf Mac im Heimnetzwerk
Die Anwendung muss lokal auf einem Mac bereitgestellt werden können und im Heimnetzwerk über eine lokale IP erreichbar sein.

#### Gherkin
```gherkin
Feature: Lokale Bereitstellung

  Scenario: Anwendung über lokale IP erreichen
    Given die Anwendung wurde lokal auf einem Mac gestartet
    When ein iPhone im selben Heimnetzwerk die lokale IP-Adresse des Macs aufruft
    Then ist die Anwendung erreichbar
```

---

### TR-003 – Kein App-Store-Deployment erforderlich
Die Anwendung darf kein App-Store-Deployment voraussetzen.

#### Gherkin
```gherkin
Feature: Betrieb ohne App Store

  Scenario: Anwendung ohne Installation aus App Store verwenden
    Given die Anwendung ist lokal auf einem Mac bereitgestellt
    When der Nutzer die Anwendung im mobilen Browser öffnet
    Then ist keine Installation aus einem App Store erforderlich
```

---

### TR-004 – Kernfunktionen ohne Internet
Der Kernspielbetrieb muss ohne Internetverbindung funktionieren, solange iPhone und Mac im selben Heimnetzwerk verbunden sind.

#### Gherkin
```gherkin
Feature: Offline-fähiger Kernspielbetrieb im LAN

  Scenario: Spiel im Heimnetzwerk ohne Internet spielen
    Given Mac und iPhone sind im selben Heimnetzwerk verbunden
    And die Internetverbindung des Heimnetzwerks ist unterbrochen
    When ein lokal gespeichertes Spiel gestartet wird
    Then sind Spielstart, Stationswechsel und Minispiele weiterhin nutzbar
```

---

### TR-005 – Lokale Speicherung der Spieldaten
Das System muss Spielmetadaten, Stationsreihenfolge, Minispielzuordnungen und Bildreferenzen lokal speichern können.

#### Gherkin
```gherkin
Feature: Lokale Datenspeicherung

  Scenario: Spieldaten lokal persistieren
    Given ein Spiel wird gespeichert
    When der Speichervorgang erfolgreich abgeschlossen wird
    Then sind Spielmetadaten, Stationsreihenfolge, Minispielzuordnungen und Bildreferenzen lokal persistent vorhanden
```

---

### TR-006 – Fortschritt während laufender Sitzung verwalten
Das System muss mindestens während einer laufenden Spielsitzung den Fortschritt verwalten.

#### Gherkin
```gherkin
Feature: Fortschritt verwalten

  Scenario: Aktuelle Station im laufenden Spiel speichern
    Given ein Spiel wurde gestartet
    And Station 2 ist aktuell spielbar
    When das Kind die Spielansicht aktualisiert oder der nächste interne Statuswechsel erfolgt
    Then kennt das System weiterhin die aktuelle Station und den Lösungsstatus der bereits abgeschlossenen Stationen
```

---

### TR-007 – Bilder mobil optimiert bereitstellen
Das System muss Bilder in einer für mobile Anzeige geeigneten Größe bereitstellen.

#### Gherkin
```gherkin
Feature: Bildoptimierung

  Scenario: Stationsbild für mobile Anzeige bereitstellen
    Given ein hochauflösendes Stationsbild wurde hochgeladen
    When das Bild in der Spielansicht verwendet wird
    Then verwendet die Anwendung eine für mobile Anzeige optimierte Darstellung
```

---

### TR-008 – Touch-Interaktionen unterstützen
Die Anwendung muss für Touch-Bedienung optimiert sein.

#### Gherkin
```gherkin
Feature: Touch-Optimierung

  Scenario: Interaktive Elemente per Touch nutzen
    Given die Anwendung läuft auf einem iPhone
    When das Kind Buttons, Auswahlfelder oder Drag-and-Drop-Elemente per Touch verwendet
    Then reagieren die interaktiven Elemente korrekt auf Touch-Eingaben
```

---

### TR-009 – Audioausgabe unterstützen
Die Anwendung muss Soundeffekte unterstützen und soll optional Hintergrundmusik und Text-to-Speech unterstützen.

#### Gherkin
```gherkin
Feature: Audioausgabe

  Scenario: Soundeffekt abspielen
    Given Audio ist auf dem Gerät verfügbar
    When das Kind eine Station erfolgreich abschließt
    Then wird ein Soundeffekt abgespielt

  Scenario: Text-to-Speech optional verwenden
    Given das Gerät unterstützt Text-to-Speech im Browser
    And die Vorlesefunktion ist aktiviert
    When eine Vorleseaktion ausgelöst wird
    Then wird der Text per Text-to-Speech ausgegeben
```

---

### TR-010 – Browserbedingte Audioeinschränkungen berücksichtigen
Die Anwendung muss Audio so einbinden, dass browserbedingte Einschränkungen auf iPhone/Safari berücksichtigt werden. Audio darf erst nach mindestens einer Benutzerinteraktion automatisch gestartet werden.

#### Gherkin
```gherkin
Feature: Audioeinschränkungen im Browser berücksichtigen

  Scenario: Audio startet erst nach Benutzerinteraktion
    Given die Anwendung wurde frisch im Safari-Browser geöffnet
    And noch keine Benutzerinteraktion hat stattgefunden
    When die Spielansicht geladen wird
    Then startet keine Hintergrundmusik automatisch

  Scenario: Audio darf nach Benutzerinteraktion starten
    Given die Anwendung wurde frisch im Safari-Browser geöffnet
    And das Kind oder der Spiel-Ersteller hat einmal auf die Anwendung getippt
    When eine Audiofunktion ausgelöst wird
    Then darf Audio abgespielt werden
```

---

### TR-011 – PWA optional
Die Anwendung soll optional als Progressive Web App installierbar sein, ist aber auch ohne PWA vollständig nutzbar.

#### Gherkin
```gherkin
Feature: Optionale PWA-Nutzung

  Scenario: Anwendung ohne PWA nutzen
    Given die Anwendung ist lokal erreichbar
    When der Nutzer die Anwendung direkt im Browser öffnet
    Then sind die Kernfunktionen ohne PWA-Installation nutzbar
```

---

## 7. Qualitätsanforderungen

### QR-001 – Verständliche Fehlermeldungen bei ungültiger Konfiguration
Ungültige Konfigurationen müssen mit verständlichen Fehlermeldungen abgefangen werden.

#### Gherkin
```gherkin
Feature: Fehlermeldungen bei Konfigurationsfehlern

  Scenario: Unvollständige Station melden
    Given eine Station ist unvollständig konfiguriert
    When der Spiel-Ersteller versucht, das Spiel zu starten
    Then zeigt das System eine verständliche Fehlermeldung an
    And die betroffene Station ist identifizierbar
```

---

### QR-002 – Wiederverwendbare Rätselinhalte pflegbar ablegen
Rätselinhalte müssen so abgelegt werden, dass sie lokal pflegbar und in mehreren Spielen wiederverwendbar sind.

#### Gherkin
```gherkin
Feature: Pflegbare Rätselinhalte

  Scenario: Rätselinhalt in mehreren Spielen verwenden
    Given ein Rätselinhalt ist lokal in der Content-Bibliothek gespeichert
    When der Rätselinhalt in mehreren Spielen referenziert wird
    Then bleibt der Rätselinhalt zentral pflegbar
```

---

## 8. Scope-Entscheidungen und explizite Nicht-Anforderungen

### NFR-001 – Keine Laufzeit-Bildgenerierung für andere Minispiele
Außer dem Puzzle wird in der App kein anderes Minispielbild dynamisch erzeugt.

#### Gherkin
```gherkin
Feature: Keine Laufzeitgenerierung außerhalb Puzzle

  Scenario: Nicht-Puzzle-Minispiel lädt vorbereitete Inhalte
    Given eine Station mit einem Nicht-Puzzle-Minispiel ist spielbar
    When die Station geladen wird
    Then werden nur vorbereitete Inhalte geladen
    And keine neue Bildgenerierung wird ausgeführt
```

---

### NFR-002 – Keine Rotationsmechanik im Puzzle
Die Anwendung unterstützt im Puzzle keine Rotation von Teilen.

#### Gherkin
```gherkin
Feature: Keine Puzzle-Rotation

  Scenario: Rotationsfunktion fehlt bewusst
    Given ein Puzzle wird angezeigt
    When das Kind das UI betrachtet
    Then gibt es keine Funktion zum Drehen von Puzzleteilen
```

---

### NFR-003 – Keine Freitext-Eingaben für Rätsellösungen im MVP
Freitext-Eingaben für Rätsellösungen werden im MVP nicht unterstützt.

#### Gherkin
```gherkin
Feature: Keine Freitextlösung im MVP

  Scenario: Freitextlösung ist nicht verfügbar
    Given ein Rätsel wird im MVP angezeigt
    When das Kind eine Antwort geben soll
    Then wird keine Freitext-Eingabe angeboten
```

---

## 9. MVP-Zuschnitt

### Muss
- neues Spiel anlegen
- 1 bis 20 Stationen verwalten
- genau ein Stationsbild pro Station
- genau ein Minispiel pro Station
- lineare Progression
- Spiel speichern und laden
- Puzzle aus Stationsbild der nächsten Station
- Puzzle mit 3, 4, 6 oder 9 Teilen
- Zahlenrätsel
- Labyrinth
- Bilderrätsel „Was fehlt denn hier?“
- kindgerechte Touch-UI
- visuelles und akustisches Erfolgsfeedback
- lokale Nutzung im Heimnetzwerk auf iPhone Safari
- vorbereitete wiederverwendbare Rätsel-Content-Bibliothek

### Soll
- Vorlesefunktion
- Hintergrundmusik
- optionale PWA
- Fortschrittsspeicherung über die laufende Sitzung hinaus

### Nicht Bestandteil des MVP
- generische AI-Bildgenerierung zur Laufzeit
- Puzzle-Rotation
- Freitextantworten
- App-Store-Deployment

