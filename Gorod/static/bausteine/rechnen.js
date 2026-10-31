// Baustein „Rechnen“ (Schule, уро́к матема́тики)
// Auf einer Kreidetafel über dem Bild stehen Aufgaben; die Lehrerin spricht.
// Drei Arten, gemischt:
//   hören   – „Ско́лько бу́дет семь плюс пять?“, die Tafel zeigt nur „? + ? = ?“
//   lesen   – „8 − 3 = 5“ steht da, man wählt den richtigen Satz („Во́семь ми́нус три – пять.“)
//   aufgabe – Textaufgabe mit Bildern: „У Ма́ши три я́блока …“ → „Пять я́блок.“ (Zahl + Kasus)
//
// Nutzt aus inhalt.json: rechnen { stimme, nomen[], aufgaben[], grammatik{} }
// Nomen:   id, ru [1, 2–4, 5+], g (m/n/f), de [Sg, Pl], bild (Emoji)
// Aufgabe: op (+/−), nomen [ids], text, de (Platzhalter {a} {b} {pl} {a_de} {b_de} {pl_de}), a [von, bis], b [von, bis],
//          person {de, nom, gen, regel} für die Erklärungen ({p_de} {p_nom} {p_gen} {p_regel})
//          Im text markiert [Wörter|schlüssel] eine antippbare Grammatik-Stelle.
// Grammatik: schlüssel → { titel, text }; zahl_1 / zahl_2_4 / zahl_5 erklären Zahl + Nomen ({menge}).

