> **ARCHIVIERT — VERALTET.** Dieser Bericht beschreibt einen frueheren
> Stand und wird nicht mehr gepflegt. Massgeblich sind `CLAUDE.md` im
> Projektwurzelverzeichnis und `PRUEFBERICHT_2026-06-12.md`.
> Die Datei bleibt als Vorgeschichte erhalten.

# Arbeitsbericht: Vokabeltrainer Russisch

## Projektübersicht

Eine monolithische HTML/CSS/JS-Anwendung zum Russisch-Lernen mit drei Lernmodi: Freie Karteikarten, Spaced Repetition (SM-2 / FSRS) und Textvorlesen.

**Datei:** `vokabeltrainer.html` (3.240 Zeilen)
**Git:** 4 Commits auf `master`
**Frameworks:** Keine — reines HTML/CSS/JS
**Design:** Dark Theme mit Gold-Akzenten, responsive bis 600px

---

## Dateistruktur

```
Vokabeltrainer/
├── vokabeltrainer.html          # Gesamte Anwendung (3.240 Zeilen)
├── bericht.md                   # Dieser Bericht
├── BildMoskau.docx              # Begleitdokument
├── spaced repetition.txt        # SR-Notizen
└── Vokabel_Textdateien/         # Vokabel- und Textdateien zum Laden
    ├── 4.2_Im_Restaurant.txt
    ├── Praepositionen_Quizlet.txt
    ├── Praepositionen_Quizlet neu.txt
    ├── Russisch_5_1_Vokabeln_Quizlet.txt
    ├── Uhrzeiten.txt
    ├── Uhrzeiten Quizlet.txt
    ├── Vokabeln Homework 06-02-26.txt
    ├── wahr - falsch.txt
    ├── Урок 5.1. Задание 4Б.txt
    └── Урок 5.1. Задание 5Б..txt
```

---

## Code-Aufbau (vokabeltrainer.html)

| Abschnitt | Zeilen | Umfang |
|-----------|--------|--------|
| **CSS** (`<style>`) | 8 – 1.470 | 1.463 Zeilen |
| **HTML** (`<body>`) | 1.472 – 1.767 | 296 Zeilen |
| **JavaScript** (`<script>`) | 1.768 – 3.238 | 1.471 Zeilen |

---

## Funktionsstand

### 1. Modus-Auswahl (Startseite)
- Zwei große Buttons: "Karteikarten" (🎴) und "Texte vorlesen" (📖)
- Je nach Auswahl wird beim Datei-Upload unterschiedlich geparst
- Schneller Modus-Wechsel zwischen Text und Karten über Buttons in der Voice-Section

### 2. Karteikarten-Modus

#### Datei-Formate
- **Klassisch:** `Russisch, Deutsch` (Quizlet-Export)
- **Erweitert:** Mehrzeilige Karten mit `\n`, Grammatikregeln in Klammern, TTS-Text in Anführungszeichen

#### Lern-Modi (wählbar im Setup-Screen)
| Modus | Beschreibung |
|-------|-------------|
| **Frei** | Karten frei durchblättern, mischen, neu starten |
| **SM-2** | Supermemo-2-Algorithmus mit Easiness-Faktor |
| **FSRS** | Free Spaced Repetition Scheduler (FSRS-4.5, 17 Gewichte) |

#### Spaced Repetition Features
- **Bewertung:** 4 Buttons — Nochmal (1), Schwer (2), Gut (3), Leicht (4)
- **Vorschau:** Jeder Button zeigt voraussichtliches nächstes Intervall
- **Queue:** Fällige Karten + max. 20 neue Karten pro Sitzung (einstellbar)
- **Karten-Status:** Neu (blau) / Fällig (rot) / Gelernt (grün mit Intervall)
- **Sitzungs-Abschluss:** Statistik mit Reviewed/Neue/Nochmal-Zähler
- **Reset:** SR-Daten zurücksetzen über Button im Setup

#### Statistik-Panel
- Lern-Streak (aufeinanderfolgende Tage)
- Anzahl Lerntage, Gesamtkarten, Durchschnitt pro Sitzung
- Gesamte Lernzeit
- Verlaufsübersicht nach Tagen gruppiert

#### Bedienung
- 3D-Flip-Animation (Klick oder Leertaste)
- Auto-Vorlesen optional
- Mischen und Neustart (nur im Frei-Modus)
- Kartenliste mit Badges und Sprecher-Button
- Satz-Navigation bei mehrzeiligen Karten (Voriger/Nächster Satz)

### 3. Text-Vorlesen-Modus
- Lädt reine Textdateien (automatische Erkennung)
- **Steuerung:** Start/Stopp/Von vorne + Geschlechtsauswahl + Tempo
- **Zwei Lese-Modi:**
  - "Alles": Ganzer Text wird vorgelesen
  - "Satzweise": Klick auf einzelne Sätze, Hervorhebung des aktiven Satzes
- Fortschrittsanzeige: "Satz X von Y"
- Text-Liste bei mehreren Texten

### 4. Sprachausgabe (Web Speech API)
- Russische Stimmen via `speechSynthesis`
- Geschlechtsfilter (männlich/weiblich) basierend auf Stimmennamen
- Windows-TTS-Stimmen bevorzugt (mit ⭐ markiert)
- Tempo einstellbar (0.5x – 1.5x)
- Akzentzeichen werden für TTS bereinigt

---

## Tastaturkürzel

