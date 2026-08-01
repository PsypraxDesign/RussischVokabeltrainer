/**
 * Puppeteer Tests for Vokabel-Editor (vokabel_editor.html)
 *
 * Tests: data loading, filtering, sorting, editing, deletion, undo,
 * isVerb/isNoun detection, conjugation/declension UI, CSV export,
 * buildExportData, and edge cases.
 *
 * Run: node test_editor.js
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EDITOR_URL = 'file:///' + path.resolve(__dirname, '..', 'vokabel_editor.html').replace(/\\/g, '/');

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

// Sample vocabulary data for testing
const SAMPLE_DATA = [
    { id: 'c_1', front: 'работать', back: 'arbeiten', grammar: 'Verb, unvollendet', source: 'Lektion1.txt' },
    { id: 'c_2', front: 'дом', back: 'das Haus', grammar: 'Subst., männl.', source: 'Lektion1.txt' },
    { id: 'c_3', front: 'красивый', back: 'schön', grammar: 'Adj.', source: 'Lektion2.txt' },
    { id: 'c_4', front: 'быстро', back: 'schnell', grammar: 'Adv.', source: 'Lektion2.txt' },
    { id: 'c_5', front: 'говорить', back: 'sprechen', grammar: '', source: 'Lektion1.txt' },
    { id: 'c_6', front: 'школа', back: 'die Schule', grammar: '', source: 'Lektion2.txt' },
    { id: 'c_7', front: 'на почту', back: 'zur Post', grammar: '', source: 'Lektion3.txt' },
    { id: 'c_8', front: 'в школу', back: 'in die Schule', grammar: '', source: 'Lektion3.txt' },
    { id: 'c_9', front: 'дочь', back: 'die Tochter', grammar: '', source: 'Lektion3.txt' },
    { id: 'c_10', front: 'мать', back: 'die Mutter', grammar: '', source: 'Lektion3.txt' },
];

// Extended data with conjugation/declension
const DATA_WITH_CONJ = [
    { id: 'c_20', front: 'делать', back: 'machen', grammar: 'Verb, unvollendet', source: 'Test.txt',
      conjugation: { input: 'делать', verb: 'делать', aspect: 'НСВ', aspect_partner: 'сделать',
          present: { 'я': 'делаю', 'ты': 'делаешь', 'он/она/оно': 'делает', 'мы': 'делаем', 'вы': 'делаете', 'они': 'делают' },
          past: { 'м': 'делал', 'ж': 'делала', 'ср': 'делало', 'мн': 'делали' },
          imperative: { 'ты': 'делай', 'вы': 'делайте' },
          participle_active: 'делающий', participle_passive: null, gerund: 'делая' } },
    { id: 'c_21', front: 'стол', back: 'der Tisch', grammar: 'Subst., männl.', source: 'Test.txt',
      declension: { input: 'стол', noun: 'стол', gender: 'м', animate: false,
          singular: { 'Им.': 'стол', 'Род.': 'стола', 'Дат.': 'столу', 'Вин.': 'стол', 'Тв.': 'столом', 'Пр.': 'столе' },
          plural: { 'Им.': 'столы', 'Род.': 'столов', 'Дат.': 'столам', 'Вин.': 'столы', 'Тв.': 'столами', 'Пр.': 'столах' } } },
];

async function loadTestData(page, data) {
    await page.evaluate((d) => {
        loadData(d);
    }, data);
}

// ============================================
// TEST 1: Data loading and display
// ============================================
async function testDataLoading(page) {
    console.log('\n--- Test 1: Data loading and display ---');
    await loadTestData(page, SAMPLE_DATA);

    const state = await page.evaluate(() => ({
        rowCount: document.querySelectorAll('#vocabBody tr').length,
        tableVisible: document.getElementById('vocabTable').style.display !== 'none',
        emptyHidden: document.getElementById('emptyState').style.display === 'none',
        toolbarVisible: document.getElementById('toolbar').style.display !== 'none',
        saveEnabled: !document.getElementById('btnSave').disabled,
        conjEnabled: !document.getElementById('btnConjAll').disabled,
        declEnabled: !document.getElementById('btnDeclAll').disabled,
        totalText: document.getElementById('stats').textContent,
    }));

    assert(state.rowCount === 10, `Shows 10 rows (got ${state.rowCount})`);
    assert(state.tableVisible, 'Table is visible');
    assert(state.emptyHidden, 'Empty state is hidden');
    assert(state.toolbarVisible, 'Toolbar is visible');
    assert(state.saveEnabled, 'Save button is enabled');
    assert(state.conjEnabled, 'Conjugate-all button is enabled');
    assert(state.declEnabled, 'Decline-all button is enabled');
    assert(state.totalText.includes('10 von 10'), `Stats show 10 of 10 (got "${state.totalText}")`);
}

// ============================================
// TEST 2: Search/filter
// ============================================
async function testSearchFilter(page) {
    console.log('\n--- Test 2: Search and filter ---');
    await loadTestData(page, SAMPLE_DATA);

    // Search by Russian word
    await page.evaluate(() => {
        document.getElementById('searchBox').value = 'дом';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300)); // debounce
    let count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 1, `Search "дом" shows 1 result (got ${count})`);

    // Search by German word
    await page.evaluate(() => {
        searchBox.value = 'Schule';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300));
    count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 2, `Search "Schule" shows 2 results (got ${count})`);

    // Search by grammar
    await page.evaluate(() => {
        searchBox.value = 'Adj.';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300));
    count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 1, `Search "Adj." shows 1 result (got ${count})`);

    // Clear search
    await page.evaluate(() => {
        searchBox.value = '';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300));
    count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 10, `Clear search shows all 10 (got ${count})`);

    // Filter by source
    await page.evaluate(() => {
        filterSource.value = 'Lektion1.txt';
        filterSource.dispatchEvent(new Event('change'));
    });
    count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 3, `Filter Lektion1 shows 3 (got ${count})`);

    // Reset filter
    await page.evaluate(() => {
        filterSource.value = '';
        filterSource.dispatchEvent(new Event('change'));
    });
}

// ============================================
// TEST 3: Deletion and undo
// ============================================
async function testDeletionUndo(page) {
    console.log('\n--- Test 3: Deletion and undo ---');
    await loadTestData(page, SAMPLE_DATA);

    // Delete first item
    await page.evaluate(() => { toggleDelete(0); });
    let state = await page.evaluate(() => ({
        deletedSize: deletedSet.size,
        pendingText: document.getElementById('pendingCount').textContent,
        firstItemDeleted: deletedSet.has(0),
        rowCount: document.querySelectorAll('#vocabBody tr').length,
    }));
    assert(state.deletedSize === 1, `1 item in deletedSet (got ${state.deletedSize})`);
    assert(state.pendingText === '1', `Pending count shows 1 (got "${state.pendingText}")`);
    assert(state.firstItemDeleted === true, 'First item is in deletedSet');
    assert(state.rowCount === 9, `Deleted row removed from view (got ${state.rowCount})`);

    // Undo
    await page.evaluate(() => { undo(); });
    state = await page.evaluate(() => ({
        deletedSize: deletedSet.size,
        undoLength: undoStack.length,
    }));
    assert(state.deletedSize === 0, 'Undo restores deleted item');
    assert(state.undoLength === 0, 'Undo stack is empty');

    // Delete multiple items
    await page.evaluate(() => {
        toggleDelete(0);
        toggleDelete(1);
        toggleDelete(2);
    });
    state = await page.evaluate(() => ({ deletedSize: deletedSet.size }));
    assert(state.deletedSize === 3, `3 items deleted (got ${state.deletedSize})`);

    // Undo one
    await page.evaluate(() => { undo(); });
    state = await page.evaluate(() => ({ deletedSize: deletedSet.size }));
    assert(state.deletedSize === 2, `After undo: 2 deleted (got ${state.deletedSize})`);

    // Restore all
    await page.evaluate(() => {
        document.getElementById('btnRestoreAll').click();
    });
    state = await page.evaluate(() => ({ deletedSize: deletedSet.size }));
    assert(state.deletedSize === 0, 'Restore all clears deletedSet');
}

// ============================================
// TEST 4: Inline editing
// ============================================
async function testInlineEditing(page) {
    console.log('\n--- Test 4: Inline editing ---');
    await loadTestData(page, SAMPLE_DATA);

    // Edit first cell (front)
    await page.evaluate(() => {
        const cell = document.querySelector('#vocabBody tr td[data-field="front"]');
        cell.textContent = 'тестировать';
        cell.dispatchEvent(new Event('blur'));
    });

    let state = await page.evaluate(() => ({
        editedKeys: Object.keys(editedMap),
        editedVal: editedMap[0]?.front,
        statsText: document.getElementById('stats').textContent,
    }));
    assert(state.editedKeys.length === 1, '1 item in editedMap');
    assert(state.editedVal === 'тестировать', `Edited value is "тестировать" (got "${state.editedVal}")`);
    assert(state.statsText.includes('1 bearbeitet'), 'Stats show 1 edited');

    // Undo edit
    await page.evaluate(() => { undo(); });
    state = await page.evaluate(() => ({
        editedKeys: Object.keys(editedMap),
    }));
    assert(state.editedKeys.length === 0, 'Undo clears edit');

    // Edit back to same value (should not create edit entry)
    await page.evaluate(() => {
        const cell = document.querySelector('#vocabBody tr td[data-field="front"]');
        cell.textContent = allData[0].front; // same value
        cell.dispatchEvent(new Event('blur'));
    });
    state = await page.evaluate(() => ({
        editedKeys: Object.keys(editedMap),
    }));
    assert(state.editedKeys.length === 0, 'No edit entry when value unchanged');
}

// ============================================
// TEST 5: buildExportData
// ============================================
async function testBuildExportData(page) {
    console.log('\n--- Test 5: buildExportData ---');
    await loadTestData(page, SAMPLE_DATA);

    // No changes: export = original
    let exportLen = await page.evaluate(() => buildExportData().length);
    assert(exportLen === 10, `Full export has 10 items (got ${exportLen})`);

    // Delete 2 items
    await page.evaluate(() => { toggleDelete(0); toggleDelete(1); });
    exportLen = await page.evaluate(() => buildExportData().length);
    assert(exportLen === 8, `After 2 deletions: 8 items (got ${exportLen})`);

    // Edit an item
    await page.evaluate(() => {
        editedMap[2] = { front: 'очень красивый' };
    });
    const editedFront = await page.evaluate(() => {
        const data = buildExportData();
        return data[0].front; // item at index 2 is now first (0,1 deleted)
    });
    assert(editedFront === 'очень красивый', `Edited front in export (got "${editedFront}")`);

    // Clean up
    await page.evaluate(() => {
        deletedSet = new Set();
        editedMap = {};
        updateView();
    });
}

// ============================================
// TEST 6: isVerb() detection
// ============================================
async function testIsVerb(page) {
    console.log('\n--- Test 6: isVerb() detection ---');
    await loadTestData(page, SAMPLE_DATA);

    const results = await page.evaluate(() => {
        const tests = [
            // Standard infinitives
            { front: 'работать', grammar: '', expected: true, desc: 'работать (standard -ать)' },
            { front: 'говорить', grammar: '', expected: true, desc: 'говорить (standard -ить)' },
            { front: 'писать', grammar: '', expected: true, desc: 'писать (standard -ать)' },
            { front: 'идти', grammar: '', expected: true, desc: 'идти (-ти ending)' },
            { front: 'мочь', grammar: '', expected: true, desc: 'мочь (-чь ending)' },
            { front: 'учиться', grammar: '', expected: true, desc: 'учиться (-ться ending)' },
            // Grammar-marked verbs
            { front: 'делаю', grammar: 'Verb, unvollendet', expected: true, desc: 'делаю with Verb grammar' },
            { front: 'сделал', grammar: 'НСВ', expected: true, desc: 'сделал with НСВ grammar' },
            // Non-verbs
            { front: 'дом', grammar: '', expected: false, desc: 'дом (noun)' },
            { front: 'красивый', grammar: 'Adj.', expected: false, desc: 'красивый (adjective)' },
            { front: 'быстро', grammar: 'Adv.', expected: false, desc: 'быстро (adverb)' },
            // Non-verb words ending in verb-like suffixes
            { front: 'дочь', grammar: '', expected: false, desc: 'дочь (noun, not verb)' },
            { front: 'мать', grammar: '', expected: false, desc: 'мать (noun, not verb)' },
            { front: 'ночь', grammar: '', expected: false, desc: 'ночь (noun, not verb)' },
            { front: 'помощь', grammar: '', expected: false, desc: 'помощь (noun, not verb)' },
            // Multi-word with verb
            { front: 'вставать поздно', grammar: '', expected: true, desc: 'вставать поздно (multi-word verb)' },
            // Verb with parenthetical
            { front: 'вставать (встаёт)', grammar: '', expected: true, desc: 'вставать (встаёт) (parenthetical)' },
            // Noun with Subst grammar
            { front: 'личность', grammar: 'Subst., weibl.', expected: false, desc: 'личность with Subst. grammar' },
        ];
        return tests.map(t => ({
            ...t,
            actual: isVerb({ front: t.front, grammar: t.grammar }),
        }));
    });

    for (const r of results) {
        assert(r.actual === r.expected, `isVerb("${r.desc}"): ${r.actual} === ${r.expected}`);
    }
}

// ============================================
// TEST 7: isNoun() detection
// ============================================
async function testIsNoun(page) {
    console.log('\n--- Test 7: isNoun() detection ---');

    const results = await page.evaluate(() => {
        const tests = [
            // Grammar-marked nouns
            { front: 'дом', grammar: 'Subst., männl.', expected: true, desc: 'дом with Subst. grammar' },
            { front: 'школа', grammar: 'Subst., weibl.', expected: true, desc: 'школа with Subst. grammar' },
            { front: 'окно', grammar: 'Subst., sächl.', expected: true, desc: 'окно with Subst. grammar' },
            { front: 'книга', grammar: 'weibl.', expected: true, desc: 'книга with weibl. grammar' },
            // German translation with article
            { front: 'школа', grammar: '', expected: true, desc: 'школа → die Schule (article)', back: 'die Schule' },
            { front: 'стол', grammar: '', expected: true, desc: 'стол → der Tisch (article)', back: 'der Tisch' },
            { front: 'окно', grammar: '', expected: true, desc: 'окно → das Fenster (article)', back: 'das Fenster' },
            // Preposition + noun phrases
            { front: 'на почту', grammar: '', expected: true, desc: 'на почту (prep + noun)', back: 'zur Post' },
            { front: 'в школу', grammar: '', expected: true, desc: 'в школу (prep + noun)', back: 'in die Schule' },
            { front: 'из дома', grammar: '', expected: true, desc: 'из дома (prep + noun)', back: 'von zu Hause' },
            { front: 'на дискотеку', grammar: '', expected: true, desc: 'на дискотеку (prep + noun)', back: 'in die Disco' },
            { front: 'к врачу', grammar: '', expected: true, desc: 'к врачу (prep + noun)', back: 'zum Arzt' },
            // Single word without grammar - should be detected
            { front: 'книга', grammar: '', expected: true, desc: 'книга (single word, no grammar)', back: 'Buch' },
            { front: 'город', grammar: '', expected: true, desc: 'город (single word, no grammar)', back: 'Stadt' },
            // Known non-verb words that look like verbs
            { front: 'дочь', grammar: '', expected: true, desc: 'дочь (non-verb noun)', back: 'die Tochter' },
            { front: 'мать', grammar: '', expected: true, desc: 'мать (non-verb noun)', back: 'die Mutter' },
            // Explicit non-nouns
            { front: 'работать', grammar: '', expected: false, desc: 'работать (verb)' },
            { front: 'говорить', grammar: '', expected: false, desc: 'говорить (verb)' },
            { front: 'красивый', grammar: 'Adj.', expected: false, desc: 'красивый (adjective)' },
            { front: 'быстро', grammar: 'Adv.', expected: false, desc: 'быстро (adverb)' },
            { front: 'должен', grammar: 'Prädikat, weibl.', expected: false, desc: 'должен (Prädikat)' },
            // Verb with grammar
            { front: 'писать', grammar: 'Verb, unvollendet', expected: false, desc: 'писать (Verb grammar)' },
            // Long phrases (>2 words) should be excluded
            { front: 'идти в школу', grammar: '', expected: false, desc: 'идти в школу (3 words, excluded)' },
            { front: 'ходить на работу каждый день', grammar: '', expected: false, desc: '5 words (excluded)' },
        ];
        return tests.map(t => ({
            ...t,
            actual: isNoun({ front: t.front, grammar: t.grammar || '', back: t.back || '' }),
        }));
    });

    for (const r of results) {
        assert(r.actual === r.expected, `isNoun("${r.desc}"): ${r.actual} === ${r.expected}`);
    }
}

// ============================================
// TEST 8: Conjugation/Declension buttons in table
// ============================================
async function testConjDeclButtons(page) {
    console.log('\n--- Test 8: Conjugation/Declension buttons in table ---');
    await loadTestData(page, [...SAMPLE_DATA, ...DATA_WITH_CONJ]);

    const buttons = await page.evaluate(() => {
        const rows = document.querySelectorAll('#vocabBody tr');
        const results = [];
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const front = cells[1]?.textContent || '';
            // Combined Conjugation/Declension column (index 6)
            const conjDeclCell = cells[6];
            const allButtons = conjDeclCell?.querySelectorAll('button') || [];
            const conjBtn = Array.from(allButtons).find(b => b.textContent.includes('Konj.'));
            const declBtn = Array.from(allButtons).find(b => b.textContent.includes('Dekl.'));
            results.push({
                front,
                hasConjBtn: !!conjBtn,
                conjText: conjBtn?.textContent || '',
                hasDeclBtn: !!declBtn,
                declText: declBtn?.textContent || '',
            });
        });
        return results;
    });

    // Check verb "работать" has conj button
    const rabota = buttons.find(b => b.front === 'работать');
    assert(rabota && rabota.hasConjBtn, 'работать has conjugation button');
    assert(rabota && rabota.conjText === 'Konj.', 'работать conj button says "Konj."');
    assert(rabota && !rabota.hasDeclBtn, 'работать has no declension button');

    // Check noun "дом" has decl button
    const dom = buttons.find(b => b.front === 'дом');
    assert(dom && dom.hasDeclBtn, 'дом has declension button');
    assert(dom && dom.declText === 'Dekl.', 'дом decl button says "Dekl."');
    assert(dom && !dom.hasConjBtn, 'дом has no conjugation button');

    // Check adj "красивый" has neither
    const kras = buttons.find(b => b.front === 'красивый');
    assert(kras && !kras.hasConjBtn, 'красивый has no conjugation button');
    assert(kras && !kras.hasDeclBtn, 'красивый has no declension button');

    // Check verb with existing conjugation shows "✓ Konj."
    const delat = buttons.find(b => b.front === 'делать');
    assert(delat && delat.hasConjBtn, 'делать has conjugation button');
    assert(delat && delat.conjText.includes('✓ Konj.'), 'делать conj button says "✓ Konj."');

    // Check noun with existing declension shows "✓ Dekl."
    const stol = buttons.find(b => b.front === 'стол');
    assert(stol && stol.hasDeclBtn, 'стол has declension button');
    assert(stol && stol.declText.includes('✓ Dekl.'), 'стол decl button says "✓ Dekl."');

    // Check preposition+noun phrase has decl button
    const pochtu = buttons.find(b => b.front === 'на почту');
    assert(pochtu && pochtu.hasDeclBtn, 'на почту has declension button');

    const shkolu = buttons.find(b => b.front === 'в школу');
    assert(shkolu && shkolu.hasDeclBtn, 'в школу has declension button');
}

// ============================================
// TEST 9: Sorting
// ============================================
async function testSorting(page) {
    console.log('\n--- Test 9: Sorting ---');
    await loadTestData(page, SAMPLE_DATA);

    // Sort by front (Russian) ascending
    await page.evaluate(() => {
        sortCol = 'front';
        sortAsc = true;
        updateView();
    });
    let firstWord = await page.evaluate(() => {
        return document.querySelector('#vocabBody tr td[data-field="front"]')?.textContent;
    });
    assert(firstWord === 'быстро', `Ascending sort: first is "быстро" (got "${firstWord}")`);

    // Sort descending
    await page.evaluate(() => {
        sortAsc = false;
        updateView();
    });
    firstWord = await page.evaluate(() => {
        return document.querySelector('#vocabBody tr td[data-field="front"]')?.textContent;
    });
    assert(firstWord === 'школа', `Descending sort: first is "школа" (got "${firstWord}")`);

    // Sort by grammar
    await page.evaluate(() => {
        sortCol = 'grammar';
        sortAsc = true;
        updateView();
    });
    const firstGrammar = await page.evaluate(() => {
        return document.querySelector('#vocabBody tr td[data-field="grammar"]')?.textContent;
    });
    // Empty grammar comes first in ascending
    assert(firstGrammar === '', `Grammar sort: empty grammar first (got "${firstGrammar}")`);

    // Reset
    await page.evaluate(() => {
        sortCol = '';
        sortAsc = true;
        updateView();
    });
}

// ============================================
// TEST 10: Source filter population
// ============================================
async function testSourceFilter(page) {
    console.log('\n--- Test 10: Source filter ---');
    await loadTestData(page, SAMPLE_DATA);

    const options = await page.evaluate(() => {
        const select = document.getElementById('filterSource');
        return Array.from(select.options).map(o => ({ value: o.value, text: o.textContent }));
    });

    assert(options.length === 4, `4 options in source filter (got ${options.length})`);
    assert(options[0].value === '', 'First option is "All"');
    assert(options[0].text.includes('10'), 'All option shows total count');
    assert(options.some(o => o.value === 'Lektion1.txt'), 'Lektion1 in filter');
    assert(options.some(o => o.value === 'Lektion2.txt'), 'Lektion2 in filter');
    assert(options.some(o => o.value === 'Lektion3.txt'), 'Lektion3 in filter');
}

// ============================================
// TEST 11: Conjugation modal display
// ============================================
async function testConjugationModal(page) {
    console.log('\n--- Test 11: Conjugation modal display ---');
    await loadTestData(page, DATA_WITH_CONJ);

    // Open conjugation modal for first item
    await page.evaluate(() => { showConjugation(0); });

    const modal = await page.evaluate(() => ({
        visible: document.getElementById('conjModal').classList.contains('visible'),
        title: document.getElementById('conjModalTitle').textContent,
        bodyHtml: document.getElementById('conjModalBody').innerHTML,
    }));

    assert(modal.visible, 'Conjugation modal is visible');
    assert(modal.title.includes('делать'), `Title contains "делать" (got "${modal.title}")`);
    assert(modal.bodyHtml.includes('делаю'), 'Body contains present tense form');
    assert(modal.bodyHtml.includes('делал'), 'Body contains past tense form');
    assert(modal.bodyHtml.includes('делай'), 'Body contains imperative form');
    assert(modal.bodyHtml.includes('НСВ'), 'Body contains aspect');

    // Close modal
    await page.evaluate(() => {
        document.getElementById('conjModalClose').click();
    });
    const closed = await page.evaluate(() => !document.getElementById('conjModal').classList.contains('visible'));
    assert(closed, 'Modal closed after clicking close button');
}

// ============================================
// TEST 12: Declension modal display
// ============================================
async function testDeclensionModal(page) {
    console.log('\n--- Test 12: Declension modal display ---');
    await loadTestData(page, DATA_WITH_CONJ);

    // Open declension modal for second item
    await page.evaluate(() => { showDeclension(1); });

    const modal = await page.evaluate(() => ({
        visible: document.getElementById('declModal').classList.contains('visible'),
        title: document.getElementById('declModalTitle').textContent,
        bodyHtml: document.getElementById('declModalBody').innerHTML,
    }));

    assert(modal.visible, 'Declension modal is visible');
    assert(modal.title.includes('стол'), `Title contains "стол" (got "${modal.title}")`);
    assert(modal.bodyHtml.includes('стола'), 'Body contains genitive form');
    assert(modal.bodyHtml.includes('столу'), 'Body contains dative form');
    assert(modal.bodyHtml.includes('столом'), 'Body contains instrumental form');
    assert(modal.bodyHtml.includes('столе'), 'Body contains prepositional form');
    assert(modal.bodyHtml.includes('столы'), 'Body contains plural nominative');
    assert(modal.bodyHtml.includes('männlich'), 'Body contains gender');

    // Close by clicking overlay
    await page.evaluate(() => {
        document.getElementById('declModal').click();
    });
    const closed = await page.evaluate(() => !document.getElementById('declModal').classList.contains('visible'));
    assert(closed, 'Modal closed after clicking overlay');
}

// ============================================
// TEST 13: Deleted items excluded from filter
// ============================================
async function testDeletedItemsFilter(page) {
    console.log('\n--- Test 13: Deleted items excluded from view ---');
    await loadTestData(page, SAMPLE_DATA);

    // Delete items and check they disappear
    await page.evaluate(() => {
        toggleDelete(0);
        toggleDelete(1);
    });

    let count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 8, `8 rows visible after 2 deletions (got ${count})`);

    // Show deleted
    await page.evaluate(() => {
        document.getElementById('cbShowDeleted').checked = true;
        document.getElementById('cbShowDeleted').dispatchEvent(new Event('change'));
    });
    count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 10, `10 rows visible with show-deleted checked (got ${count})`);

    // Deleted rows have class
    const deletedRows = await page.evaluate(() =>
        document.querySelectorAll('#vocabBody tr.marked-delete').length
    );
    assert(deletedRows === 2, `2 rows marked-delete (got ${deletedRows})`);

    // Clean up
    await page.evaluate(() => {
        document.getElementById('cbShowDeleted').checked = false;
        deletedSet = new Set();
        updateView();
    });
}

// ============================================
// TEST 14: Edge cases - empty data
// ============================================
async function testEmptyData(page) {
    console.log('\n--- Test 14: Edge cases - empty data ---');

    // Load empty array
    await loadTestData(page, []);
    let count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 0, `0 rows for empty data (got ${count})`);

    const stats = await page.evaluate(() => document.getElementById('stats').textContent);
    assert(stats.includes('0 von 0'), `Stats show 0 of 0 (got "${stats}")`);
}

// ============================================
// TEST 15: Edge cases - special characters
// ============================================
async function testSpecialCharacters(page) {
    console.log('\n--- Test 15: Edge cases - special characters ---');

    const specialData = [
        { id: 'c_sp1', front: 'молоко́', back: 'die Milch', grammar: 'Subst., sächl.', source: 'test.txt' },
        { id: 'c_sp2', front: 'большо́й', back: 'groß', grammar: '', source: 'test.txt' },
        { id: 'c_sp3', front: '"здравствуйте"', back: '"Guten Tag"', grammar: '', source: 'test.txt' },
        { id: 'c_sp4', front: 'дом; квартира', back: 'Haus; Wohnung', grammar: '', source: 'test.txt' },
    ];
    await loadTestData(page, specialData);

    const count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 4, `4 rows for special char data (got ${count})`);

    // Verify accent marks preserved
    const firstFront = await page.evaluate(() =>
        document.querySelector('#vocabBody tr td[data-field="front"]')?.textContent
    );
    assert(firstFront === 'молоко́', `Accent mark preserved: "${firstFront}"`);

    // Search with accent
    await page.evaluate(() => {
        searchBox.value = 'молоко';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300));
    const searchCount = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(searchCount === 1, `Search "молоко" finds accented version (got ${searchCount})`);

    await page.evaluate(() => {
        searchBox.value = '';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300));
}

// ============================================
// TEST 16: Edge cases - isVerb/isNoun boundary
// ============================================
async function testVerbNounBoundary(page) {
    console.log('\n--- Test 16: isVerb/isNoun boundary cases ---');

    const results = await page.evaluate(() => {
        const tests = [
            // Empty front
            { front: '', grammar: '', isV: false, isN: false, desc: 'empty string' },
            // Only spaces
            { front: '   ', grammar: '', isV: false, isN: false, desc: 'whitespace only' },
            // Single letter
            { front: 'я', grammar: '', isV: false, isN: true, desc: 'single letter я' },
            // Number
            { front: '123', grammar: '', isV: false, isN: true, desc: 'numbers (single word, no grammar)' },
            // Verb ending but in NON_VERB_WORDS
            { front: 'нести', grammar: '', isV: false, isN: true, desc: 'нести (in NON_VERB_WORDS, treated as noun)' },
            // Reflexive verb
            { front: 'одеваться', grammar: '', isV: true, isN: false, desc: 'одеваться (-ться ending)' },
            // Perfective marker in grammar
            { front: 'сделать', grammar: 'СВ', isV: true, isN: false, desc: 'сделать with СВ grammar' },
            // Mixed case grammar
            { front: 'дом', grammar: 'SUBST., MÄNNL.', isV: false, isN: true, desc: 'uppercase grammar' },
            // Kurzform exclusion
            { front: 'красив', grammar: 'Kurzform', isV: false, isN: false, desc: 'красив (Kurzform excluded)' },
            // Verb with bracket notation
            { front: 'готовить (готовлю)', grammar: '', isV: true, isN: false, desc: 'готовить (готовлю) with parens' },
            // Real data: verb grammar with "3. Pers. Pl." (previously excluded by 'pl.' in NON_VERB_GRAMMAR)
            { front: 'работать', grammar: 'unvollendeter Aspekt, 3. Pers. Pl.', isV: true, isN: false, desc: 'verb with Aspekt + Pers. Pl. grammar' },
            { front: 'любить', grammar: 'Verb, unvollendeter Aspekt, 3. Pers. Pl. Präs.', isV: true, isN: false, desc: 'verb with Verb + Pl. Präs. grammar' },
            // Real data: noun with "Subst., Präp. Sg." (previously excluded by 'präp' in NON_NOUN_GRAMMAR)
            { front: 'стол', grammar: 'Subst., männl., Präp. Sg.', isV: false, isN: true, desc: 'noun with Subst. + Präp. case grammar' },
            { front: 'стена', grammar: 'Subst., weibl., Präp. Sg.', isV: false, isN: true, desc: 'noun weibl. with Präp. case grammar' },
            // Real data: noun with gender + Präpositiv (no Subst. marker)
            { front: 'жизнь', grammar: 'weibl., Präpositiv', isV: false, isN: true, desc: 'noun weibl. + Präpositiv (no Subst.)' },
            // Real data: Adverb contains 'verb' substring — must NOT be classified as verb
            { front: 'быстро', grammar: 'Adverb', isV: false, isN: false, desc: 'Adverb not misclassified as verb' },
            { front: 'часто', grammar: 'Adverb', isV: false, isN: false, desc: 'Adverb часто not verb' },
            // Real data: Prädikat exclusion still works
            { front: 'должен', grammar: 'Prädikat, weibl.', isV: false, isN: false, desc: 'Prädikat weibl. not noun' },
            { front: 'нельзя', grammar: 'Prädikat', isV: false, isN: false, desc: 'Prädikat alone not noun' },
        ];
        return tests.map(t => ({
            ...t,
            actualV: isVerb({ front: t.front, grammar: t.grammar, back: '' }),
            actualN: isNoun({ front: t.front, grammar: t.grammar, back: '' }),
        }));
    });

    for (const r of results) {
        assert(r.actualV === r.isV, `isVerb("${r.desc}"): ${r.actualV} === ${r.isV}`);
        assert(r.actualN === r.isN, `isNoun("${r.desc}"): ${r.actualN} === ${r.isN}`);
    }
}

// ============================================
// TEST 17: buildConjPrompt / buildDeclPrompt
// ============================================
async function testPromptBuilding(page) {
    console.log('\n--- Test 17: Prompt building ---');

    const prompts = await page.evaluate(() => {
        const conjPrompt = buildConjPrompt(['работать', 'говорить']);
        const declPrompt = buildDeclPrompt(['дом', 'школа']);
        return { conjPrompt, declPrompt };
    });

    assert(prompts.conjPrompt.includes('работать'), 'Conj prompt contains "работать"');
    assert(prompts.conjPrompt.includes('говорить'), 'Conj prompt contains "говорить"');
    assert(prompts.conjPrompt.includes('JSON'), 'Conj prompt mentions JSON');
    assert(prompts.conjPrompt.includes('НСВ'), 'Conj prompt mentions aspect');

    assert(prompts.declPrompt.includes('дом'), 'Decl prompt contains "дом"');
    assert(prompts.declPrompt.includes('школа'), 'Decl prompt contains "школа"');
    assert(prompts.declPrompt.includes('JSON'), 'Decl prompt mentions JSON');
    assert(prompts.declPrompt.includes('Им.'), 'Decl prompt mentions Nominativ');
    assert(prompts.declPrompt.includes('Род.'), 'Decl prompt mentions Genitiv');
}

// ============================================
// TEST 18: parseConjResponse
// ============================================
async function testParseConjResponse(page) {
    console.log('\n--- Test 18: parseConjResponse ---');

    const results = await page.evaluate(() => {
        // Valid JSON array
        const r1 = parseConjResponse('[{"input":"тест","verb":"тест"}]');
        // With markdown fences
        const r2 = parseConjResponse('```json\n[{"input":"тест"}]\n```');
        // With extra text before/after
        const r3 = parseConjResponse('Here is the result:\n[{"input":"тест"}]\nDone.');
        // Invalid JSON
        const r4 = parseConjResponse('This is not JSON at all');
        // Empty array
        const r5 = parseConjResponse('[]');
        // Not an array
        const r6 = parseConjResponse('{"input":"тест"}');
        // Nested fences with text
        const r7 = parseConjResponse('Sure!\n```\n[{"input":"x","verb":"y"}]\n```\nHope this helps!');

        return {
            r1len: r1.length, r1input: r1[0]?.input,
            r2len: r2.length, r2input: r2[0]?.input,
            r3len: r3.length,
            r4len: r4.length,
            r5len: r5.length,
            r6len: r6.length,
            r7len: r7.length, r7verb: r7[0]?.verb,
        };
    });

    assert(results.r1len === 1 && results.r1input === 'тест', 'Parses valid JSON array');
    assert(results.r2len === 1 && results.r2input === 'тест', 'Parses markdown-fenced JSON');
    assert(results.r3len === 1, 'Parses JSON with surrounding text');
    assert(results.r4len === 0, 'Returns empty for non-JSON');
    assert(results.r5len === 0, 'Returns empty for empty array');
    assert(results.r6len === 0, 'Returns empty for non-array JSON');
    assert(results.r7len === 1 && results.r7verb === 'y', 'Parses fenced JSON without "json" tag');
}

// ============================================
// TEST 19: Conjugation data preserved in export
// ============================================
async function testConjDeclDataExport(page) {
    console.log('\n--- Test 19: Conjugation/declension data in export ---');
    await loadTestData(page, DATA_WITH_CONJ);

    const exportData = await page.evaluate(() => buildExportData());

    assert(exportData[0].conjugation !== undefined, 'First item has conjugation data');
    assert(exportData[0].conjugation.verb === 'делать', 'Conjugation verb is correct');
    assert(exportData[0].conjugation.present['я'] === 'делаю', 'Conjugation present form preserved');

    assert(exportData[1].declension !== undefined, 'Second item has declension data');
    assert(exportData[1].declension.noun === 'стол', 'Declension noun is correct');
    assert(exportData[1].declension.singular['Род.'] === 'стола', 'Declension genitive form preserved');
    assert(exportData[1].declension.gender === 'м', 'Declension gender preserved');
}

// ============================================
// TEST 20: Multiple edits and undo chain
// ============================================
async function testMultipleEditsUndo(page) {
    console.log('\n--- Test 20: Multiple edits and undo chain ---');
    await loadTestData(page, SAMPLE_DATA);

    // Make multiple edits to same item
    await page.evaluate(() => {
        // Simulate editing front
        const item = allData[0];
        const oldFront = item.front;
        editedMap[0] = { front: 'первое изменение' };
        undoStack.push({ type: 'edit', idx: 0, field: 'front', prev: oldFront, hadEntry: false });
    });

    await page.evaluate(() => {
        undoStack.push({ type: 'edit', idx: 0, field: 'front', prev: 'первое изменение', hadEntry: true });
        editedMap[0].front = 'второе изменение';
    });

    let val = await page.evaluate(() => editedMap[0]?.front);
    assert(val === 'второе изменение', `After 2 edits: "${val}"`);

    // Undo second edit
    await page.evaluate(() => { undo(); });
    val = await page.evaluate(() => editedMap[0]?.front);
    assert(val === 'первое изменение', `After 1 undo: "${val}"`);

    // Undo first edit
    await page.evaluate(() => { undo(); });
    val = await page.evaluate(() => editedMap[0]);
    assert(val === undefined, 'After 2 undos: no edit entry');
}

// ============================================
// TEST 21: Search combined with source filter
// ============================================
async function testCombinedFilters(page) {
    console.log('\n--- Test 21: Search + source filter combined ---');
    await loadTestData(page, SAMPLE_DATA);

    // Filter by source + search
    await page.evaluate(() => {
        filterSource.value = 'Lektion3.txt';
        filterSource.dispatchEvent(new Event('change'));
    });
    let count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 4, `Lektion3 has 4 items (got ${count})`);

    await page.evaluate(() => {
        searchBox.value = 'почту';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300));
    count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 1, `Lektion3 + "почту" = 1 item (got ${count})`);

    // Search that matches nothing in this source
    await page.evaluate(() => {
        searchBox.value = 'arbeiten';
        searchBox.dispatchEvent(new Event('input'));
    });
    await new Promise(r => setTimeout(r, 300));
    count = await page.evaluate(() => document.querySelectorAll('#vocabBody tr').length);
    assert(count === 0, `Lektion3 + "arbeiten" = 0 items (got ${count})`);

    // Clean up
    await page.evaluate(() => {
        searchBox.value = '';
        filterSource.value = '';
        searchBox.dispatchEvent(new Event('input'));
        filterSource.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 300));
}

// ============================================
// TEST 22: Select all checkbox
// ============================================
async function testSelectAll(page) {
    console.log('\n--- Test 22: Select all checkbox ---');
    await loadTestData(page, SAMPLE_DATA);

    // Click select all
    await page.evaluate(() => {
        document.getElementById('cbSelectAll').checked = true;
        document.getElementById('cbSelectAll').dispatchEvent(new Event('change'));
    });

    let deletedSize = await page.evaluate(() => deletedSet.size);
    assert(deletedSize === 10, `Select all marks 10 items (got ${deletedSize})`);

    // Deselect all
    await page.evaluate(() => {
        document.getElementById('cbSelectAll').checked = false;
        document.getElementById('cbSelectAll').dispatchEvent(new Event('change'));
    });

    // Note: deselect all might not restore — check behavior
    // Clean up
    await page.evaluate(() => {
        deletedSet = new Set();
        updateView();
    });
}

// ============================================
// MAIN
// ============================================
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('    [console.error]', msg.text());
    });
    page.on('pageerror', err => console.log('    [PAGE ERROR]', err.message));

    await page.goto(EDITOR_URL, { waitUntil: 'networkidle0' });

    try {
        await testDataLoading(page);
        await testSearchFilter(page);
        await testDeletionUndo(page);
        await testInlineEditing(page);
        await testBuildExportData(page);
        await testIsVerb(page);
        await testIsNoun(page);
        await testConjDeclButtons(page);
        await testSorting(page);
        await testSourceFilter(page);
        await testConjugationModal(page);
        await testDeclensionModal(page);
        await testDeletedItemsFilter(page);
        await testEmptyData(page);
        await testSpecialCharacters(page);
        await testVerbNounBoundary(page);
        await testPromptBuilding(page);
        await testParseConjResponse(page);
        await testConjDeclDataExport(page);
        await testMultipleEditsUndo(page);
        await testCombinedFilters(page);
        await testSelectAll(page);
    } catch (err) {
        console.error('\n  FATAL ERROR:', err.message);
        failed++;
    }

    await browser.close();

    console.log(`\n========================================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================`);

    process.exit(failed > 0 ? 1 : 0);
})();
