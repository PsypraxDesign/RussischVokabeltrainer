// ─────────────────────────────────────────────────────────────
//  Claude-Modell: eine Quelle, mit Verfügbarkeitsprüfung
// ─────────────────────────────────────────────────────────────
//
// Anlass: Am 15.06.2026 wurde `claude-sonnet-4-20250514` abgeschaltet.
// Die Kennung stand fest verdrahtet an zwei Stellen im Code, und der
// Ausfall fiel erst Wochen später auf — die KI-Funktionen scheiterten
// still.
//
// Dieses Modul löst beides:
//   1. Die Kennung steht nur noch hier (CLAUDE_MODEL_FALLBACK).
//   2. Vor dem ersten Aufruf wird gegen die Models-API geprüft, ob das
//      Modell überhaupt noch existiert — und falls nicht, automatisch
//      das neueste `claude-sonnet-*` genommen.
//
// Grundsatz: **Die Prüfung darf die App nie blockieren.** Schlägt sie
// fehl — kein Netz, kein Schlüssel, Endpunkt geändert —, wird der
// Fallback benutzt und weitergearbeitet. Ein kaputter Check ist kein
// Grund, das Vokabellernen anzuhalten.

// Wunschmodell. Wird verwendet, solange es die API bestätigt.
const CLAUDE_MODEL_FALLBACK = 'claude-sonnet-5';

// Wie lange ein Prüfergebnis gilt. Modelle werden nicht täglich
// abgeschaltet; sieben Tage sind ein Kompromiss zwischen Aktualität
// und unnötigen Anfragen.
const CLAUDE_MODEL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CLAUDE_MODEL_LS_ID = 'vokabeltrainer_model';
const CLAUDE_MODEL_LS_TS = 'vokabeltrainer_model_checked';
const CLAUDE_MODEL_LS_NOTE = 'vokabeltrainer_model_note';

// Ergebnis der letzten Prüfung, für die Oberfläche lesbar.
// { model, quelle: 'cache'|'api'|'fallback', gewechselt: bool, hinweis: string|null }
let claudeModelStatus = null;

function claudeModelGetStatus() {
    return claudeModelStatus;
}

/**
 * Liefert die zu verwendende Modellkennung.
 *
 * Reihenfolge:
 *   1. Frisches Ergebnis aus dem localStorage (jünger als TTL)
 *   2. Abfrage der Models-API und Auswahl
 *   3. CLAUDE_MODEL_FALLBACK
 *
 * @param {string} apiKey    Anthropic-Schlüssel
 * @param {object} [opt]     { force: true } überspringt den Cache
 * @returns {Promise<string>} Modellkennung, nie leer
 */
async function resolveClaudeModel(apiKey, opt) {
    const force = !!(opt && opt.force);

    if (!force) {
        const zwischengespeichert = claudeModelAusCache();
        if (zwischengespeichert) {
            claudeModelStatus = {
                model: zwischengespeichert,
                quelle: 'cache',
                gewechselt: false,
                hinweis: localStorage.getItem(CLAUDE_MODEL_LS_NOTE) || null
            };
            return zwischengespeichert;
        }
    }

    if (!apiKey) {
        claudeModelStatus = {
            model: CLAUDE_MODEL_FALLBACK,
            quelle: 'fallback',
            gewechselt: false,
            hinweis: 'Ohne API-Schlüssel keine Prüfung möglich.'
        };
        return CLAUDE_MODEL_FALLBACK;
    }

    try {
        const verfuegbar = await claudeModelListe(apiKey);
        const gewaehlt = claudeModelWaehlen(verfuegbar);

        const gewechselt = gewaehlt !== CLAUDE_MODEL_FALLBACK;
        const hinweis = gewechselt
            ? `„${CLAUDE_MODEL_FALLBACK}" ist nicht mehr verfügbar — verwende „${gewaehlt}". `
              + `Wenn das dauerhaft so bleiben soll, CLAUDE_MODEL_FALLBACK in js/claude-model.js anpassen.`
            : null;

        claudeModelMerken(gewaehlt, hinweis);
        claudeModelStatus = { model: gewaehlt, quelle: 'api', gewechselt, hinweis };

        if (gewechselt) console.warn('[claude-model]', hinweis);
        return gewaehlt;

    } catch (e) {
        // Absichtlich weich: die Prüfung ist Komfort, kein Betriebsmittel.
        console.warn('[claude-model] Prüfung fehlgeschlagen, nutze Fallback:', e.message);
        claudeModelStatus = {
            model: CLAUDE_MODEL_FALLBACK,
            quelle: 'fallback',
            gewechselt: false,
            hinweis: 'Verfügbarkeit ungeprüft (' + e.message + ').'
        };
        return CLAUDE_MODEL_FALLBACK;
    }
}

