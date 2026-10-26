# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Russian vocabulary trainer — a browser app for learning Russian with flashcards, text-to-speech, verb conjugation tables, and noun declension tables. No build tools, no frameworks, no server. Open `index.html` directly in a browser.

## Architecture

### Main App: `index.html` (5825 lines) + `js/` modules

Die Logik liegt seit dem Umbau vom 25.05.2026 groesstenteils in `js/`
(zusammen 2024 Zeilen), nicht mehr in `index.html`. Geladen wird in dieser
Reihenfolge: `i18n.js`, `sr.js`, `tts.js`, `azure-tts.js`, `vocab-junk.js`,
`db.js`, `file-sync.js`, `conjugation.js`, `declension.js`, `claude-model.js`, `ai-vocab.js`,
`docx.js`, `parser.js`, `selection-lookup.js`.

### vokabeln.json ist massgeblich (`js/file-sync.js`, seit 25.10.2026)

Anlass: Review 25.10.2026 (Befund K1/K2). Frueher schrieb der Trainer bei jedem
Fensterwechsel (`visibilitychange`) die **komplette IndexedDB** in die Datei
(`autoExportJSON()`, entfernt). Der Editor uebertrug aber nur einen Teil seiner
Aenderungen in die IndexedDB (keine Loeschungen, nur Eintraege mit
Konjugation/Deklination/Betonung) — Loeschungen und Korrekturen aus dem Editor
wurden so zurueckgedreht. Jetzt gilt:

- **Datei -> Datenbank**: `connectVocabFile()` liest `vokabeln.json` und
  ersetzt die IndexedDB komplett (`replaceVocabDB()`, Muell bleibt draussen).
  Beim Start ohne Nachfrage; beim Zurueckkehren ins Fenster nur, wenn sich
  `lastModified` geaendert hat (`reloadVocabFileIfChanged()` — so kommen
  Editor-Aenderungen an).
- **Trainer-Aenderungen**: `saveCardsToDB()`/`deleteSourceFromDB()` schreiben
  erst die IndexedDB, dann `persistVocabChanges()`: Datei **frisch lesen**,
  nur die geaenderten Eintraege einmischen (`mergeVocabRecord()`: leere Felder
  des Trainers ueberschreiben nichts, `added` bleibt) bzw. entfernen,
  schreiben, IndexedDB ersetzen. Rueckgabe `'saved' | 'pending' | 'db-only'`.
  Alle Dateijobs laufen nacheinander (`queueVocabFileJob()`).
- **Ohne Berechtigung** (nach Browser-Neustart verlangt Edge einen Klick fuer
  `requestPermission`): Aenderungen warten in `settings/pendingVocabChanges`
  (IndexedDB), die Leiste `#fileSyncBar` unter dem Kopf zeigt „🔗 Verbinden"
  samt Anzahl. Kaputte Datei -> Zustand `error`, es wird **nie** geschrieben.
  Leere Datei (neu angelegt) -> einmalig der bisherige Bestand.
- Der Pflicht-Dialog beim Start (Alert + Dateiauswahl ohne Nutzergeste) ist
  entfallen; die Leiste bietet die Auswahl an.
- **Editor** (`vokabel_editor.html`): merkt sich Stand und `lastModified` beim
  Laden (`rememberFileState()`). Hat der Trainer die Datei inzwischen
  geaendert, fuehrt `mergeExternalChanges()` beim Speichern zusammen: neue
  Eintraege des Trainers bleiben, dort geloeschte bleiben geloescht, dort
  geaenderte werden uebernommen — ausser der Editor hat denselben Eintrag
  selbst geaendert (dann gewinnt der Editor).
- **Lernstand** in `lernstand.json` (`connectProgressFile()`): beim Verbinden
  pro Karte der neuere Stand (`lastReview`), Verlauf vereinigt; danach
  `scheduleProgressSave()` aus `saveSRData()`/`saveHistory()` (2 s verzoegert)
  und `flushProgressSave()` beim Verlassen des Fensters. Datei-Handle in
  `settings/progressFileHandle`. Der Lernstand haengt weiterhin am
  Inhalts-Hash der Karte (`getCardId()`): eine korrigierte Uebersetzung
  beginnt bei null (Review H1, offen).
