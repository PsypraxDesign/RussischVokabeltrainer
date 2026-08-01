// Russisch-Lernen — AI-Vokabel-Generierung (Claude API)
// Wird vor dem Hauptscript in index.html geladen.
// Erwartet folgende Globals (in index.html definiert):
//   - apiKey

// --- Prompt-Builder fuer initialen Vokabel-Extract ---
function buildVocabPrompt(text, targetLang) {
    const langName = { de: 'German', en: 'English', ru: 'Russian' }[targetLang] || 'German';

    const translationInstruction = targetLang === 'ru'
        ? 'Provide a brief Russian definition or explanation for each word (as if for a Russian learner clarifying meaning).'
        : `Translate each word/phrase into ${langName}.`;

    const grammarLangInstruction = targetLang === 'de'
        ? 'Write ALL grammar notes in German (e.g. "unvollendeter Aspekt, 3. Pers. Sg.", "weibl.", "männl.", "Präp. + Genitiv").'
        : 'Write ALL grammar notes in English (e.g. "imperfective, 3rd pers. sg.", "fem.", "masc.", "prep. + genitive").';

    return `You are a Russian language teaching assistant. Create a complete vocabulary list for the following Russian text. Every single word must be included.

Instructions:
1. Extract EVERY meaningful Russian word from the text — do not skip any word, no matter how basic (including и, в, на, есть, это, etc.). SKIP the following — they are NOT vocabulary:
   - Personal pronouns (я, ты, он, она, оно, мы, вы, они, меня, тебя, его, её, нас, вас, их, мне, тебе, ему, ей, нам, вам, им, мной, тобой, ним, ней, ними, обо мне, etc.)
   - Pure numbers (7, 14, 20), times (6:30, 9:30), dates
   - List markers and punctuation (-, –, —, •, "1)", "2.", "a)", "i.", etc.)
   - Standalone punctuation or dashes
1a. CRITICAL: Write all Russian words in CYRILLIC script only. NEVER use Latin transliteration (e.g. write "дёшево", NOT "deschovo"; write "хорошо", NOT "khorosho"). Use the letter ё where appropriate (not е).
1b. CRITICAL: Each Russian word must appear ONLY ONCE in the output. Do not create duplicate entries. If a word appears in multiple grammatical forms, create one entry with all forms in the "forms" array.
2. ${translationInstruction}
3. For each item, include brief grammar info: noun gender, verb aspect, case requirements for prepositions, etc. ${grammarLangInstruction}
4. For verbs: give the infinitive form as the "russian" value, but also list the conjugated form(s) appearing in the text in the "forms" array.
5. For nouns/adjectives: give the dictionary form (nominative singular), and list declined forms from the text in the "forms" array.
6. If a word appears in multiple forms, create only ONE entry with all forms listed.
7. IMPORTANT: Also extract ALL multi-word expressions, idioms, collocations, and fixed phrases as SEPARATE entries. Examples:
   - Prepositional phrases: "в наше время" (in our time), "на самом деле" (actually), "в конце концов" (in the end)
   - Verb constructions: "у меня есть" (I have), "мне нравится" (I like), "можно сказать" (one could say)
   - Set expressions: "друг друга" (each other), "так как" (since/because), "то есть" (that is)
   - Any phrase where the meaning differs from the individual words
   List these IN ADDITION to the individual words — do not skip the individual words.
8. Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

JSON format — each element:
{
  "russian": "dictionary form of the word",
  "forms": ["form1_from_text", "form2_from_text"],
  "translation": "translation in ${langName}",
  "grammar": "brief grammar note in ${langName}"
}

Russian text to analyze:
"""
${text}
"""`;
}

// --- Prompt-Builder fuer fehlende Woerter (zweiter Pass) ---
function buildMissingWordsPrompt(missingWords, originalText, targetLang) {
    const langName = { de: 'German', en: 'English', ru: 'Russian' }[targetLang] || 'German';

    const translationInstruction = targetLang === 'ru'
        ? 'Provide a brief Russian definition or explanation for each word.'
        : `Translate each word into ${langName}.`;

    const grammarLangInstruction = targetLang === 'de'
        ? 'Write grammar notes in German.'
        : 'Write grammar notes in English.';

    return `You are a Russian language teaching assistant. The following Russian words appear in a text but were missed in the initial vocabulary extraction. Provide vocabulary entries for EVERY word listed below — do not skip any, even if they are basic, common, or proper nouns.

Instructions:
1. ${translationInstruction}
2. Include brief grammar info. ${grammarLangInstruction}
3. Give the dictionary form as "russian" and the text form in "forms" array.
4. For proper nouns (names, company names), still provide an entry with a note in the grammar field.
5. Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

JSON format for each entry:
{"russian": "dictionary form", "forms": ["form_from_text"], "translation": "translation", "grammar": "grammar note"}

Original text for context:
"""
${originalText}
"""

Words that MUST be included (${missingWords.length} words):
${missingWords.join(', ')}`;
}

