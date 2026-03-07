/**
 * Puppeteer Navigation Tests
 *
 * Tests the "back to main menu" navigation flow from both text mode
 * and flashcard mode, verifying:
 * - Mode selection is shown properly after returning
 * - Mode buttons respond to clicks
 * - Upload section appears and is functional
 * - No stale state interferes with navigation
 *
 * Run: node test_navigation.js
 */

const puppeteer = require('puppeteer');
const path = require('path');

const INDEX_URL = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const SAMPLE_CARDS = 'большой,groß\nмаленький,klein\nбыстрый,schnell';
const SAMPLE_TEXT = 'Привет! Как дела?\n\nМеня зовут Александр. Я живу в Москве.';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.log(`  ✗ ${message}`);
    }
}

async function uploadContent(page, content, mode) {
    // Click mode button
    if (mode === 'flashcards') {
        await page.click('#modeFlashcards');
    } else {
        await page.click('#modeTexts');
    }
    await page.waitForSelector('#uploadSection', { visible: true });

    // Inject file content via parseContent (simulates file load)
    await page.evaluate((text) => {
        parseContent(text);
    }, content);
}

async function getModeSelectionVisible(page) {
    return page.evaluate(() => {
        return document.getElementById('modeSelection').style.display !== 'none'
            && document.getElementById('modeSelection').offsetParent !== null;
    });
}

async function getUploadVisible(page) {
    return page.evaluate(() => {
        return document.getElementById('uploadSection').style.display === 'block';
    });
}

async function getScreenState(page) {
    return page.evaluate(() => {
        const el = (id) => document.getElementById(id);
        return {
            modeSelection: el('modeSelection').style.display,
            uploadSection: el('uploadSection').style.display,
            flashcardSetup: el('flashcardSetup').style.display,
            flashcardContainer: el('flashcardContainer').classList.contains('visible'),
            textReaderContainer: el('textReaderContainer').classList.contains('visible'),
            voiceSection: el('voiceSection').style.display,
            selectedMode: typeof selectedMode !== 'undefined' ? selectedMode : null,
        };
    });
}

async function verifyModeSelectionClean(page, testName) {
    const state = await getScreenState(page);
    assert(state.modeSelection === 'block', `${testName}: modeSelection visible`);
    assert(state.uploadSection === 'none', `${testName}: uploadSection hidden`);
    assert(state.flashcardSetup === 'none', `${testName}: flashcardSetup hidden`);
    assert(!state.flashcardContainer, `${testName}: flashcardContainer hidden`);
    assert(!state.textReaderContainer, `${testName}: textReaderContainer hidden`);
    assert(state.voiceSection === 'flex', `${testName}: voiceSection visible on start`);
    assert(state.selectedMode === null, `${testName}: selectedMode is null`);
}

async function verifyButtonsClickable(page, testName) {
    // Check that mode buttons are not covered by other elements
    const clickable = await page.evaluate(() => {
        const flashBtn = document.getElementById('modeFlashcards');
        const textBtn = document.getElementById('modeTexts');
        const flashRect = flashBtn.getBoundingClientRect();
        const textRect = textBtn.getBoundingClientRect();

        // Check element at the center of each button
        const flashCenter = document.elementFromPoint(
            flashRect.left + flashRect.width / 2,
            flashRect.top + flashRect.height / 2
        );
        const textCenter = document.elementFromPoint(
            textRect.left + textRect.width / 2,
            textRect.top + textRect.height / 2
        );

        return {
            flashcardsBtnHit: flashBtn.contains(flashCenter),
            textsBtnHit: textBtn.contains(textCenter),
            flashTopElement: flashCenter ? flashCenter.id || flashCenter.className : 'null',
            textTopElement: textCenter ? textCenter.id || textCenter.className : 'null',
        };
    });

    assert(clickable.flashcardsBtnHit,
        `${testName}: Flashcard button is topmost (found: ${clickable.flashTopElement})`);
    assert(clickable.textsBtnHit,
        `${testName}: Text button is topmost (found: ${clickable.textTopElement})`);
}

