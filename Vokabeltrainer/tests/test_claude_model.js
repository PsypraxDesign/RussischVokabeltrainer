// Tests fuer js/claude-model.js — Modellauswahl und Verfuegbarkeitspruefung
// Laedt claude-model.js per eval in den Node-Scope (kein Build-Step).
// Aufruf: node tests/test_claude_model.js
//
// Kein Netz, kein API-Schluessel: fetch und localStorage werden gestubbt.

const fs = require('fs');
const path = require('path');

let src = fs.readFileSync(path.join(__dirname, '..', 'js', 'claude-model.js'), 'utf8');
// Wie in test_sr.js: const/let auf Top-Level waeren im eval-Scope fuer
// spaetere Bloecke nicht sichtbar. Auf var umschreiben.
src = src.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ');
eval(src);

// ── Testgeruest ─────────────────────────────────────────────
let bestanden = 0, fehlgeschlagen = 0;

function assert(bedingung, beschreibung) {
    if (bedingung) { bestanden++; }
    else { fehlgeschlagen++; console.error('  FEHLER: ' + beschreibung); }
}

async function runTest(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { fehlgeschlagen++; console.error('  FEHL ' + name + ' — ' + e.message); }
}

// ── Stubs ───────────────────────────────────────────────────
function localStorageStub() {
    const daten = {};
    return {
        getItem: k => (k in daten ? daten[k] : null),
        setItem: (k, v) => { daten[k] = String(v); },
        removeItem: k => { delete daten[k]; },
        _daten: daten
    };
}

/** fetch-Stub, der eine Models-Liste liefert. */
function fetchMit(ids, opt) {
    opt = opt || {};
    return async () => {
        if (opt.httpFehler) return { ok: false, status: opt.httpFehler };
        if (opt.wirft) throw new Error('Netzwerk weg');
        return {
            ok: true,
            status: 200,
            json: async () => opt.kaputt
                ? { unerwartet: true }
                : { data: ids.map(x => (typeof x === 'string' ? { id: x, created_at: '2026-01-01' } : x)) }
        };
    };
}

function frisch() {
    globalThis.localStorage = localStorageStub();
    claudeModelStatus = null;
}

