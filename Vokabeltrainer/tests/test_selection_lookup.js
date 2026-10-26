// Test: Markieren mit der Maus im Lesetext -> Vokabelliste oder Claude.
// Claude wird ersetzt (kein Netz, keine Kosten).
// Aufruf: node tests/test_selection_lookup.js
const puppeteer = require('puppeteer');
const { isolatePage } = require('./helpers/offline');
const path = require('path');
const fs = require('fs');
const os = require('os');
const vm = require('vm');

let passed = 0, failed = 0;
function check(name, cond) {
    if (cond) { passed++; console.log('  OK   ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

function unitTests() {
    console.log('\nHilfsfunktionen');
    const ctx = { String, JSON, Error };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'selection-lookup.js'), 'utf8')
        + '\nthis.api = { cleanSelectionText, parseSelectionResponse, buildSelectionPrompt };', ctx);
    const a = ctx.api;
    check('Satzzeichen am Rand weg', a.cleanSelectionText(' «метро», ') === 'метро');
    check('Bindestrich innen bleibt', a.cleanSelectionText('по-русски.') === 'по-русски');
    check('Zeilenumbruch wird Leerzeichen', a.cleanSelectionText('все\n машины') === 'все машины');
    check('ohne Kyrillisch -> leer', a.cleanSelectionText('Hallo Welt') === '');
    check('zu lang -> leer', a.cleanSelectionText('слово '.repeat(13)) === '');
    const r = a.parseSelectionResponse('Hier: {"russian":"кварти́ра","translation":"Wohnung","grammar":"Subst., weibl."} fertig');
    check('Antwort gelesen', r.russian === 'кварти́ра' && r.translation === 'Wohnung' && r.grammar === 'Subst., weibl.');
    let threw = '';
    try { a.parseSelectionResponse('{"russian":"x"}'); } catch (e) { threw = e.message; }
    check('fehlende Uebersetzung -> PARSE', threw === 'PARSE');
    check('Prompt enthaelt Ausdruck und Satz', /«машины»/.test(a.buildSelectionPrompt('машины', 'Все машины стоят.', 'de'))
        && /«Все машины стоят\.»/.test(a.buildSelectionPrompt('машины', 'Все машины стоят.', 'de')));
}

