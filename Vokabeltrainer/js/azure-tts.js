// Russisch-Lernen — Azure-Sprachausgabe (Microsoft Speech, REST)
// Wird vor dem Hauptscript in index.html geladen.
//
// Anlass (25.10.2026): Die kostenlosen Online-Stimmen von Edge (Светлана,
// Дмитрий) meldeten nur noch "synthesis-failed", eine russische Windows-Stimme
// liess sich nicht installieren — die App blieb stumm. Azure liefert dieselben
// Neural-Stimmen ueber einen eigenen Schluessel, unabhaengig vom Browser.
//
// Die REST-Schnittstelle kennt keine Wortgrenzen-Ereignisse. Die
// Wort-Hervorhebung wird deshalb aus der Audiodauer geschaetzt
// (estimateWordTimings), proportional zur Wortlaenge.

const AZURE_VOICES = [
    { azure: true, name: 'ru-RU-SvetlanaNeural', label: 'Светлана', gender: 'female' },
    { azure: true, name: 'ru-RU-DariyaNeural', label: 'Дария', gender: 'female' },
    { azure: true, name: 'ru-RU-DmitryNeural', label: 'Дмитрий', gender: 'male' }
];

// Dieselben Schluessel wie aussprache_trainer.html — alle per file://
// geoeffneten Seiten teilen sich im Browser einen localStorage.
const AZURE_LS_KEY = 'aussprache_azure_key';
const AZURE_LS_REGION = 'aussprache_azure_region';

const AZURE_CACHE_MAX = 150;

// --- Konfiguration: 1. api-key.js, 2. localStorage ---
function isAzureKeyFromFile() {
    return typeof AZURE_SPEECH_KEY !== 'undefined' && !!AZURE_SPEECH_KEY;
}

function getAzureConfig() {
    let key = '';
    let region = '';
    if (isAzureKeyFromFile()) {
        key = AZURE_SPEECH_KEY;
        region = (typeof AZURE_SPEECH_REGION !== 'undefined' && AZURE_SPEECH_REGION) || '';
    } else {
        try {
            key = localStorage.getItem(AZURE_LS_KEY) || '';
            region = localStorage.getItem(AZURE_LS_REGION) || '';
        } catch (e) { /* Speicher gesperrt: Azure bleibt aus */ }
    }
    key = key.trim();
    region = region.trim().toLowerCase();
    return { key, region, fromFile: isAzureKeyFromFile() };
}

function saveAzureConfig(key, region) {
    localStorage.setItem(AZURE_LS_KEY, (key || '').trim());
    localStorage.setItem(AZURE_LS_REGION, (region || '').trim().toLowerCase());
}

// Die Region landet in der URL — nur Kleinbuchstaben und Ziffern zulassen.
function isValidAzureRegion(region) {
    return /^[a-z0-9]+$/.test(region || '');
}

function isAzureConfigured() {
    const cfg = getAzureConfig();
    return !!cfg.key && isValidAzureRegion(cfg.region);
}

// --- SSML ---
// Browser-Rate (1 = normal) -> SSML-Prozentangabe ("-10%", "+20%")
function azureRateFromBrowserRate(rate) {
    const r = Number.isFinite(rate) && rate > 0 ? rate : 1;
    const pct = Math.round((r - 1) * 100);
    return (pct >= 0 ? '+' : '') + pct + '%';
}