// ── Tests ───────────────────────────────────────────────────
(async function () {
console.log('claude-model.js');

await runTest('1. Wunschmodell vorhanden -> wird genommen', async () => {
    frisch();
    globalThis.fetch = fetchMit(['claude-opus-5', CLAUDE_MODEL_FALLBACK, 'claude-sonnet-4-6']);
    const m = await resolveClaudeModel('key');
    assert(m === CLAUDE_MODEL_FALLBACK, 'erwartet ' + CLAUDE_MODEL_FALLBACK + ', bekam ' + m);
    assert(claudeModelGetStatus().gewechselt === false, 'darf nicht als Wechsel gelten');
    assert(claudeModelGetStatus().quelle === 'api', 'Quelle sollte api sein');
});

await runTest('2. Wunschmodell weg -> neuestes Sonnet', async () => {
    frisch();
    globalThis.fetch = fetchMit([
        { id: 'claude-sonnet-4-6',  created_at: '2026-02-01' },
        { id: 'claude-sonnet-9-9',  created_at: '2026-07-01' },   // neuer
        { id: 'claude-opus-5',      created_at: '2026-12-01' }    // kein Sonnet
    ]);
    const m = await resolveClaudeModel('key');
    assert(m === 'claude-sonnet-9-9', 'erwartet claude-sonnet-9-9, bekam ' + m);
    assert(claudeModelGetStatus().gewechselt === true, 'muss als Wechsel gelten');
    assert(/nicht mehr verf/.test(claudeModelGetStatus().hinweis || ''), 'Hinweis fehlt');
});

await runTest('3. Gar kein Sonnet -> neuestes Claude-Modell', async () => {
    frisch();
    globalThis.fetch = fetchMit([
        { id: 'claude-opus-5',    created_at: '2026-03-01' },
        { id: 'claude-haiku-9',   created_at: '2026-08-01' }
    ]);
    const m = await resolveClaudeModel('key');
    assert(m === 'claude-haiku-9', 'erwartet claude-haiku-9, bekam ' + m);
});

await runTest('4. HTTP-Fehler -> Fallback, kein Absturz', async () => {
    frisch();
    globalThis.fetch = fetchMit([], { httpFehler: 500 });
    const m = await resolveClaudeModel('key');
    assert(m === CLAUDE_MODEL_FALLBACK, 'muss auf Fallback zurueckfallen');
    assert(claudeModelGetStatus().quelle === 'fallback', 'Quelle sollte fallback sein');
});

await runTest('5. Netzwerkfehler -> Fallback, kein Absturz', async () => {
    frisch();
    globalThis.fetch = fetchMit([], { wirft: true });
    const m = await resolveClaudeModel('key');
    assert(m === CLAUDE_MODEL_FALLBACK, 'muss auf Fallback zurueckfallen');
});

await runTest('6. Unerwartete Antwortstruktur -> Fallback', async () => {
    frisch();
    globalThis.fetch = fetchMit([], { kaputt: true });
    const m = await resolveClaudeModel('key');
    assert(m === CLAUDE_MODEL_FALLBACK, 'muss auf Fallback zurueckfallen');
});

await runTest('7. Ohne Schluessel gar keine Anfrage', async () => {
    frisch();
    let gerufen = 0;
    globalThis.fetch = async () => { gerufen++; return { ok: true, status: 200, json: async () => ({ data: [] }) }; };
    const m = await resolveClaudeModel('');
    assert(m === CLAUDE_MODEL_FALLBACK, 'muss Fallback liefern');
    assert(gerufen === 0, 'darf die API ohne Schluessel nicht aufrufen');
});

await runTest('8. Zweiter Aufruf kommt aus dem Cache', async () => {
    frisch();
    let gerufen = 0;
    globalThis.fetch = async () => {
        gerufen++;
        return { ok: true, status: 200, json: async () => ({ data: [{ id: CLAUDE_MODEL_FALLBACK, created_at: '2026-01-01' }] }) };
    };
    await resolveClaudeModel('key');
    await resolveClaudeModel('key');
    assert(gerufen === 1, 'zweiter Aufruf haette gecacht sein muessen, Anfragen: ' + gerufen);
    assert(claudeModelGetStatus().quelle === 'cache', 'Quelle sollte cache sein');
});

await runTest('9. force umgeht den Cache', async () => {
    frisch();
    let gerufen = 0;
    globalThis.fetch = async () => {
        gerufen++;
        return { ok: true, status: 200, json: async () => ({ data: [{ id: CLAUDE_MODEL_FALLBACK, created_at: '2026-01-01' }] }) };
    };
    await resolveClaudeModel('key');
    await resolveClaudeModel('key', { force: true });
    assert(gerufen === 2, 'force haette erneut anfragen muessen, Anfragen: ' + gerufen);
});

await runTest('10. Abgelaufener Cache wird verworfen', async () => {
    frisch();
    globalThis.localStorage.setItem(CLAUDE_MODEL_LS_ID, 'claude-uralt');
    globalThis.localStorage.setItem(CLAUDE_MODEL_LS_TS, String(Date.now() - CLAUDE_MODEL_TTL_MS - 1000));
    globalThis.fetch = fetchMit([CLAUDE_MODEL_FALLBACK]);
    const m = await resolveClaudeModel('key');
    assert(m === CLAUDE_MODEL_FALLBACK, 'abgelaufener Cache haette ignoriert werden muessen, bekam ' + m);
});

await runTest('11. Cache leeren erzwingt neue Pruefung', async () => {
    frisch();
    let gerufen = 0;
    globalThis.fetch = async () => {
        gerufen++;
        return { ok: true, status: 200, json: async () => ({ data: [{ id: CLAUDE_MODEL_FALLBACK, created_at: '2026-01-01' }] }) };
    };
    await resolveClaudeModel('key');
    claudeModelCacheLeeren();
    await resolveClaudeModel('key');
    assert(gerufen === 2, 'nach dem Leeren haette neu angefragt werden muessen');
});

await runTest('12. Kaputtes localStorage bricht nichts ab', async () => {
    claudeModelStatus = null;
    globalThis.localStorage = {
        getItem: () => { throw new Error('privater Modus'); },
        setItem: () => { throw new Error('privater Modus'); },
        removeItem: () => { throw new Error('privater Modus'); }
    };
    globalThis.fetch = fetchMit([CLAUDE_MODEL_FALLBACK]);
    const m = await resolveClaudeModel('key');
    assert(m === CLAUDE_MODEL_FALLBACK, 'muss trotz kaputtem localStorage liefern');
});

console.log('\n' + bestanden + ' Zusicherungen bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
process.exit(fehlgeschlagen ? 1 : 0);
})();
