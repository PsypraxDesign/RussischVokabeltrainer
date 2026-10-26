// Test: Woerterbuch im Lesetext aus der Gesamtliste aller Lektionen,
// Datenmuell-Erkennung (js/vocab-junk.js), JSON-Sperre beim Import und
// muellfreier JSON-Export.
// Aufruf: node tests/test_vocab_global.js
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

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--allow-file-access-from-files'] });
    const page = await browser.newPage();
    await isolatePage(page);   // kein Netz, keine echten Schluessel
    const errors = [];
    const dialogs = [];
    page.on('pageerror', e => errors.push(e.message));
    // Vor goto: sonst blockiert der Startup-Alert jedes evaluate()
    page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(1200);

    // Datenbank fuellen: zwei Lektionen, Muell, Eintrag ohne Uebersetzung
    await page.evaluate(async () => {
        const db = await openVocabDB();
        const tx = db.transaction('vocabulary', 'readwrite');
        const st = tx.objectStore('vocabulary');
        st.clear();
        const rec = (id, front, back, source) => st.put({ id, front, back, grammar: '', forms: [], source });
        rec('t1', 'кварти́ра', 'Wohnung', 'lektion_a.txt');
        rec('t2', 'на метро', 'mit der U-Bahn', 'lektion_a.txt');
        rec('t3', 'дом', 'Haus (andere Lektion)', 'lektion_a.txt');
        rec('t4', 'дом', 'Haus (eigene Lektion)', 'neuer_text.txt');
        rec('t5', 'кот', 'Katze', 'vokabeln.json');          // Muell: JSON als Quelle
        rec('t6', 'я: читаю', 'lese', 'lektion_a.txt');       // Muell: Feldname-Zeile
        rec('t7', 'стол', '', 'lektion_a.txt');               // ohne Uebersetzung
        await new Promise(r => { tx.oncomplete = r; });
    });

    console.log('\nMuell-Erkennung');
    const junk = await page.evaluate(() => ({
        json: isJunkVocabRecord({ front: 'кот', source: 'vokabeln.json' }),
        field: isJunkVocabRecord({ front: 'Род.: болезни', source: 'x.txt' }),
        added: isJunkVocabRecord({ front: 'added: 2026-02-28T20:45:52.112Z', source: 'x.txt' }),
        real: isJunkVocabRecord({ front: 'квартира', source: 'lektion.txt' }),
        phrase: isJunkVocabRecord({ front: 'Мой дом — моя крепость.', source: '3.1_Mein_Haus.txt' })
    }));
    check('Quelle vokabeln.json ist Muell', junk.json);
    check('"Род.: …" ist Muell', junk.field);
    check('"added: …" ist Muell', junk.added);
    check('echte Vokabel ist kein Muell', !junk.real);
    check('echte Phrase ist kein Muell', !junk.phrase);

    // Text mit anderem Dateinamen als lektion_a.txt laden
    const textFile = path.join(os.tmpdir(), 'neuer_text.txt');
    fs.writeFileSync(textFile, 'Моя квартира рядом. Я еду на метро. Наш дом большой. Кот спит. Стол новый.', 'utf8');
    await page.evaluate(() => modeTextsBtn.click());
    await (await page.$('#fileInput')).uploadFile(textFile);
    await wait(1000);

    const mark = (word) => page.evaluate((w) => {
        const el = [...document.querySelectorAll('.text-paragraph .word')]
            .find(e => e.textContent.replace(/[.,!?]/g, '').toLowerCase() === w);
        return el ? { has: el.classList.contains('has-vocab'), tr: el.dataset.vocabTranslation || '' } : null;
    }, word);

    console.log('\nGesamtliste im Lesetext');
    check('Wort aus anderer Lektion markiert', (await mark('квартира')).has);
    check('Betonungszeichen stoert nicht (кварти́ра = квартира)', (await mark('квартира')).tr === 'Wohnung');
    check('Wortgruppe aus anderer Lektion markiert', (await mark('на')).has && (await mark('метро')).tr === 'mit der U-Bahn');
    check('eigene Lektion hat Vorrang', (await mark('дом')).tr === 'Haus (eigene Lektion)');
    check('Muell (Quelle vokabeln.json) nicht markiert', !(await mark('кот')).has);
    check('Eintrag ohne Uebersetzung nicht markiert', !(await mark('стол')).has);
    check('Karteikarten = nur Vokabeln dieses Texts', await page.evaluate(() =>
        cards.length === 1 && cards[0].answer === 'Haus (eigene Lektion)'));

    console.log('\nVokabeln generieren: nur frische Vokabeln zaehlen');
    await page.evaluate(() => {
        buildVocabMap([{ russian: 'кот', translation: 'Katze (neu)', grammar: '' }]);
        markVocabWords();
    });
    check('alte Marken werden entfernt', !(await mark('квартира')).has);
    check('fehlende Woerter enthalten Woerter der Gesamtliste', await page.evaluate(() => getMissingWords().includes('квартира')));
    check('frische Vokabel markiert', (await mark('кот')).tr === 'Katze (neu)');
    await page.evaluate(() => hideVocabPreview());
    await wait(400);
    check('nach der Vorschau wieder Gesamtliste', (await mark('квартира')).tr === 'Wohnung' && !(await mark('кот')).has);

    console.log('\nJSON-Datei als Text');
    dialogs.length = 0;
    const textsBefore = await page.evaluate(() => texts.length);
    await page.evaluate(() => processFile(new File(['[{"id":"x"}]'], 'vokabeln.json', { type: 'application/json' })));
    await wait(300);
    check('Import wird abgelehnt', dialogs.length === 1 && dialogs[0].includes('vokabeln.json'));
    check('nichts geladen', await page.evaluate(() => texts.length) === textsBefore);

    console.log('\nDatei-Abgleich: Muell aus der Datei kommt nicht in die Datenbank');
    // Seit 25.10.2026 ist vokabeln.json massgeblich (js/file-sync.js); der
    // fruehere Komplett-Export aus der Datenbank (autoExportJSON) entfiel.
    const dbAfter = await page.evaluate(async () => {
        const fileRecords = [
            { id: 'f1', front: 'кварти́ра', back: 'Wohnung', source: 'lektion_a.txt' },
            { id: 'f2', front: 'кот', back: 'Katze', source: 'vokabeln.json' },
            { id: 'f3', front: 'я: читаю', back: 'lese', source: 'lektion_a.txt' }
        ];
        let text = JSON.stringify(fileRecords);
        vocabFileHandle = {
            name: 'vokabeln.json',
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
            getFile: async () => new File([text], 'vokabeln.json', { lastModified: 1 }),
            createWritable: async () => ({ write: async (d) => { text = d; }, close: async () => {} })
        };
        await connectVocabFile(false);
        vocabFileHandle = null;
        return (await getAllCardsFromDB()).map(r => r.id);
    });
    check('echte Vokabel aus der Datei in der Datenbank', dbAfter.includes('f1'));
    check('Muell aus der Datei nicht in der Datenbank', !dbAfter.includes('f2') && !dbAfter.includes('f3'));

    check('keine Seitenfehler', errors.length === 0);
    if (errors.length) console.log(errors);

    // Aufraeumen: Testdaten aus der IndexedDB des Testprofils
    await page.evaluate(async () => {
        const db = await openVocabDB();
        const tx = db.transaction('vocabulary', 'readwrite');
        tx.objectStore('vocabulary').clear();
        await new Promise(r => { tx.oncomplete = r; });
    });
    await browser.close();
    console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
