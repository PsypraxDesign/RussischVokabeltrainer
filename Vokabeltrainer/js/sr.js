// Russisch-Lernen — Spaced Repetition Algorithmen (SM-2 + FSRS-4.5)
// Wird vor dem Hauptscript in index.html geladen.
// Reine Algorithmen ohne DOM- oder State-Abhaengigkeiten.

// --- Faelligkeit auf Tagesgrenzen (M-14) ---
// Frueher: Date.now() + Tage * 86400000. Das ist ein rollendes 24-Stunden-
// Fenster — wer abends lernt, bekommt die Karte am Folgetag erst abends
// wieder. Faelligkeiten gehoeren auf den lokalen Tagesbeginn.
function dueTimestampForDays(intervalDays) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Math.max(1, Math.round(intervalDays)));
    return d.getTime();
}

// Tagesschluessel aus der lokalen Zeit, nicht aus UTC (M-14). toISOString()
// liefert den UTC-Tag; in Mitteleuropa zaehlt damit alles vor 01:00/02:00
// zum Vortag — Streak und Tagesstatistik brechen scheinbar grundlos ab.
function localDateKey(ts) {
    const d = ts === undefined ? new Date() : new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

// --- SM-2 Algorithm ---
function sm2Review(data, quality) {
    // quality: 0-5
    if (quality >= 3) {
        if (data.iterations === 0) data.interval = 1;
        else if (data.iterations === 1) data.interval = 6;
        else data.interval = Math.round(data.interval * data.easiness);
        data.iterations++;
        data.easiness = Math.max(1.3,
            data.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    } else {
        data.iterations = 0;
        data.interval = 1;
    }
    data.lastReview = Date.now();
    data.nextReview = dueTimestampForDays(data.interval);
    data.algorithm = 'sm2';
    return data;
}

// Predict SM-2 interval for a given quality
function sm2PredictInterval(data, quality) {
    const d = JSON.parse(JSON.stringify(data));
    if (quality >= 3) {
        if (d.iterations === 0) return 1;
        if (d.iterations === 1) return 6;
        return Math.round(d.interval * d.easiness);
    }
    return 1;
}

// --- FSRS Algorithm (FSRS-4.5 with default weights) ---
// w[0..3]  = S_0 fuer grade 1..4 (Init-Stabilitaet)
// w[4], w[5] = Init-Difficulty Parameter
// w[6]     = Difficulty-Delta pro grade
// w[7]     = Mean-Reversion-Gewicht fuer Difficulty
// w[8..10] = Stability-Growth Parameter
// w[11..14]= Forget-Stability Parameter
// w[15]    = Hard-Penalty, w[16] = Easy-Bonus
const FSRS_W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

function fsrsInitStability(grade) {
    return Math.max(0.1, FSRS_W[grade - 1]);
}

function fsrsInitDifficulty(grade) {
    return Math.min(10, Math.max(1, FSRS_W[4] - (grade - 3) * FSRS_W[5]));
}

function fsrsRetrievability(elapsedDays, stability) {
    // FSRS-4.5: R(t, S) = (1 + t/(9*S))^(-1)
    if (stability <= 0) return 1;
    return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

function fsrsNextDifficulty(d, grade) {
    // FSRS-4.5: linear damping + mean reversion auf D_0(4) mit Gewicht w[7]
    const deltaD = -FSRS_W[6] * (grade - 3);
    const dPrime = d + deltaD * (10 - d) / 9;
    const d0_4 = Math.min(10, Math.max(1, FSRS_W[4] - FSRS_W[5])); // D_0(Easy)
    const dNew = FSRS_W[7] * d0_4 + (1 - FSRS_W[7]) * dPrime;
    return Math.min(10, Math.max(1, dNew));
}

function fsrsNextStability(d, s, r, grade) {
    if (grade === 1) {
        // Forget stability
        return FSRS_W[11] * Math.pow(d, -FSRS_W[12]) *
            (Math.pow(s + 1, FSRS_W[13]) - 1) *
            Math.exp((1 - r) * FSRS_W[14]);
    }
    const hardPenalty = grade === 2 ? FSRS_W[15] : 1;
    const easyBonus = grade === 4 ? FSRS_W[16] : 1;
    return s * (1 + Math.exp(FSRS_W[8]) *
        (11 - d) * Math.pow(s, -FSRS_W[9]) *
        (Math.exp((1 - r) * FSRS_W[10]) - 1) *
        hardPenalty * easyBonus);
}

function fsrsReview(data, grade) {
    // grade: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
    if (data.reps === 0) {
        data.difficulty = fsrsInitDifficulty(grade);
        data.stability = fsrsInitStability(grade);
    } else {
        const elapsed = Math.max(0, (Date.now() - data.lastReview) / (1000 * 60 * 60 * 24));
        const r = fsrsRetrievability(elapsed, data.stability);
        data.difficulty = fsrsNextDifficulty(data.difficulty, grade);
        data.stability = fsrsNextStability(data.difficulty, data.stability, r, grade);
    }
    data.reps++;
    data.interval = Math.max(1, Math.round(data.stability));
    data.lastReview = Date.now();
    data.nextReview = dueTimestampForDays(data.interval);
    data.algorithm = 'fsrs';
    return data;
}

// Predict FSRS interval for a given grade
function fsrsPredictInterval(data, grade) {
    if (data.reps === 0) {
        return Math.max(1, Math.round(fsrsInitStability(grade)));
    }
    const elapsed = Math.max(0, (Date.now() - data.lastReview) / (1000 * 60 * 60 * 24));
    const r = fsrsRetrievability(elapsed, data.stability);
    const d = fsrsNextDifficulty(data.difficulty, grade);
    const s = fsrsNextStability(d, data.stability, r, grade);
    return Math.max(1, Math.round(s));
}
