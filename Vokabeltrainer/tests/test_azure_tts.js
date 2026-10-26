// Test fuer die Azure-Sprachausgabe (js/azure-tts.js) und den Hinweis bei
// ausgefallener Stimme. Ohne Netz: fetch und Audio werden im Browser ersetzt.
// Aufruf: node tests/test_azure_tts.js
const puppeteer = require('puppeteer');
const { isolatePage } = require('./helpers/offline');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

let passed = 0, failed = 0;
function check(name, cond) {
    if (cond) { passed++; console.log('  OK   ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

// --- Teil 1: reine Hilfsfunktionen, ohne Browser ---
function unitTests() {
    console.log('\nHilfsfunktionen');
    const store = {};
    const ctx = {
        localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } },
        Map, Promise, Error, Number, String, Math
    };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'azure-tts.js'), 'utf8')
        + '\nthis.api = { azureRateFromBrowserRate, buildAzureSsml, estimateWordTimings, wordIndexAt,'
        + ' isValidAzureRegion, getAzureConfig, saveAzureConfig, isAzureConfigured };', ctx);
    const a = ctx.api;

    check('Rate 0.9 -> -10%', a.azureRateFromBrowserRate(0.9) === '-10%');
    check('Rate 1.2 -> +20%', a.azureRateFromBrowserRate(1.2) === '+20%');
    check('ungueltige Rate -> +0%', a.azureRateFromBrowserRate(NaN) === '+0%');

    const ssml = a.buildAzureSsml('Tom & <Jerry> "da"', 'ru-RU-SvetlanaNeural', 1);
    check('SSML maskiert & < > "', ssml.includes('Tom &amp; &lt;Jerry&gt; &quot;da&quot;'));
    check('SSML nennt die Stimme', ssml.includes('<voice name="ru-RU-SvetlanaNeural">'));

    const starts = a.estimateWordTimings(['Я', 'люблю', 'Москву'], 3.0);
    check('Wortzeiten: erstes Wort bei 0', starts[0] === 0);
    check('Wortzeiten steigen', starts[1] > starts[0] && starts[2] > starts[1] && starts[2] < 3);
    check('wordIndexAt vor Wort 2', a.wordIndexAt(starts, starts[1] - 0.01) === 0);
    check('wordIndexAt am Ende', a.wordIndexAt(starts, 2.99) === 2);
    check('keine Dauer -> keine Zeiten', a.estimateWordTimings(['a'], 0).length === 0);

    check('Region germanywestcentral gueltig', a.isValidAzureRegion('germanywestcentral'));
    check('Region mit Punkt ungueltig', !a.isValidAzureRegion('evil.com/x'));
    check('ohne Schluessel nicht eingerichtet', !a.isAzureConfigured());
    a.saveAzureConfig(' abc ', ' GermanyWestCentral ');
    const cfg = a.getAzureConfig();
    check('Schluessel/Region getrimmt, Region klein', cfg.key === 'abc' && cfg.region === 'germanywestcentral');
    check('mit Schluessel eingerichtet', a.isAzureConfigured());
}