function escapeXmlText(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildAzureSsml(text, voiceName, rate) {
    return '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU">'
        + '<voice name="' + escapeXmlText(voiceName) + '">'
        + '<prosody rate="' + azureRateFromBrowserRate(rate) + '">'
        + escapeXmlText(text)
        + '</prosody></voice></speak>';
}

// --- Geschaetzte Wort-Startzeiten (Sekunden) ---
// Jedes Wort bekommt Zeit proportional zu seiner Laenge (+1 fuer die Pause).
function estimateWordTimings(words, duration) {
    if (!words.length || !(duration > 0)) return [];
    const weights = words.map(w => w.length + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    const starts = [];
    let acc = 0;
    for (const w of weights) {
        starts.push(duration * acc / total);
        acc += w;
    }
    return starts;
}

// Index des Wortes, das zum Zeitpunkt `time` gesprochen wird.
function wordIndexAt(starts, time) {
    let idx = -1;
    for (let i = 0; i < starts.length; i++) {
        if (starts[i] <= time) idx = i; else break;
    }
    return idx;
}

// --- Abruf mit Zwischenspeicher ---
// Gleicher Satz, gleiche Stimme, gleiche Rate -> kein zweiter Abruf.
// Spart Kontingent und macht das Weiterlesen nahtlos (Vorab-Abruf).
const azureAudioCache = new Map();

function azureCacheKey(text, voiceName, rate) {
    return voiceName + '|' + azureRateFromBrowserRate(rate) + '|' + text;
}

function azureError(code, detail) {
    const err = new Error(code + (detail ? ': ' + detail : ''));
    err.code = code;
    return err;
}

function fetchAzureAudio(text, voiceName, rate) {
    const cacheKey = azureCacheKey(text, voiceName, rate);
    if (azureAudioCache.has(cacheKey)) {
        // Zuletzt benutzt ans Ende ruecken (einfaches LRU)
        const hit = azureAudioCache.get(cacheKey);
        azureAudioCache.delete(cacheKey);
        azureAudioCache.set(cacheKey, hit);
        return hit;
    }
    const cfg = getAzureConfig();
    if (!cfg.key || !isValidAzureRegion(cfg.region)) {
        return Promise.reject(azureError('config'));
    }
    const url = 'https://' + cfg.region + '.tts.speech.microsoft.com/cognitiveservices/v1';
    const promise = fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': cfg.key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
        },
        body: buildAzureSsml(text, voiceName, rate)
    }).catch(e => {
        throw azureError('network', e.message);
    }).then(res => {
        if (res.status === 401 || res.status === 403) throw azureError('auth', String(res.status));
        if (res.status === 429) throw azureError('quota', '429');
        if (!res.ok) throw azureError('http', String(res.status));
        return res.blob();
    }).then(blob => {
        if (!blob.size) throw azureError('http', 'leere Antwort');
        return blob;
    });
    // Fehlschlaege nicht merken — der naechste Versuch soll neu abrufen.
    promise.catch(() => azureAudioCache.delete(cacheKey));
    azureAudioCache.set(cacheKey, promise);
    while (azureAudioCache.size > AZURE_CACHE_MAX) {
        azureAudioCache.delete(azureAudioCache.keys().next().value);
    }
    return promise;
}

// --- Wiedergabe ---
// Genau eine Wiedergabe gleichzeitig. stopAzureSpeech() verhaelt sich wie
// speechSynthesis.cancel(): onEnd wird NICHT gerufen, nur onCancel.
let azurePlayback = null;   // { token, audio, url, onCancel, raf }
let azurePlayToken = 0;

function cleanupAzurePlayback(pb) {
    if (!pb) return;
    if (pb.raf) cancelAnimationFrame(pb.raf);
    if (pb.audio) {
        pb.audio.onended = pb.audio.onerror = pb.audio.onplaying = null;
        pb.audio.pause();
    }
    if (pb.url) URL.revokeObjectURL(pb.url);
}

function stopAzureSpeech() {
    azurePlayToken++;
    const pb = azurePlayback;
    azurePlayback = null;
    if (!pb) return;
    cleanupAzurePlayback(pb);
    if (pb.onCancel) pb.onCancel();
}

function isAzureSpeaking() {
    return !!azurePlayback;
}

// opts: { onStart, onEnd, onError(err), onCancel, onWord(idx), words: [] }
function playAzureSpeech(text, voiceName, rate, opts = {}) {
    stopAzureSpeech();
    const token = ++azurePlayToken;
    const pb = { token, audio: null, url: null, onCancel: opts.onCancel, raf: 0 };
    azurePlayback = pb;

    const fail = (err) => {
        if (azurePlayback !== pb) return;
        azurePlayback = null;
        cleanupAzurePlayback(pb);
        if (opts.onError) opts.onError(err);
    };

    fetchAzureAudio(text, voiceName, rate).then(blob => {
        if (azurePlayback !== pb) return;   // inzwischen abgebrochen
        pb.url = URL.createObjectURL(blob);
        const audio = new Audio(pb.url);
        pb.audio = audio;
        let starts = null;
        let lastWord = -1;

        const tick = () => {
            if (azurePlayback !== pb) return;
            if (!starts && audio.duration > 0 && opts.words) {
                starts = estimateWordTimings(opts.words, audio.duration);
            }
            if (starts && opts.onWord) {
                const idx = wordIndexAt(starts, audio.currentTime);
                if (idx > lastWord) {
                    lastWord = idx;
                    opts.onWord(idx);
                }
            }
            pb.raf = requestAnimationFrame(tick);
        };

        audio.onplaying = () => {
            if (azurePlayback !== pb) return;
            if (opts.onStart) opts.onStart();
            if (opts.onWord && !pb.raf) pb.raf = requestAnimationFrame(tick);
        };
        audio.onended = () => {
            if (azurePlayback !== pb) return;
            azurePlayback = null;
            cleanupAzurePlayback(pb);
            if (opts.onEnd) opts.onEnd();
        };
        audio.onerror = () => fail(azureError('audio'));
        audio.play().catch(e => fail(azureError('audio', e.message)));
    }).catch(fail);
}

// Naechsten Satz schon abrufen, waehrend der aktuelle noch laeuft.
function prefetchAzureAudio(text, voiceName, rate) {
    if (!text || !isAzureConfigured()) return;
    fetchAzureAudio(text, voiceName, rate).catch(() => { /* wird beim Abspielen gemeldet */ });
}