// --- HTTP-Aufruf an Claude API ---
async function callClaudeAPI(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 16384,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error('AUTH');
        if (response.status === 429) throw new Error('RATE_LIMIT');
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP_${response.status}: ${body.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) throw new Error('EMPTY_RESPONSE');
    return content;
}

// --- Antwort parsen, filtern und deduplizieren ---
function parseVocabResponse(responseText) {
    let jsonStr = responseText.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
    }

    const startIdx = jsonStr.indexOf('[');
    if (startIdx === -1) throw new Error('PARSE');

    let endIdx = jsonStr.lastIndexOf(']');
    if (endIdx === -1) {
        // Truncated response — try to salvage by finding last complete object
        const lastComplete = jsonStr.lastIndexOf('}');
        if (lastComplete === -1) throw new Error('PARSE');
        jsonStr = jsonStr.substring(startIdx, lastComplete + 1) + ']';
        // Remove trailing comma before the ]
        jsonStr = jsonStr.replace(/,\s*\]$/, ']');
    } else {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }

    let items;
    try {
        items = JSON.parse(jsonStr);
    } catch (e) {
        // Last resort: try removing the last incomplete entry
        const lastBrace = jsonStr.lastIndexOf('},{');
        if (lastBrace === -1) throw new Error('PARSE');
        jsonStr = jsonStr.substring(0, lastBrace + 1) + ']';
        items = JSON.parse(jsonStr);
    }
    if (!Array.isArray(items) || items.length === 0) throw new Error('PARSE');

    const filtered = items.filter(item => {
        if (!item || typeof item.russian !== 'string') return false;
        const r = item.russian.trim();
        if (!r) return false;
        // Filter out punctuation-only entries (-, --, ...)
        if (/^[\-–—.,:;!?…]+$/.test(r)) return false;
        // Filter out pure numbers, times, dates (e.g. "930", "9:30", "7", "14", "2026")
        if (/^[\d:.,\-\/\s]+$/.test(r)) return false;
        // Filter out list markers like "1)", "2.", "a)", "i."
        if (/^[\dIVXivxa-zа-я]{1,3}[.)\]]\s*$/.test(r)) return false;
        // Filter out personal pronouns (nicht lernrelevant)
        const PRONOUNS = new Set([
            'я','ты','он','она','оно','мы','вы','они',
            'меня','тебя','его','её','ее','нас','вас','их',
            'мне','тебе','ему','ей','нам','вам','им',
            'мной','мною','тобой','тобою','им','ей','ею','ими',
            'себя','себе','собой','собою'
        ]);
        if (PRONOUNS.has(r.replace(/́/g, '').toLowerCase())) return false;
        // Filter out entries that are too long (whole sentences/paragraphs)
        if (r.length > 120) return false;
        // Filter out entries with too many words (max ~8 for idiomatic phrases)
        const wordCount = r.split(/\s+/).length;
        if (wordCount > 8) return false;
        // Reject entries without any Cyrillic characters (transliterations like "deschovo")
        if (!/[А-Яа-яЁё]/.test(r)) return false;
        // Reject entries that are mostly Latin (more Latin letters than Cyrillic)
        const cyrCount = (r.match(/[А-Яа-яЁё]/g) || []).length;
        const latCount = (r.match(/[A-Za-z]/g) || []).length;
        if (latCount > cyrCount) return false;
        // Reject JSON/DB metadata fragments (e.g. "front: ужасно", "Род.: симптомов",
        // "input: намерен") that get extracted when a vokabeln.json dump is loaded as text.
        if (/^\s*(id|front|back|input|verb|noun|grammar|forms?|source|translation|aspect|aspect_partner|gender|animate|stress|wordtype|conjugation|declension|present|past|future|imperative|participle_active|participle_passive|gerund|singular|plural|им|род|дат|вин|тв|пр|я|ты|вы|мы|он|она|оно|они|м|ж|ср|мн)\.?\s*:\s/i.test(r)) return false;
        return true;
    }).map(item => ({
        russian: item.russian.trim(),
        forms: Array.isArray(item.forms) ? item.forms.map(f => f.trim()) : [],
        translation: (item.translation || '').trim(),
        grammar: (item.grammar || '').trim()
    }));

    // Deduplicate by normalized russian word (lowercase, stress marks removed)
    const seen = new Map();
    for (const item of filtered) {
        const key = item.russian.replace(/́/g, '').toLowerCase().trim();
        if (!seen.has(key)) {
            seen.set(key, item);
        } else {
            // Merge forms from duplicate into existing entry
            const existing = seen.get(key);
            if (item.forms && item.forms.length) {
                const allForms = new Set([...(existing.forms || []), ...item.forms]);
                existing.forms = [...allForms];
            }
        }
    }
    return [...seen.values()];
}
