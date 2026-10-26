// Russisch-Lernen — Abgleich mit den Dateien vokabeln.json und lernstand.json
// Wird nach js/db.js geladen (nutzt openVocabDB, getAllCardsFromDB,
// vocabFileHandle, isJunkVocabRecord).
//
// Seit 25.10.2026 ist die DATEI vokabeln.json massgeblich, die IndexedDB
// nur noch ihr Abbild. Vorher schrieb der Trainer bei jedem Fensterwechsel
// seine komplette Datenbank in die Datei — Loeschungen und Korrekturen aus
// dem Vokabel-Editor gingen so verloren (Review 25.10.2026, Befund K1/K2).
//
// Regeln:
//   - Verbinden/Neu einlesen: Datei lesen -> IndexedDB komplett ersetzen.
//   - Aenderungen des Trainers: Datei frisch lesen -> nur die geaenderten
//     Eintraege einmischen bzw. entfernen -> schreiben -> IndexedDB ersetzen.
//     Nie ein Komplett-Ueberschreiben aus der Datenbank.
//   - Ohne Berechtigung (nach Browser-Neustart) landen Aenderungen in einer
//     Warteschlange (IndexedDB, settings/pendingVocabChanges) und werden beim
//     naechsten Verbinden eingemischt.
//
// lernstand.json haelt den Lernfortschritt (localStorage vokabeltrainer_sr
// und vokabeltrainer_history), der vorher nur im Browser lag.

let vocabSyncState = 'none';      // none | disconnected | synced | error
let vocabSyncError = '';
let vocabFileStamp = 0;           // lastModified beim letzten Lesen/Schreiben
let progressFileHandle = null;
let progressSyncState = 'none';   // none | disconnected | synced | error
let progressSaveTimer = null;

// Rueckmeldungen an index.html (dort gesetzt)
const fileSyncHooks = {
    onStateChange: null,      // () => void — Leiste/Einstellungen neu zeichnen
    onVocabReloaded: null,    // () => void — Datenbank wurde aus der Datei ersetzt
    onProgressMerged: null    // () => void — Lernstand im Speicher neu laden
};

function notifyFileSync(hook) {
    const fn = fileSyncHooks[hook];
    if (typeof fn === 'function') {
        try { fn(); } catch (e) { console.warn('fileSync hook', hook, e); }
    }
}

function setVocabSyncState(state, error = '') {
    vocabSyncState = state;
    vocabSyncError = error;
    notifyFileSync('onStateChange');
}

function setProgressSyncState(state) {
    progressSyncState = state;
    notifyFileSync('onStateChange');
}

// --- Berechtigung ---
// request=true nur aus einem Klick heraus aufrufen: requestPermission
// braucht eine Nutzeraktion, sonst lehnt der Browser ab.
async function hasFilePermission(handle, request) {
    if (!handle) return false;
    try {
        if (await handle.queryPermission({ mode: 'readwrite' }) === 'granted') return true;
        if (!request) return false;
        return await handle.requestPermission({ mode: 'readwrite' }) === 'granted';
    } catch (e) {
        return false;
    }
}

