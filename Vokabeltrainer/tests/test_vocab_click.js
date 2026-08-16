// Test: Klick auf eine Woerterbuch-Vokabel im Lesemodus
//
// Geprueft wird:
//   1. Der Eintrag wird angezeigt (Tooltip sichtbar, richtiges Wort).
//   2. Vorgelesen wird ausschliesslich die russische Vokabel — nicht die
//      Uebersetzung und nicht der ganze Satz.
//   3. Woerter ohne Wörterbuch-Eintrag lesen weiterhin den Satz vor.
//   4. Eine laufende Vorlese-Kette laeuft nach dem Klick nicht weiter.
//   5. Der Start-Knopf wird zu "Weiter" und liest beim unterbrochenen Satz
//      weiter — nicht von vorne.
//
// Aufruf: node tests/test_vocab_click.js

const puppeteer = require('puppeteer');
const path = require('path');

let passed = 0;
let failed = 0;

function check(name, cond, detail) {
    if (cond) {
        passed++;
        console.log(`  OK   ${name}`);
    } else {
        failed++;
        console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`);
    }
}

const TEXT = 'Привет. Меня зовут Иван. Мне двадцать лет. Я живу в Москве.';
const VOCAB = [
    { russian: 'привет', translation: 'Hallo', grammar: 'Interjektion' },
    { russian: 'звать', translation: 'nennen, heißen', grammar: 'Verb, unvollendet', forms: ['зовут'] }
];

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--allow-file-access-from-files', '--no-sandbox']
    });
    const page = await browser.newPage();

    // Muss VOR dem ersten goto() haengen: der Startup-Alert zur Speicherdatei
    // blockiert sonst jedes page.evaluate() bis zum Protokoll-Timeout.
    page.on('dialog', async dialog => { await dialog.dismiss(); });
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // --- Gemeinsames Setup: Text rendern, Vokabeln markieren, speak() stubben
    await page.evaluate((text, vocab) => {
        window.__setup = (mode) => {
            texts = [{ title: 'Test', body: text }];
            currentIndex = 0;
            currentSentenceIndex = 0;
            readMode = mode;
            renderTextContent();
            buildVocabMap(vocab);
            markVocabWords();

            window.__calls = [];
            window.__ends = [];
            speak = function (t, onEnd) {
                window.__calls.push(t);
                window.__ends.push(onEnd || null);
            };
        };
        window.__wordEl = (txt) =>
            Array.from(document.querySelectorAll('.text-paragraph .word'))
                .find(el => el.textContent === txt) || null;
        window.__click = (txt) => {
            const el = window.__wordEl(txt);
            if (!el) return false;
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return true;
        };
    }, TEXT, VOCAB);

    // --- 1: Satzweise-Modus, Klick auf eine Vokabel
    console.log('\nKlick auf Vokabel (Satzweise-Modus)');
    const r1 = await page.evaluate(() => {
        window.__setup('sentence');
        const marked = window.__wordEl('зовут');
        const clicked = window.__click('зовут');
        return {
            clicked,
            hasVocabClass: marked ? marked.classList.contains('has-vocab') : false,
            dataRussian: marked ? marked.dataset.vocabRussian : null,
            calls: window.__calls,
            tooltipVisible: document.getElementById('vocabTooltip').classList.contains('visible'),
            tooltipWord: document.getElementById('vocabTooltipWord').textContent,
            tooltipTranslation: document.getElementById('vocabTooltipTranslation').textContent
        };
    });
    check('Wort ist als Vokabel markiert', r1.hasVocabClass);
    check('Klick ausgeloest', r1.clicked);
    check('Eintrag wird angezeigt', r1.tooltipVisible);
    check('Eintrag zeigt die Woerterbuchform', r1.tooltipWord === 'звать', `war "${r1.tooltipWord}"`);
    check('Eintrag zeigt die Uebersetzung', r1.tooltipTranslation === 'nennen, heißen', `war "${r1.tooltipTranslation}"`);
    check('genau einmal vorgelesen', r1.calls.length === 1, `calls=${JSON.stringify(r1.calls)}`);
    check('vorgelesen wird die russische Vokabel', r1.calls[0] === 'звать', `war "${r1.calls[0]}"`);
    check('Uebersetzung wird nicht vorgelesen',
        !r1.calls.some(c => (c || '').includes('nennen') || (c || '').includes('heißen')));
    check('nicht der ganze Satz vorgelesen',
        !r1.calls.some(c => (c || '').includes('Иван')), `calls=${JSON.stringify(r1.calls)}`);

    // --- 2: Wort ohne Eintrag liest weiterhin den Satz
    console.log('\nKlick auf Wort ohne Eintrag (Satzweise-Modus)');
    const r2 = await page.evaluate(() => {
        window.__setup('sentence');
        const el = window.__wordEl('Иван.');
        const clicked = window.__click('Иван.');
        return {
            clicked,
            hasVocabClass: el ? el.classList.contains('has-vocab') : false,
            calls: window.__calls
        };
    });
    check('Wort ist nicht als Vokabel markiert', !r2.hasVocabClass);
    check('Satz wird vorgelesen', r2.calls.length === 1 && r2.calls[0] === 'Меня зовут Иван.',
        `calls=${JSON.stringify(r2.calls)}`);

    // --- 3: laufende Vorlese-Kette wird nicht fortgesetzt
    console.log('\nKlick waehrend des Vorlesens (Gesamttext)');
    const r3 = await page.evaluate(async () => {
        window.__setup('all');
        stopRequested = false;
        speakFullText();                      // Kette startet mit Satz 1
        const firstCall = window.__calls[0];
        const chainEnd = window.__ends[0];
        window.__click('зовут');              // Vokabel dazwischen
        const afterClick = window.__calls.slice();
        if (chainEnd) chainEnd();             // Kette meldet "Satz fertig"
        await new Promise(r => setTimeout(r, 300));
        return { firstCall, afterClick, calls: window.__calls };
    });
    check('Kette beginnt mit dem ersten Satz', r3.firstCall === 'Привет.', `war "${r3.firstCall}"`);
    check('Vokabel wird dazwischen vorgelesen',
        r3.afterClick.length === 2 && r3.afterClick[1] === 'звать', `calls=${JSON.stringify(r3.afterClick)}`);
    check('Kette laeuft danach nicht weiter',
        r3.calls.length === 2, `calls=${JSON.stringify(r3.calls)}`);

    // --- 4: "Weiter" liest beim unterbrochenen Satz weiter
    console.log('\n"Weiter" nach Vokabel-Klick');
    const r4 = await page.evaluate(async () => {
        window.__setup('all');
        stopRequested = false;
        speakFullText();                       // Satz 1
        window.__ends[0]();                    // Satz 1 fertig -> Kette geht zu Satz 2
        await new Promise(r => setTimeout(r, 250));
        const beforeClick = window.__calls.slice();
        window.__click('зовут');               // Klick mitten in Satz 2
        const label = document.getElementById('mainSpeakLabel').textContent;
        const progress = document.getElementById('textReaderProgress').textContent;
        document.getElementById('mainSpeakBtn').click();   // "Weiter"
        await new Promise(r => setTimeout(r, 100));
        return {
            beforeClick,
            calls: window.__calls,
            label,
            expectedLabel: t('btn_resume'),
            startLabel: t('btn_start'),
            labelAfterResume: document.getElementById('mainSpeakLabel').textContent,
            progress,
            sentence2: sentences[1]
        };
    });
    check('Kette war bei Satz 2 angekommen',
        r4.beforeClick.length === 2 && r4.beforeClick[1] === 'Меня зовут Иван.',
        `calls=${JSON.stringify(r4.beforeClick)}`);
    check('Start-Knopf heisst danach "Weiter"', r4.label === r4.expectedLabel,
        `war "${r4.label}", erwartet "${r4.expectedLabel}"`);
    check('Hinweis nennt den unterbrochenen Satz', /2/.test(r4.progress), `war "${r4.progress}"`);
    check('"Weiter" liest den unterbrochenen Satz, nicht den ersten',
        r4.calls.length === 4 && r4.calls[3] === r4.sentence2,
        `calls=${JSON.stringify(r4.calls)}`);
    check('Knopf heisst danach wieder "Start"', r4.labelAfterResume === r4.startLabel,
        `war "${r4.labelAfterResume}"`);

    // --- 5: Stopp-Knopf ist ebenfalls fortsetzbar
    console.log('\n"Weiter" nach Stopp');
    const r5 = await page.evaluate(async () => {
        window.__setup('all');
        stopRequested = false;
        speakFullText();
        window.__ends[0]();
        await new Promise(r => setTimeout(r, 250));   // laeuft bei Satz 2
        stopSpeaking();
        const label = document.getElementById('mainSpeakLabel').textContent;
        startSpeaking();
        await new Promise(r => setTimeout(r, 100));
        return { label, expectedLabel: t('btn_resume'), calls: window.__calls, sentence2: sentences[1] };
    });
    check('Stopp macht den Knopf zu "Weiter"', r5.label === r5.expectedLabel, `war "${r5.label}"`);
    check('nach Stopp wird bei Satz 2 fortgesetzt',
        r5.calls.length === 3 && r5.calls[2] === r5.sentence2, `calls=${JSON.stringify(r5.calls)}`);

    // --- 6: Satzweise-Modus bietet kein "Weiter" an
    console.log('\nSatzweise-Modus');
    const r6 = await page.evaluate(() => {
        window.__setup('sentence');
        window.__click('зовут');
        return {
            label: document.getElementById('mainSpeakLabel').textContent,
            startLabel: t('btn_start')
        };
    });
    check('Knopf bleibt "Start"', r6.label === r6.startLabel, `war "${r6.label}"`);

    await browser.close();

    console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed === 0 ? 0 : 1);
})();
