// Город — Sprachausgabe
// Azure-Stimmen aus dem Vokabeltrainer (/geteilt/azure-tts.js); ohne Schlüssel
// springen die russischen Browser-Stimmen ein.
//
// Figuren haben feste Stimmen, damit man im Dialog hört, wer spricht:
//   erzaehler  – in der Kopfleiste wählbar (Wimmelbild, Hören & Zeigen)
//   weiblich   – Дария (z. B. die Kellnerin)
//   maennlich  – Дмитрий (man selbst)

(function () {
    const RATE = 0.9;
    const FIGUREN_AZURE = { weiblich: 'ru-RU-DariyaNeural', maennlich: 'ru-RU-DmitryNeural' };
    const hatAzure = () => typeof isAzureConfigured === 'function' && isAzureConfigured();

    let browserStimmen = [];
    let erzaehler = null;        // gewählte Stimme (Azure-Objekt oder Browser-Stimme)
    let beiStoerung = () => {};  // setzt der Kern: zeigt einen Hinweis

    function bereinigen(text) {
        if (typeof cleanTextForSpeech === 'function') return cleanTextForSpeech(text);
        return String(text).normalize('NFD').replace(/́/g, '').normalize('NFC');
    }

    // Edge spielt Ton erst nach dem ersten Klick in die Seite.
    function darfTon() {
        return !navigator.userActivation || navigator.userActivation.hasBeenActive;
    }

    function liste() {
        const azure = hatAzure() ? AZURE_VOICES : [];
        return azure.concat(browserStimmen.filter(v => v.lang.startsWith('ru')));
    }

    function geschlecht(v) {
        if (v.gender) return v.gender;
        if (typeof getVoiceGender === 'function') return getVoiceGender(v);
        return 'unknown';
    }

    function azureName(figur) {
        if (figur === 'weiblich' || figur === 'maennlich') return FIGUREN_AZURE[figur];
        return erzaehler && erzaehler.azure ? erzaehler.name : 'ru-RU-SvetlanaNeural';
    }

    function stop() {
        if (typeof stopAzureSpeech === 'function') stopAzureSpeech();
        speechSynthesis.cancel();
    }

    function perBrowser(text, figur) {
        return new Promise(resolve => {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'ru-RU';
            u.rate = RATE;
            const ru = browserStimmen.filter(v => v.lang.startsWith('ru'));
            if (figur === 'weiblich' || figur === 'maennlich') {
                const passend = ru.find(v => geschlecht(v) === (figur === 'weiblich' ? 'female' : 'male'));
                if (passend) u.voice = passend;
            } else if (erzaehler && !erzaehler.azure) {
                u.voice = erzaehler;
            }
            const notbremse = setTimeout(resolve, 9000);   // manche Browser melden das Ende nie
            u.onend = () => { clearTimeout(notbremse); resolve(); };
            u.onerror = (e) => {
                clearTimeout(notbremse);
                if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
                    beiStoerung(`Browser-Stimme ausgefallen (${e.error}).`);
                }
                resolve();
            };
            speechSynthesis.speak(u);
        });
    }

    // Spricht russischen Text. Löst auf, wenn fertig oder abgebrochen.
    function sage(text, figur = 'erzaehler') {
        stop();
        const sauber = bereinigen(text);
        if (!sauber || !darfTon()) return Promise.resolve();
        const azureMoeglich = hatAzure() && (figur !== 'erzaehler' || !erzaehler || erzaehler.azure);
        if (!azureMoeglich) return perBrowser(sauber, figur);
        return new Promise(resolve => {
            playAzureSpeech(sauber, azureName(figur), RATE, {
                onEnd: resolve,
                onCancel: resolve,
                onError: (err) => {
                    const gruende = { auth: 'Schlüssel ungültig', quota: 'Kontingent erschöpft', network: 'keine Verbindung', config: 'Schlüssel fehlt' };
                    beiStoerung('Azure-Stimme gestört: ' + (gruende[err && err.code] || (err && err.message) || 'unbekannt') + ' – Browser-Stimme springt ein.');
                    perBrowser(sauber, figur).then(resolve);
                }
            });
        });
    }

    function vorabladen(text, figur = 'erzaehler') {
        if (!hatAzure()) return;
        prefetchAzureAudio(bereinigen(text), azureName(figur), RATE);
    }

    function waehlen(name) {
        erzaehler = liste().find(v => v.name === name) || erzaehler;
    }

    function laden(onFertig) {
        const neu = () => {
            browserStimmen = speechSynthesis.getVoices();
            if (!erzaehler) erzaehler = liste().find(v => v.azure) || liste()[0] || null;
            onFertig && onFertig();
        };
        speechSynthesis.onvoiceschanged = neu;
        neu();
    }

    window.Stimmen = {
        sage, stop, vorabladen, liste, waehlen, laden, darfTon, geschlecht,
        get erzaehler() { return erzaehler; },
        set beiStoerung(fn) { beiStoerung = fn; },
        get mitAzure() { return hatAzure(); }
    };
})();
