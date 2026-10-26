// Russisch-Lernen — Nachschlagen markierter Woerter im Lesetext
// Wird vor dem Hauptscript in index.html geladen.
// Reine Hilfsfunktionen ohne DOM-Abhaengigkeiten; Anzeige und Ablauf
// (Vokabelliste zuerst, sonst Claude) stehen in index.html.

const SELECTION_MAX_WORDS = 12;
const SELECTION_MAX_CHARS = 120;

// Markierten Text fuer das Nachschlagen aufbereiten. Liefert '' wenn die
// Markierung nichts Russisches enthaelt oder zu lang ist (dann ist es kein
// Ausdruck mehr, sondern ein Satzteil zum Uebersetzen — dafuer gibt es den
// Vokabel-Generator).
function cleanSelectionText(raw) {
    let s = String(raw || '').replace(/\s+/g, ' ').trim();
    // Satzzeichen an den Raendern weg, innen (Bindestrich, Komma) behalten
    s = s.replace(/^[\s.,!?;:«»"'„“”‚‘’…()\[\]—–-]+/, '')
         .replace(/[\s.,!?;:«»"'„“”‚‘’…()\[\]—–-]+$/, '');
    if (!s || !/[Ѐ-ӿ]/.test(s)) return '';
    if (s.length > SELECTION_MAX_CHARS) return '';
    if (s.split(' ').length > SELECTION_MAX_WORDS) return '';
    return s;
}

function buildSelectionPrompt(expression, sentence, targetLang) {
    const langName = { de: 'German', en: 'English', ru: 'Russian' }[targetLang] || 'German';
    const translationInstruction = targetLang === 'ru'
        ? 'a brief explanation of the meaning in simple Russian'
        : `the ${langName} translation that fits this context`;
    const grammarInstruction = targetLang === 'de'
        ? 'short grammar note in German, e.g. "Subst., weibl.", "Verb, unvollendet", "Adjektiv", "Wendung"'
        : 'short grammar note in English, e.g. "noun, fem.", "verb, imperfective", "adjective", "phrase"';

    return `You are a Russian dictionary for a German-speaking learner.

Expression marked by the learner: «${expression}»
Sentence it appears in: «${sentence || expression}»

Return ONLY a JSON object, no other text:
{"russian": "...", "translation": "...", "grammar": "..."}

- "russian": the dictionary form in Cyrillic with stress mark (U+0301) on the stressed vowel: nouns in nominative singular, verbs in the infinitive, adjectives in nominative singular masculine. A fixed phrase or idiom stays a phrase. If the marked text is a longer group of words, keep it as it is (only add stress marks).
- "translation": ${translationInstruction}.
- "grammar": ${grammarInstruction}. Mention the case of the marked form if it is not the dictionary form.`;
}

// Antwort von Claude lesen: erstes {...}-Objekt, Pflichtfelder pruefen.
function parseSelectionResponse(text) {
    const m = String(text || '').match(/\{[\s\S]*\}/);
    if (!m) throw new Error('PARSE');
    let obj;
    try { obj = JSON.parse(m[0]); } catch (e) { throw new Error('PARSE'); }
    const russian = typeof obj.russian === 'string' ? obj.russian.trim() : '';
    const translation = typeof obj.translation === 'string' ? obj.translation.trim() : '';
    if (!russian || !translation) throw new Error('PARSE');
    const grammar = typeof obj.grammar === 'string' ? obj.grammar.trim() : '';
    return { russian, translation, grammar };
}