- Test: `node tests/test_file_sync.js` (43 Tests, Datei-Attrappen statt Dialoge).

### Woerterbuch im Lesetext = Gesamtliste (seit 25.10.2026)

- `loadVocabForText(source)` (frueher `loadVocabForSource`) baut
  `generatedVocabMap` aus **allen** Vokabeln der IndexedDB; die des aktuellen
  Texts werden zuletzt eingetragen und gewinnen. Muell und Eintraege ohne
  Uebersetzung bleiben draussen. Karteikarten (`cards`) bleiben die des Texts.
- `normalizeWord()` entfernt Betonungszeichen (U+0300/U+0301) — sonst passte
  „кварти́ра" aus der Liste nie auf „квартира" im Text.
- `markVocabWords()` **loescht zuerst alle alten Marken**. Wichtig fuer
  „Vokabeln generieren": dessen zweiter Durchgang (`getMissingWords()`) fragt
  nach allen unmarkierten Woertern — Marken aus der Gesamtliste duerfen dort
  nicht als erfasst gelten. Waehrend der Vorschau gilt nur die frische Liste,
  `hideVocabPreview()` laedt danach wieder die Gesamtliste.
- Test: `node tests/test_vocab_global.js` (21 Tests).

### Datenmuell in der Vokabelliste (`js/vocab-junk.js`)

Am 06.04.2026 wurde `vokabeln.json` als Vokabeltext importiert: jede JSON-Zeile
wurde zur Karte (`id: c_…`, `front: …`, `Род.: болезни`), 10.616 Stueck mit
Quelle `vokabeln.json` — 88 % der Liste. Fuer 842 davon hatte der Editor sogar
Konjugationen erzeugt. Am 25.10.2026 aus `Vokabelliste_JSON/vokabeln.json`
entfernt (Sicherung: `vokabeln_vor_bereinigung_2026-10-25.json`, 1.473 Eintraege
bleiben).

- `isJunkVocabRecord()`: Quelle endet auf `.json` **oder** `front` beginnt mit
  einem JSON-Feldnamen/Tabellenlabel (`METADATA_FIELD_PATTERN`). Gemeinsam fuer
  Trainer und Editor — der Editor definiert das Muster nicht mehr selbst.
- `replaceVocabDB()` (js/file-sync.js) laesst Muell beim Einlesen weg.
- `processFile()` lehnt `.json` ab (`file_json_refused`).
- Editor „🧹 Müll löschen" durchsucht die **IndexedDB direkt**
  (`deleteJunkFromTrainerDB()`), nicht nur die IDs der geladenen JSON-Datei —
  die kann schon sauber sein, waehrend die Datenbank im Browser noch Muell hat.

### Markieren mit der Maus (`js/selection-lookup.js`, seit 25.10.2026)

Doppelklick oder Ziehen im Lesetext oeffnet `#selectionPopup`:
1. Treffer in `generatedVocabMap` (Ausdruck ueber `normalizeExpression()`)
   -> sofort, „aus deiner Vokabelliste".
2. Sonst `callClaudeAPI(buildSelectionPrompt(ausdruck, satz, currentLang))`,
   Antwort ueber `parseSelectionResponse()`; Ergebnis im `selectionCache`.
   Warten: Lichtstreif ueber dem Ausdruck (`.selection-scan`) + Punkte.
3. „➕ In Vokabelliste" -> `saveCardsToDB(..., currentSourceFile)`, die Textform
   als `forms` (traegt per `persistVocabChanges()` auch in die Datei ein),
   dann `loadVocabForText()`.

- Ausgeloest von `mouseup`/`touchend` an `textReaderContent` (per `setTimeout`,
  damit die Doppelklick-Auswahl steht). Der Capture-Klick-Listener stoppt den
  Klick am Ende einer Markierung (`selectionIsActiveInText()`), sonst laese der
  Satz-Handler (Satzweise-Modus) bzw. der Vokabel-Klick vor.
- `mousedown` im Kaestchen wird verhindert, damit die Auswahl bleibt; das
  Kaestchen wandert beim (auch automatischen) Scrollen mit. Escape schliesst
  zuerst das Kaestchen, erst der naechste Escape stoppt das Vorlesen.
