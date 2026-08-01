// Bereinigt Dubletten in vokabeln.json.
// Aufruf: node dedupe_vokabeln.js [pfad/zur/vokabeln.json]
//
// Dublettenkriterium: normalisiertes (front|back)-Tupel.
// Normalisierung: lowercase, Akzente (U+0301) entfernt, Whitespace getrimmt,
// fuehrende Grammatik-Klammern wie "(Akk.) " ignoriert.
//
// Merge-Regel: Beim Zusammenfuehren wird der "reichste" Eintrag behalten
// (meiste nicht-leere Felder), und fehlende Felder aus den Dubletten ergaenzt.
// Forms-Arrays werden vereinigt. Original wird als .bak gesichert.

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] ||
    path.join(__dirname, '..', 'Vokabelliste_JSON', 'vokabeln.json');

if (!fs.existsSync(inputPath)) {
    console.error('Datei nicht gefunden: ' + inputPath);
    process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const entries = JSON.parse(raw);
console.log('Gelesen: ' + entries.length + ' Eintraege aus ' + inputPath);

function normalize(s) {
    if (!s) return '';
    return String(s)
        .replace(/^\(([^)]*)\)\s*/, '')          // fuehrende Grammatik-Klammer raus
        .replace(/[\u0300-\u036f]/g, '')         // Kombinationszeichen (Akzente)
        .replace(/ё/gi, 'е')                     // ё/е zusammenfassen
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function keyOf(e) {
    return normalize(e.front) + '|' + normalize(e.back);
}

// "Reichtum": Anzahl Felder mit substantiellem Inhalt
function richness(e) {
    let r = 0;
    if (e.back && e.back.trim()) r += 2;
    if (e.grammar && e.grammar.trim()) r += 1;
    if (Array.isArray(e.forms) && e.forms.length) r += 1;
    if (e.conjugation) r += 3;
    if (e.declension) r += 3;
    if (e.stress) r += 1;
    if (e.wordType) r += 1;
    if (Array.isArray(e.images) && e.images.length) r += 2;
    if (e.source && e.source.trim()) r += 1;
    return r;
}

function mergeInto(target, src) {
    if (!target.back && src.back) target.back = src.back;
    if (!target.grammar && src.grammar) target.grammar = src.grammar;
    if (!target.conjugation && src.conjugation) target.conjugation = src.conjugation;
    if (!target.declension && src.declension) target.declension = src.declension;
    if (!target.stress && src.stress) target.stress = src.stress;
    if (!target.wordType && src.wordType) target.wordType = src.wordType;
    // Forms vereinigen
    const forms = new Set([...(target.forms || []), ...(src.forms || [])]);
    target.forms = [...forms];
    // Images vereinigen (eindeutig per JSON-String)
    const imgSet = new Map();
    [...(target.images || []), ...(src.images || [])].forEach(im => {
        imgSet.set(JSON.stringify(im), im);
    });
    target.images = [...imgSet.values()];
    // Tags vereinigen
    const tags = new Set([...(target.tags || []), ...(src.tags || [])]);
    target.tags = [...tags];
}

const groups = new Map();
const empties = [];

for (const e of entries) {
    // Voellig leere Eintraege (kein front oder front beginnt mit "aspect_partner:")
    if (!e.front || !e.front.trim()) { empties.push(e); continue; }
    if (/^aspect_partner:/i.test(e.front)) { empties.push(e); continue; }
    const k = keyOf(e);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
}

const cleaned = [];
let dupGroups = 0;
let removed = 0;
const examples = [];

for (const [k, group] of groups) {
    if (group.length === 1) {
        cleaned.push(group[0]);
    } else {
        dupGroups++;
        removed += group.length - 1;
        // Reichsten Eintrag als Basis
        group.sort((a, b) => richness(b) - richness(a));
        const winner = group[0];
        for (let i = 1; i < group.length; i++) mergeInto(winner, group[i]);
        cleaned.push(winner);
        if (examples.length < 10) {
            examples.push({
                front: winner.front,
                back: winner.back,
                count: group.length,
                sources: [...new Set(group.map(g => g.source))]
            });
        }
    }
}

console.log('');
console.log('Dubletten-Gruppen:    ' + dupGroups);
console.log('Entfernte Eintraege:  ' + removed);
console.log('Leere/aspect_partner: ' + empties.length + ' (werden entfernt)');
console.log('Vorher:               ' + entries.length);
console.log('Nachher:              ' + cleaned.length);

if (examples.length) {
    console.log('\nBeispiele:');
    for (const ex of examples) {
        console.log('  ' + ex.count + 'x  ' + ex.front + '  -> ' + (ex.back || '(leer)') +
            '   [' + ex.sources.join(', ') + ']');
    }
}

if (dupGroups === 0 && empties.length === 0) {
    console.log('\nKeine Aenderungen noetig.');
    process.exit(0);
}

// Backup + Schreiben
const bakPath = inputPath + '.bak';
fs.writeFileSync(bakPath, raw, 'utf8');
console.log('\nBackup geschrieben: ' + bakPath);

fs.writeFileSync(inputPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log('Bereinigte Datei:   ' + inputPath);
