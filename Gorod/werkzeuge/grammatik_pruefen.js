// Prüft die Grammatik-Regeln an allen russischen Sätzen der Module.
// Aufruf: node werkzeuge/grammatik_pruefen.js [regel-id]   (mit id: alle Treffer dieser Regel)
const fs = require('fs');
const path = require('path');

const basis = path.resolve(__dirname, '..');
require(path.join(basis, 'static', 'grammatik.js'));
const daten = JSON.parse(fs.readFileSync(path.join(basis, 'static', 'grammatik.json'), 'utf8'));
Grammatik.laden(daten);

const saetze = new Set();
for (const m of fs.readdirSync(path.join(basis, 'module'))) {
    const datei = path.join(basis, 'module', m, 'inhalt.json');
    if (!fs.existsSync(datei)) continue;
    (function lauf(x) {
        if (Array.isArray(x)) x.forEach(lauf);
        else if (x && typeof x === 'object') Object.values(x).forEach(lauf);
        else if (typeof x === 'string' && /[а-яё]/i.test(x) && x.includes(' ') && !/[a-zäöüß]{3}/i.test(x)) saetze.add(x);
    })(JSON.parse(fs.readFileSync(datei, 'utf8')));
}

const nurRegel = process.argv[2];
const proRegel = {};
let ohne = 0;
for (const s of saetze) {
    const teile = Grammatik.teile(s);
    const stellen = teile.filter(t => typeof t !== 'string');
    if (!stellen.length) ohne++;
    stellen.forEach(t => { (proRegel[t.regel] = proRegel[t.regel] || []).push({ t, s }); });
}
console.log(`${Grammatik.anzahl} Regeln, ${saetze.size} Sätze, davon ${ohne} ohne Stelle\n`);
if (nurRegel) {
    (proRegel[nurRegel] || []).forEach(({ t, s }) => console.log(`[${t.text}]  ←  ${s}\n   ${t.erkl.replace(/\n/g, ' ¶ ')}`));
} else {
    daten.regeln.forEach(r => {
        const l = proRegel[r.id] || [];
        const beispiele = [...new Set(l.map(x => x.t.text))].slice(0, 8);
        console.log(`${String(l.length).padStart(4)}  ${r.id.padEnd(18)} ${beispiele.join(' | ')}`);
    });
}
