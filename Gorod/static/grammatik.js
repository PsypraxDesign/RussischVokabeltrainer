// Город — Grammatik zum Antippen
// Findet in einem russischen Satz Stellen, zu denen es eine Erklärung gibt
// (Präposition + Fall, Zahl + Nomen, Datum, Verben, feste Wendungen …).
// Die Regeln stehen in static/grammatik.json, erzeugt von werkzeuge/grammatik_regeln.py.
//
// Gesucht wird ohne Betonungszeichen und mit е statt ё – Regeln mit "betont": true
// sehen die Betonung (сто́ит „kostet“ / стои́т „steht“). Angezeigt wird der Originaltext.
// Auch in Node nutzbar (werkzeuge/grammatik_pruefen.js).

(function (wurzel) {
    let regeln = [], lemmata = {};

    function laden(daten) {
        lemmata = daten.lemmata || {};
        regeln = (daten.regeln || []).map(r => {
            try {
                return { ...r, re: new RegExp(`(?<![\\p{L}\\u0301-])(?:${r.muster})(?![\\p{L}\\u0301-])`, r.gross ? 'gdu' : 'gidu') };
            } catch (e) {
                console.warn('Grammatik-Regel', r.id, e.message);
                return null;
            }
        }).filter(Boolean);
    }

    // Suchfassung des Texts und Rückweg zu den Original-Positionen
    function fassungen(text) {
        let flach = '', karte = [];
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '́') continue;
            flach += c === 'ё' ? 'е' : c === 'Ё' ? 'Е' : c;
            karte.push(i);
        }
        karte.push(text.length);
        const betont = text.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
        return { flach, karte, betont };
    }

    const schluessel = (t) => t.toLowerCase().replace(/́/g, '').replace(/ё/g, 'е');

    // „Москва́ → в Москве́“: Grundform der Gruppe np (ganz oder letztes Wort)
    function grundform(npOrig) {
        if (!npOrig) return '';
        const ganz = lemmata[schluessel(npOrig)];
        if (ganz && schluessel(ganz) !== schluessel(npOrig)) return `${ganz} → ${npOrig}`;
        const woerter = npOrig.split(/\s+/);
        if (woerter.length > 1) {
            const letzt = woerter[woerter.length - 1];
            const l = lemmata[schluessel(letzt)];
            if (l && schluessel(l) !== schluessel(letzt)) return `${l} → ${letzt}`;
        }
        return '';
    }

    // Vorlage füllen: {0} ganzer Treffer, {1} … / {name} Gruppen, {L} Grundform.
    // Zeilen mit leerem Platzhalter fallen weg; „?name:“ am Zeilenanfang = nur wenn Gruppe getroffen.
    function fuellen(vorlage, werte) {
        return (vorlage || '').split('\n').map(zeile => {
            const bed = zeile.match(/^\?(\w+):\s?/);
            if (bed) {
                if (!werte[bed[1]]) return null;
                zeile = zeile.slice(bed[0].length);
            }
            let leer = false;
            const fertig = zeile.replace(/\{(\w+)\}/g, (_, k) => {
                const v = werte[k];
                if (!v) leer = true;
                return v || '';
            });
            return leer ? null : fertig;
        }).filter(z => z !== null).join('\n');
    }

    function teile(text) {
        if (!text || !regeln.length) return [text];
        const { flach, karte, betont } = fassungen(text);
        const belegt = new Uint8Array(text.length);
        const treffer = [];
        for (const r of regeln) {
            const quelle = r.betont ? betont : flach;
            const pos = r.betont ? (i) => i : (i) => karte[i];
            r.re.lastIndex = 0;
            let m;
            while ((m = r.re.exec(quelle))) {
                if (!m[0]) { r.re.lastIndex++; continue; }
                const a = pos(m.index), b = pos(m.index + m[0].length);
                let frei = true;
                for (let i = a; i < b; i++) if (belegt[i]) { frei = false; break; }
                if (!frei) continue;
                belegt.fill(1, a, b);
                const werte = { 0: text.slice(a, b) };
                m.indices.forEach((ix, n) => { if (n && ix) werte[n] = text.slice(pos(ix[0]), pos(ix[1])); });
                Object.entries(m.indices.groups || {}).forEach(([k, ix]) => { if (ix) werte[k] = text.slice(pos(ix[0]), pos(ix[1])); });
                werte.L = grundform(werte.np);
                treffer.push({ a, b, text: werte[0], titel: fuellen(r.titel, werte), erkl: fuellen(r.text, werte), regel: r.id });
            }
        }
        treffer.sort((x, y) => x.a - y.a);
        const aus = [];
        let i = 0;
        treffer.forEach(t => {
            if (t.a > i) aus.push(text.slice(i, t.a));
            aus.push({ text: t.text, titel: t.titel, erkl: t.erkl, regel: t.regel });
            i = t.b;
        });
        if (i < text.length) aus.push(text.slice(i));
        return aus;
    }

    wurzel.Grammatik = { laden, teile, get anzahl() { return regeln.length; } };
})(typeof window !== 'undefined' ? window : globalThis);