// ============================================
// TEST 1: Basic mode selection → upload → back
// ============================================
async function testBasicNavigation(page) {
    console.log('\n--- Test 1: Basic navigation ---');

    // Mode selection should be visible initially
    const visible = await getModeSelectionVisible(page);
    assert(visible, 'Mode selection visible on start');

    // Click flashcards
    await page.click('#modeFlashcards');
    const uploadVis = await getUploadVisible(page);
    assert(uploadVis, 'Upload section visible after clicking flashcards');

    // Click back to mode selection
    await page.click('#backToModeBtn');
    const modeVis = await getModeSelectionVisible(page);
    assert(modeVis, 'Mode selection visible after clicking back');

    // Click texts
    await page.click('#modeTexts');
    const uploadVis2 = await getUploadVisible(page);
    assert(uploadVis2, 'Upload section visible after clicking texts');

    // Back again
    await page.click('#backToModeBtn');
    await verifyModeSelectionClean(page, 'After back-to-mode');
}

// ============================================
// TEST 2: Text mode → back to home → flashcards
// ============================================
async function testTextModeToHome(page) {
    console.log('\n--- Test 2: Text mode → back to home → flashcards ---');

    // Load text content
    await uploadContent(page, SAMPLE_TEXT, 'texts');

    // Verify text reader is visible
    const textVisible = await page.evaluate(() =>
        document.getElementById('textReaderContainer').classList.contains('visible'));
    assert(textVisible, 'Text reader visible after loading text');

    // Click "back to home" button
    await page.click('#backToHomeBtn');

    // Verify clean mode selection
    await verifyModeSelectionClean(page, 'After back-to-home from text');
    await verifyButtonsClickable(page, 'After back-to-home from text');

    // Verify data was reset
    const dataReset = await page.evaluate(() => ({
        cards: cards.length,
        texts: texts.length,
        sentences: sentences.length,
        isTextMode: isTextMode,
    }));
    assert(dataReset.cards === 0, 'Cards array reset');
    assert(dataReset.texts === 0, 'Texts array reset');
    assert(dataReset.sentences === 0, 'Sentences array reset');
    assert(dataReset.isTextMode === false, 'isTextMode reset');

    // Now click flashcards — should work
    await page.click('#modeFlashcards');
    const uploadVis = await getUploadVisible(page);
    assert(uploadVis, 'Upload visible after clicking flashcards');

    // No continue button should be shown (data was reset)
    const continueVis = await page.evaluate(() =>
        document.getElementById('continueCardsBtn').style.display);
    assert(continueVis === 'none', 'No continue-cards button shown');

    // Go back and try texts
    await page.click('#backToModeBtn');
    await page.click('#modeTexts');
    const uploadVis2 = await getUploadVisible(page);
    assert(uploadVis2, 'Upload visible after clicking texts');

    const continueTextVis = await page.evaluate(() =>
        document.getElementById('continueTextBtn').style.display);
    assert(continueTextVis === 'none', 'No continue-text button shown');

    // Reset for next test
    await page.click('#backToModeBtn');
}

// ============================================
// TEST 3: Flashcard mode → mainMenuBtn → setupBackBtn → texts
// ============================================
async function testFlashcardModeToHome(page) {
    console.log('\n--- Test 3: Flashcard mode → mainMenu → setup back → texts ---');

    // Load flashcards
    await uploadContent(page, SAMPLE_CARDS, 'flashcards');

    // Should be on flashcard setup
    const setupVisible = await page.evaluate(() =>
        document.getElementById('flashcardSetup').style.display === 'block');
    assert(setupVisible, 'Flashcard setup visible after loading cards');

    // Start flashcards
    await page.click('#startFlashcardsBtn');

    // Flashcard container should be visible
    const fcVisible = await page.evaluate(() =>
        document.getElementById('flashcardContainer').classList.contains('visible'));
    assert(fcVisible, 'Flashcard container visible after start');

    // In flashcard mode, voiceSection is hidden, so use mainMenuBtn
    // mainMenuBtn goes to flashcard setup (cards > 0)
    await page.click('#mainMenuBtn');

    const setupVis2 = await page.evaluate(() =>
        document.getElementById('flashcardSetup').style.display === 'block');
    assert(setupVis2, 'Flashcard setup visible after mainMenuBtn');

    // Now click setupBackBtn to go to mode selection
    await page.click('#setupBackBtn');

    // Verify clean mode selection
    await verifyModeSelectionClean(page, 'After setupBackBtn from flashcards');
    await verifyButtonsClickable(page, 'After setupBackBtn from flashcards');

    // Click texts — should work
    await page.click('#modeTexts');
    const uploadVis = await getUploadVisible(page);
    assert(uploadVis, 'Upload visible after clicking texts');

    // Reset
    await page.click('#backToModeBtn');
}

