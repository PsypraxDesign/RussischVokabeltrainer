// Russisch-Lernen — Word-Dateien (.docx) einlesen
// Wird vor dem Hauptscript in index.html geladen.
//
// Warum ohne Bibliothek: Das Projekt hat keinen Build-Step und laeuft auch
// von file:// aus. Eine .docx-Datei ist ein ZIP-Archiv, in dem der Text als
// XML unter "word/document.xml" liegt. Das Entpacken uebernimmt die
// eingebaute DecompressionStream-API ('deflate-raw'), so dass weder CDN
// noch npm-Paket noetig ist.
//
// Nicht unterstuetzt: das alte Binaerformat .doc (Word 97-2003) und
// passwortgeschuetzte Dokumente. Beides meldet einen klaren Fehler.

// --- Minimaler ZIP-Leser --------------------------------------------------

const ZIP_EOCD_SIG = 0x06054b50;   // End of Central Directory
const ZIP_CEN_SIG  = 0x02014b50;   // Central Directory File Header
const ZIP_LOC_SIG  = 0x04034b50;   // Local File Header

// Sucht das EOCD-Record vom Dateiende her. Es ist 22 Byte gross, kann aber
// einen bis zu 65535 Byte langen Kommentar hinter sich haben.
function zipFindEocd(view) {
    const minPos = Math.max(0, view.byteLength - (22 + 0xFFFF));
    for (let i = view.byteLength - 22; i >= minPos; i--) {
        if (view.getUint32(i, true) === ZIP_EOCD_SIG) return i;
    }
    return -1;
}

// Liefert die Rohdaten (noch komprimiert) eines Eintrags oder null.
function zipFindEntry(buffer, wantedName) {
    const view = new DataView(buffer);
    const eocd = zipFindEocd(view);
    if (eocd === -1) throw new Error('zip_no_eocd');

    const entryCount = view.getUint16(eocd + 10, true);
    const cenOffset = view.getUint32(eocd + 16, true);
    if (cenOffset === 0xFFFFFFFF) throw new Error('zip64');

    const decoder = new TextDecoder('utf-8');
    let pos = cenOffset;

    for (let n = 0; n < entryCount; n++) {
        if (pos + 46 > buffer.byteLength) break;
        if (view.getUint32(pos, true) !== ZIP_CEN_SIG) break;

        const flags = view.getUint16(pos + 8, true);
        const method = view.getUint16(pos + 10, true);
        const compSize = view.getUint32(pos + 20, true);
        const nameLen = view.getUint16(pos + 28, true);
        const extraLen = view.getUint16(pos + 30, true);
        const commentLen = view.getUint16(pos + 32, true);
        const localOffset = view.getUint32(pos + 42, true);
        const name = decoder.decode(new Uint8Array(buffer, pos + 46, nameLen));

        if (name === wantedName) {
            if (flags & 0x1) throw new Error('zip_encrypted');
            if (compSize === 0xFFFFFFFF || localOffset === 0xFFFFFFFF) throw new Error('zip64');
            if (view.getUint32(localOffset, true) !== ZIP_LOC_SIG) throw new Error('zip_bad_local');
            // Der lokale Header wiederholt Name und Extra-Feld — beide koennen
            // andere Laengen haben als im Central Directory, deshalb hier neu lesen.
            const locNameLen = view.getUint16(localOffset + 26, true);
            const locExtraLen = view.getUint16(localOffset + 28, true);
            const dataStart = localOffset + 30 + locNameLen + locExtraLen;
            return {
                method,
                data: new Uint8Array(buffer, dataStart, compSize)
            };
        }

        pos += 46 + nameLen + extraLen + commentLen;
    }
    return null;
}

async function zipInflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('no_decompression_stream');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
}

// --- WordprocessingML in Text umsetzen ------------------------------------

// Formatier-Container: was hier drinsteht, ist Layout-Information und kein
// Text. Besonders wichtig fuer w:pPr — die dort definierten Tabstopps heissen
// ebenfalls w:tab und wuerden sonst als echte Tabulatoren im Text landen.
const DOCX_SKIP = new Set([
    'pPr', 'rPr', 'sectPr', 'tblPr', 'tblGrid', 'trPr', 'tcPr', 'numPr',
    'tblPrEx', 'proofErr', 'bookmarkStart', 'bookmarkEnd'
]);

// Text eines Absatzes (w:p) inklusive Hyperlinks, Tabulatoren und Umbruechen.
function docxParagraphText(node) {
    let out = '';
    (function walk(el) {
        for (const child of el.children) {
            const name = child.localName;
            if (DOCX_SKIP.has(name)) continue;
            if (name === 't') out += child.textContent;
            else if (name === 'tab') out += '\t';
            else if (name === 'br' || name === 'cr') out += '\n';
            else if (name === 'noBreakHyphen') out += '-';
            else if (name === 'instrText' || name === 'delText') continue;  // Feldbefehle, geloeschter Text
            else walk(child);
        }
    })(node);
    return out;
}

