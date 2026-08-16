/**
 * Puppeteer-Tests fuer den Word-Import (js/docx.js)
 *
 * Prueft:
 * - echte .docx-Dateien aus dem Projekt (Text, Reihenfolge, Tabellen)
 * - selbst gebaute ZIPs (deflate + stored) mit kontrolliertem WordprocessingML
 * - Tabstopp-Definitionen in w:pPr landen nicht als Tabulator im Text
 * - Tabellen werden Tab-getrennt (Karteikarten-Format 'tab')
 * - Fehlerfaelle: .doc, kaputtes Archiv, verschluesselt
 *
 * Aufruf: node tests/test_docx.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const INDEX_URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  \u2713 ${message}`);
    } else {
        failed++;
        console.log(`  \u2717 ${message}`);
    }
}

// --- Minimaler ZIP-Writer, damit Testdokumente ohne Word entstehen ---------

function crc32(buf) {
    let c, crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        c = (crc ^ buf[i]) & 0xFF;
        for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
        crc = (crc >>> 8) ^ c;
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// entries: [{ name, content }], store = true -> unkomprimiert ablegen
function makeZip(entries, { store = false, encrypted = false } = {}) {
    const locals = [];
    const central = [];
    let offset = 0;

    for (const entry of entries) {
        const nameBuf = Buffer.from(entry.name, 'utf8');
        const raw = Buffer.from(entry.content, 'utf8');
        const data = store ? raw : zlib.deflateRawSync(raw);
        const flags = encrypted ? 0x1 : 0x0;
        const method = store ? 0 : 8;

        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);              // version needed
        local.writeUInt16LE(flags, 6);
        local.writeUInt16LE(method, 8);
        local.writeUInt32LE(crc32(raw), 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(raw.length, 22);
        local.writeUInt16LE(nameBuf.length, 26);
        local.writeUInt16LE(0, 28);              // extra length
        locals.push(local, nameBuf, data);

        const cen = Buffer.alloc(46);
        cen.writeUInt32LE(0x02014b50, 0);
        cen.writeUInt16LE(20, 4);
        cen.writeUInt16LE(20, 6);
        cen.writeUInt16LE(flags, 8);
        cen.writeUInt16LE(method, 10);
        cen.writeUInt32LE(crc32(raw), 16);
        cen.writeUInt32LE(data.length, 20);
        cen.writeUInt32LE(raw.length, 24);
        cen.writeUInt16LE(nameBuf.length, 28);
        cen.writeUInt32LE(offset, 42);
        central.push(cen, nameBuf);

        offset += 30 + nameBuf.length + data.length;
    }

    const localPart = Buffer.concat(locals);
    const centralPart = Buffer.concat(central);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralPart.length, 12);
    eocd.writeUInt32LE(localPart.length, 16);

    return Buffer.concat([localPart, centralPart, eocd]);
}

const W_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

function docxWith(bodyXml) {
    return makeZip([
        { name: '[Content_Types].xml', content: '<?xml version="1.0"?><Types/>' },
        { name: 'word/document.xml', content: `<?xml version="1.0" encoding="UTF-8"?><w:document ${W_NS}><w:body>${bodyXml}</w:body></w:document>` }
    ]);
}

function para(runs, pPr = '') {
    return `<w:p>${pPr}<w:r>${runs}</w:r></w:p>`;
}

// --- Testdokumente ---------------------------------------------------------

const DOC_BASIC = docxWith(
    // Tabstopps in w:pPr heissen ebenfalls w:tab -> duerfen nicht im Text landen
    para('<w:t>Привет</w:t>', '<w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs></w:pPr>') +
    para('<w:t xml:space="preserve">Wort</w:t><w:tab/><w:t>Übersetzung</w:t>') +
    para('<w:t>Zeile1</w:t><w:br/><w:t>Zeile2</w:t>') +
    '<w:p/>' +
    '<w:p><w:hyperlink r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:r><w:t>Link-Text</w:t></w:r></w:hyperlink></w:p>' +
    para('<w:instrText>HYPERLINK "http://x"</w:instrText><w:t>Sichtbar</w:t>') +
    '<w:p><w:del><w:r><w:delText>Geloescht</w:delText></w:r></w:del><w:r><w:t>Behalten</w:t></w:r></w:p>'
);

const DOC_TABLE = docxWith(
    '<w:tbl><w:tblPr><w:tblStyle w:val="Raster"/></w:tblPr>' +
    '<w:tr><w:tc><w:p><w:r><w:t>дом</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Haus</w:t></w:r></w:p></w:tc></w:tr>' +
    '<w:tr><w:tc><w:p><w:r><w:t>стол</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Tisch</w:t></w:r></w:p></w:tc></w:tr>' +
    '</w:tbl>'
);

const DOC_STORED = makeZip([
    { name: 'word/document.xml', content: `<?xml version="1.0"?><w:document ${W_NS}><w:body><w:p><w:r><w:t>Unkomprimiert</w:t></w:r></w:p></w:body></w:document>` }
], { store: true });

const DOC_ENCRYPTED = makeZip([
    { name: 'word/document.xml', content: `<?xml version="1.0"?><w:document ${W_NS}><w:body/></w:document>` }
], { encrypted: true });

const DOC_NO_DOCUMENT_XML = makeZip([{ name: 'irgendwas.txt', content: 'kein Word' }]);

const REAL_FILES = [
    {
        file: 'Vokabel_Texte_Input/Das_Leben_im_Mutterschutz.docx',
        contains: ['Жизнь мамы в декрете', 'Почему сидеть в декрете', '1) Ничего нельзя контролировать.'],
        order: ['Жизнь мамы в декрете', 'Женщина в декрете', 'Почему сидеть в декрете']
    },
    {
        file: 'lesematerial/Uebung_Adjektiv_Nomen_toschka_ru_a1_p68.docx',
        contains: ['Adjektiv-Endungen', 'Nr.\tAdjektiv-Stamm', '1\tдорог____\tтелефон  (m)'],
        order: ['Aufgabe: Schreibe die richtige Endung', 'Nr.\tAdjektiv-Stamm']
    },
    {
        file: 'docs/Gebrauchsanweisung.docx',
        contains: ['Russisch Vokabeltrainer', 'Willkommen', 'Modus\tBeschreibung\tEmpfohlen für'],
        order: ['Willkommen', 'Karteikarten']
    }
];

// --- Ausfuehrung -----------------------------------------------------------

async function readInPage(page, name, buffer) {
    return page.evaluate(async (fileName, b64) => {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const file = new File([bytes], fileName);
        try {
            return { ok: true, text: await readFileAsText(file) };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }, name, Buffer.from(buffer).toString('base64'));
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    // Der Startup-Hinweis zur Speicherdatei ist ein alert() und wuerde
    // page.evaluate() blockieren.
    page.on('dialog', async dialog => { await dialog.dismiss(); });
    await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => new Promise(r => setTimeout(r, 300)));

    console.log('\nModul geladen');
    const hasApi = await page.evaluate(() => typeof readFileAsText === 'function' && typeof readDocxText === 'function');
    assert(hasApi, 'readFileAsText und readDocxText sind global verfuegbar');
    assert(await page.evaluate(() => typeof DecompressionStream !== 'undefined'), 'Browser kennt DecompressionStream');
    assert(await page.$eval('#fileInput', el => el.accept).then(a => a.includes('.docx')), 'Datei-Dialog akzeptiert .docx');

    console.log('\nSelbst gebautes Dokument (deflate)');
    const basic = await readInPage(page, 'basic.docx', DOC_BASIC);
    assert(basic.ok, 'Dokument wird ohne Fehler gelesen');
    const text = basic.text || '';
    assert(text.startsWith('Привет'), 'Erster Absatz steht am Anfang');
    assert(!text.startsWith('\t') && !text.includes('Привет\t'), 'Tabstopp-Definition aus w:pPr erzeugt keinen Tabulator');
    assert(text.includes('Wort\tÜbersetzung'), 'w:tab im Text wird zu Tabulator');
    assert(text.includes('Zeile1\nZeile2'), 'w:br wird zu Zeilenumbruch');
    assert(text.includes('Link-Text'), 'Text in w:hyperlink wird uebernommen');
    assert(text.includes('Sichtbar') && !text.includes('HYPERLINK'), 'Feldbefehl (w:instrText) wird uebersprungen');
    assert(text.includes('Behalten') && !text.includes('Geloescht'), 'Geloeschter Text (w:delText) wird uebersprungen');
    assert(!/\n{3,}/.test(text), 'Keine dreifachen Leerzeilen');

    console.log('\nTabellen');
    const table = await readInPage(page, 'tabelle.docx', DOC_TABLE);
    assert(table.ok && table.text === 'дом\tHaus\nстол\tTisch', 'Tabellenzeilen werden Tab-getrennt: ' + JSON.stringify(table.text));
    const asTab = await page.evaluate(txt => detectFormat(txt), table.text || '');
    assert(asTab === 'tab', 'Word-Tabelle wird als Karteikarten-Format "tab" erkannt');
    const cards = await page.evaluate(txt => {
        isTabFormat = true; isClassicFormat = false;
        const lines = txt.split('\n');
        return lines.map(l => l.split('\t'));
    }, table.text || '');
    assert(cards.length === 2 && cards[0][0] === 'дом' && cards[0][1] === 'Haus', 'Zeilen ergeben Vorder-/Rueckseite');

    console.log('\nUnkomprimierter ZIP-Eintrag');
    const stored = await readInPage(page, 'stored.docx', DOC_STORED);
    assert(stored.ok && stored.text === 'Unkomprimiert', 'Eintrag mit Methode 0 (stored) wird gelesen');

    console.log('\nFehlerfaelle');
    const legacy = await readInPage(page, 'alt.doc', Buffer.from('irgendwas'));
    assert(!legacy.ok && /\.doc/.test(legacy.error), '.doc wird mit Hinweis auf .docx abgelehnt: ' + legacy.error);

    const notZip = await readInPage(page, 'kaputt.docx', Buffer.from('Das ist kein ZIP-Archiv'));
    assert(!notZip.ok && /Word-Datei/.test(notZip.error), 'Kaputtes Archiv meldet Fehler: ' + notZip.error);

    const noDoc = await readInPage(page, 'ohne.docx', DOC_NO_DOCUMENT_XML);
    assert(!noDoc.ok && /Word-Datei/.test(noDoc.error), 'ZIP ohne word/document.xml meldet Fehler');

    const enc = await readInPage(page, 'geschuetzt.docx', DOC_ENCRYPTED);
    assert(!enc.ok && /[Pp]asswort/.test(enc.error), 'Passwortgeschuetzte Datei meldet Fehler: ' + enc.error);

    console.log('\nFehlermeldungen folgen der Sprachwahl');
    const enMsg = await page.evaluate(() => { const old = currentLang; currentLang = 'en'; const m = t('docx_err_legacy'); currentLang = old; return m; });
    assert(/Save as/.test(enMsg), 'Englische Fehlermeldung vorhanden');
    const ruMsg = await page.evaluate(() => { const old = currentLang; currentLang = 'ru'; const m = t('docx_err_encrypted'); currentLang = old; return m; });
    assert(/паролем/.test(ruMsg), 'Russische Fehlermeldung vorhanden');

    console.log('\nEchte Word-Dateien aus dem Projekt');
    for (const spec of REAL_FILES) {
        const abs = path.join(ROOT, spec.file);
        if (!fs.existsSync(abs)) { console.log(`  - uebersprungen (fehlt): ${spec.file}`); continue; }
        const res = await readInPage(page, path.basename(abs), fs.readFileSync(abs));
        assert(res.ok, `${spec.file}: gelesen`);
        const t2 = res.text || '';
        for (const needle of spec.contains) {
            assert(t2.includes(needle), `${spec.file}: enthaelt ${JSON.stringify(needle.slice(0, 40))}`);
        }
        let lastPos = -1, inOrder = true;
        for (const needle of spec.order) {
            const pos = t2.indexOf(needle);
            if (pos <= lastPos) inOrder = false;
            lastPos = pos;
        }
        assert(inOrder, `${spec.file}: Reihenfolge der Abschnitte stimmt`);
        assert(!/<w:|<\/w:/.test(t2), `${spec.file}: keine XML-Reste im Text`);
    }

    console.log('\nLesemodus verarbeitet Word-Text');
    const textBlocks = await page.evaluate(async (b64) => {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const content = await readFileAsText(new File([bytes], 'Lektion.docx'));
        currentSourceFile = 'Lektion.docx';
        parseTexts(content.replace(/\r\n/g, '\n'));
        return texts.map(t => ({ title: t.title, len: t.body.length }));
    }, fs.readFileSync(path.join(ROOT, 'Vokabel_Texte_Input/Das_Leben_im_Mutterschutz.docx')).toString('base64'));
    assert(textBlocks.length > 0, `parseTexts erzeugt ${textBlocks.length} Textblock/Bloecke`);
    assert(textBlocks.every(b => b.len > 0), 'Alle Textbloecke haben Inhalt');

    console.log('\nEnd-to-End: Word-Datei ueber den Datei-Dialog laden');
    // Textmodus mit einem russischen Lesetext
    await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
    await page.click('#modeTexts');
    let input = await page.$('#fileInput');
    await input.uploadFile(path.join(ROOT, 'Vokabel_Texte_Input/Das_Leben_im_Mutterschutz.docx'));
    await page.waitForFunction(() => texts.length > 0, { timeout: 5000 }).catch(() => {});
    const textState = await page.evaluate(() => ({
        count: texts.length,
        source: currentSourceFile,
        visible: document.getElementById('textReaderContainer').classList.contains('visible'),
        body: texts[0] ? texts[0].body.slice(0, 30) : ''
    }));
    assert(textState.count > 0 && textState.visible, 'Textmodus zeigt den Inhalt der Word-Datei');
    assert(textState.source === 'Das_Leben_im_Mutterschutz.docx', 'Dateiname wird als Quelle uebernommen');
    assert(/[А-Яа-я]/.test(textState.body), 'Kyrillischer Text ist angekommen: ' + JSON.stringify(textState.body));

    // Karteikartenmodus mit einer Word-Tabelle
    await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
    await page.click('#modeFlashcards');
    input = await page.$('#fileInput');
    await input.uploadFile(path.join(ROOT, 'lesematerial/Uebung_Adjektiv_Nomen_toschka_ru_a1_p68.docx'));
    await page.waitForFunction(() => cards.length > 0, { timeout: 5000 }).catch(() => {});
    const cardState = await page.evaluate(() => ({ count: cards.length, tab: isTabFormat, first: cards[0] || null }));
    assert(cardState.count > 0, `Word-Tabelle ergibt ${cardState.count} Karteikarten`);
    assert(cardState.tab === true, 'Tabelle wird als Tab-Format erkannt');

    assert(pageErrors.length === 0, 'Keine JavaScript-Fehler auf der Seite' + (pageErrors.length ? ': ' + pageErrors.join(' | ') : ''));

    await browser.close();

    console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed === 0 ? 0 : 1);
})().catch(e => {
    console.error(e);
    process.exit(1);
});