// ============================================
// TEST 4: Flashcard setup → back → mode selection works
// ============================================
async function testFlashcardSetupBack(page) {
    console.log('\n--- Test 4: Flashcard setup → back → mode buttons work ---');

    // Load flashcards
    await uploadContent(page, SAMPLE_CARDS, 'flashcards');

    const setupVisible = await page.evaluate(() =>
        document.getElementById('flashcardSetup').style.display === 'block');
    assert(setupVisible, 'Flashcard setup visible');

    // Click setup back button
    await page.click('#setupBackBtn');

    // Verify clean mode selection state
    await verifyModeSelectionClean(page, 'After setupBackBtn');
    await verifyButtonsClickable(page, 'After setupBackBtn');

    // Mode buttons should work
    await page.click('#modeFlashcards');
    const uploadVis = await getUploadVisible(page);
    assert(uploadVis, 'Upload visible after clicking flashcards post-setup-back');

    // Reset
    await page.click('#backToModeBtn');
}

// ============================================
// TEST 5: mainMenuBtn with no cards → proper cleanup
// ============================================
async function testMainMenuBtnFallback(page) {
    console.log('\n--- Test 5: mainMenuBtn fallback to mode selection ---');

    // Load flashcards, start, then simulate cards=[] via evaluate
    await uploadContent(page, SAMPLE_CARDS, 'flashcards');
    await page.click('#startFlashcardsBtn');

    // Clear cards and click mainMenuBtn via evaluate (since button is in flashcard controls)
    await page.evaluate(() => {
        cards = [];
        document.getElementById('mainMenuBtn').click();
    });

    // Should go to mode selection with proper cleanup
    await verifyModeSelectionClean(page, 'After mainMenuBtn with empty cards');
    await verifyButtonsClickable(page, 'After mainMenuBtn with empty cards');
}

// ============================================
// TEST 6: No ghost speech after back to home
// ============================================
async function testNoGhostSpeech(page) {
    console.log('\n--- Test 6: No ghost speech after navigation ---');

    // Load text
    await uploadContent(page, SAMPLE_TEXT, 'texts');

    // Check stopRequested after back to home
    await page.click('#backToHomeBtn');

    const stopState = await page.evaluate(() => ({
        stopRequested: stopRequested,
        sentencesLength: sentences.length,
    }));
    assert(stopState.stopRequested === true, 'stopRequested is true after back-to-home');
    assert(stopState.sentencesLength === 0, 'sentences cleared after back-to-home');
}

// ============================================
// TEST 7: Rapid navigation (stress test)
// ============================================
async function testRapidNavigation(page) {
    console.log('\n--- Test 7: Rapid navigation cycles ---');

    for (let i = 0; i < 5; i++) {
        // Flashcards path
        await page.click('#modeFlashcards');
        await page.click('#backToModeBtn');

        // Texts path
        await page.click('#modeTexts');
        await page.click('#backToModeBtn');
    }

    // After rapid cycling, mode selection should be clean
    await verifyModeSelectionClean(page, 'After 5 rapid navigation cycles');
    await verifyButtonsClickable(page, 'After rapid cycling');

    // Buttons should still work
    await page.click('#modeFlashcards');
    const uploadVis = await getUploadVisible(page);
    assert(uploadVis, 'Upload still works after rapid cycling');

    await page.click('#backToModeBtn');
}

// ============================================
// TEST 8: Full round-trip (text → home → cards → learn → home → text)
// ============================================
async function testFullRoundTrip(page) {
    console.log('\n--- Test 8: Full round-trip ---');

    // 1. Load text
    await uploadContent(page, SAMPLE_TEXT, 'texts');
    const textVis = await page.evaluate(() =>
        document.getElementById('textReaderContainer').classList.contains('visible'));
    assert(textVis, 'Round-trip: text reader visible');

    // 2. Back to home
    await page.click('#backToHomeBtn');
    await verifyModeSelectionClean(page, 'Round-trip: after text→home');

    // 3. Load flashcards
    await uploadContent(page, SAMPLE_CARDS, 'flashcards');
    await page.click('#startFlashcardsBtn');
    const fcVis = await page.evaluate(() =>
        document.getElementById('flashcardContainer').classList.contains('visible'));
    assert(fcVis, 'Round-trip: flashcard container visible');

    // 4. Back to home (mainMenuBtn → setup → setupBackBtn)
    await page.click('#mainMenuBtn');
    await page.click('#setupBackBtn');
    await verifyModeSelectionClean(page, 'Round-trip: after cards→home');

    // 5. Load text again
    await uploadContent(page, SAMPLE_TEXT, 'texts');
    const textVis2 = await page.evaluate(() =>
        document.getElementById('textReaderContainer').classList.contains('visible'));
    assert(textVis2, 'Round-trip: text reader visible again');

    // 6. Final back to home
    await page.click('#backToHomeBtn');
    await verifyModeSelectionClean(page, 'Round-trip: final state clean');
    await verifyButtonsClickable(page, 'Round-trip: final state');
}

