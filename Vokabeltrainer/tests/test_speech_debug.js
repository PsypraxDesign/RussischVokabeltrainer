// Diagnose-Test fuer Text-to-Speech im Text-Reader
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--allow-file-access-from-files', '--no-sandbox']
    });
    const page = await browser.newPage();

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => consoleMessages.push(`[PAGEERROR] ${err.message}`));

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    console.log('Loading:', url);
    // Auto-dismiss the alert dialog from startup pick file requirement
    page.on('dialog', async dialog => {
        console.log('Dialog:', dialog.message());
        await dialog.dismiss();
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Check critical things
    const checks = await page.evaluate(() => {
        return {
            startSpeaking: typeof startSpeaking,
            speakFullText: typeof speakFullText,
            speak: typeof speak,
            speakSentenceChain: typeof speakSentenceChain,
            splitIntoSentences: typeof splitIntoSentences,
            splitIntoWords: typeof splitIntoWords,
            cleanTextForSpeech: typeof cleanTextForSpeech,
            highlightCurrentSentence: typeof highlightCurrentSentence,
            clearWordHighlights: typeof clearWordHighlights,
            getCleanedWordCount: typeof getCleanedWordCount,
            stopRequested: typeof stopRequested,
            isSpeaking: typeof isSpeaking,
            selectedVoice: typeof selectedVoice,
            wordBoundarySupported: typeof wordBoundarySupported,
            sentences: typeof sentences,
            currentSentenceIndex: typeof currentSentenceIndex,
            speakingIndicator: typeof speakingIndicator,
            textSpeakingIndicator: typeof textSpeakingIndicator,
            mainSpeakBtn: typeof mainSpeakBtn,
            mainStopBtn: typeof mainStopBtn,
            speakBtn: typeof speakBtn,
            stopBtn: typeof stopBtn,
        };
    });

    console.log('\n=== Function/Variable availability ===');
    for (const [k, v] of Object.entries(checks)) {
        const ok = v !== 'undefined';
        console.log(`${ok ? 'OK ' : 'MISSING'} ${k}: ${v}`);
    }

    console.log('\n=== Console messages ===');
    consoleMessages.forEach(m => console.log(m));

    await browser.close();
})();