- `speakDictionaryForm()` ist der gemeinsame Kern von Vokabel-Klick und 🔊.
- Test: `node tests/test_selection_lookup.js` (30 Tests, Claude ersetzt).

### Sprachausgabe: Azure und Browser-Stimmen (seit 25.10.2026)

Anlass: Die App blieb beim Vorlesen stumm. Alle **Online-Stimmen von Edge**
(Светлана/Дмитрий „Online (Natural)“, aber auch deutsche und englische)
meldeten `synthesis-failed`, Windows hatte keine russische Stimme, und die App
verschluckte den Fehler. Am Code lag es nicht.

- **Azure** (`js/azure-tts.js`): REST-Abruf `https://<region>.tts.speech.microsoft.com/cognitiveservices/v1`,
  MP3 ueber `Audio`. Stimmen `AZURE_VOICES` (Светлана, Дария, Дмитрий) stehen in
  der Auswahl **vor** den Browser-Stimmen und sind vorgewaehlt, sobald ein
  Schluessel da ist. `selectedVoice` ist dann ein Objekt `{azure: true, name, label, gender}`,
  kein `SpeechSynthesisVoice` — `speak()` verzweigt danach.
- Schluessel: 1. `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION` in `api-key.js`,
  2. `localStorage` `aussprache_azure_key`/`aussprache_azure_region` — dieselben
  Schluessel wie `aussprache_trainer.html` (file://-Seiten teilen sich den
  Speicher). Eingabe auch in den Einstellungen (⚙). Region des vorhandenen
  Schluessels: `germanywestcentral`.
- REST liefert keine Wortgrenzen: `estimateWordTimings()` verteilt die
  Audiodauer proportional zur Wortlaenge, `requestAnimationFrame` markiert mit.
- Cache (`azureAudioCache`, LRU 150) + `prefetchAzureAudio()` fuer den
  naechsten Satz in `speakSentenceChain()` — jeder Satz wird einmal abgerufen.
- **`cancelSpeech()` statt `speechSynthesis.cancel()`** — stoppt beide Wege.
  `stopAzureSpeech()` verhaelt sich wie `cancel()`: kein `onEnd`, nur `onCancel`.
- **Ausfall wird gemeldet**: `handleSpeechFailure()` zeigt `#ttsNotice` und
  setzt bei laufender Kette den „Weiter“-Punkt. Gilt fuer Azure-Fehler
  (auth/quota/network/config) und Browser-Fehler ausser `interrupted`/`canceled`.
- `getVoiceGender()` kennt kyrillische Namen (Edge nennt seine Stimmen jetzt
  „Microsoft Светлана Online“) und `voice.gender` der Azure-Stimmen.
- Seit 25.10.2026 sind auf dem Windows-PC auch die Offline-Stimmen
  **Microsoft Irina / Pavel** installiert (`Add-WindowsCapability -Online -Name
  "Language.TextToSpeech~~~ru-RU~0.0.1.0"` als Administrator; der Weg ueber
  Einstellungen → „Stimmen hinzufuegen“ brach still ab, die Installation im
  Terminal stand minutenlang bei 10 %, lief aber durch).
- Test: `node tests/test_azure_tts.js` (33 Tests, ohne Netz — `fetch` und
  `Audio` werden ersetzt).

| Section | Lines (approx.) | Content |
|---------|-----------------|---------|
| CSS (`<style>`) | 8–1650 | Dark theme, gold accents, 3D card flip, conjugation/declension modal, responsive (breakpoint 600px) |
| HTML (`<body>`) | 1650–1980 | ~5 screens toggled via `display:none/block`: mode selection, file upload, flashcard setup, flashcard view, text reader; conjugation + declension modal overlays |
| i18n translations | 1980–2500 | `translations` object with ~140 keys × 3 languages (de/en/ru), including conjugation and declension labels |
| JavaScript | 2500–6000 | All logic: parsing, SR algorithms, TTS, rendering, IndexedDB, conjugation/declension display |

### Vocabulary Editor: `vokabel_editor.html` (2684 lines)

