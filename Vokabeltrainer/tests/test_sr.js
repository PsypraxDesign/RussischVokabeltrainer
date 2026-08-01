// Tests fuer js/sr.js — SM-2 und FSRS Algorithmen
// Laedt sr.js per eval in den Node-Scope (kein Build-Step).
// Aufruf: node test_sr.js

const fs = require('fs');
const path = require('path');

let src = fs.readFileSync(path.join(__dirname, '..', 'js', 'sr.js'), 'utf8');
// sr.js deklariert FSRS_W als `const` — per eval im Funktions-Scope waere es
// nicht fuer spaetere Code-Bloecke sichtbar. Wir ersetzen const/let durch var,
// damit die Bindings am Funktions-Scope haengen.
src = src.replace(/\bconst\s+FSRS_W\b/g, 'var FSRS_W');
eval(src);

let passed = 0;
let failed = 0;
const failures = [];

function assert(name, cond, info) {
    if (cond) {
        passed++;
        console.log('  OK   ' + name);
    } else {
        failed++;
        failures.push(name + (info ? ' — ' + info : ''));
        console.log('  FAIL ' + name + (info ? ' — ' + info : ''));
    }
}

function approx(a, b, eps = 1e-6) {
    return Math.abs(a - b) <= eps;
}

function newCard() {
    return {
        iterations: 0,
        easiness: 2.5,
        interval: 0,
        difficulty: 0,
        stability: 0,
        reps: 0,
        lastReview: 0,
        nextReview: 0,
        algorithm: ''
    };
}

// =============================================================
console.log('\n== SM-2 ==');
// =============================================================

// Klassische SuperMemo-Sequenz: n=0 -> I=1, n=1 -> I=6, n>=2 -> I = round(I*EF)
{
    const c = newCard();
    sm2Review(c, 5); // Good
    assert('SM-2: erste korrekte Antwort -> interval = 1', c.interval === 1, 'got ' + c.interval);
    assert('SM-2: iterations nach erster Antwort = 1', c.iterations === 1);

    sm2Review(c, 5);
    assert('SM-2: zweite korrekte Antwort -> interval = 6', c.interval === 6, 'got ' + c.interval);
    assert('SM-2: iterations nach zweiter Antwort = 2', c.iterations === 2);

    // Dritte Antwort: I = round(6 * EF). EF wurde zweimal mit q=5 erhoeht.
    // EF' = EF + (0.1 - 0*(0.08 + 0)) = EF + 0.1 -> 2.6, dann 2.7
    // ABER: Die EF-Aenderung passiert NACH der Intervallberechnung. D.h. das
    // dritte Intervall benutzt die EF NACH zwei Updates = 2.7.
    // Dritte Berechnung: round(6 * 2.7) = 16
    const expected = Math.round(6 * c.easiness); // easiness jetzt 2.7
    sm2Review(c, 5);
    assert('SM-2: dritte korrekte Antwort -> interval = round(6 * EF)',
        c.interval === expected, 'expected ' + expected + ' got ' + c.interval);
}

// Easiness-Update Formel: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
{
    const c = newCard();
    sm2Review(c, 5); // q=5: EF += 0.1
    assert('SM-2: EF nach q=5 = 2.6', approx(c.easiness, 2.6));

    const c2 = newCard();
    sm2Review(c2, 4); // q=4: EF += (0.1 - 1*(0.08+0.02)) = 0
    assert('SM-2: EF nach q=4 unveraendert', approx(c2.easiness, 2.5));

    const c3 = newCard();
    sm2Review(c3, 3); // q=3: EF += (0.1 - 2*(0.08+0.04)) = 0.1 - 0.24 = -0.14
    assert('SM-2: EF nach q=3 = 2.36', approx(c3.easiness, 2.36, 1e-9));
}

// Easiness-Untergrenze 1.3
{
    const c = newCard();
    c.easiness = 1.3;
    sm2Review(c, 3); // wuerde auf 1.16 fallen, muss bei 1.3 bleiben
    assert('SM-2: EF nicht unter 1.3', c.easiness === 1.3);
}

// Fehlschlag: iterations -> 0, interval -> 1
{
    const c = newCard();
    sm2Review(c, 5);
    sm2Review(c, 5);
    sm2Review(c, 5); // n=3, interval=16
    assert('SM-2: vor Fehlschlag iterations=3', c.iterations === 3);
    sm2Review(c, 1); // Fehlschlag
    assert('SM-2: nach Fehlschlag iterations=0', c.iterations === 0);
    assert('SM-2: nach Fehlschlag interval=1', c.interval === 1);
}

// nextReview = lastReview + interval*Tag
{
    const c = newCard();
    sm2Review(c, 5);
    const deltaDays = (c.nextReview - c.lastReview) / 86400000;
    assert('SM-2: nextReview liegt interval Tage nach lastReview', approx(deltaDays, c.interval, 1e-9));
}

// sm2PredictInterval stimmt mit sm2Review ueberein (ohne Mutation)
{
    const c = newCard();
    sm2Review(c, 5);
    sm2Review(c, 5); // n=2, interval=6, EF=2.7
    const snapshot = JSON.stringify(c);
    const predicted = sm2PredictInterval(c, 5);
    const expected = Math.round(6 * 2.7);
    assert('SM-2: PredictInterval = round(6*EF)', predicted === expected,
        'expected ' + expected + ' got ' + predicted);
    assert('SM-2: PredictInterval mutiert data nicht', JSON.stringify(c) === snapshot);
}

