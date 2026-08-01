// Klickt "Vorlesen" und faengt jede Exception ein
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--allow-file-access-from-files', '--no-sandbox']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]`, msg.text()));
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

    page.on('dialog', async dialog => { await dialog.dismiss(); });

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Inject a sample text and switch to text mode
    const result = await page.evaluate(() => {
        try {
            // Simulate loading a text
            texts = [{
                title: 'Test',
                body: 'Привет. Меня зовут Иван. Мне двадцать лет.'
            }];
            currentIndex = 0;
            currentSentenceIndex = 0;
            isTextMode = true;

            // Wrap speak to catch errors
            const origSpeak = speak;
            window.__speakCalled = false;
            window.__speakError = null;
            speak = function(...args) {
                window.__speakCalled = true;
                console.log('speak() called with:', JSON.stringify(args[0]));
                try {
                    return origSpeak.apply(this, args);
                } catch (e) {
                    window.__speakError = e.message;
                    console.log('speak() threw:', e.message);
                    throw e;
                }
            };

            // Manually populate sentences (skip rendering)
            sentences = splitIntoSentences(texts[0].body);
            console.log('sentences.length =', sentences.length);

            // Now call startSpeaking directly
            try {
                startSpeaking();
                return { ok: true, speakCalled: window.__speakCalled, speakError: window.__speakError };
            } catch (e) {
                return { ok: false, error: e.message, stack: e.stack };
            }
        } catch (e) {
            return { ok: false, error: 'OUTER: ' + e.message, stack: e.stack };
        }
    });

    console.log('\n=== Result ===');
    console.log(JSON.stringify(result, null, 2));

    await new Promise(r => setTimeout(r, 1000));
    await browser.close();
})();
