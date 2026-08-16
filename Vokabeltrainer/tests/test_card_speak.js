// Test: Klick auf die russische Vokabel der Karteikarte liest sie erneut vor
//
// Geprueft wird:
//   1. Klick auf die Vokabel liest vor und dreht die Karte NICHT um.
//   2. Klick daneben dreht weiterhin um.
//   3. Bei umgekehrter Abfragerichtung wandert die Klick-Flaeche auf die
//      Rueckseite (dort steht dann die russische Vokabel).
//   4. Vorgelesen wird die Grundform (displaySpeakText), nicht die Uebersetzung.
//
// Aufruf: node tests/test_card_speak.js

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

const CARDS = 'работать\tarbeiten\nначинать\tanfangen';

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--allow-file-access-from-files', '--no-sandbox']
    });
    const page = await browser.newPage();

    // Muss VOR dem ersten goto() haengen (Startup-Alert zur Speicherdatei).
    page.on('dialog', async dialog => { await dialog.dismiss(); });
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate((content) => {
        document.getElementById('modeFlashcards').click();
        parseContent(content);
        document.getElementById('startFlashcardsBtn').click();

        window.__calls = [];
        speak = function (t) { window.__calls.push(t); };
        speakAnswer = function (t) { window.__calls.push('DE:' + t); };

        window.__click = (id) => {
            document.getElementById(id)
                .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        };
        window.__flipped = () => document.getElementById('flashcard').classList.contains('flipped');
    }, CARDS);

    // --- 1: Vorderseite mit russischer Vokabel
    console.log('\nKlick auf die russische Vokabel (Vorderseite)');
    const r1 = await page.evaluate(() => {
        window.__calls = [];
        const q = document.getElementById('questionText');
        const before = window.__flipped();
        window.__click('questionText');
        return {
            text: q.textContent,
            isVocab: q.classList.contains('card-vocab'),
            title: q.title,
            answerIsVocab: document.getElementById('answerText').classList.contains('card-vocab'),
            before,
            after: window.__flipped(),
            calls: window.__calls
        };
    });
    check('Vorderseite traegt die Vokabel', r1.text === 'работать', `war "${r1.text}"`);
    check('Vokabel ist als anklickbar markiert', r1.isVocab);
    check('Rueckseite ist nicht anklickbar markiert', !r1.answerIsVocab);
    check('Tooltip vorhanden', /Vorlesen|hear it again|прослушать/.test(r1.title), `war "${r1.title}"`);
    check('Vokabel wird vorgelesen', r1.calls.length === 1 && r1.calls[0] === 'работать',
        `calls=${JSON.stringify(r1.calls)}`);
    check('Karte dreht sich nicht um', r1.before === false && r1.after === false);

    // --- 2: Klick daneben dreht weiterhin um
    console.log('\nKlick neben die Vokabel');
    const r2 = await page.evaluate(() => {
        window.__calls = [];
        window.__click('flashcardFront');
        return { flipped: window.__flipped(), calls: window.__calls };
    });
    check('Karte dreht sich um', r2.flipped === true);

    // --- 3: Umgekehrte Abfragerichtung — Vokabel steht hinten
    console.log('\nUmgekehrte Abfragerichtung');
    const r3 = await page.evaluate(() => {
        document.getElementById('directionBtn').click();   // ru2other -> other2ru
        window.__calls = [];
        const q = document.getElementById('questionText');
        const a = document.getElementById('answerText');
        window.__click('answerText');                      // Vokabel auf der Rueckseite
        const afterVocabClick = { flipped: window.__flipped(), calls: window.__calls.slice() };
        window.__click('questionText');                    // Uebersetzung -> umdrehen
        return {
            frontText: q.textContent,
            backText: a.textContent,
            backIsVocab: a.classList.contains('card-vocab'),
            frontIsVocab: q.classList.contains('card-vocab'),
            afterVocabClick,
            flippedAfterOther: window.__flipped()
        };
    });
    check('Vorderseite zeigt die Uebersetzung', r3.frontText === 'arbeiten', `war "${r3.frontText}"`);
    check('Rueckseite zeigt die Vokabel', r3.backText === 'работать', `war "${r3.backText}"`);
    check('Klick-Flaeche wandert auf die Rueckseite', r3.backIsVocab && !r3.frontIsVocab);
    check('Vokabel wird vorgelesen',
        r3.afterVocabClick.calls.length === 1 && r3.afterVocabClick.calls[0] === 'работать',
        `calls=${JSON.stringify(r3.afterVocabClick.calls)}`);
    check('Klick auf die Vokabel dreht nicht um', r3.afterVocabClick.flipped === false);
    check('Klick auf die Uebersetzung dreht um', r3.flippedAfterOther === true);

    await browser.close();

    console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed === 0 ? 0 : 1);
})();
