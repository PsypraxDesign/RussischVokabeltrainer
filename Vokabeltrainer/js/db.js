// Russisch-Lernen — IndexedDB & File System Access API
// Wird vor dem Hauptscript in index.html geladen.
// Stellt globale Funktionen und die Variable `vocabFileHandle` zur Verfuegung.
//
// Externe Abhaengigkeiten (werden im Hauptscript erwartet):
//   - getCardId(card)  : Hash-Funktion fuer Karten-IDs
//   - t(key, params)   : i18n-Funktion (fuer exportVocabularyTSV)

let vocabFileHandle = null;

// --- Last-Directory Speicherung ---

async function saveLastDirectory(dirHandle) {
    try {
        const db = await openVocabDB();
        const tx = db.transaction('settings', 'readwrite');
        tx.objectStore('settings').put({ key: 'lastDirectory', handle: dirHandle });
    } catch (e) { /* ignore */ }
}

async function loadLastDirectory() {
    try {
        const db = await openVocabDB();
        const tx = db.transaction('settings', 'readonly');
        const get = tx.objectStore('settings').get('lastDirectory');
        return new Promise((resolve) => {
            get.onsuccess = () => resolve(get.result?.handle || null);
            get.onerror = () => resolve(null);
        });
    } catch (e) { return null; }
}

// --- IndexedDB ---

function openVocabDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('vokabeltrainer', 2);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('vocabulary')) {
                const store = db.createObjectStore('vocabulary', { keyPath: 'id' });
                store.createIndex('source', 'source', { unique: false });
                store.createIndex('topic', 'topic', { unique: false });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function saveCardsToDB(cardsList, source) {
    const db = await openVocabDB();
    const tx = db.transaction('vocabulary', 'readwrite');
    const store = tx.objectStore('vocabulary');
    for (const card of cardsList) {
        // Richtungsunabhaengige ID, sonst entstehen Dubletten beim Speichern
        // in unterschiedlichen Abfragerichtungen.
        const id = (typeof getCardContentHash === 'function') ? getCardContentHash(card) : getCardId(card);
        const existing = await new Promise(r => { const req = store.get(id); req.onsuccess = () => r(req.result); req.onerror = () => r(null); });
        let front = card.displayText;
        let grammar = '';
        // M-18: geschachtelte Klammern korrekt behandeln
        const gm = extractGrammarPrefix(front);
        if (gm) {
            grammar = gm.grammar;
            front = gm.rest;
        }
        store.put({
            id,
            front: front || card.displayText,
            back: card.answer,
            grammar,
            forms: card.forms || existing?.forms || [],
            images: (card.images && card.images.length) ? card.images : (existing?.images || []),
            tags: existing?.tags || [],
            topic: existing?.topic || '',
            category: existing?.category || '',
            source: source || existing?.source || '',
            added: existing?.added || new Date().toISOString(),
            conjugation: card.conjugation || existing?.conjugation || null,
            declension: card.declension || existing?.declension || null,
            stress: card.stress || existing?.stress || null,
            wordType: card.wordType || existing?.wordType || null
        });
    }
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });
}

async function getVocabBySource(source) {
    if (!source) return [];
    const db = await openVocabDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('vocabulary', 'readonly');
        const idx = tx.objectStore('vocabulary').index('source');
        const req = idx.getAll(source);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

function dbRecordsToVocabItems(records) {
    return records.map(r => ({
        russian: r.front,
        forms: r.forms || [],
        translation: r.back,
        grammar: r.grammar || '',
        images: r.images || [],
        conjugation: r.conjugation || null,
        declension: r.declension || null,
        stress: r.stress || null
    }));
}

async function getAllCardsFromDB() {
    const db = await openVocabDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('vocabulary', 'readonly');
        const req = tx.objectStore('vocabulary').getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function getSourcesFromDB() {
    const allCards = await getAllCardsFromDB();
    const sourceMap = {};
    for (const card of allCards) {
        const src = card.source || '';
        if (!sourceMap[src]) sourceMap[src] = 0;
        sourceMap[src]++;
    }
    // Sort by name, put empty-source last
    return Object.entries(sourceMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
            if (!a.name) return 1;
            if (!b.name) return -1;
            return a.name.localeCompare(b.name);
        });
}

async function deleteSourceFromDB(source) {
    const db = await openVocabDB();
    const tx = db.transaction('vocabulary', 'readwrite');
    const store = tx.objectStore('vocabulary');
    const idx = store.index('source');
    const req = idx.getAll(source);
    req.onsuccess = () => {
        for (const record of req.result) {
            store.delete(record.id);
        }
    };
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });
}

async function exportVocabularyTSV() {
    const allCards = await getAllCardsFromDB();
    if (allCards.length === 0) {
        alert(t('export_empty'));
        return;
    }
    const header = 'Russisch;Deutsch;Thema;Kategorie;Grammatik;Quelle';
    const rows = allCards.map(c => {
        const fields = [c.front, c.back, c.topic, c.category, c.grammar, c.source];
        return fields.map(f => {
            const clean = (f || '').replace(/\n/g, ' ');
            if (clean.includes(';') || clean.includes('"')) {
                return '"' + clean.replace(/"/g, '""') + '"';
            }
            return clean;
        }).join(';');
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `vokabeln_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// --- File System Access API ---

async function saveVocabFileHandle(handle) {
    try {
        const db = await openVocabDB();
        const tx = db.transaction('settings', 'readwrite');
        tx.objectStore('settings').put({ key: 'vocabFileHandle', handle });
    } catch (e) { /* ignore */ }
}

async function loadVocabFileHandle() {
    try {
        const db = await openVocabDB();
        const tx = db.transaction('settings', 'readonly');
        const get = tx.objectStore('settings').get('vocabFileHandle');
        return new Promise(r => {
            get.onsuccess = () => r(get.result?.handle || null);
            get.onerror = () => r(null);
        });
    } catch (e) { return null; }
}

async function pickVocabExportFile() {
    if (!window.showSaveFilePicker) return null;
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: 'vokabeln.json',
            types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        vocabFileHandle = handle;
        await saveVocabFileHandle(handle);
        return handle;
    } catch (e) { return null; } // user cancelled
}

async function autoExportJSON() {
    try {
        // Load handle if not yet loaded
        if (!vocabFileHandle) {
            vocabFileHandle = await loadVocabFileHandle();
        }
        if (!vocabFileHandle) return; // no file chosen yet

        // Verify permission
        const perm = await vocabFileHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
            const req = await vocabFileHandle.requestPermission({ mode: 'readwrite' });
            if (req !== 'granted') return;
        }

        // Get all vocab from DB
        const allCards = await getAllCardsFromDB();
        if (allCards.length === 0) return;

        const json = JSON.stringify(allCards, null, 2);
        const writable = await vocabFileHandle.createWritable();
        await writable.write(json);
        await writable.close();
    } catch (e) {
        console.warn('Auto-export JSON failed:', e);
    }
}