Separate single-file app for editing the JSON vocabulary database:
- Load/save `vokabeln.json` via File System Access API
- Remembers last file path (IndexedDB + localStorage fallback)
- Inline editing of vocabulary fields (word, translation, grammar, forms, source)
- **CSV Export**: semicolon-separated, UTF-8 BOM, reuses file handle for overwrite without dialog
- **Conjugation generation** via Claude API (`api-key.js` provides the key)
  - Single verb or bulk generation (5er batches with rate-limit retry)
  - Verb detection (`isVerb()`): checks first word for infinitive endings, ignores parenthetical content and extra words
  - Generates: aspect, partner verb, present/future/past tense, imperative, participles, gerund
  - `syncConjugationToDB()` writes conjugation and declension data to index.html's IndexedDB on save
- **Declension generation** via Claude API
  - Single noun or bulk generation (5er batches, same retry logic as conjugation)
  - Noun detection (`isNoun()`): checks grammar field for noun markers (Subst., männl./weibl./sächl.), excludes verbs/adjectives/adverbs/predicates
  - Generates: gender (м/ж/ср), animacy, singular + plural forms for all 6 cases (Им./Род./Дат./Вин./Тв./Пр.)
  - Supports Pluraliatantum (plural-only nouns like "деньги")
- **Normalization** (`normalizeVocabulary()`): AI-powered batch cleanup via Claude API
  - Converts words to dictionary form (nouns→Nom.Sg., verbs→infinitive, adjectives→Nom.Sg.masc.)
  - Corrects German translation to match dictionary form
  - Replaces Russian grammar tags with German ones (e.g. "НСВ" → "Verb, unvollendet")
  - Processes in 20er batches, respects source filter
- AI vocabulary filter for new text imports

### Key Globals & State (index.html)

- `cards[]` — parsed flashcard array; `currentIndex` — active card
- `texts[]` — parsed text blocks for reading mode
- `srData{}` — spaced repetition data (keyed by content hash `c_<hash>`)
- `currentMode` — `'free'` | `'sm2'` | `'fsrs'`
- `currentLang` — `'de'` | `'en'` | `'ru'` (UI language)
- DOM element references cached at script start (~60 `getElementById` calls)

### Two Main Modes

1. **Flashcards** — Load `.txt` files or saved vocabulary from IndexedDB. Three learning modes: Free browse, SM-2, FSRS. Conjugation/declension buttons show grammar tables in modals.
   - **Vokabel anklicken = erneut vorlesen**: `renderCard()` setzt die Klasse
     `card-vocab` auf die Seite, die gerade die russische Vokabel traegt
     (`questionText` bzw. bei umgekehrter Richtung `answerText`). Ein
     Capture-Listener an `#flashcard` faengt den Klick darauf ab, ruft
     `speak(card.displaySpeakText || card.speakableText)` und stoppt die
     Weitergabe — sonst wuerde der Umdreh-Listener am selben Element die Karte
     drehen. Test: `node tests/test_card_speak.js` (13 Tests).
2. **Text Reader** — Load plain Russian text files, read aloud sentence-by-sentence with highlighting via Web Speech API.

### Abfragerichtung sichtbar am Knopf

