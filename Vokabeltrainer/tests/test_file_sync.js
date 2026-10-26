// Test: vokabeln.json ist massgeblich (js/file-sync.js), Lernstand in
// lernstand.json, Editor uebernimmt Trainer-Aenderungen beim Speichern,
// dazu die Korrekturen aus dem Review vom 25.10.2026 (Vorlese-Kette,
// Richtungswechsel, Escaping, fehlender Text).
// Dateien werden durch Attrappen mit dem Verhalten von FileSystemFileHandle
// ersetzt (Inhalt, lastModified, Berechtigung), Dialoge gibt es im Test nicht.
// Aufruf: node tests/test_file_sync.js
const puppeteer = require('puppeteer');
const { isolatePage } = require('./helpers/offline');
const path = require('path');
const fs = require('fs');
const os = require('os');

let passed = 0, failed = 0;
function check(name, cond) {
    if (cond) { passed++; console.log('  OK   ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

// Im Browser verfuegbar: makeFakeHandle(name, text, perm)
function installFakes() {
    window.makeFakeHandle = (name, text, perm = 'granted') => {
        const h = {
            name, text, perm, stamp: 1000, writes: 0, grantOnRequest: true,
            async queryPermission() { return h.perm; },
            async requestPermission() { if (h.grantOnRequest) h.perm = 'granted'; return h.perm; },
            async getFile() { return new File([h.text], name, { lastModified: h.stamp }); },
            async createWritable() {
                if (h.perm !== 'granted') throw new Error('NotAllowedError');
                let buf = '';
                return {
                    write: async (d) => { buf += d; },
                    close: async () => { h.text = buf; h.stamp += 1; h.writes++; }
                };
            },
            // "Jemand anderes" (Editor) aendert die Datei
            externalWrite(data) { h.text = JSON.stringify(data, null, 2); h.stamp += 1; }
        };
        return h;
    };
}

async function trainerTests(browser) {
    const page = await browser.newPage();
    await isolatePage(page);
    const errors = [];
    const dialogs = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    await page.evaluateOnNewDocument(installFakes);

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(1200);

    const bar = () => page.evaluate(() => ({
        visible: fileSyncBar.classList.contains('visible'),
        text: fileSyncText.textContent,
        button: fileSyncAction.textContent
    }));

    console.log('\nStart ohne gewaehlte Datei');
    check('kein Pflicht-Dialog mehr beim Start', dialogs.length === 0);
    let b = await bar();
    check('Leiste bietet "Vokabelliste wählen" an', b.visible && b.button === await page.evaluate(() => t('file_sync_btn_pick')));

    console.log('\nVerbinden: Datei ersetzt die Datenbank');
    const fileData = [
        { id: 'a1', front: 'дом', back: 'Haus', source: 'L1.txt', conjugation: null, declension: { gender: 'м' } },
        { id: 'a2', front: 'кот', back: 'Katze', source: 'L1.txt' },
        { id: 'a3', front: 'читать', back: 'lesen', source: 'L2.txt' }
    ];
    const r1 = await page.evaluate(async (data) => {
        // veralteter Eintrag nur in der Datenbank
        const db = await openVocabDB();
        const tx = db.transaction('vocabulary', 'readwrite');
        tx.objectStore('vocabulary').clear();
        tx.objectStore('vocabulary').put({ id: 'old', front: 'старый', back: 'alt', source: 'X.txt' });
        await new Promise(r => { tx.oncomplete = r; });
        window.vf = makeFakeHandle('vokabeln.json', JSON.stringify(data));
        vocabFileHandle = vf;
        const ok = await connectVocabFile(false);
        return { ok, ids: (await getAllCardsFromDB()).map(r => r.id).sort(), state: vocabSyncState, writes: vf.writes };
    }, fileData);
    check('verbunden', r1.ok && r1.state === 'synced');
    check('Datenbank = Datei (veralteter Eintrag weg)', JSON.stringify(r1.ids) === '["a1","a2","a3"]');
    check('beim Verbinden nichts geschrieben', r1.writes === 0);
    b = await bar();
    check('Leiste zeigt jetzt den Lernstand-Hinweis', b.visible && b.button === await page.evaluate(() => t('progress_sync_btn_create')));

    console.log('\nTrainer speichert: lesen, einmischen, schreiben');
    const r2 = await page.evaluate(async () => {
        // Der Editor hat inzwischen "кот" korrigiert und "читать" geloescht
        const now = JSON.parse(vf.text);
        now.find(r => r.id === 'a2').back = 'Kater';
        vf.externalWrite(now.filter(r => r.id !== 'a3'));
        // Trainer speichert eine neue Vokabel und "дом" ohne Deklination
        const result = await saveCardsToDB([
            { displayText: 'собака', speakableText: 'собака', answer: 'Hund' },
            { displayText: 'дом', speakableText: 'дом', answer: 'Haus' }
        ], 'L3.txt');
        const file = JSON.parse(vf.text);
        return {
            result,
            fronts: file.map(r => r.front + '=' + r.back),
            hasDomDecl: !!(file.find(r => r.front === 'дом') || {}).declension,
            dbCount: (await getAllCardsFromDB()).length,
            fileCount: file.length
        };
    });
    check('Ergebnis "saved"', r2.result === 'saved');
    check('neue Vokabel in der Datei', r2.fronts.includes('собака=Hund'));
    check('Korrektur des Editors bleibt erhalten', r2.fronts.includes('кот=Kater'));
    check('Loeschung des Editors bleibt erhalten', !r2.fronts.some(f => f.startsWith('читать')));
    check('Deklination aus der Datei bleibt beim Ueberschreiben', r2.hasDomDecl);
    check('Datenbank = Datei', r2.dbCount === r2.fileCount);

    console.log('\nLektion loeschen');
    const r3 = await page.evaluate(async () => {
        const result = await deleteSourceFromDB('L3.txt');
        return { result, fronts: JSON.parse(vf.text).map(r => r.front) };
    });
    check('aus der Datei entfernt', r3.result === 'saved' && !r3.fronts.includes('собака'));

    console.log('\nEditor aendert die Datei, Trainer kommt zurueck ins Fenster');
    const r4 = await page.evaluate(async () => {
        const now = JSON.parse(vf.text);
        now.push({ id: 'e1', front: 'книга', back: 'Buch', source: 'L1.txt' });
        vf.externalWrite(now);
        const reloaded = await reloadVocabFileIfChanged();
        const again = await reloadVocabFileIfChanged();
        return { reloaded, again, inDb: (await getAllCardsFromDB()).some(r => r.id === 'e1') };
    });
    check('neu eingelesen', r4.reloaded && r4.inDb);
    check('ohne Aenderung kein erneutes Einlesen', r4.again === false);

    console.log('\nOhne Berechtigung: Warteschlange');
    const r5 = await page.evaluate(async () => {
        vf.perm = 'prompt';
        vf.grantOnRequest = false;
        const before = vf.text;
        const result = await saveCardsToDB([{ displayText: 'рыба', speakableText: 'рыба', answer: 'Fisch' }], 'L4.txt');
        return { result, unchanged: vf.text === before, state: vocabSyncState, pending: await countPendingVocabChanges() };
    });
    check('Ergebnis "pending", Datei unberuehrt', r5.result === 'pending' && r5.unchanged);
    check('Zustand "disconnected", 1 Aenderung wartet', r5.state === 'disconnected' && r5.pending === 1);
    await wait(100);
    b = await bar();
    check('Leiste: "Verbinden" mit Hinweis auf wartende Aenderung',
        b.visible && b.button === await page.evaluate(() => t('file_sync_btn_connect'))
        && b.text.includes(await page.evaluate(() => t('file_sync_pending', { n: 1 }))));
    await page.evaluate(() => { vf.grantOnRequest = true; });
    await page.click('#fileSyncAction');
    await wait(400);
    const r6 = await page.evaluate(async () => ({
        state: vocabSyncState,
        inFile: JSON.parse(vf.text).some(r => r.front === 'рыба'),
        pending: await countPendingVocabChanges()
    }));
    check('nach "Verbinden": eingetragen, Warteschlange leer', r6.state === 'synced' && r6.inFile && r6.pending === 0);

    console.log('\nKaputte Datei wird nie ueberschrieben');
    const r7 = await page.evaluate(async () => {
        vf.text = '{ kaputt';
        vf.stamp += 1;
        const result = await saveCardsToDB([{ displayText: 'птица', speakableText: 'птица', answer: 'Vogel' }], 'L5.txt');
        return { result, text: vf.text, state: vocabSyncState };
    });
    check('Fehlerzustand, Datei unveraendert', r7.state === 'error' && r7.text === '{ kaputt' && r7.result === 'pending');
    await wait(100);
    check('Leiste meldet den Fehler', (await page.evaluate(() => fileSyncBar.classList.contains('error'))));

    console.log('\nNeue leere Datei: bisheriger Bestand wird hineingeschrieben');
    const r8 = await page.evaluate(async () => {
        const dbCount = (await getAllCardsFromDB()).length;
        window.vf2 = makeFakeHandle('neu.json', '');
        vocabFileHandle = vf2;
        await connectVocabFile(false);
        const file = JSON.parse(vf2.text);
        return { dbCount, fileCount: file.length, hasPending: file.some(r => r.front === 'птица') };
    });
    check('leere Datei bekommt den Bestand', r8.fileCount >= r8.dbCount && r8.fileCount > 0);
    check('wartende Aenderung landet mit drin', r8.hasPending);

    console.log('\nLernstand (lernstand.json)');
    const r9 = await page.evaluate(async () => {
        localStorage.setItem('vokabeltrainer_sr', JSON.stringify({
            c_a: { lastReview: 100, interval: 1 },
            c_b: { lastReview: 500, interval: 9 }
        }));
        localStorage.setItem('vokabeltrainer_history', JSON.stringify([{ date: '2026-10-20', duration: 60, cardsReviewed: 5 }]));
        window.pf = makeFakeHandle('lernstand.json', JSON.stringify({
            sr: { c_a: { lastReview: 300, interval: 4 }, c_b: { lastReview: 200, interval: 2 }, c_c: { lastReview: 50, interval: 1 } },
            history: [{ date: '2026-10-19', duration: 30, cardsReviewed: 2 }, { date: '2026-10-20', duration: 60, cardsReviewed: 5 }]
        }));
        progressFileHandle = pf;
        const ok = await connectProgressFile(false);
        const sr = JSON.parse(localStorage.getItem('vokabeltrainer_sr'));
        const hist = JSON.parse(localStorage.getItem('vokabeltrainer_history'));
        const file = JSON.parse(pf.text);
        return { ok, sr, hist: hist.length, fileSr: Object.keys(file.sr).length, inMemory: srData.c_a && srData.c_a.interval };
    });
    check('verbunden', r9.ok);
    check('pro Karte gewinnt der neuere Stand', r9.sr.c_a.interval === 4 && r9.sr.c_b.interval === 9 && r9.sr.c_c.interval === 1);
    check('Verlauf vereinigt ohne Doppelte', r9.hist === 2);
    check('Lernstand im Speicher neu geladen', r9.inMemory === 4);
    check('Datei enthaelt den zusammengefuehrten Stand', r9.fileSr === 3);
    const r10 = await page.evaluate(async () => {
        const before = pf.writes;
        srData.c_d = { lastReview: 999, interval: 3 };
        saveSRData();
        const immediately = pf.writes;
        await flushProgressSave();
        return { before, immediately, after: pf.writes, has: !!JSON.parse(pf.text).sr.c_d };
    });
    check('Bewertung wird verzoegert gesichert', r10.immediately === r10.before && r10.after === r10.before + 1 && r10.has);

    console.log('\nPunkt 3: Vorlese-Kette, Richtungswechsel, Escaping, Texte');
    // Vorlese-Kette: Moduswechsel muss sie beenden, auch wenn der Browser
    // nach cancel() noch onend meldet (hier: speak ruft onEnd immer auf)
    const textFile = path.join(os.tmpdir(), 'kette_test.txt');
    fs.writeFileSync(textFile, 'Раз. Два. Три. Четыре. Пять. Шесть.', 'utf8');
    await page.evaluate(() => { vocabFileHandle = null; progressFileHandle = null; modeTextsBtn.click(); });
    await (await page.$('#fileInput')).uploadFile(textFile);
    await wait(800);
    const chain = await page.evaluate(async () => {
        window.__spoken = [];
        window.speak = (text, onEnd) => { window.__spoken.push(text); setTimeout(() => onEnd && onEnd(), 60); };
        mainSpeakBtn.click();
        await new Promise(r => setTimeout(r, 150));
        readSentenceBtn.click();
        const atSwitch = window.__spoken.length;
        await new Promise(r => setTimeout(r, 700));
        return { atSwitch, after: window.__spoken.length };
    });
    check('Wechsel auf "Satz für Satz" beendet die Kette', chain.after === chain.atSwitch);

    const dir = await page.evaluate(() => {
        const histBefore = JSON.parse(localStorage.getItem('vokabeltrainer_history') || '[]').length;
        queryDirection = 'ru2other';
        cards = [{ displayText: 'дом', speakableText: 'дом', answer: 'Haus' }];
        srMode = 'sm2';
        sessionStartTime = Date.now() - 5000;
        sessionStats = { reviewed: 1, again: 0, newCards: 1 };
        document.getElementById('maxNewCardsInput').value = '0';
        directionBtn.click();
        const histAfter = JSON.parse(localStorage.getItem('vokabeltrainer_history') || '[]').length;
        return {
            histBefore, histAfter,
            complete: document.getElementById('sessionComplete').classList.contains('visible')
        };
    });
    check('Richtungswechsel verbucht die laufende Runde', dir.histAfter === dir.histBefore + 1);
    check('nichts faellig: Rundenende statt leerer Karte', dir.complete);

    const esc = await page.evaluate(() => {
        cards = [{ displayText: 'читать', speakableText: 'читать', answer: 'lesen',
            conjugation: { verb: 'читать', aspect: 'НСВ', aspect_partner: '<img src=x onerror="window.__xss=1">прочитать' } }];
        currentIndex = 0;
        showConjugationModal();
        const body = document.querySelector('.conj-modal-overlay.visible') || document.body;
        return {
            img: !!body.querySelector('img[src="x"]'),
            text: body.textContent.includes('<img src=x'),
            num: escapeHtml(42),
            arr: escapeHtml(['a', '<b>'])
        };
    });
    check('Partner-Aspekt wird escaped (kein <img>)', !esc.img && esc.text);
    check('escapeHtml verkraftet Zahlen und Arrays', esc.num === '42' && esc.arr === 'a,&lt;b&gt;');
    check('Text "btn_delete" vorhanden', await page.evaluate(() => t('btn_delete') !== 'btn_delete'));

    check('keine Seitenfehler (Trainer)', errors.length === 0);
    if (errors.length) console.log(errors);
    await page.close();
}

async function editorTests(browser) {
    const page = await browser.newPage();
    await isolatePage(page);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.evaluateOnNewDocument(installFakes);
    const url = 'file:///' + path.resolve(__dirname, '..', 'vokabel_editor.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(800);

    console.log('\nEditor: Trainer-Aenderungen beim Speichern uebernehmen');
    const r = await page.evaluate(async () => {
        const start = [
            { id: 'k', front: 'кот', back: 'Katze', source: 'L1.txt' },
            { id: 'u', front: 'дом', back: 'Haus', source: 'L1.txt' },
            { id: 'd', front: 'стол', back: 'Tisch', source: 'L1.txt' },
            { id: 'e', front: 'читать', back: 'lesen', source: 'L2.txt' }
        ];
        const h = makeFakeHandle('vokabeln.json', JSON.stringify(start));
        currentFileHandle = h;
        loadData(await readFromHandle(h));
        // Editor korrigiert "читать"
        allData.find(x => x.id === 'e').back = 'lesen (vorlesen)';
        // Trainer schreibt inzwischen: neue Vokabel, "дом" mit Form, "стол" geloescht,
        // "читать" geaendert (Konflikt: Editor gewinnt)
        const now = JSON.parse(h.text);
        now.find(x => x.id === 'u').forms = ['дома'];
        now.find(x => x.id === 'e').back = 'lesen (Trainer)';
        h.externalWrite(now.filter(x => x.id !== 'd').concat([{ id: 'n', front: 'рыба', back: 'Fisch', source: 'L3.txt' }]));
        await saveFile();
        const file = JSON.parse(h.text);
        const by = Object.fromEntries(file.map(x => [x.id, x]));
        return {
            ids: file.map(x => x.id).sort().join(','),
            uForms: (by.u.forms || []).join(','),
            eBack: by.e.back,
            view: allData.length
        };
    });
    check('neue Vokabel des Trainers bleibt', r.ids.includes('n'));
    check('Loeschung des Trainers bleibt', !r.ids.split(',').includes('d'));
    check('Aenderung des Trainers an unveraendertem Eintrag bleibt', r.uForms === 'дома');
    check('bei Konflikt gewinnt der Editor', r.eBack === 'lesen (vorlesen)');
    check('Ansicht zeigt den zusammengefuehrten Stand', r.view === 4);
    const r2 = await page.evaluate(async () => {
        // Zweites Speichern ohne fremde Aenderung: nichts wird zusammengefuehrt
        const h = currentFileHandle;
        const before = h.text;
        await saveFile();
        return JSON.parse(h.text).length === JSON.parse(before).length;
    });
    check('zweites Speichern ohne fremde Aenderung stabil', r2);
    check('keine Seitenfehler (Editor)', errors.length === 0);
    if (errors.length) console.log(errors);
    await page.close();
}

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--allow-file-access-from-files'] });
    try {
        await trainerTests(browser);
        await editorTests(browser);
    } finally {
        await browser.close();
    }
    console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