async function browserTests() {
    const browser = await puppeteer.launch({ headless: true, args: ['--allow-file-access-from-files'] });
    const page = await browser.newPage();
    await isolatePage(page);   // kein Netz, keine echten Schluessel
    await page.setViewport({ width: 1100, height: 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.dismiss());   // Startup-Alert zur Speicherdatei

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(1200);

    await page.evaluate(async () => {
        const db = await openVocabDB();
        const tx = db.transaction('vocabulary', 'readwrite');
        const st = tx.objectStore('vocabulary');
        st.clear();
        st.put({ id: 's1', front: 'метро́', back: 'U-Bahn', grammar: 'Subst., sächl.', forms: [], source: 'andere.txt' });
        await new Promise(r => { tx.oncomplete = r; });
        // Claude ersetzen, Aufrufe zaehlen; Sprachausgabe abfangen
        window.__claudeCalls = [];
        window.__claudeMode = 'ok';
        window.callClaudeAPI = (prompt) => {
            window.__claudeCalls.push(prompt);
            return new Promise((resolve, reject) => setTimeout(() => {
                if (window.__claudeMode === 'auth') reject(new Error('AUTH'));
                else resolve('{"russian":"маши́на","translation":"Auto","grammar":"Subst., weibl., hier Nom. Pl."}');
            }, 400));
        };
        window.__spoken = [];
        window.speak = (text) => { window.__spoken.push(text); };
        apiKey = 'test-key';
    });

    const textFile = path.join(os.tmpdir(), 'auswahl_test.txt');
    fs.writeFileSync(textFile, 'Я еду на метро. Все машины стоят.', 'utf8');
    await page.evaluate(() => modeTextsBtn.click());
    await (await page.$('#fileInput')).uploadFile(textFile);
    await wait(900);

    const wordBox = (w) => page.evaluate((t) => {
        const el = [...document.querySelectorAll('.text-paragraph .word')]
            .find(e => e.textContent.replace(/[.,]/g, '') === t);
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, r: r.right };
    }, w);
    const state = () => page.evaluate(() => ({
        visible: selectionPopup.classList.contains('visible'),
        loading: selectionPopup.classList.contains('loading'),
        footer: getComputedStyle(selectionPopupFooter).display,
        word: selectionPopupWord.textContent,
        tr: selectionPopupTranslation.textContent,
        src: selectionPopupSource.textContent,
        msg: selectionPopupMessage.style.display !== 'none' ? selectionPopupMessage.textContent : '',
        save: selectionSaveBtn.style.display !== 'none'
    }));
    const dblclick = async (w) => { const b = await wordBox(w); await page.mouse.click(b.x, b.y, { clickCount: 2 }); await wait(150); };

    console.log('\nTreffer in der Vokabelliste');
    await dblclick('метро');
    let s = await state();
    check('Kaestchen offen', s.visible);
    check('Eintrag aus der Liste (mit Betonung)', s.word === 'метро́' && s.tr === 'U-Bahn');
    check('Quelle: Vokabelliste', s.src === await page.evaluate(() => t('selection_from_list')));
    check('kein Speichern-Knopf bei Listentreffer', !s.save);
    check('Claude nicht gefragt', (await page.evaluate(() => window.__claudeCalls.length)) === 0);
    await page.click('#selectionSpeakBtn');
    check('🔊 liest die Woerterbuchform', (await page.evaluate(() => window.__spoken)).includes('метро́'));
    await page.keyboard.press('Escape');
    await wait(100);
    check('Escape schliesst', !(await state()).visible);

    console.log('\nWortgruppe ueber Claude');
    const a = await wordBox('Все'), z = await wordBox('стоят');
    await page.mouse.move(a.l + 1, a.y);
    await page.mouse.down();
    await page.mouse.move(z.r - 1, z.y, { steps: 6 });
    await page.mouse.up();
    await wait(120);
    s = await state();
    check('waehrend des Wartens: Animation', s.visible && s.loading);
    check('waehrend des Wartens: keine alte Fusszeile', s.footer === 'none');
    await wait(600);
    s = await state();
    check('Claude-Ergebnis angezeigt', !s.loading && s.word === 'маши́на' && s.tr === 'Auto');
    check('Quelle: Claude', s.src === await page.evaluate(() => t('selection_from_claude')));
    const prompt = await page.evaluate(() => window.__claudeCalls[0] || '');
    check('Claude bekommt Ausdruck und Satz', prompt.includes('«Все машины стоят»') && prompt.includes('«Все машины стоят.»'));
    check('Satz wurde nicht vorgelesen', (await page.evaluate(() => window.__spoken.length)) === 1);

    console.log('\nIn die Vokabelliste uebernehmen');
    await page.click('#selectionSaveBtn');
    await wait(500);
    check('Knopf meldet gespeichert', (await page.evaluate(() => selectionSaveBtn.textContent)) === await page.evaluate(() => t('selection_saved')));
    const saved = await page.evaluate(async () => (await getAllCardsFromDB()).find(r => r.front === 'маши́на'));
    check('in der Datenbank unter diesem Text', !!saved && saved.back === 'Auto' && saved.source === 'auswahl_test.txt');
    check('Textform als forms gespeichert', !!saved && saved.forms.includes('Все машины стоят'));

    console.log('\nZwischenspeicher, Fehler, ohne Schluessel');
    await page.mouse.click(5, 5);
    await wait(150);
    check('Klick daneben schliesst', !(await state()).visible);
    await page.evaluate(() => { window.__claudeCalls = []; });
    await page.mouse.move(a.l + 1, a.y); await page.mouse.down();
    await page.mouse.move(z.r - 1, z.y, { steps: 6 }); await page.mouse.up();
    await wait(200);
    check('gleiche Markierung: aus dem Zwischenspeicher', (await page.evaluate(() => window.__claudeCalls.length)) === 0 && (await state()).tr === 'Auto');
    await page.mouse.click(5, 5);

    await page.evaluate(() => { window.__claudeMode = 'auth'; });
    await dblclick('еду');
    await wait(600);
    s = await state();
    check('Fehler wird angezeigt', s.visible && s.msg.includes(await page.evaluate(() => t('generate_error_auth'))));
    await page.mouse.click(5, 5);

    await page.evaluate(() => { apiKey = ''; });
    await dblclick('на');
    s = await state();
    check('ohne Claude-Schluessel: Hinweis', s.visible && s.msg === await page.evaluate(() => t('selection_no_key')));
    await page.mouse.click(5, 5);

    console.log('\nSatzweise-Modus');
    await page.evaluate(() => { apiKey = 'test-key'; window.__claudeMode = 'ok'; window.__spoken = []; document.getElementById('readSentenceBtn').click(); });
    await wait(300);
    const sentenceMode = await page.evaluate(() => readMode === 'sentence');
    if (sentenceMode) {
        await dblclick('метро');
        check('Markieren im klickbaren Satz liest den Satz nicht vor',
            (await page.evaluate(() => window.__spoken.filter(x => x.includes('Я еду')).length)) <= 1
            && (await state()).visible);
    } else {
        console.log('  (Satzweise-Knopf nicht gefunden — uebersprungen)');
    }

    check('keine Seitenfehler', errors.length === 0);
    if (errors.length) console.log(errors);

    await page.evaluate(async () => {
        const db = await openVocabDB();
        const tx = db.transaction('vocabulary', 'readwrite');
        tx.objectStore('vocabulary').clear();
        await new Promise(r => { tx.oncomplete = r; });
    });
    await browser.close();
}

(async () => {
    unitTests();
    await browserTests();
    console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
