# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Russian vocabulary trainer — a single-file browser app for learning Russian with flashcards and text-to-speech. No build tools, no frameworks, no server. Open `index.html` directly in a browser.

## Architecture

**Everything lives in `index.html`** (~4000 lines), structured as:

| Section | Lines (approx.) | Content |
|---------|-----------------|---------|
| CSS (`<style>`) | 8–1580 | Dark theme, gold accents, 3D card flip, responsive (breakpoint 600px) |
| HTML (`<body>`) | 1585–1900 | ~5 screens toggled via `display:none/block`: mode selection, file upload, flashcard setup, flashcard view, text reader |
| i18n translations | 1904–2245 | `translations` object with ~100 keys × 3 languages (de/en/ru) |
| JavaScript | 2245–4027 | All logic: parsing, SR algorithms, TTS, rendering, IndexedDB |

### Key Globals & State

- `cards[]` — parsed flashcard array; `currentIndex` — active card
- `texts[]` — parsed text blocks for reading mode
- `srData{}` — spaced repetition data (keyed by content hash `c_<hash>`)
- `currentMode` — `'free'` | `'sm2'` | `'fsrs'`
- `currentLang` — `'de'` | `'en'` | `'ru'` (UI language)
- DOM element references cached at script start (~60 `getElementById` calls)

### Two Main Modes

1. **Flashcards** — Load `.txt` files with vocabulary (comma-separated, tab-separated, or advanced format with grammar tags/images). Three learning modes: Free browse, SM-2, FSRS.
2. **Text Reader** — Load plain Russian text files, read aloud sentence-by-sentence with highlighting via Web Speech API.

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
| IndexedDB | `vokabeltrainer` / `vocabulary` | Cumulative vocabulary database (deduplicated by content hash) |

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
- **DB**: `saveCardsToDB()`, `exportVocabularyTSV()`

## Development Notes

- **No build step** — edit `index.html`, refresh browser
- **No tests** — manual testing only
- **No package manager** — only external dependency is Google Fonts (Playfair Display, Source Sans 3) loaded via CDN
- The app was renamed from `vokabeltrainer.html` to `index.html` for GitHub Pages
- SVG vocabulary illustration sets live in `Vokabel_Textdateien/testbilder/`, `bilder_familie/`, `bilder_antonyme/`
- Sample vocabulary files (`.txt`) are in `Vokabel_Textdateien/`

## Conventions

- All user-facing strings must go through the i18n system: add key to `translations` (all 3 languages), use `data-i18n` attribute in HTML or `t('key')` in JS
- Card format tags use round parentheses: `(img:path)`, `(speak:text)`, `(grammar)` — legacy `[img:...]` square brackets still supported
- CSS custom properties defined in `:root` for theming (e.g. `--bg-primary`, `--accent`, `--text-primary`)
- Keyboard shortcuts: Space=flip, arrows=navigate, 1-4=SR rating, Enter=speak, Escape=stop

## Known Issues

- `textSentenceControls` referenced but not defined as DOM element (pre-existing bug, harmless)
- No offline capability (Google Fonts CDN dependency)
