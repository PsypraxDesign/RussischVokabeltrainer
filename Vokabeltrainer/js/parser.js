// Russisch-Lernen — Datei-Parser (Karteikarten + Texte + Format-Erkennung)
// Wird vor dem Hauptscript in index.html geladen.
// Erwartet folgende Globals (in index.html definiert):
//   - cards, texts, currentIndex, currentSentenceIndex
//   - currentSourceFile
//   - isTabFormat, isClassicFormat
//   - t(key, params), showTextMode(), showFlashcardSetup(), saveCardsToDB()

// --- Format-Erkennung ---
function detectFormat(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const linesWithTab = lines.filter(line => line.includes('\t')).length;
    if (linesWithTab / lines.length > 0.5) return 'tab';
    let linesWithComma = lines.filter(line => line.includes(',')).length;
    if (linesWithComma / lines.length < 0.5) return 'text';
    if (content.includes('\\n') || content.includes('"')) return 'advanced';
    return 'classic';
}

// --- Texte parsen (Lese-Modus) ---
function parseTexts(content) {
    texts = [];

    // Dateiname ohne Endung als Fallback-Titel
    const fileTitle = currentSourceFile
        ? currentSourceFile.replace(/\.[^.]+$/, '')
        : '';

    // Versuche zuerst, nach klaren Trennern zu splitten (doppelte Leerzeilen oder Titel)
    const titlePattern = /^(Урок|Задание|Текст|Глава|Часть|Раздел|\d+\.)/i;
    let blocks = content.split(/\n\n+/).filter(b => b.trim());

    // Wenn wir nur einen Block haben oder sehr viele kleine Blöcke,
    // versuche nach Titeln zu splitten
    if (blocks.length === 1 || blocks.every(b => b.length < 100)) {
        blocks = content.split(/\n(?=Урок|Задание|Текст|Глава|Часть|Раздел|\d+\.)/i).filter(b => b.trim());
    }

    blocks.forEach((block, idx) => {
        const lines = block.trim().split('\n');
        let title = '';
        let body = block.trim();

        // Prüfe, ob die erste Zeile ein Titel ist
        if (lines[0].match(titlePattern) || (lines[0].length < 60 && lines.length > 1)) {
            title = lines[0].trim();
            body = lines.slice(1).join('\n').trim();
        }

        // Falls kein Body nach dem Titel übrig ist, nimm den ganzen Block
        if (!body && block.trim()) {
            body = block.trim();
            title = '';
        }

        if (body) {
            const fallback = fileTitle || t('text_fallback', { n: idx + 1 });
            texts.push({
                title: title || fallback,
                body: body
            });
        }
    });

    // Fallback: Gesamten Inhalt als einen Text behandeln
    if (texts.length === 0) {
        const fallback = fileTitle || t('text_fallback', { n: 1 });
        texts = [{ title: fallback, body: content.trim() }];
    }

    currentIndex = 0;
    currentSentenceIndex = 0;
    showTextMode();
}

// --- Karteikarten parsen ---
function parseCards(content) {
    const lines = content.split('\n').filter(line => line.trim());
    cards = [];

    lines.forEach(line => {
        let question, answer;

        // Split: tab-separated or last-comma
        if (isTabFormat) {
            const tabIdx = line.indexOf('\t');
            if (tabIdx === -1) return;
            question = line.substring(0, tabIdx).trim();
            answer = line.substring(tabIdx + 1).trim();
        } else {
            const firstComma = line.indexOf(',');
            if (firstComma === -1) return;
            question = line.substring(0, firstComma).trim();
            answer = line.substring(firstComma + 1).trim();
        }

        if (!question && !answer) return;

        // Skip JSON/DB metadata lines (e.g. "id: c_o0eqbn", "front: ужасно", "Род.: симптомов")
        // that appear when a vokabeln.json dump is accidentally imported as flashcards.
        if (/^\s*(id|front|back|input|verb|noun|grammar|forms?|source|translation|aspect|aspect_partner|gender|animate|stress|wordtype|conjugation|declension|present|past|future|imperative|participle_active|participle_passive|gerund|singular|plural|им|род|дат|вин|тв|пр|я|ты|вы|мы|он|она|оно|они|м|ж|ср|мн)\.?\s*:\s/i.test(question)) return;

        // Extract (img:...) tags — also support legacy [img:...]
        const images = [];
        const imgRegex = /(?:\(img:([^)]+)\)|\[img:([^\]]+)\])/g;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(question)) !== null) {
            images.push((imgMatch[1] || imgMatch[2]).trim());
        }
        question = question.replace(imgRegex, '').trim();

        // Extract (speak:...) tag
        let speakOverride = null;
        const speakMatch = question.match(/\(speak:([^)]+)\)/);
        if (speakMatch) {
            speakOverride = speakMatch[1].trim();
            question = question.replace(speakMatch[0], '').trim();
        }

        let displayText = question;
        let speakableText;

        if (!isClassicFormat && !isTabFormat) {
            // Legacy advanced format: \n and "quotes"
            question = question.replace(/\\n/g, '\n');
            displayText = question;
            const quotes = question.match(/"([^"]+)"/g);
            if (quotes) {
                speakableText = quotes.map(m => m.replace(/"/g, '')).join(' ');
            }
            displayText = question.replace(/"/g, '');
        }

        // Determine speakable text
        if (speakOverride) {
            speakableText = speakOverride;
        } else if (!speakableText) {
            // Strip grammar (text) from start for speech
            let text = displayText;
            if (text.match(/^\((?!img:|speak:)[^)]*\)/)) {
                text = text.replace(/^\([^)]*\)\s*/, '');
            }
            speakableText = text;
        }

        // Skip entries that are too long (likely a text paragraph, not a vocabulary card)
        if ((question && question.length > 200) || (answer && answer.length > 200)) return;

        // Allow image-only cards (no text, just image)
        if (question || images.length > 0) {
            cards.push({ displayText: displayText || '', speakableText: speakableText || '', answer: answer || '', images });
        }
    });

    currentIndex = 0;

    // Save to IndexedDB (cumulative, no duplicates)
    saveCardsToDB(cards, currentSourceFile).catch(e => console.warn('DB save error:', e));

    showFlashcardSetup();
}