/** Holt die Modell-Liste. Wirft bei jedem Fehler. */
async function claudeModelListe(apiKey) {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
        method: 'GET',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        }
    });

    if (!res.ok) throw new Error('Models-API antwortete mit HTTP ' + res.status);

    const json = await res.json();
    if (!json || !Array.isArray(json.data)) throw new Error('Unerwartete Antwortstruktur');

    const ids = json.data
        .filter(m => m && typeof m.id === 'string')
        .map(m => ({ id: m.id, created_at: m.created_at || '' }));

    if (!ids.length) throw new Error('Leere Modell-Liste');
    return ids;
}

/**
 * Wählt aus der Liste die Kennung aus.
 *
 * Ist das Wunschmodell dabei, gewinnt es — auch wenn ein neueres
 * existiert. Ein automatischer Sprung auf eine neue Generation ändert
 * Ausgabequalität und Kosten und darf nicht nebenbei passieren.
 * Gewechselt wird nur, wenn das Wunschmodell *weg* ist.
 */
function claudeModelWaehlen(verfuegbar) {
    if (verfuegbar.some(m => m.id === CLAUDE_MODEL_FALLBACK)) {
        return CLAUDE_MODEL_FALLBACK;
    }

    const sonnets = verfuegbar
        .filter(m => m.id.startsWith('claude-sonnet-'))
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    if (sonnets.length) return sonnets[0].id;

    // Kein Sonnet mehr? Dann irgendein Claude-Modell, Hauptsache es läuft.
    const claudes = verfuegbar
        .filter(m => m.id.startsWith('claude-'))
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    if (claudes.length) return claudes[0].id;

    throw new Error('Kein Claude-Modell in der Liste');
}

function claudeModelAusCache() {
    try {
        const id = localStorage.getItem(CLAUDE_MODEL_LS_ID);
        const ts = parseInt(localStorage.getItem(CLAUDE_MODEL_LS_TS) || '0', 10);
        if (!id || !ts) return null;
        if (Date.now() - ts > CLAUDE_MODEL_TTL_MS) return null;
        return id;
    } catch (e) {
        return null;   // privater Modus o. Ä. — kein Grund abzubrechen
    }
}

function claudeModelMerken(id, hinweis) {
    try {
        localStorage.setItem(CLAUDE_MODEL_LS_ID, id);
        localStorage.setItem(CLAUDE_MODEL_LS_TS, String(Date.now()));
        if (hinweis) localStorage.setItem(CLAUDE_MODEL_LS_NOTE, hinweis);
        else localStorage.removeItem(CLAUDE_MODEL_LS_NOTE);
    } catch (e) {
        /* Speichern ist Komfort, kein Muss */
    }
}

/** Erzwingt eine neue Prüfung beim nächsten Aufruf. */
function claudeModelCacheLeeren() {
    try {
        localStorage.removeItem(CLAUDE_MODEL_LS_ID);
        localStorage.removeItem(CLAUDE_MODEL_LS_TS);
        localStorage.removeItem(CLAUDE_MODEL_LS_NOTE);
    } catch (e) { /* egal */ }
}