`queryDirection` (`ru2other` | `other2ru`) liegt in `localStorage`
(`vokabeltrainer_direction`) und ueberlebt jede Sitzung. Der Knopf `#directionBtn`
zeigt deshalb die **aktive** Richtung an (`#directionLabel`: „RU → DE" /
„DE → RU"), nicht nur das Wort „Richtung" — sonst startet die Karte scheinbar
grundlos auf Deutsch. `updateDirectionButton()` setzt Text **und**
`data-i18n`/`data-i18n-title` neu, damit ein Sprachwechsel (`applyLanguage()`)
die Anzeige nicht wieder auf einen festen Schluessel zurueckdreht; aufgerufen
beim Start (nach `applyLanguage(currentLang)`) und bei jedem Klick.

### Woerterbuch-Vokabeln im Lesetext

Woerter mit Eintrag im generierten Woerterbuch tragen `.word.has-vocab`
(gepunktete Unterlinie). Mausueber zeigt den Eintrag als Tooltip.

- **Klick** zeigt den Eintrag ebenfalls (wichtig auf Tipp-Geraeten ohne Hover)
  und liest **nur die russische Woerterbuchform** vor (`dataset.vocabRussian`) —
  nicht die Uebersetzung und nicht den Satz: `speakVocabWord()`.
- Der Klick-Listener haengt in der **Capture-Phase** an `textReaderContent` und
  ruft `stopPropagation()`. Der Satz-Handler haengt direkt an
  `.sentence.clickable` und wuerde sonst zuerst feuern und den ganzen Satz
  vorlesen. Woerter ohne Eintrag lesen weiterhin den Satz vor.
- `speechSession` koppelt eine laufende Vorlese-Kette ab: `speakSentenceChain()`
  merkt sich den Zaehlerstand und bricht in seinem `onEnd`/Timeout ab, wenn ein
  Vokabel-Klick ihn erhoeht hat. Ohne diese Sperre setzt das durch
  `speechSynthesis.cancel()` ausgeloeste `onend` die Kette fort und
  ueberspricht die Vokabel.
- Test: `node tests/test_vocab_click.js` (22 Tests).

### Fortsetzen des Vorlesens ("Weiter")

Nur im Gesamttext-Modus (`readMode === 'all'`) — satzweise liest der Start-Knopf
ohnehin beim aktuellen Satz.

- `chainRunning` = Kette laeuft; `resumeAvailable` = sie wurde mittendrin
  unterbrochen. Gesetzt wird der Merkpunkt ueber `setResumePoint(true)` — vom
  Vokabel-Klick (`speakVocabWord()`) und vom Stopp-Knopf (`stopSpeaking()`).
- `updateSpeakButton()` beschriftet `#mainSpeakLabel` um (`btn_start` ↔
  `btn_resume`) und setzt dabei auch `data-i18n`/`data-i18n-title` neu, damit ein
  Sprachwechsel (`applyLanguage()`) die richtige Beschriftung behaelt.
  `textReaderProgress` zeigt `paused_at` mit der Satznummer.
- `startSpeaking()` verzweigt: Satzweise → aktueller Satz, `resumeAvailable` →
  `resumeReading()` (wiederholt den unterbrochenen Satz ganz), sonst
  `speakFullText()` von vorne. `resumeReading()` erhoeht `speechSession`, damit
  ein noch wartender 150-ms-Timer der alten Kette nicht zusaetzlich anspringt.
- Zurueckgesetzt wird der Merkpunkt bei Textende, `restartText()`,
  `speakFullText()` und in `renderTextContent()` (anderer Text/Lese-Modus).

### Conjugation Feature

- **Editor** (`vokabel_editor.html`): generates conjugation tables via Claude API, stores in JSON and syncs to IndexedDB
- **Flashcards** (`index.html`): "Konjugation" button on card front opens modal with conjugation table
  - `showConjugationModal()` renders aspect, tenses (present/future/past), imperative, participles, gerund
  - Bilingual labels (German + Russian) via i18n keys `conj_*`
  - Modal title shows infinitive + translation; infinitive line shown when card displays conjugated form
  - Escape key closes modal
  - **Auto-normalization in `renderCard()`**: single-word conjugated forms are replaced with infinitive from `conjugation.verb`; grammar tag is replaced with German label (e.g. "Verb, unvollendet"); phrases are left unchanged; TTS uses infinitive only for single-word replacements
- **Data flow**: card objects carry `conjugation` field through `vocabItemsToCards()`, `dbRecordsToVocabItems()`, `saveCardsToDB()`

### Declension Feature

- **Editor** (`vokabel_editor.html`): generates declension tables via Claude API, stores in JSON and syncs to IndexedDB
- **Flashcards** (`index.html`): "Deklination" button on card front opens modal with declension table
  - `showDeclensionModal()` renders gender, animacy, singular and plural forms for all 6 cases
  - Bilingual labels via i18n keys `decl_*`
  - Modal title shows nominative + translation
  - Escape key closes modal
  - **Auto-normalization in `renderCard()`**: single-word declined forms are replaced with nominative from `declension.noun`; grammar tag is replaced with German label (e.g. "Subst., männl."); phrases are left unchanged
- **Data flow**: card objects carry `declension` field through `vocabItemsToCards()`, `dbRecordsToVocabItems()`, `saveCardsToDB()`

### Spaced Repetition

- **SM-2**: `sm2Review()` / `sm2PredictInterval()` — classic SuperMemo algorithm
- **FSRS**: `fsrsReview()` / `fsrsPredictInterval()` — FSRS-4.5 with 17 default weights
- `buildReviewQueue()` builds session queue (due cards + max 20 new)
- `rateCard()` processes user rating (1–4), advances queue
- Card IDs: content hash via `getCardId()`, stable across file reloads

### i18n System

- `translations` object at top of script, keys like `btn_start`, `card_front`
- `t(key, params)` — lookup with `{placeholder}` substitution
- `applyLanguage(lang)` — iterates `[data-i18n]` and `[data-i18n-title]` attributes
- Language persisted in `localStorage` key `vokabeltrainer_lang`

### Data Storage

| Storage | Key | Content |
|---------|-----|---------|
| localStorage | `vokabeltrainer_sr` | SR card data (iterations, easiness, interval, stability, etc.) |
| localStorage | `vokabeltrainer_history` | Session history array |
| Datei | `vokabeln.json` | **Massgebliche** Vokabelliste (js/file-sync.js) |
| Datei | `lernstand.json` | Sicherung von `vokabeltrainer_sr` + `vokabeltrainer_history` |
| IndexedDB | `vokabeltrainer` / `settings` | `vocabFileHandle`, `progressFileHandle`, `pendingVocabChanges`, `lastDirectory` |
| localStorage | `vokabeltrainer_lang` | UI language |
| IndexedDB | `vokabeltrainer` / `vocabulary` | **Abbild** von vokabeln.json (deduplicated by content hash), includes `conjugation` field for verbs and `declension` field for nouns |
| IndexedDB | `vokabel_editor_handles` / `handles` | File handle for last opened JSON file (editor) |
| localStorage | `vokabel_editor_lastfile` | Last opened JSON filename fallback (editor) |

### Card Input Formats (auto-detected by `detectFormat()`)

- **Tab-separated**: `front\tback` (Quizlet-compatible)
- **Comma-separated**: split on last comma
- **Advanced**: `(grammar)` prefix, `\n` line breaks, `"quoted"` speech text, `(img:path)` images
- **Plain text**: detected as reading material for text mode

### Word-Import (`js/docx.js`)

`.docx`-Dateien werden gleichberechtigt zu `.txt`/`.csv` akzeptiert (Datei-Dialog,
Drag-and-Drop, beide Modi). `readFileAsText(file)` ist der gemeinsame Einstieg:
`.docx` wird entpackt, alles andere als UTF-8-Text gelesen.

- Kein externes Paket: `.docx` ist ein ZIP, das Entpacken macht die eingebaute
  `DecompressionStream('deflate-raw')`. Ein minimaler ZIP-Leser
  (`zipFindEocd`/`zipFindEntry`) holt `word/document.xml` heraus.
- `docxXmlToText()` wandelt WordprocessingML in Text: Absaetze -> Zeilen,
  `w:tab` -> Tabulator, `w:br` -> Umbruch, Hyperlinks werden mitgenommen,
  Feldbefehle (`w:instrText`) und geloeschter Text (`w:delText`) nicht.
  Formatier-Container (`w:pPr` etc.) werden uebersprungen — die dort
  definierten Tabstopps heissen ebenfalls `w:tab`.
- **Word-Tabellen** werden zeilenweise Tab-getrennt ausgegeben. Eine
  zweispaltige Vokabeltabelle landet damit direkt im Tab-Format der Karteikarten.
- Nicht unterstuetzt: altes Binaerformat `.doc` und passwortgeschuetzte
  Dateien — beides meldet eine uebersetzte Fehlermeldung (`docx_err_*`).

### Important Functions by Area

- **Parsing**: `detectFormat()`, `parseCards()`, `parseTexts()`
- **Word-Import**: `readFileAsText()`, `readDocxText()`, `docxXmlToText()` (js/docx.js)
- **Rendering**: `renderCard()`, `renderCardList()`, `showFlashcardSetup()`, `showFlashcardMode()`, `showTextMode()`
- **TTS**: `speak()`, `cleanTextForSpeech()`, `splitIntoSentences()`, `getVoiceGender()`, `updateVoiceSelect()`
- **SR**: `getCardId()`, `sm2Review()`, `fsrsReview()`, `buildReviewQueue()`, `rateCard()`
- **DB**: `saveCardsToDB()`, `exportVocabularyTSV()`, `vocabItemsToCards()`, `dbRecordsToVocabItems()`
- **Conjugation**: `showConjugationModal()` (index.html); `callClaudeAPI()`, `isVerb()`, `syncConjugationToDB()` (editor)
- **Declension**: `showDeclensionModal()` (index.html); `isNoun()`, `generateDeclension()`, `generateAllDeclensions()` (editor)
- **Normalization**: `normalizeVocabulary()`, `buildNormalizePrompt()`, `parseNormalizeResponse()` (editor)
- **CSV Export**: `exportCSV()` (editor)

## Development Notes

- **No build step** — edit HTML files, refresh browser
- **Puppeteer tests** in `tests/`: `test_navigation.js`, `test_editor.js`,
  `test_classification.js`, `test_sr.js`, `test_docx.js`, `test_vocab_click.js`,
  `test_card_speak.js`, `test_speech_click.js`, `test_speech_debug.js`,
  `test_azure_tts.js`, `test_vocab_global.js`, `test_selection_lookup.js`,
  `test_file_sync.js`. Alle Puppeteer-Tests laufen ohne Netz (`tests/helpers/offline.js`).
  Aufruf einzeln, z. B. `node tests/test_navigation.js`.
- **Word-Import-Test**: `node tests/test_docx.js` (48 Tests) — prueft echte
  `.docx` aus dem Projekt und selbst gebaute ZIPs (deflate + stored).
- **Zwei Fallen bei Puppeteer-Tests gegen `index.html`** (beide haben
  `test_navigation.js` lange sabotiert):
  1. Ohne `page.on('dialog', …)`-Handler *vor* dem ersten `goto()` blockiert
     der Startup-`alert()` zur Speicherdatei jedes laufende `page.evaluate()`
     bis zum Protokoll-Timeout (`Runtime.callFunctionOn timed out`). Das
     Alert kommt asynchron nach dem IndexedDB-Lookup, der Abbruch wandert
     also von Lauf zu Lauf.
  2. `page.click()` misst, scrollt, klickt — rendert die App dazwischen nach
     (gespeicherte Vokabeln aus IndexedDB), rutscht das Ziel weg und der Klick
     scheitert mit "Node is either not clickable or not an Element".
     `test_navigation.js` klickt deshalb ueber `clickStable()`, das erst auf
     eine stabile Position wartet.
- **Modelltest ohne Netz**: `node tests/test_claude_model.js` (12 Tests).
- **Dev scripts** in `tools/` (docx generators `create_docx*.py`, `dedupe_vokabeln.js`); documentation in `docs/`, media in `media/`, standalone learning pages in `lesematerial/`
- **No package manager for app** — `package.json` exists only for Puppeteer test dependencies
- External dependency: Google Fonts (Playfair Display, Source Sans 3) loaded via CDN
- The app was renamed from `vokabeltrainer.html` to `index.html` for GitHub Pages
- SVG vocabulary illustration sets live in `Vokabel_Texte_Input/testbilder/`, `bilder_familie/`, `bilder_antonyme/`
- Sample vocabulary files (`.txt`) are in `Vokabel_Texte_Input/`
- `api-key.js` liefert `CLAUDE_API_KEY`. Die Datei ist per `.gitignore`
  ausgenommen und wird bewusst nicht versioniert. Alternativ laesst sich der
  Schluessel im Editor eintragen (`localStorage`).
- **Denken abschalten (`thinking: {type: 'disabled'}`)**: Seit Claude Sonnet 5
  denkt das Modell, sobald das Feld `thinking` fehlt — und das Denken zaehlt
  gegen `max_tokens`. Am 16.08.2026 verbrauchte ein 3.900-Zeichen-Text so das
  gesamte Budget im Denken (16.384 Tokens, 155 s) und lieferte keinen Text;
  die App meldete „Antwort konnte nicht verarbeitet werden". Fuer Extraktions-
  aufgaben bringt Denken nichts, deshalb steht in `js/ai-vocab.js` ausdruecklich
  `thinking: {type: 'disabled'}` (und `max_tokens: 32000` als Puffer). Ebenso
  wichtig: die Antwort ist eine **Liste von Bloecken** — den ersten Block vom
  Typ `text` suchen, nicht `content[0]` nehmen (bei Denken steht dort ein
  Thinking-Block). Gilt gleichermassen fuer `vokabel_editor.html`, falls dort
  einmal dasselbe Muster auftaucht.
- **Abgeschnittene KI-Antworten**: `salvageJsonObjects()` in `js/ai-vocab.js`
  zaehlt Klammern (mit String- und Escape-Erkennung) und rettet alle
  vollstaendigen Objekte. Die frueheren Heuristiken (letztes `]`, Muster
  `},{`) scheiterten an `forms`-Arrays und eingerueckter Ausgabe.
- **Modellkennung**: nur in `js/claude-model.js` (`CLAUDE_MODEL_FALLBACK`).
  `resolveClaudeModel()` prueft vor dem Aufruf gegen die Models-API, ob das
  Modell noch existiert, und weicht sonst auf das neueste `claude-sonnet-*`
  aus. Anlass: die Abschaltung von `claude-sonnet-4-20250514` am 15.06.2026.
- `aussprache_trainer.html` (2481 Zeilen) ist eine eigenstaendige App fuer
  Aussprachetraining ueber Microsoft Azure Speech; der Schluessel wird im
  Formular eingegeben und in `localStorage` gehalten.
- `lesematerial/` enthaelt eigenstaendige Lernseiten (`grammatik_*.html`,
  `StarWarsEnglish.html`).
- App runs on Microsoft Edge (best Russian TTS voice support). Die
  Edge-Online-Stimmen koennen aber ausfallen (25.10.2026: `synthesis-failed`) —
  verlaesslich sind Azure (siehe oben) und die Windows-Stimmen Irina/Pavel.
- **Echte Stimmen testen**: Puppeteer-gestartete Browser sehen keine
  Online-Stimmen. Fuer echte Tests Edge selbst starten
  (`msedge --remote-debugging-port=9333 --user-data-dir=<tmp> --no-first-run`)
  und mit `puppeteer.connect({browserURL: 'http://127.0.0.1:9333'})` verbinden.
  Dort `uploadFile()` nur mit `path.resolve(...)` (Backslash-Pfad) — mit
  Schraegstrichen meldet Edge beim Lesen „A requested file or directory could
  not be found".

## Conventions

- All user-facing strings must go through the i18n system: add key to `translations` (all 3 languages), use `data-i18n` attribute in HTML or `t('key')` in JS
- Card format tags use round parentheses: `(img:path)`, `(speak:text)`, `(grammar)` — legacy `[img:...]` square brackets still supported
- CSS custom properties defined in `:root` for theming (e.g. `--bg-primary`, `--accent`, `--text-primary`)
- **Lesefarben im Textmodus**: bereits vorgelesener Text nutzt `--text-read`
  (nicht `--text-muted` — das war auf dem blauen Satzband praktisch unlesbar),
  der aktuelle Satz `--reading-band` mit weisser Schrift, das gerade gesprochene
  Wort Gold auf dunkler Schrift. `.sentence.current` steht bewusst **nach**
  `.sentence.read` (gleiche Spezifitaet), und
  `.sentence.current .word.spoken-word` haelt schon gesprochene Woerter im
  aktuellen Satz hell.
- Keyboard shortcuts: Space=flip, arrows=navigate, 1-4=SR rating, Enter=speak, Escape=close modal/stop

## Known Issues

- No offline capability (Google Fonts CDN dependency)
- Offen aus dem Review vom 25.10.2026: Lernstand am Inhalts-Hash statt an
  einer stabilen ID (H1, Teil 2); Lektion loeschen entfernt geteilte Vokabeln
  auch aus anderen Lektionen (H2); 55 Paare nur durch Betonung verschieden,
  31-Bit-Hash (M3); Kartenbilder werden nicht gespeichert (M4).
- **Tests ohne Netz**: jede Puppeteer-Seite ruft `isolatePage(page)` aus
  `tests/helpers/offline.js` auf (sperrt http(s), ersetzt `api-key.js` durch
  eine leere Datei). Sonst loesten Tests echte Azure-Anfragen aus.
