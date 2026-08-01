// Russisch-Lernen — Text-to-Speech Helpers
// Wird vor dem Hauptscript in index.html geladen.
// Reine Hilfsfunktionen ohne DOM-Abhaengigkeiten.

// --- Voice-Namen fuer Geschlechtserkennung ---
const femaleVoiceNames = ['irina', 'svetlana', 'maria', 'anna', 'elena', 'natasha', 'olga', 'female', 'женский'];
const maleVoiceNames = ['pavel', 'dmitri', 'dmitry', 'alexander', 'sergei', 'sergey', 'boris', 'ivan', 'male', 'мужской'];

// --- Text-Bereinigung fuer Sprachausgabe ---
// Entfernt Klammer-Inhalte, Akzente, Sonderzeichen
function cleanTextForSpeech(text) {
    if (!text) return '';
    let cleaned = text.replace(/\([^)]*\)/g, '');
    cleaned = cleaned.replace(/\//g, ', ');
    cleaned = cleaned.normalize('NFD');
    cleaned = cleaned.replace(/[\u0300\u0301]/g, '');
    cleaned = cleaned.normalize('NFC');
    const accentedMap = {
        'а́': 'а', 'а̀': 'а', 'е́': 'е', 'ѐ': 'е',
        'и́': 'и', 'ѝ': 'и', 'о́': 'о', 'о̀': 'о',
        'у́': 'у', 'у̀': 'у', 'ы́': 'ы', 'ы̀': 'ы',
        'э́': 'э', 'э̀': 'э', 'ю́': 'ю', 'ю̀': 'ю',
        'я́': 'я', 'я̀': 'я', 'ё́': 'ё', 'ё̀': 'ё',
        'А́': 'А', 'Е́': 'Е', 'И́': 'И', 'О́': 'О',
        'У́': 'У', 'Ы́': 'Ы', 'Э́': 'Э', 'Ю́': 'Ю',
        'Я́': 'Я', 'Ё́': 'Ё'
    };
    for (const [accented, plain] of Object.entries(accentedMap)) {
        cleaned = cleaned.split(accented).join(plain);
    }
    cleaned = cleaned.replace(/[ˈˊˋ´`ʹʼ]/g, '');
    cleaned = cleaned.replace(/,\s*,/g, ',');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

// --- Text in Saetze splitten ---
function splitIntoSentences(text) {
    const parts = text.split(/(?<=[.!?])\s+/);
    return parts.filter(s => s.trim().length > 0);
}

// --- Satz in Woerter splitten (mit Whitespace-Tokens) ---
function splitIntoWords(sentence) {
    const tokens = [];
    const regex = /(\S+)|(\s+)/g;
    let match;
    let wordIdx = 0;
    while ((match = regex.exec(sentence)) !== null) {
        if (match[1]) {
            tokens.push({ text: match[1], isSpace: false, wordIdx: wordIdx++ });
        } else {
            tokens.push({ text: match[2], isSpace: true });
        }
    }
    return tokens;
}

// --- Anzahl Woerter im bereinigten Text (fuer TTS-Wort-Alignment) ---
function getCleanedWordCount(sentence) {
    const cleaned = cleanTextForSpeech(sentence);
    return cleaned.split(/\s+/).filter(w => w.length > 0).length;
}

// --- Voice-Geschlecht erraten anhand des Namens ---
function getVoiceGender(voice) {
    const nameLower = voice.name.toLowerCase();
    if (femaleVoiceNames.some(n => nameLower.includes(n))) return 'female';
    if (maleVoiceNames.some(n => nameLower.includes(n))) return 'male';
    return 'unknown';
}