// Tabellenzeile -> Zellen mit Tabulator getrennt. Damit werden zweispaltige
// Wort-Uebersetzung-Tabellen aus Word direkt vom Tab-Format der Karteikarten
// erkannt (detectFormat -> 'tab').
function docxTableText(tbl) {
    const rows = [];
    for (const tr of tbl.children) {
        if (tr.localName !== 'tr') continue;
        const cells = [];
        for (const tc of tr.children) {
            if (tc.localName !== 'tc') continue;
            cells.push(docxBlocksText(tc).replace(/\s*\n\s*/g, ' ').trim());
        }
        if (cells.some(c => c)) rows.push(cells.join('\t'));
    }
    return rows.join('\n');
}

// Durchlaeuft Absaetze, Tabellen und Inhaltssteuerelemente in Dokumentreihenfolge.
function docxBlocksText(container) {
    const parts = [];
    for (const el of container.children) {
        const name = el.localName;
        if (name === 'p') parts.push(docxParagraphText(el));
        else if (name === 'tbl') parts.push(docxTableText(el));
        else if (name === 'sdt' || name === 'sdtContent' || name === 'smartTag') parts.push(docxBlocksText(el));
    }
    return parts.join('\n');
}

function docxXmlToText(xmlString) {
    const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('docx_bad_xml');

    // <w:body> ohne Namespace-Annahmen suchen.
    let body = null;
    for (const el of doc.documentElement.children) {
        if (el.localName === 'body') { body = el; break; }
    }
    if (!body) throw new Error('docx_no_body');

    let text = docxBlocksText(body);
    // Weiche Trennstriche und geschuetzte Leerzeichen stoeren TTS und Parser.
    text = text.replace(/­/g, '').replace(/ /g, ' ');
    // Mehr als eine Leerzeile bringt nichts — parseTexts trennt Bloecke
    // ohnehin an "\n\n+".
    text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

// --- Oeffentliche Schnittstelle -------------------------------------------

function isDocxFile(file) {
    return /\.docx$/i.test(file.name || '');
}

function isLegacyDocFile(file) {
    return /\.doc$/i.test(file.name || '');
}

async function readDocxText(file) {
    const buffer = await file.arrayBuffer();
    let entry;
    try {
        entry = zipFindEntry(buffer, 'word/document.xml');
    } catch (e) {
        throw new Error(docxErrorMessage(e));
    }
    if (!entry) throw new Error(docxErrorMessage(new Error('docx_no_document')));

    let raw;
    try {
        raw = entry.method === 0 ? entry.data : await zipInflateRaw(entry.data);
    } catch (e) {
        throw new Error(docxErrorMessage(e));
    }
    if (entry.method !== 0 && entry.method !== 8) throw new Error(docxErrorMessage(new Error('zip_method')));

    const xml = new TextDecoder('utf-8').decode(raw);
    try {
        return docxXmlToText(xml);
    } catch (e) {
        throw new Error(docxErrorMessage(e));
    }
}

// Uebersetzt die internen Fehlerschluessel in eine Meldung fuer den Nutzer.
// t() kommt aus index.html; faellt auf Deutsch zurueck, falls kein Key existiert.
function docxErrorMessage(err) {
    const key = err && err.message;
    const map = {
        zip_no_eocd: 'docx_err_not_zip',
        zip_bad_local: 'docx_err_not_zip',
        docx_bad_xml: 'docx_err_not_zip',
        docx_no_document: 'docx_err_not_zip',
        docx_no_body: 'docx_err_not_zip',
        zip_encrypted: 'docx_err_encrypted',
        zip64: 'docx_err_too_big',
        zip_method: 'docx_err_too_big',
        no_decompression_stream: 'docx_err_browser'
    };
    const i18nKey = map[key];
    if (i18nKey && typeof t === 'function') {
        const msg = t(i18nKey);
        if (msg && msg !== i18nKey) return msg;
    }
    return 'Die Word-Datei konnte nicht gelesen werden.' + (key ? ' (' + key + ')' : '');
}

// Liest eine beliebige unterstuetzte Datei als Text — .docx wird entpackt,
// alles andere als UTF-8-Text gelesen.
async function readFileAsText(file) {
    if (isDocxFile(file)) return readDocxText(file);
    if (isLegacyDocFile(file)) {
        const msg = (typeof t === 'function' && t('docx_err_legacy') !== 'docx_err_legacy')
            ? t('docx_err_legacy')
            : 'Das alte Word-Format .doc wird nicht unterstützt. Bitte in Word als .docx speichern.';
        throw new Error(msg);
    }
    return file.text();
}