// --- Einstellungen in der IndexedDB (settings-Store) ---
async function readSetting(key) {
    try {
        const db = await openVocabDB();
        return await new Promise(resolve => {
            const req = db.transaction('settings', 'readonly').objectStore('settings').get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) { return null; }
}

async function writeSetting(record) {
    const db = await openVocabDB();
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put(record);
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
}

// --- Warteschlange ---
async function loadPendingVocabChanges() {
    const rec = await readSetting('pendingVocabChanges');
    return {
        key: 'pendingVocabChanges',
        upserts: (rec && rec.upserts) || {},
        deleteIds: (rec && rec.deleteIds) || []
    };
}

async function countPendingVocabChanges() {
    const p = await loadPendingVocabChanges();
    return Object.keys(p.upserts).length + p.deleteIds.length;
}

// --- Datei lesen/schreiben ---
async function readJsonFile(handle) {
    const file = await handle.getFile();
    const text = await file.text();
    return { text, stamp: file.lastModified };
}

function parseVocabFileText(text) {
    if (!text.trim()) return [];
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('VOCAB_FILE_INVALID'); }
    if (!Array.isArray(data)) throw new Error('VOCAB_FILE_INVALID');
    return data.filter(r => r && typeof r === 'object' && r.id);
}

async function writeJsonFile(handle, data) {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
}

async function replaceVocabDB(records) {
    const db = await openVocabDB();
    const tx = db.transaction('vocabulary', 'readwrite');
    const store = tx.objectStore('vocabulary');
    store.clear();
    for (const r of records) {
        if (!isJunkVocabRecord(r)) store.put(r);
    }
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
}

// Eintrag aus der Datei mit der Aenderung des Trainers zusammenfuehren:
// Was der Trainer leer laesst, bleibt wie in der Datei (z. B. Konjugation
// aus dem Editor); "added" bleibt das urspruengliche Datum.
function mergeVocabRecord(fileRec, trainerRec) {
    if (!fileRec) return trainerRec;
    const merged = { ...fileRec };
    for (const [k, v] of Object.entries(trainerRec)) {
        if (k === 'added') continue;
        if (v === null || v === undefined || v === '') continue;
        if (Array.isArray(v) && v.length === 0) continue;
        merged[k] = v;
    }
    return merged;
}

// Alle Datei-Zugriffe nacheinander, nie zwei gleichzeitig
let vocabFileQueue = Promise.resolve();
function queueVocabFileJob(job) {
    const run = vocabFileQueue.then(job, job);
    vocabFileQueue = run.catch(() => {});
    return run;
}

// Datei lesen, Warteschlange einmischen, ggf. schreiben, IndexedDB ersetzen.
async function syncVocabFileNow() {
    const pending = await loadPendingVocabChanges();
    const { text, stamp } = await readJsonFile(vocabFileHandle);
    let records = parseVocabFileText(text);
    let mustWrite = false;

    // Neue, leere Datei: einmalig den bisherigen Bestand hineinschreiben
    if (!text.trim()) {
        records = (await getAllCardsFromDB()).filter(r => !isJunkVocabRecord(r));
        mustWrite = records.length > 0;
    }

    const byId = new Map(records.map(r => [r.id, r]));
    for (const id of pending.deleteIds) {
        if (byId.delete(id)) mustWrite = true;
    }
    for (const rec of Object.values(pending.upserts)) {
        byId.set(rec.id, mergeVocabRecord(byId.get(rec.id), rec));
        mustWrite = true;
    }
    const merged = [...byId.values()];

    let newStamp = stamp;
    if (mustWrite) {
        await writeJsonFile(vocabFileHandle, merged);
        newStamp = (await vocabFileHandle.getFile()).lastModified;
    }
    await replaceVocabDB(merged);
    await writeSetting({ key: 'pendingVocabChanges', upserts: {}, deleteIds: [] });
    vocabFileStamp = newStamp;
    return merged.length;
}

// Verbinden (beim Start ohne Nachfrage, per Klick mit Nachfrage).
async function connectVocabFile(request) {
    if (!vocabFileHandle) vocabFileHandle = await loadVocabFileHandle();
    if (!vocabFileHandle) { setVocabSyncState('none'); return false; }
    if (!(await hasFilePermission(vocabFileHandle, request))) {
        setVocabSyncState('disconnected');
        return false;
    }
    try {
        await queueVocabFileJob(syncVocabFileNow);
        setVocabSyncState('synced');
        notifyFileSync('onVocabReloaded');
        return true;
    } catch (e) {
        console.warn('Vokabelliste konnte nicht abgeglichen werden:', e);
        setVocabSyncState('error', e.message || String(e));
        return false;
    }
}

// Aenderungen des Trainers festhalten. Die IndexedDB ist zu diesem Zeitpunkt
// schon geschrieben; hier geht es um die Datei.
async function persistVocabChanges({ upserts = [], deleteIds = [] }) {
    if (!vocabFileHandle) vocabFileHandle = await loadVocabFileHandle();
    if (!vocabFileHandle) return 'db-only';   // nie eine Datei gewaehlt

    const pending = await loadPendingVocabChanges();
    for (const rec of upserts) {
        pending.upserts[rec.id] = rec;
        pending.deleteIds = pending.deleteIds.filter(id => id !== rec.id);
    }
    for (const id of deleteIds) {
        delete pending.upserts[id];
        if (!pending.deleteIds.includes(id)) pending.deleteIds.push(id);
    }
    await writeSetting(pending);

    if (!(await hasFilePermission(vocabFileHandle, true))) {
        setVocabSyncState('disconnected');
        return 'pending';
    }
    try {
        await queueVocabFileJob(syncVocabFileNow);
        setVocabSyncState('synced');
        return 'saved';
    } catch (e) {
        console.warn('Vokabelliste konnte nicht geschrieben werden:', e);
        setVocabSyncState('error', e.message || String(e));
        return 'pending';
    }
}

// Datei vom Editor geaendert? Dann neu einlesen (beim Zurueckkehren ins Fenster).
async function reloadVocabFileIfChanged() {
    if (vocabSyncState !== 'synced' || !vocabFileHandle) return false;
    try {
        const file = await vocabFileHandle.getFile();
        if (file.lastModified === vocabFileStamp) return false;
    } catch (e) {
        setVocabSyncState('disconnected');
        return false;
    }
    return connectVocabFile(false);
}

// --- Lernstand (lernstand.json) ---

async function loadProgressFileHandle() {
    const rec = await readSetting('progressFileHandle');
    return rec ? rec.handle : null;
}

async function pickProgressFile() {
    if (!window.showSaveFilePicker) return null;
    try {
        const opts = {
            suggestedName: 'lernstand.json',
            types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        };
        // Im Ordner der Vokabelliste beginnen
        if (vocabFileHandle) opts.startIn = vocabFileHandle;
        const handle = await window.showSaveFilePicker(opts);
        progressFileHandle = handle;
        await writeSetting({ key: 'progressFileHandle', handle });
        return handle;
    } catch (e) { return null; }
}

function readLocalJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
}