| Taste | Karteikarten (Frei) | Karteikarten (SR) | Text-Modus |
|-------|---------------------|-------------------|------------|
| **←/→** | Vorherige/Nächste Karte | — | — |
| **↑/↓** | — | — | Text scrollen |
| **Leertaste** | Karte umdrehen | Karte umdrehen | — |
| **1–4** | — | Bewertung (Nochmal–Leicht) | — |
| **Enter** | Vorlesen starten/stoppen | Vorlesen starten/stoppen | Vorlesen starten/stoppen |
| **Escape** | Vorlesen stoppen | Vorlesen stoppen | Vorlesen stoppen |
| **Home** | Neustart | — | Text neu starten |

---

## Datenspeicherung (localStorage)

| Schlüssel | Inhalt |
|-----------|--------|
| `vokabeltrainer_sr` | SR-Kartendaten: `{ cardId: { iterations, easiness, interval, difficulty, stability, reps, lastReview, nextReview, algorithm } }` |
| `vokabeltrainer_history` | Sitzungsverlauf: `[{ date, duration, cardsReviewed, newCards, algorithm }]` |

Karten-IDs werden als Content-Hash generiert (`c_<hash>`), sodass SR-Daten dateiunabhängig sind und bei erneutem Laden derselben Vokabeln erhalten bleiben.

---

## Wichtige Funktionen (Zeilen ca.)

### Hilfsfunktionen
| Funktion | Zeile | Beschreibung |
|----------|-------|--------------|
| `cleanTextForSpeech()` | 1871 | Akzente und Sonderzeichen für TTS bereinigen |
| `splitIntoSentences()` | 1896 | Text an Satzzeichen aufteilen |

### Spaced Repetition
| Funktion | Zeile | Beschreibung |
|----------|-------|--------------|
| `getCardId()` | 1905 | Content-Hash als Karten-ID |
| `loadSRData()` / `saveSRData()` | 1916 | localStorage lesen/schreiben |
| `sm2Review()` | 1949 | SM-2 Algorithmus (Bewertung verarbeiten) |
| `sm2PredictInterval()` | 1969 | SM-2 Intervall-Vorschau |
| `fsrsReview()` | 2014 | FSRS Algorithmus (Bewertung verarbeiten) |
| `fsrsPredictInterval()` | 2034 | FSRS Intervall-Vorschau |
| `buildReviewQueue()` | 2055 | Fällige + neue Karten für Sitzung zusammenstellen |
| `rateCard()` | 2125 | Bewertung verarbeiten, nächste Karte zeigen |
| `showSessionComplete()` | 2178 | Sitzungsende mit Statistik |

### Statistik
| Funktion | Zeile | Beschreibung |
|----------|-------|--------------|
| `recordSession()` | 2244 | Sitzung in History speichern |
| `calculateStreak()` | 2261 | Lern-Streak berechnen |
| `renderStatistics()` | 2296 | Statistik-Panel rendern |

### Stimmen & TTS
| Funktion | Zeile | Beschreibung |
|----------|-------|--------------|
| `getVoiceGender()` | 2345 | Stimmengeschlecht aus Namen erkennen |
| `updateVoiceSelect()` | 2358 | Stimmen-Dropdown nach Geschlecht filtern |
| `speak()` | 2999 | Zentrale Sprachausgabe-Funktion |
| `speakFullText()` | 3050 | Ganzen Text vorlesen |
| `speakSingleSentence()` | 3056 | Einzelnen Satz vorlesen |

### Datei-Verarbeitung
| Funktion | Zeile | Beschreibung |
|----------|-------|--------------|
| `detectFormat()` | 2638 | Format erkennen (text/classic/advanced) |
| `parseContent()` | 2646 | Weiterleitung an parseTexts/parseCards |
| `parseTexts()` | 2669 | Textdatei in Textblöcke aufteilen |
| `parseCards()` | 2831 | Vokabeldatei in Karteikarten parsen |

### UI & Rendering
| Funktion | Zeile | Beschreibung |
|----------|-------|--------------|
| `showTextMode()` | 2717 | Text-Modus initialisieren |
| `renderTextContent()` | 2744 | Sätze rendern mit Klick-Funktion |
| `showFlashcardSetup()` | 2864 | Setup-Screen mit SR-Info anzeigen |
| `showFlashcardMode()` | 2877 | Karteikarten-Ansicht starten |
| `renderCard()` | 2914 | Einzelne Karte rendern (Front/Back) |
| `renderCardList()` | 2951 | Kartenliste mit Badges rendern |

---

## Git-Historie

| Commit | Beschreibung |
|--------|-------------|
| `83fe9e8` | Text-Vorlese-Funktion mit vereinfachtem GUI |
| `c03b546` | Arbeitsbericht für Projektübergabe hinzugefügt |
| `c98b0d7` | Karteikarten: Stimmauswahl vor Start, Buttons nach oben, kompakteres Layout |
| `cb5118a` | Modus-Wechsel-Buttons in Voice-Section verschoben und verbessert |

---

## Bekannte Probleme

1. **`textSentenceControls` nicht definiert** (Zeile ~2532/2541): Referenz auf ein DOM-Element, das im HTML nicht existiert. Sollte vermutlich `sentenceControls` sein.
2. **Keine Offline-Fähigkeit:** Lädt Google Fonts extern (Playfair Display, Source Sans 3).

---

## Architektur-Hinweise

- **Monolithisch:** Alles in einer Datei — CSS, HTML, JS. Keine Build-Tools, keine Module.
- **State Management:** Globale Variablen (`cards`, `texts`, `srData`, `currentIndex` etc.)
- **~63 DOM-Elemente** werden beim Start als Referenzen gecacht.
- **~50 Event Listener** für Buttons, Keyboard, Drag&Drop, Speech-Events.
- **Responsive:** Media-Query bei 600px für mobile Anpassungen.
- **Kein Server:** Rein clientseitig, alle Daten in localStorage.