(function () {
    const RUNDEN = 8;
    const OPS = {
        '+': { ru: 'плюс', f: (a, b) => a + b }, '−': { ru: 'ми́нус', f: (a, b) => a - b },
        '×': { ru: 'умно́жить на', f: (a, b) => a * b }, ':': { ru: 'раздели́ть на', f: (a, b) => a / b }
    };
    const GEGEN = { '+': '−', '−': '+', '×': ':', ':': '×' };
    const zufall = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const ohneBetonung = (t) => t.replace(/́/g, '');
    const ohneMarken = (t) => t.replace(/\[([^\]|]+)\|\w+\]/g, '$1');

    // Zahlwort mit passendem Genus (одно́ я́блоко, одна́ / две …)
    function zahl(n, g = 'm') {
        let w = Zahlwort.zahlwort(n);
        if (g === 'n') w = w.replace(/оди́н$/, 'одно́');
        if (g === 'f') w = w.replace(/оди́н$/, 'одна́').replace(/(^|\s)два$/, '$1две');
        return w;
    }
    const menge = (n, nomen) => `${zahl(n, nomen.g)} ${Zahlwort.form(n, ...nomen.ru)}`;
    function regel(n) {
        const z = n % 100, e = n % 10;
        if (z >= 11 && z <= 14) return 'der Genitiv Plural';
        if (e === 1) return 'der Nominativ Singular';
        if (e >= 2 && e <= 4) return 'der Genitiv Singular';
        return 'der Genitiv Plural';
    }

    Gorod.bausteine.rechnen = {
        start(ctx) {
            const G = Gorod;
            const daten = ctx.inhalt.rechnen;
            const stimme = daten.stimme || 'weiblich';
            let deck, i, richtig, fehlversuch, laufend = true;
            const q = (s) => ctx.tafel.querySelector(s);
            const gram = daten.grammatik || {};

            // ---------- Grammatik-Stellen ----------
            // Zahl + Nomen: passende Regel und die Übersicht mit den drei Formen dieses Nomens
            function zahlRegel(n, menge, nomen) {
                const z = n % 100, e = n % 10;
                const key = z >= 11 && z <= 14 ? 'zahl_11_14' : e === 1 ? 'zahl_1' : e >= 2 && e <= 4 ? 'zahl_2_4' : 'zahl_5';
                const klingt = z >= 11 && z <= 14 ? e : null;   // двена́дцать „klingt nach“ два
                const zeilen = [gram[key], gram.zahl_alle].filter(Boolean).map(g => g.text).join('\n');
                return zeilen.replaceAll('{menge}', menge).replaceAll('{zahlwort}', Zahlwort.zahlwort(n))
                    .replaceAll('{klingt}', klingt ? zahl(klingt, nomen.g) : '')
                    .replaceAll('{falle}', klingt ? `${Zahlwort.zahlwort(n)} ${klingt === 1 ? nomen.ru[0] : nomen.ru[1]}` : '')
                    .replaceAll('{eins}', zahl(1, nomen.g)).replaceAll('{f1}', nomen.ru[0])
                    .replaceAll('{f2}', nomen.ru[1]).replaceAll('{f5}', nomen.ru[2]);
            }
            // Eine Stelle; n = Zahl, falls die Stelle eine Mengenangabe ist
            function stelle(text, key, n = null, fuell = (x) => x, nomen = null) {
                const g = gram[key];
                const erkl = [g ? fuell(g.text) : '', n != null ? zahlRegel(n, text, nomen) : ''].filter(Boolean).join('\n');
                return { text, titel: g && g.titel ? fuell(g.titel) : '', erkl };
            }
            // „[У Ма́ши|u_gen] [{a}|menge_nom].“ → Teile für G.grammatikSatz
            function zerlege(vorlage, fuell, zahlen, nomen) {
                return vorlage.split(/(\[[^\]]+\])/).filter(Boolean).map(st => {
                    const m = st.match(/^\[(.+)\|(\w+)\]$/);
                    if (!m) return fuell(st);
                    const n = m[1].includes('{a}') ? zahlen.a : m[1].includes('{b}') ? zahlen.b : null;
                    return stelle(fuell(m[1]), m[2], n, fuell, nomen);
                });
            }
            const opSchluessel = (op) => (op === '×' ? 'umnozhit' : op === ':' ? 'razdelit' : 'plus_minus');
            // „Во́семь ми́нус три – пять.“ mit Stellen für Rechenzeichen und Strich
            function satzTeile(a, op, b, c) {
                return [`${gross(Zahlwort.zahlwort(a))} `, stelle(OPS[op].ru, opSchluessel(op)), ` ${Zahlwort.zahlwort(b)} `,
                    stelle(`– ${Zahlwort.zahlwort(c)}`, 'tire'), '.'];
            }

            // ---------- Kreidetafel über dem Bild ----------
            const buehne = document.createElement('div');
            buehne.className = 'fahrplan-buehne kreide rechen-buehne';
            buehne.innerHTML = `
              <div class="abfahrt-tafel rechen-tafel">
                <div class="at-kopf"><span>Матема́тика</span><span class="at-de">Mathe</span></div>
                <div class="rt-aufgabe" id="rt-aufgabe"></div>
                <div class="rt-bilder" id="rt-bilder"></div>
              </div>`;
            ctx.buehne.appendChild(buehne);
            function kreide(text) {
                const el = buehne.querySelector('#rt-aufgabe');
                const zeichen = [...text];
                let n = 0;
                el.textContent = '';
                const token = (kreide.token = (kreide.token || 0) + 1);
                if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
                (function schritt() {
                    if (token !== kreide.token || !el.isConnected) return;
                    el.textContent = zeichen.slice(0, ++n).join('');
                    if (n < zeichen.length) setTimeout(schritt, 55);
                })();
            }

            // ---------- Aufgaben erzeugen ----------
            function rechnung() {
                const op = G.mischen(['+', '+', '−', '−', '×', ':'])[0];
                let a, b;
                if (op === '+') { a = zufall(2, 12); b = zufall(2, 20 - a); }
                else if (op === '−') { a = zufall(5, 20); b = zufall(1, a - 1); }
                else if (op === '×') { a = zufall(2, 5); b = zufall(2, 5); }
                else { b = zufall(2, 5); a = b * zufall(2, 5); }
                return { op, a, b, c: OPS[op].f(a, b) };
            }
            function satz(a, op, b, c) { return `${gross(Zahlwort.zahlwort(a))} ${OPS[op].ru} ${Zahlwort.zahlwort(b)} – ${Zahlwort.zahlwort(c)}.`; }

            function hoeren() {
                const r = rechnung();
                const text = `Ско́лько бу́дет ${Zahlwort.zahlwort(r.a)} ${OPS[r.op].ru} ${Zahlwort.zahlwort(r.b)}?`;
                const andere = new Set();
                const kandidaten = [r.c + 1, r.c - 1, r.c < 10 ? r.c + 10 : r.c - 10, OPS[GEGEN[r.op]].f(r.a, r.b), r.c + 2];
                kandidaten.forEach(x => { if (Number.isInteger(x) && x >= 0 && x !== r.c && andere.size < 3) andere.add(x); });
                return {
                    art: 'hoeren', sprich: text, frage: '🔊 Hör zu – wie viel ist das?', frage_ru: text,
                    de: `Wie viel ist ${r.a} ${r.op} ${r.b}?`,
                    tafel: `? ${r.op} ? = ?`, tafel_danach: `${r.a} ${r.op} ${r.b} = ${r.c}`,
                    optionen: [{ text: String(r.c), ok: true }, ...[...andere].map(x => ({ text: String(x),
                        hinweis: `Hör noch einmal genau hin: „${ohneBetonung(text)}“` }))],
                    loesung: satz(r.a, r.op, r.b, r.c), loesung_teile: satzTeile(r.a, r.op, r.b, r.c),
                    // erst nach der Antwort zeigen – vorher würde der Text das Hören verraten
                    frage_danach: [stelle('Ско́лько бу́дет', 'skolko_budet'), ` ${Zahlwort.zahlwort(r.a)} `,
                        stelle(OPS[r.op].ru, opSchluessel(r.op)), ` ${Zahlwort.zahlwort(r.b)}?`]
                };
            }

            function lesen() {
                const r = rechnung();
                const richtigerSatz = satz(r.a, r.op, r.b, r.c);
                const falsch = [{ text: satz(r.a, GEGEN[r.op], r.b, r.c), hinweis: 'плюс = +, ми́нус = −, умно́жить на = ×, раздели́ть на = :' }];
                // Zehner-Falle: во́семь ↔ восемна́дцать
                const welche = [['a', r.a], ['b', r.b], ['c', r.c]].find(([, n]) => (n >= 2 && n <= 9) || (n >= 12 && n <= 19));
                if (welche) {
                    const [k, n] = welche, falschN = n < 10 ? n + 10 : n - 10;
                    const w = { ...r, [k]: falschN };
                    falsch.push({ text: satz(w.a, w.op, w.b, w.c), hinweis: `${Zahlwort.zahlwort(falschN)} = ${falschN}. Auf der Tafel steht ${n}: ${Zahlwort.zahlwort(n)}.` });
                }
                if (falsch.length < 2) falsch.push({ text: satz(r.a, r.op, r.b, r.c + 1), hinweis: `Rechne nach: ${r.a} ${r.op} ${r.b} = ${r.c}.` });
                return {
                    art: 'lesen', sprich: 'Прочита́й приме́р.', frage: 'Прочита́й приме́р.', frage_ru: 'Прочита́й приме́р.',
                    de: 'Lies die Rechnung vor.', tafel: `${r.a} ${r.op} ${r.b} = ${r.c}`, tafel_danach: `${r.a} ${r.op} ${r.b} = ${r.c}`,
                    frage_teile: [stelle('Прочита́й', 'prochitai'), ' ', stelle('приме́р', 'primer'), '.'],
                    optionen: [{ text: richtigerSatz, ok: true }, ...falsch], loesung: richtigerSatz,
                    loesung_teile: satzTeile(r.a, r.op, r.b, r.c)
                };
            }

            function textaufgabe() {
                const v = G.mischen(daten.aufgaben)[0];
                const nomenId = G.mischen(v.nomen)[0];
                const nomen = daten.nomen.find(x => x.id === nomenId);
                let a = zufall(v.a[0], v.a[1]), b = zufall(v.b[0], v.b[1]);
                if (v.op === '−' && b >= a) b = a - 1;
                const c = OPS[v.op].f(a, b);
                const de = (n) => `${n} ${n === 1 ? nomen.de[0] : nomen.de[1]}`;
                const p = v.person || {};
                const fuell = (t) => t.replaceAll('{a}', menge(a, nomen)).replaceAll('{b}', menge(b, nomen)).replaceAll('{pl}', nomen.ru[2])
                    .replaceAll('{a_de}', de(a)).replaceAll('{b_de}', de(b)).replaceAll('{pl_de}', nomen.de[1])
                    .replaceAll('{p_de}', p.de || '').replaceAll('{p_nom}', p.nom || '').replaceAll('{p_gen}', p.gen || '')
                    .replaceAll('{p_regel}', p.regel || '');
                const text = fuell(ohneMarken(v.text));
                const richtigeForm = Zahlwort.form(c, ...nomen.ru);
                const andereForm = nomen.ru.find(f => f !== richtigeForm && (richtigeForm === nomen.ru[2] ? f === nomen.ru[1] : f === nomen.ru[2]));
                const c2 = OPS[GEGEN[v.op]].f(a, b);
                const zahlFalsch = c2 > 0 && c2 !== c ? c2 : c + 1;
                return {
                    art: 'aufgabe', sprich: text, frage: text, frage_ru: text, de: fuell(v.de),
                    frage_teile: zerlege(v.text, fuell, { a, b }, nomen),
                    tafel: 'Зада́ча', bilder: { n1: a, n2: b, op: v.op, bild: nomen.bild }, tafel_danach: `${a} ${v.op} ${b} = ${c}`,
                    optionen: [
                        { text: `${gross(menge(c, nomen))}.`, ok: true },
                        { text: `${gross(zahl(c, nomen.g))} ${andereForm}.`, hinweis: `Nach ${zahl(c, nomen.g)} steht ${regel(c)}: ${menge(c, nomen)}.` },
                        { text: `${gross(menge(zahlFalsch, nomen))}.`, hinweis: `Rechne nach: ${a} ${v.op} ${b} = ${c}.` }
                    ],
                    loesung: `${gross(menge(c, nomen))}.`,
                    loesung_teile: [{ text: gross(menge(c, nomen)), titel: 'Zahl + Nomen', erkl: zahlRegel(c, menge(c, nomen), nomen) }, '.']
                };
            }

            function zeigeBilder(b) {
                const box = buehne.querySelector('#rt-bilder');
                if (!b) { box.innerHTML = ''; return; }
                const reihe = (n, weg) => Array.from({ length: n }, (_, k) => `<span class="rt-ding ${weg ? 'weg' : ''}" style="animation-delay:${k * 0.08}s">${b.bild}</span>`).join('');
                box.innerHTML = b.op === '+'
                    ? `<span class="rt-gruppe">${reihe(b.n1)}</span><span class="rt-op">+</span><span class="rt-gruppe">${reihe(b.n2)}</span>`
                    : `<span class="rt-gruppe">${reihe(b.n1 - b.n2)}${reihe(b.n2, true)}</span>`;
            }

            // ---------- Ablauf ----------
            function aufbauen() {
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>Mathe</h2>
                    <p>Мари́я Ива́новна stellt Aufgaben. Hör zu, lies die Tafel, rechne.</p>
                  </header>
                  <div class="wo-frage">
                    <button class="hoer-knopf klein" id="nochmal" title="Nochmal hören">🔊</button>
                    <div><div class="fp-frage" id="frage"></div><p class="gram-tipp" id="gram-tipp" hidden>Gepunktet unterstrichen: antippen für die Grammatik</p></div>
                  </div>
                  <div class="gram-box" id="gram" hidden></div>
                  <div class="hilfe-zeile">
                    <button class="hilfe-knopf" id="uebersetzen" title="Auf Deutsch (zählt als Hilfe)"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                    <span class="uebersetzung" id="uebersetzung"></span>
                  </div>
                  <div class="balken"><div id="balken-fuellung"></div></div>
                  <div class="wo-optionen" id="optionen"></div>
                  <div class="rueckmeldung" id="rueckmeldung"></div>
                  <div id="danach"></div>`;
                q('#nochmal').addEventListener('click', () => { const f = deck[i]; if (f) ctx.sage(f.sprich, stimme); });
                q('#uebersetzen').addEventListener('click', () => {
                    const f = deck[i]; if (!f) return;
                    fehlversuch = true;
                    q('#uebersetzung').innerHTML = f.art === 'hoeren'
                        ? `${G.esc(f.frage_ru)}<br>„${G.esc(f.de)}“` : `„${G.esc(f.de)}“`;
                    q('#uebersetzen').classList.add('benutzt');
                });
            }

            function neueRunde() {
                const arten = G.mischen(['hoeren', 'hoeren', 'hoeren', 'lesen', 'lesen', 'aufgabe', 'aufgabe', 'aufgabe']).slice(0, RUNDEN);
                deck = arten.map(a => (a === 'hoeren' ? hoeren() : a === 'lesen' ? lesen() : textaufgabe()));
                i = 0; richtig = 0;
                aufbauen();
                frage();
            }

            function frage() {
                const f = deck[i];
                if (!f || !laufend) return;
                fehlversuch = false;
                kreide(f.tafel);
                zeigeBilder(f.bilder);
                const mitStellen = G.grammatikSatz(q('#frage'), f.frage_teile || [f.frage], q('#gram'), (t) => ctx.sage(t, stimme));
                q('#gram-tipp').hidden = !mitStellen;
                q('#uebersetzung').textContent = '';
                q('#uebersetzen').classList.remove('benutzt');
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#rueckmeldung').innerHTML = '';
                q('#danach').innerHTML = '';
                const box = q('#optionen');
                box.innerHTML = '';
                box.classList.toggle('zahlen', f.art === 'hoeren');
                G.mischen(f.optionen).forEach((o, n) => {
                    const b = document.createElement('button');
                    b.className = 'antwort wo-option';
                    b.style.animationDelay = (n * 0.05) + 's';
                    b.innerHTML = `<span class="ru">${G.esc(o.text)}</span>`;
                    b.addEventListener('click', () => waehle(o, b, f));
                    box.appendChild(b);
                });
                ctx.sage(f.sprich, stimme);
            }

            function waehle(o, knopf, f) {
                if (!laufend || knopf.disabled) return;
                const rm = q('#rueckmeldung');
                if (o.ok) {
                    if (!fehlversuch) richtig++;
                    ctx.tafel.querySelectorAll('.wo-option').forEach(b => { b.disabled = true; });
                    knopf.classList.add('treffer');
                    kreide(f.tafel_danach);
                    rm.className = 'rueckmeldung gut';
                    rm.innerHTML = '✓ <strong id="loesung"></strong><div class="gram-box" id="gram-loesung" hidden></div>';
                    G.grammatikSatz(q('#loesung'), f.loesung_teile || [f.loesung], q('#gram-loesung'), (t) => ctx.sage(t, stimme));
                    if (f.frage_danach) {
                        G.grammatikSatz(q('#frage'), f.frage_danach, q('#gram'), (t) => ctx.sage(t, stimme));
                        q('#gram-tipp').hidden = false;
                    }
                    ctx.sage(f.loesung, stimme);
                    q('#danach').innerHTML = `<button class="knopf-haupt" id="weiter">${i + 1 < deck.length ? 'Weiter' : 'Ergebnis'} <span>→</span></button>`;
                    q('#weiter').addEventListener('click', () => {
                        i++;
                        q('#balken-fuellung').style.width = (i / deck.length * 100) + '%';
                        if (i >= deck.length) ende(); else frage();
                    });
                    return;
                }
                fehlversuch = true;
                knopf.classList.add('daneben');
                knopf.disabled = true;
                rm.className = 'rueckmeldung schlecht';
                rm.textContent = o.hinweis;
            }

            function ende() {
                const sterne = richtig >= 7 ? 3 : richtig >= 5 ? 2 : 1;
                ctx.stand.rechnen_bestes = Math.max(ctx.stand.rechnen_bestes || 0, richtig);
                ctx.speichern();
                kreide(sterne === 3 ? 'Молодцы́! 5' : 'Хорошо́! 4');
                zeigeBilder(null);
                q('#optionen').innerHTML = '';
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#rueckmeldung').innerHTML = '';
                q('.wo-frage').classList.add('fertig');
                const weiter = ctx.modul.stufen[ctx.modul.stufen.indexOf(ctx.stufe) + 1];
                q('#danach').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${richtig} von ${deck.length}</strong> auf Anhieb richtig.</p>
                    <p class="klein">In Russland ist die 5 (пятёрка) die beste Note.</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="nochmal-runde">↻ Nochmal</button>
                      ${weiter ? '<button class="knopf-haupt" id="weiter-stufe">Weiter <span>→</span></button>' : ''}
                    </div>
                  </div>`;
                q('#nochmal-runde').addEventListener('click', neueRunde);
                const ws = q('#weiter-stufe');
                if (ws) ws.addEventListener('click', () => ctx.zuStufe(weiter));
                ctx.sage(sterne === 3 ? 'Молоде́ц! Пять!' : 'Хорошо́!', stimme);
            }

            neueRunde();
            return () => { laufend = false; buehne.remove(); };
        }
    };
})();