function buildProgressPayload() {
    return {
        app: 'vokabeltrainer',
        version: 1,
        saved: new Date().toISOString(),
        sr: readLocalJson('vokabeltrainer_sr', {}),
        history: readLocalJson('vokabeltrainer_history', [])
    };
}

// Pro Karte gewinnt der zuletzt bewertete Stand.
function mergeSRData(local, fromFile) {
    const merged = { ...local };
    for (const [id, rec] of Object.entries(fromFile || {})) {
        const mine = merged[id];
        if (!mine || (rec && (rec.lastReview || 0) > (mine.lastReview || 0))) merged[id] = rec;
    }
    return merged;
}

// Sitzungsverlauf: Vereinigung, doppelte Eintraege nur einmal
function mergeHistory(local, fromFile) {
    const seen = new Set();
    const out = [];
    for (const h of [...(fromFile || []), ...(local || [])]) {
        const key = JSON.stringify(h);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(h);
    }
    return out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

async function connectProgressFile(request) {
    if (!progressFileHandle) progressFileHandle = await loadProgressFileHandle();
    if (!progressFileHandle) { setProgressSyncState('none'); return false; }
    if (!(await hasFilePermission(progressFileHandle, request))) {
        setProgressSyncState('disconnected');
        return false;
    }
    try {
        const { text } = await readJsonFile(progressFileHandle);
        if (text.trim()) {
            let data;
            try { data = JSON.parse(text); } catch (e) { throw new Error('PROGRESS_FILE_INVALID'); }
            const sr = mergeSRData(readLocalJson('vokabeltrainer_sr', {}), data.sr);
            const history = mergeHistory(readLocalJson('vokabeltrainer_history', []), data.history);
            localStorage.setItem('vokabeltrainer_sr', JSON.stringify(sr));
            localStorage.setItem('vokabeltrainer_history', JSON.stringify(history));
            notifyFileSync('onProgressMerged');
        }
        await writeJsonFile(progressFileHandle, buildProgressPayload());
        setProgressSyncState('synced');
        return true;
    } catch (e) {
        console.warn('Lernstand konnte nicht abgeglichen werden:', e);
        setProgressSyncState('error');
        return false;
    }
}

// Nach jeder Bewertung: kurz warten, dann schreiben (mehrere Bewertungen
// hintereinander ergeben einen Schreibvorgang).
function scheduleProgressSave() {
    if (progressSyncState !== 'synced') return;
    clearTimeout(progressSaveTimer);
    progressSaveTimer = setTimeout(flushProgressSave, 2000);
}

async function flushProgressSave() {
    clearTimeout(progressSaveTimer);
    progressSaveTimer = null;
    if (progressSyncState !== 'synced' || !progressFileHandle) return;
    try {
        await writeJsonFile(progressFileHandle, buildProgressPayload());
    } catch (e) {
        console.warn('Lernstand konnte nicht gesichert werden:', e);
        setProgressSyncState('disconnected');
    }
}
