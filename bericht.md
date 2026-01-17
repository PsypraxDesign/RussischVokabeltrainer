# Arbeitsbericht: Vokabeltrainer Russisch

## Projektübersicht
Eine HTML/JS-Anwendung zum Russisch-Lernen mit zwei Modi: Karteikarten und Textvorlesen.

**Datei:** `vokabeltrainer.html`
**Git:** Initialisiert, 1 Commit

---

## Aktueller Funktionsstand

### Modus-Auswahl (Startseite)
- Zwei große Buttons: "Karteikarten" oder "Texte vorlesen"
- Je nach Auswahl wird beim Datei-Upload unterschiedlich geparst

### Karteikarten-Modus
- Lädt CSV/TXT mit Format: `Russisch, Deutsch`
- Flipbare Karteikarten mit Animation
- Auto-Vorlesen optional
- Mischen, Neustart möglich
- Unterstützt klassisches Quizlet-Format und erweitertes Format mit `\n`

### Text-Vorlesen-Modus
- Lädt reine Textdateien
- **Steuerung oben:** Start/Stopp/Von vorne + Geschlechtsauswahl + Tempo
- **Zwei Lese-Modi:**
  - "Alles": Ganzer Text wird vorgelesen
  - "Satzweise": Klick auf einzelne Sätze zum Vorlesen
- Textfenster ist starr (kein Auto-Scroll)
- Text-Liste erscheint nur bei mehreren Texten

### Sprachausgabe
- Russische Stimmen via Web Speech API
- Geschlechtsfilter (männlich/weiblich) basierend auf Stimmennamen
- Tempo einstellbar (0.5x - 1.5x)
- Akzentzeichen werden für TTS bereinigt

---

## Wichtige Code-Stellen

| Funktion | Zeile (ca.) | Beschreibung |
|----------|-------------|--------------|
| `parseContent()` | 1418 | Entscheidet Text vs. Karteikarten |
| `showTextMode()` | 1495 | Initialisiert Text-UI |
| `renderTextContent()` | 1511 | Rendert Sätze, macht sie klickbar |
| `speak()` | 1721 | Zentrale Sprachausgabe-Funktion |
| `updateVoiceSelect()` | 1251 | Filtert Stimmen nach Geschlecht |

---

## Kürzlich entfernt (GUI-Entschlackung)
- Format-Indicator "Text-Modus aktiv"
- Alle Buttons unter dem Textfenster
- Navigation "Voriger/Nächster Text" (bleibt nur in Text-Liste)
- Auto-Scroll bei Satzauswahl

---

## Bekannte Eigenheiten
- Stimmen-Erkennung nach Geschlecht basiert auf Namen (Irina=weiblich, Pavel=männlich)
- Bei unbekannten Stimmen: werden als "weiblich" behandelt
- Windows-TTS-Stimmen bevorzugt (mit Stern markiert)

---

## Offene Punkte / Ideen für Weiterentwicklung
- Fortschrittspeicherung (localStorage)
- Mehrere Dateien gleichzeitig laden
- Export-Funktion für gelernte Vokabeln
- Dunkelmodus-Toggle (aktuell nur dunkel)
