# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Russian vocabulary trainer — a browser app for learning Russian with flashcards, text-to-speech, verb conjugation tables, and noun declension tables. No build tools, no frameworks, no server. Open `index.html` directly in a browser.

## Architecture

### Main App: `index.html` (~6000 lines)

| Section | Lines (approx.) | Content |
|---------|-----------------|---------|
| CSS (`<style>`) | 8–1650 | Dark theme, gold accents, 3D card flip, conjugation/declension modal, responsive (breakpoint 600px) |
| HTML (`<body>`) | 1650–1980 | ~5 screens toggled via `display:none/block`: mode selection, file upload, flashcard setup, flashcard view, text reader; conjugation + declension modal overlays |
| i18n translations | 1980–2500 | `translations` object with ~140 keys × 3 languages (de/en/ru), including conjugation and declension labels |
| JavaScript | 2500–6000 | All logic: parsing, SR algorithms, TTS, rendering, IndexedDB, conjugation/declension display |

### Vocabulary Editor: `vokabel_editor.html` (~1800 lines)

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
2. **Text Reader** — Load plain Russian text files, read aloud sentence-by-sentence with highlighting via Web Speech API.

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
| localStorage | `vokabeltrainer_lang` | UI language |
| IndexedDB | `vokabeltrainer` / `vocabulary` | Cumulative vocabulary database (deduplicated by content hash), includes `conjugation` field for verbs and `declension` field for nouns |
| IndexedDB | `vokabel_editor_handles` / `handles` | File handle for last opened JSON file (editor) |
| localStorage | `vokabel_editor_lastfile` | Last opened JSON filename fallback (editor) |

### Card Input Formats (auto-detected by `detectFormat()`)

- **Tab-separated**: `front\tback` (Quizlet-compatible)
- **Comma-separated**: split on last comma
- **Advanced**: `(grammar)` prefix, `\n` line breaks, `"quoted"` speech text, `(img:path)` images
- **Plain text**: detected as reading material for text mode

### Important Functions by Area

- **Parsing**: `detectFormat()`, `parseCards()`, `parseTexts()`
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
- **Puppeteer tests** in `tests/` (e.g. `test_navigation.js`, 118 tests), run with `node tests/test_navigation.js`
- **Dev scripts** in `tools/` (docx generators `create_docx*.py`, `dedupe_vokabeln.js`); documentation in `docs/`, media in `media/`, standalone learning pages in `lesematerial/`
- **No package manager for app** — `package.json` exists only for Puppeteer test dependencies
- External dependency: Google Fonts (Playfair Display, Source Sans 3) loaded via CDN
- The app was renamed from `vokabeltrainer.html` to `index.html` for GitHub Pages
- SVG vocabulary illustration sets live in `Vokabel_Textdateien/testbilder/`, `bilder_familie/`, `bilder_antonyme/`
- Sample vocabulary files (`.txt`) are in `Vokabel_Textdateien/`
- `api-key.js` (not committed) provides `ANTHROPIC_API_KEY` for conjugation generation
- App runs on Microsoft Edge (best Russian TTS voice support)

## Conventions

- All user-facing strings must go through the i18n system: add key to `translations` (all 3 languages), use `data-i18n` attribute in HTML or `t('key')` in JS
- Card format tags use round parentheses: `(img:path)`, `(speak:text)`, `(grammar)` — legacy `[img:...]` square brackets still supported
- CSS custom properties defined in `:root` for theming (e.g. `--bg-primary`, `--accent`, `--text-primary`)
- Keyboard shortcuts: Space=flip, arrows=navigate, 1-4=SR rating, Enter=speak, Escape=close modal/stop

## Known Issues

- No offline capability (Google Fonts CDN dependency)