// ============================================
// TEST 9: Saved vocab section appears with DB entries
// ============================================
async function testSavedVocabList(page) {
    console.log('\n--- Test 9: Saved vocab list shows after loading cards ---');

    // Load flashcards (this saves to IndexedDB)
    await uploadContent(page, SAMPLE_CARDS, 'flashcards');

    // Go back to mode selection
    await page.evaluate(() => { switchToModeSelection(); });

    // Click flashcards again
    await page.click('#modeFlashcards');

    // Wait for async renderSavedVocabList to finish
    await page.waitForSelector('#savedVocabSection[style*="block"]', { timeout: 3000 });

    const savedSection = await page.evaluate(() => {
        return document.getElementById('savedVocabSection').style.display;
    });
    assert(savedSection === 'block', 'Saved vocab section is visible');

    // Check that items exist in the list
    const items = await page.evaluate(() => {
        const els = document.querySelectorAll('.saved-vocab-item');
        return Array.from(els).map(el => ({
            source: el.dataset.source,
            name: el.querySelector('.saved-vocab-item-name')?.textContent,
        }));
    });

    assert(items.length >= 1, `Saved vocab list has items (found ${items.length})`);
    assert(items[0].source === '__all__', 'First item is "All vocabulary"');

    // Should also have individual source entries
    if (items.length > 1) {
        assert(items[1].source !== '__all__', 'Second item is a specific source');
    }
}

// ============================================
// TEST 10: Click saved vocab item loads cards
// ============================================
async function testLoadFromSavedVocab(page) {
    console.log('\n--- Test 10: Load cards from saved vocabulary ---');

    // First save some cards to DB
    await uploadContent(page, SAMPLE_CARDS, 'flashcards');
    await page.evaluate(() => { switchToModeSelection(); });

    // Click flashcards
    await page.click('#modeFlashcards');
    await page.waitForSelector('#savedVocabSection[style*="block"]', { timeout: 3000 });

    // Click "All vocabulary" via evaluate (element may need scrolling)
    await page.evaluate(() => {
        document.querySelector('.saved-vocab-item.all-vocab').click();
    });

    // Should go to flashcard setup
    await page.waitForFunction(() =>
        document.getElementById('flashcardSetup').style.display === 'block',
        { timeout: 3000 }
    );

    const state = await page.evaluate(() => ({
        setupVisible: document.getElementById('flashcardSetup').style.display === 'block',
        uploadHidden: document.getElementById('uploadSection').style.display === 'none',
        savedVocabHidden: document.getElementById('savedVocabSection').style.display === 'none',
        cardsCount: cards.length,
    }));

    assert(state.setupVisible, 'Flashcard setup visible after loading from DB');
    assert(state.uploadHidden, 'Upload section hidden after loading from DB');
    assert(state.savedVocabHidden, 'Saved vocab section hidden after loading from DB');
    assert(state.cardsCount === 3, `Loaded 3 cards from DB (got ${state.cardsCount})`);
}

// ============================================
// TEST 11: Saved vocab hidden in text mode
// ============================================
async function testSavedVocabNotInTextMode(page) {
    console.log('\n--- Test 11: Saved vocab not shown in text mode ---');

    // Click texts mode
    await page.click('#modeTexts');

    const savedVis = await page.evaluate(() =>
        document.getElementById('savedVocabSection').style.display);
    assert(savedVis === 'none', 'Saved vocab section hidden in text mode');

    await page.click('#backToModeBtn');
}