// --- Teil 2: in der App ---
async function browserTests() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required']
    });
    const page = await browser.newPage();
    await isolatePage(page);   // kein Netz, keine echten Schluessel
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.dismiss());   // Startup-Alert zur Speicherdatei

    // Vor jedem Script: Azure einrichten, fetch und Audio ersetzen
    await page.evaluateOnNewDocument(() => {
        localStorage.setItem('aussprache_azure_key', 'test-key');
        localStorage.setItem('aussprache_azure_region', 'germanywestcentral');
        window.__fetchMode = 'ok';
        window.__fetchCalls = [];
        window.fetch = async (url, opts) => {
            window.__fetchCalls.push({ url, body: opts && opts.body });
            if (window.__fetchMode === 'auth') return new Response('', { status: 401 });
            return new Response(new Blob([new Uint8Array(64)], { type: 'audio/mpeg' }), { status: 200 });
        };
        // Audio-Ersatz: "spielt" 300 ms, dann ended
        window.Audio = class {
            constructor() { this.currentTime = 0; this.duration = 0.3; this.paused = true; }
            play() {
                this.paused = false;
                setTimeout(() => { if (!this.paused && this.onplaying) this.onplaying(); }, 10);
                this._t = setTimeout(() => {
                    if (this.paused) return;
                    this.currentTime = this.duration;
                    if (this.onended) this.onended();
                }, 300);
                return Promise.resolve();
            }
            pause() { this.paused = true; clearTimeout(this._t); }
        };
    });

    const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(1500);

    console.log('\nStimmenauswahl');
    const voices = await page.evaluate(() => [...voiceSelect.options].map(o => o.textContent));
    check('Azure-Stimme steht oben', /Светлана \(Azure\)/.test(voices[0] || ''));
    check('Azure ist vorgewaehlt', await page.evaluate(() => !!(selectedVoice && selectedVoice.azure)));
    await page.evaluate(() => genderMaleBtn.click());
    check('maennlich -> Дмитрий (Azure)', await page.evaluate(() => selectedVoice && selectedVoice.name === 'ru-RU-DmitryNeural'));
    await page.evaluate(() => genderFemaleBtn.click());

    // Text laden wie im echten Ablauf: Modus "Texte", dann Datei-Feld
    const textFile = path.join(require('os').tmpdir(), 'azure_tts_test.txt');
    fs.writeFileSync(textFile, 'Привет. Как дела? Всё хорошо.', 'utf8');
    await page.evaluate(() => modeTextsBtn.click());
    await (await page.$('#fileInput')).uploadFile(textFile);
    await wait(800);
    check('Textmodus mit 3 Saetzen', await page.evaluate(() => sentences.length === 3));

    console.log('\nVorlesen ueber Azure');
    await page.evaluate(() => { window.__fetchCalls = []; mainSpeakBtn.click(); });
    await wait(2000);
    const calls = await page.evaluate(() => window.__fetchCalls);
    check('alle Saetze gelesen', await page.evaluate(() => currentSentenceIndex >= 3));
    check('Abruf an die richtige Region', calls.length > 0 && calls[0].url.startsWith('https://germanywestcentral.tts.speech.microsoft.com/'));
    check('jeder Satz nur einmal abgerufen (Vorab-Abruf + Cache)', calls.length === 3);
    check('Knopf wieder "Start"', await page.evaluate(() => mainSpeakLabel.textContent) === await page.evaluate(() => t('btn_start')));

    console.log('\nStopp mitten im Text');
    await page.evaluate(() => restartText());
    await page.evaluate(() => mainSpeakBtn.click());
    await wait(450);
    await page.evaluate(() => mainStopBtn.click());
    await wait(100);
    check('nach Stopp spricht Azure nicht mehr', await page.evaluate(() => !isAzureSpeaking()));
    check('Knopf heisst "Weiter"', await page.evaluate(() => mainSpeakLabel.textContent === t('btn_resume')));
    const idxAfterStop = await page.evaluate(() => currentSentenceIndex);
    await wait(600);
    check('Kette laeuft nach Stopp nicht weiter', await page.evaluate(() => currentSentenceIndex) === idxAfterStop);

    console.log('\nAzure lehnt den Schluessel ab');
    await page.evaluate(() => { restartText(); azureAudioCache.clear(); window.__fetchMode = 'auth'; mainSpeakBtn.click(); });
    await wait(300);
    const notice = await page.evaluate(() => ({ visible: ttsNotice.classList.contains('visible'), text: ttsNotice.textContent }));
    check('Hinweis sichtbar statt Stille', notice.visible);
    check('Hinweis nennt den Grund', notice.text.includes(await page.evaluate(() => t('tts_azure_reason_auth'))));
    check('Sprech-Anzeige zurueckgesetzt', await page.evaluate(() => !isSpeaking && mainSpeakBtn.style.display !== 'none'));

    console.log('\nBrowser-Stimme faellt aus (synthesis-failed)');
    await page.evaluate(() => {
        ttsNotice.classList.remove('visible');
        selectedVoice = null;   // Browser-Weg
        // speechSynthesis.speak ersetzen: meldet sofort den Fehler wie Edge
        speechSynthesis.speak = (u) => setTimeout(() => u.onerror({ error: 'synthesis-failed' }), 20);
        restartText();
        mainSpeakBtn.click();
    });
    await wait(300);
    const notice2 = await page.evaluate(() => ({ visible: ttsNotice.classList.contains('visible'), text: ttsNotice.textContent }));
    check('Hinweis bei synthesis-failed', notice2.visible && notice2.text.includes('synthesis-failed'));
    check('Weiter-Punkt gesetzt', await page.evaluate(() => resumeAvailable));

    console.log('\nAbbruch durch eigenen Stopp ist kein Fehler');
    await page.evaluate(() => {
        ttsNotice.classList.remove('visible');
        speechSynthesis.speak = (u) => setTimeout(() => u.onerror({ error: 'interrupted' }), 20);
        restartText();
        mainSpeakBtn.click();
    });
    await wait(300);
    check('kein Hinweis bei "interrupted"', await page.evaluate(() => !ttsNotice.classList.contains('visible')));

    check('keine Seitenfehler', errors.length === 0);
    if (errors.length) console.log(errors);
    await browser.close();
}

(async () => {
    unitTests();
    await browserTests();
    console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