// PredictInterval fuer frische Karte
{
    const c = newCard();
    assert('SM-2: Predict fresh q=3 -> 1', sm2PredictInterval(c, 3) === 1);
    assert('SM-2: Predict fresh q=1 -> 1 (Fehlschlag)', sm2PredictInterval(c, 1) === 1);
}

// =============================================================
console.log('\n== FSRS ==');
// =============================================================

// FSRS Init-Stabilitaet = w[grade-1]
{
    for (let g = 1; g <= 4; g++) {
        const expected = Math.max(0.1, FSRS_W[g - 1]);
        assert('FSRS: initStability(' + g + ') = w[' + (g - 1) + '] = ' + expected,
            approx(fsrsInitStability(g), expected));
    }
}

// FSRS Init-Schwierigkeit
{
    // D_0(G) = clamp(w[4] - (G-3)*w[5], 1, 10)
    for (let g = 1; g <= 4; g++) {
        const expected = Math.min(10, Math.max(1, FSRS_W[4] - (g - 3) * FSRS_W[5]));
        assert('FSRS: initDifficulty(' + g + ') = ' + expected.toFixed(3),
            approx(fsrsInitDifficulty(g), expected));
    }
}

// Retrievability bei t=S sollte 0.9 sein (klassische FSRS-Konvention: Ziel-Retention 0.9 nach S Tagen)
{
    const r = fsrsRetrievability(10, 10);
    assert('FSRS: retrievability(t=S) = 0.9', approx(r, 0.9, 1e-9), 'got ' + r);
    const r2 = fsrsRetrievability(0, 5);
    assert('FSRS: retrievability(0) = 1', approx(r2, 1, 1e-9));
    const r3 = fsrsRetrievability(20, 10);
    assert('FSRS: retrievability(2S) = 9/11', approx(r3, 9 / 11, 1e-9), 'got ' + r3);
}

// Erste Bewertung setzt reps=1, stability/difficulty aus Init-Funktionen
{
    const c = newCard();
    fsrsReview(c, 3);
    assert('FSRS: nach erstem Review reps=1', c.reps === 1);
    assert('FSRS: nach erstem Review stability = initStability(3)',
        approx(c.stability, fsrsInitStability(3)));
    assert('FSRS: nach erstem Review difficulty = initDifficulty(3)',
        approx(c.difficulty, fsrsInitDifficulty(3)));
    assert('FSRS: algorithm = "fsrs"', c.algorithm === 'fsrs');
}

// Interval >= 1 und nextReview konsistent
{
    const c = newCard();
    fsrsReview(c, 3);
    assert('FSRS: interval >= 1', c.interval >= 1);
    const deltaDays = (c.nextReview - c.lastReview) / 86400000;
    assert('FSRS: nextReview = lastReview + interval Tage', approx(deltaDays, c.interval, 1e-9));
}

// Monotonie der Voraussage: Easy >= Good >= Hard (>= Again ist nicht garantiert, da grade=1 die Forget-Stability benutzt)
{
    const c = newCard();
    fsrsReview(c, 3); // etabliert Basis
    // Zeitreise simulieren: tue so als waere das Review lang her
    c.lastReview = Date.now() - 10 * 86400000;
    const pAgain = fsrsPredictInterval(c, 1);
    const pHard = fsrsPredictInterval(c, 2);
    const pGood = fsrsPredictInterval(c, 3);
    const pEasy = fsrsPredictInterval(c, 4);
    console.log('    predictions (after 10d): again=' + pAgain + ' hard=' + pHard + ' good=' + pGood + ' easy=' + pEasy);
    assert('FSRS: Easy >= Good', pEasy >= pGood);
    assert('FSRS: Good >= Hard', pGood >= pHard);
    // Again sollte Stabilitaet reduzieren -> kleiner als Good
    assert('FSRS: Again < Good', pAgain < pGood, 'again=' + pAgain + ' good=' + pGood);
}

// fresh-card Predictions sind die Init-Stabilitaeten
{
    const c = newCard();
    for (let g = 1; g <= 4; g++) {
        const expected = Math.max(1, Math.round(fsrsInitStability(g)));
        assert('FSRS: Predict fresh grade=' + g + ' -> ' + expected,
            fsrsPredictInterval(c, g) === expected);
    }
}

// Stabilitaet waechst bei wiederholtem Good (Karte etabliert sich)
{
    const c = newCard();
    fsrsReview(c, 3);
    const s1 = c.stability;
    // Review direkt nach Faelligkeit (elapsed ~ interval)
    c.lastReview = Date.now() - c.interval * 86400000;
    fsrsReview(c, 3);
    const s2 = c.stability;
    assert('FSRS: Stability waechst bei Good-Good', s2 > s1, 's1=' + s1 + ' s2=' + s2);
}

// Difficulty bleibt im [1,10] Bereich
{
    const c = newCard();
    for (let i = 0; i < 20; i++) fsrsReview(c, 1);
    assert('FSRS: Difficulty <= 10 nach 20x Again', c.difficulty <= 10);
    assert('FSRS: Difficulty >= 1 nach 20x Again', c.difficulty >= 1);
}

// =============================================================
console.log('\n== Ergebnis ==');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
    console.log('\nFehlgeschlagene Tests:');
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
}