// ============================================
// TEST 12: Saved vocab with multiple sources
// ============================================
async function testMultipleSources(page) {
    console.log('\n--- Test 12: Multiple sources in saved vocab ---');

    // Save cards from two different "files"
    await page.evaluate(() => {
        const cards1 = [
            { displayText: 'кошка', speakableText: 'кошка', answer: 'Katze', forms: [], images: [] },
            { displayText: 'собака', speakableText: 'собака', answer: 'Hund', forms: [], images: [] },
        ];
        const cards2 = [
            { displayText: 'дом', speakableText: 'дом', answer: 'Haus', forms: [], images: [] },
        ];
        return Promise.all([
            saveCardsToDB(cards1, 'Tiere.txt'),
            saveCardsToDB(cards2, 'Wohnung.txt'),
        ]);
    });

    // Navigate to flashcards
    await page.click('#modeFlashcards');
    await page.waitForSelector('#savedVocabSection[style*="block"]', { timeout: 3000 });

    const items = await page.evaluate(() => {
        const els = document.querySelectorAll('.saved-vocab-item');
        return Array.from(els).map(el => ({
            source: el.dataset.source,
            name: el.querySelector('.saved-vocab-item-name')?.textContent,
            count: el.querySelector('.saved-vocab-item-count')?.textContent,
        }));
    });

    // Should have: All, Tiere, Wohnung (at least)
    assert(items.length >= 3, `At least 3 items in list (got ${items.length})`);
    assert(items[0].source === '__all__', 'First is "All vocabulary"');

    const tiere = items.find(i => i.source === 'Tiere.txt');
    const wohnung = items.find(i => i.source === 'Wohnung.txt');
    assert(tiere !== undefined, 'Tiere.txt source found');
    assert(wohnung !== undefined, 'Wohnung.txt source found');
    assert(tiere.name === 'Tiere', 'Tiere displayed without extension');
    assert(wohnung.name === 'Wohnung', 'Wohnung displayed without extension');

    // Click specific source (Tiere)
    await page.evaluate(() => {
        const items = document.querySelectorAll('.saved-vocab-item');
        for (const item of items) {
            if (item.dataset.source === 'Tiere.txt') { item.click(); break; }
        }
    });

    await page.waitForFunction(() =>
        document.getElementById('flashcardSetup').style.display === 'block',
        { timeout: 3000 }
    );

    const loaded = await page.evaluate(() => cards.length);
    assert(loaded === 2, `Loaded 2 cards from Tiere source (got ${loaded})`);
}

// ============================================
// TEST 13: Saved vocab section hidden after back
// ============================================
async function testSavedVocabHiddenAfterBack(page) {
    console.log('\n--- Test 13: Saved vocab section hidden after navigation ---');

    // Go to flashcards (savedVocabSection visible)
    await page.click('#modeFlashcards');
    await page.waitForSelector('#savedVocabSection[style*="block"]', { timeout: 3000 });

    // Back to mode selection
    await page.click('#backToModeBtn');

    const savedVis = await page.evaluate(() =>
        document.getElementById('savedVocabSection').style.display);
    assert(savedVis === 'none', 'Saved vocab hidden after backToModeBtn');

    // Also verify via switchToModeSelection
    await page.click('#modeFlashcards');
    await page.waitForSelector('#savedVocabSection[style*="block"]', { timeout: 3000 });

    await page.evaluate(() => { switchToModeSelection(); });

    const savedVis2 = await page.evaluate(() =>
        document.getElementById('savedVocabSection').style.display);
    assert(savedVis2 === 'none', 'Saved vocab hidden after switchToModeSelection');
}

// ============================================
// MAIN
// ============================================
async function main() {
    console.log('Starting navigation tests...');
    console.log('URL:', INDEX_URL);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });

    // Wait for app initialization
    await page.waitForSelector('#modeSelection');

    try {
        await testBasicNavigation(page);

        // Reload between test groups to start fresh
        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testTextModeToHome(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testFlashcardModeToHome(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testFlashcardSetupBack(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testMainMenuBtnFallback(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testNoGhostSpeech(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testRapidNavigation(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testFullRoundTrip(page);

        // Saved Vocabulary DB tests
        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testSavedVocabList(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testLoadFromSavedVocab(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testSavedVocabNotInTextMode(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testMultipleSources(page);

        await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#modeSelection');
        await testSavedVocabHiddenAfterBack(page);

    } catch (e) {
        console.error('\nTest execution error:', e.message);
        failed++;
    }

    // Report console errors
    if (consoleErrors.length > 0) {
        console.log('\n--- Browser Console Errors ---');
        consoleErrors.forEach(e => console.log(`  ! ${e}`));
    }

    console.log(`\n========================================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================`);

    await browser.close();
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
