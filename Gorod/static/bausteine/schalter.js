// Baustein „Am Schalter“ (Flughafen: Passkontrolle, Gepäck, Zoll; Bahnhof: Fahrkarte, Im Zug;
// Supermarkt: Theke, Kasse; Schule: Im Unterricht)
// Man reist mit einem erfundenen Pass bzw. Fahrauftrag und beantwortet die Fragen am Schalter.
// Die falschen Antworten sind typische Fehler (Kasus, Genus, Zahlwort) und
// bekommen einen Hinweis statt eines roten Kreuzes – wie im Café-Dialog.
// Eine Reise (= ein Pass) gilt für alle Schalter-Stufen, bis man eine neue beginnt.
//
// Nutzt aus inhalt.json: reise { figuren{}, reisende[], szenen{<stufe>} }
// Szene:   titel, zettel_titel, start, knoten{}, geschafft (Satz für das Ende)
// Knoten:  sprecher, text, de, dann optionen[] | feld, weiter?, pause? (ms),
//          aktion? ("stempel" | "bezahlen" | "drucken" | "scannen" | "klingeln": element wackelt, Glocke)
// Option:  text, de, weiter | ende | hinweis, zahlart? ("bar" | "karte", geprüft gegen reisende[].zahlart)
// Dokument: reisende[].pass (Reisepass) oder reisende[].bilet (Fahrkarte, mit szene.bilet_drucken
//          erst nach aktion "drucken" sichtbar). Preis für {summe}: reisende[].preis,
//          Kassenzettel: reisende[].posten (Text oder [{ru, preis}]). reise.start_stufe: wo eine
//          neue Reise beginnt (sonst die erste Schalter-Stufe).
// Feld:    reisende[].felder[feld] = { richtig: {text, de}, falsch: [{text, de, hinweis}] }
// Platzhalter {schluessel} in Texten kommen aus reisende[].p

(function () {
    const SCHALTER_STUFEN = ['pass', 'gepaeck', 'zoll', 'fahrkarte', 'zug', 'theke', 'kasse', 'unterricht'];

    // Eine Reise (ein Pass, ein Fahrauftrag, ein Einkaufszettel) gilt über mehrere Stufen,
    // auch über andere Bausteine (Einkaufen) – deshalb hier für alle.
    Gorod.reiseWaehlen = function (ctx, neu) {
        const alle = ctx.inhalt.reise.reisende;
        let r = !neu && alle.find(x => x.id === ctx.stand.reisender);
        if (!r) {
            const andere = alle.filter(x => x.id !== ctx.stand.reisender);
            r = andere[Math.floor(Math.random() * andere.length)];
            ctx.stand.reisender = r.id;
            ctx.speichern();
        }
        return r;
    };

    // Kassen-Piep (nur nach dem ersten Klick – Autoplay-Sperre)
    let tonKontext = null;
    function piep(hz = 1760, dauer = 0.09, ab = 0) {
        if (!window.Stimmen || (Stimmen.darfTon && !Stimmen.darfTon())) return;
        try {
            tonKontext = tonKontext || new AudioContext();
            const o = tonKontext.createOscillator(), g = tonKontext.createGain();
            const t = tonKontext.currentTime + ab;
            o.frequency.value = hz; g.gain.value = 0.05;
            o.connect(g); g.connect(tonKontext.destination);
            o.start(t); o.stop(t + dauer);
        } catch (e) { /* ohne Ton */ }
    }

    function schalter(ctx) {
        const G = Gorod;
        const reise = ctx.inhalt.reise;
        const szene = reise.szenen[ctx.stufe];
        const fig = reise.figuren;
        let laufend = true, wer, hinweise, zahlart;
        const q = (s) => ctx.tafel.querySelector(s);

        // Eine Reise bleibt über Pass, Gepäck und Zoll dieselbe
        const reisender = (neu) => Gorod.reiseWaehlen(ctx, neu);
        const stimmeVon = (s) => s === 'ich'
            ? (wer.geschlecht === 'f' ? 'weiblich' : 'maennlich')
            : (fig[s] && fig[s].stimme) || 'erzaehler';
        const platzhalter = () => ({
            ...(wer.preis ? { summe: Zahlwort.rubel(wer.preis), summe_de: `${wer.preis} Rubel` } : {}),
            ...(wer.p || {})
        });
        const ersetze = (t) => { const p = platzhalter(); return String(t || '').replace(/\{(\w+)\}/g, (m, k) => (k in p ? p[k] : m)); };
        const ZAHLART_DE = { bar: 'bar', karte: 'mit Karte' };

        function start(neu) {
            wer = reisender(neu);
            hinweise = 0; zahlart = null;
            ctx.tafel.classList.remove('beim-zahlen');
            const mitDe = !!ctx.stand.uebersetzung;
            ctx.tafel.innerHTML = `
              <header class="tafel-kopf">
                <h2>${G.esc(szene.titel)}</h2>
                <label class="schalter" title="Alle Sätze immer auch auf Deutsch zeigen"><input type="checkbox" id="uebersetzung" ${mitDe ? 'checked' : ''}><span><span class="flagge" aria-hidden="true"></span>immer übersetzen</span></label>
              </header>
              <div class="reise-papiere">
                ${wer.pass ? pass() : ''}${wer.bilet ? bilet() : ''}
                <div class="zettel reise-zettel"><span class="zettel-titel">${G.esc(szene.zettel_titel || 'Deine Reise')}</span>
                  ${(wer.zettel[ctx.stufe] || []).map(z => `<span class="zettel-zeile">${G.esc(z)}</span>`).join('')}
                  ${ctx.stufe === 'gepaeck' ? gepaeckBild(wer.gepaeck) : ''}
                </div>
              </div>
              <div class="gespraech ${mitDe ? 'mit-de' : ''}" id="gespraech"></div>
              <div class="hinweis-karte" id="hinweis" hidden></div>
              <div class="antworten ${mitDe ? 'mit-de' : ''}" id="antworten"></div>
              <div id="kasse-box"></div>`;
            ctx.tafel.querySelectorAll('.reisepass .sprich').forEach(b => b.addEventListener('click', () => ctx.sage(b.dataset.text)));
            q('#uebersetzung').addEventListener('change', (e) => {
                ctx.stand.uebersetzung = e.target.checked;
                ctx.speichern();
                q('#gespraech').classList.toggle('mit-de', e.target.checked);
                q('#antworten').classList.toggle('mit-de', e.target.checked);
            });
            knoten(szene.start);
        }

        // Der Pass: russisch beschriftet, Einträge zum Anhören antippbar
        function pass() {
            const p = wer.pass;
            const feld = (lbl, wert, sprich = true) => `<div><dt>${lbl}</dt><dd>${sprich
                ? `<button class="sprich" data-text="${G.esc(wert)}">${G.esc(wert)}</button>` : G.esc(wert)}</dd></div>`;
            return `<div class="reisepass" id="reisepass">
                <div class="rp-kopf"><span class="rp-wappen" aria-hidden="true"></span>ПА́СПОРТ <small>Reisepass</small></div>
                <div class="rp-seite">
                  <svg class="rp-foto" viewBox="0 0 60 72" aria-hidden="true">
                    <rect width="60" height="72" fill="#dfe9ee"/>
                    ${wer.geschlecht === 'f'
                        ? '<path d="M12 44 Q10 14 30 12 Q50 14 48 44 Z" fill="#7a4a2b"/>'
                        : '<path d="M16 28 Q16 12 30 12 Q44 12 44 28 Q40 18 30 19 Q20 18 16 28Z" fill="#4a3a2e"/>'}
                    <circle cx="30" cy="31" r="13" fill="#f2c7a6"/>
                    <path d="M8 72 Q10 50 30 50 Q50 50 52 72Z" fill="${wer.geschlecht === 'f' ? '#a0523a' : '#3e4855'}"/>
                  </svg>
                  <dl>
                    ${feld('Фами́лия', p.familie)}${feld('И́мя', p.imya)}${feld('О́тчество', p.otchestvo)}
                    ${feld('Да́та рожде́ния', p.geburt, false)}
                  </dl>
                </div>
                <div class="rp-stempel" aria-hidden="true">ВЪЕЗД<small>${new Date().toLocaleDateString('de-DE')}</small></div>
              </div>`;
        }

        // Die Fahrkarte: wie ein russischer Fahrschein, Zahlen statt Wörter
        function bilet() {
            const b = wer.bilet;
            const feld = (lbl, wert, klasse = '') => `<div class="${klasse}"><dt>${lbl}</dt><dd>${G.esc(wert)}</dd></div>`;
            return `<div class="fahrkarte ${szene.bilet_drucken ? 'ungedruckt' : ''}" id="bilet">
                <div class="fk-kopf">ПРОЕЗДНО́Й ДОКУМЕ́НТ <small>Fahrkarte</small></div>
                <dl class="fk-felder">
                  ${feld('По́езд', b.poezd)}${feld('Вре́мя', b.abfahrt)}${feld('Да́та', b.datum)}
                  ${feld('Куда́', b.ziel, 'breit')}
                  ${feld('Ваго́н', b.wagen)}${feld('Ме́сто', b.mesto)}${feld('Класс', b.klasse)}
                </dl>
                <div class="fk-preis">${b.preis.toLocaleString('de-DE')} ₽</div>
              </div>`;
        }

        // Kleines Bild des aufgegebenen Gepäcks – Farbe und Größe, ohne Worte
        function gepaeckBild(g) {
            if (!g) return '';
            const s = g.gross ? 1 : 0.72;
            const form = {
                chemodan: `<rect x="14" y="16" width="44" height="54" rx="6" fill="${g.farbe}"/><path d="M28 16 V8 H44 V16" stroke="#3a3a3a" stroke-width="4" fill="none"/>
                           <path d="M24 22 V64 M48 22 V64" stroke="rgba(0,0,0,.18)" stroke-width="3"/><circle cx="22" cy="72" r="4" fill="#333"/><circle cx="50" cy="72" r="4" fill="#333"/>`,
                sumka: `<path d="M8 34 H64 L60 70 H12Z" fill="${g.farbe}"/><path d="M22 34 Q22 14 36 14 Q50 14 50 34" stroke="${g.farbe}" stroke-width="5" fill="none"/>
                        <path d="M12 44 H60" stroke="rgba(0,0,0,.18)" stroke-width="3"/>`,
                ryukzak: `<rect x="16" y="18" width="40" height="52" rx="14" fill="${g.farbe}"/><rect x="22" y="44" width="28" height="20" rx="5" fill="rgba(0,0,0,.18)"/>
                          <path d="M28 18 Q36 6 44 18" stroke="#3a3a3a" stroke-width="4" fill="none"/>`
            }[g.art] || '';
            return `<svg class="gepaeck-bild" viewBox="0 0 72 78" aria-hidden="true"><g transform="translate(${36 - 36 * s} ${78 - 78 * s}) scale(${s})">${form}</g></svg>`;
        }

        function zeile(sprecher, ru, de) {
            const div = document.createElement('div');
            div.className = 'zeile ' + (sprecher === 'ich' ? 'ich' : 'sie') + (sprecher === 'erzaehler' ? ' erzaehler' : '');
            const name = sprecher === 'ich' ? 'Ich' : (fig[sprecher] && fig[sprecher].name) || '';
            div.innerHTML = `${name ? `<span class="zeile-wer">${G.esc(name)}</span>` : ''}
              <span class="zeile-text"><button class="zeile-ru" title="Nochmal anhören">${G.esc(ru)}</button>${de ? '<button class="zeile-hilfe" title="Auf Deutsch"><span class="flagge" aria-hidden="true"></span></button>' : ''}</span>
              <span class="zeile-de">${G.esc(de || '')}</span>`;
            div.querySelector('.zeile-ru').addEventListener('click', () => ctx.sage(ru, stimmeVon(sprecher)));
            G.satz(div.querySelector('.zeile-ru'), ru, { anker: div.querySelector('.zeile-text'), stimme: stimmeVon(sprecher) });
            const hilfe = div.querySelector('.zeile-hilfe');
            if (hilfe) hilfe.addEventListener('click', () => div.classList.toggle('offen'));
            q('#gespraech').appendChild(div);
            div.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        function hinweis(text) {
            const h = q('#hinweis');
            if (!text) { h.hidden = true; return; }
            h.textContent = text;
            h.hidden = false;
            h.classList.remove('auf'); void h.offsetWidth; h.classList.add('auf');
        }

        async function knoten(id) {
            if (!laufend) return;
            const k = { ...szene.knoten[id], id };
            const text = ersetze(k.text), de = ersetze(k.de);
            q('#antworten').innerHTML = '';
            zeile(k.sprecher, text, de);
            ctx.blase(text, ctx.stand.uebersetzung ? de : null, fig[k.sprecher]);
            await ctx.sage(text, stimmeVon(k.sprecher));
            if (!laufend) return;
            if (k.pause) { await G.pause(k.pause); if (!laufend) return; }
            if (k.aktion === 'stempel') {
                q('#reisepass').classList.add('gestempelt');
                await G.pause(700);
                if (!laufend) return;
            }
            if (k.aktion === 'drucken') {
                const karte = q('#bilet');
                if (karte) { karte.classList.remove('ungedruckt'); karte.classList.add('gedruckt'); }
                await G.pause(1100);
                if (!laufend) return;
            }
            if (k.aktion === 'klingeln') {
                const el = ctx.svg.getElementById(k.element || 'hs-zvonok');
                if (el) el.classList.add('klingelt');
                for (let n = 0; n < 8; n++) piep(n % 2 ? 1180 : 1320, 0.11, n * 0.14);
                await G.pause(1400);
                if (el) el.classList.remove('klingelt');
                if (!laufend) return;
            }
            if (k.aktion === 'scannen') {
                await scannen();
                if (!laufend) return;
            }
            if (k.aktion === 'bezahlen') {
                await bezahlen();
                if (!laufend) return;
            }
            if (k.optionen || k.feld) zeigeOptionen(k);
            else if (k.weiter) knoten(k.weiter);
        }

        const kassenzettel = () => (Array.isArray(wer.posten) ? wer.posten : [{ ru: wer.posten || 'биле́т', preis: wer.preis }]);

        // Waren laufen über den Scanner: Piep, Zeile, die Summe zählt mit
        async function scannen() {
            const box = q('#kasse-box');
            box.innerHTML = `<div class="scanner"><div class="scan-kopf"><span>Ка́сса</span><span class="scan-anzeige">ИТОГО: <b id="scan-summe">0</b> ₽</span></div><ul id="scan-liste"></ul></div>`;
            box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            let summe = 0;
            for (const p of kassenzettel()) {
                await G.pause(520);
                if (!laufend) return;
                const li = document.createElement('li');
                li.innerHTML = `<span>${G.esc(p.ru)}</span><span>${p.preis} ₽</span>`;
                q('#scan-liste').appendChild(li);
                summe += p.preis;
                q('#scan-summe').textContent = summe.toLocaleString('de-DE');
                piep();
            }
            await G.pause(700);
        }

        // Bar oder mit Karte – wie im Café; abgelehnte Karte → bar
        async function bezahlen() {
            const bz = Gorod.bausteine.bezahlen;
            const box = q('#kasse-box');
            const posten = kassenzettel();
            ctx.tafel.classList.add('beim-zahlen');
            let erg;
            if (zahlart === 'karte') {
                const versuch = bz.mitKarte(ctx, box, wer.preis, posten);
                box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                erg = await versuch;
                if (!laufend) return;
                if (erg.abgelehnt) { await G.pause(700); erg = await bz.kassieren(ctx, box, wer.preis, posten); }
            } else {
                const kassiert = bz.kassieren(ctx, box, wer.preis, posten);
                box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                erg = await kassiert;
            }
            if (!laufend) return;
            if (erg && erg.hilfe) hinweise++;
            await G.pause(900);
            if (!laufend) return;
            box.innerHTML = '';
            ctx.tafel.classList.remove('beim-zahlen');
        }

        function optionenFuer(k) {
            if (k.optionen) return k.optionen.map(o => {
                const opt = { ...o, text: ersetze(o.text), de: ersetze(o.de) };
                if (o.zahlart && wer.zahlart && o.zahlart !== wer.zahlart) {
                    opt.hinweis = `Auf deinem Zettel steht: ${ZAHLART_DE[wer.zahlart]} bezahlen.`;
                }
                return opt;
            });
            const f = wer.felder[k.feld];
            return [{ ...f.richtig, weiter: k.weiter }, ...f.falsch];
        }

        function zeigeOptionen(k) {
            const box = q('#antworten');
            box.innerHTML = '';
            G.mischen(optionenFuer(k)).forEach((o, i) => {
                const b = document.createElement('button');
                b.className = 'antwort';
                b.style.animationDelay = (i * 0.06) + 's';
                b.innerHTML = `<span class="ru">${G.esc(o.text)}</span><span class="de">${G.esc(o.de || '')}</span>`;
                b.addEventListener('click', () => waehle(o, b, k));
                box.appendChild(b);
            });
        }

        async function waehle(o, knopf, k) {
            if (!laufend) return;
            if (o.hinweis) {
                hinweise++;
                knopf.classList.add('daneben');
                knopf.disabled = true;
                hinweis(o.hinweis);
                return;
            }
            hinweis(null);
            q('#antworten').innerHTML = '';
            zeile('ich', o.text, o.de);
            await ctx.sage(o.text, stimmeVon('ich'));
            if (!laufend) return;
            if (o.zahlart) zahlart = o.zahlart;
            if (o.ende) return abschluss();
            knoten(o.weiter || k.weiter);
        }

        function abschluss() {
            const sterne = hinweise === 0 ? 3 : hinweise <= 2 ? 2 : 1;
            ctx.stand.schalter = ctx.stand.schalter || {};
            ctx.stand.schalter[ctx.stufe] = (ctx.stand.schalter[ctx.stufe] || 0) + 1;
            ctx.speichern();
            ctx.blaseWeg();
            // Nächster Schalter dieser Reise, sonst eine neue Reise
            const stufen = ctx.modul.stufen.filter(s => SCHALTER_STUFEN.includes(s));
            const naechste = stufen[stufen.indexOf(ctx.stufe) + 1];
            q('#antworten').innerHTML = `
              <div class="ergebnis">
                <div class="sterne">${G.sterne(sterne)}</div>
                <p><strong>${G.esc(szene.geschafft || 'Geschafft!')}</strong></p>
                <p class="klein">${hinweise === 0 ? 'Ganz ohne Hinweis – отли́чно!' : `${hinweise} Hinweis${hinweise > 1 ? 'e' : ''} gebraucht.`}</p>
                <div class="knopf-reihe">
                  <button class="knopf-zweit" id="nochmal">↻ Noch einmal</button>
                  ${naechste
                      ? `<button class="knopf-haupt" id="weiter">Weiter: ${G.esc(reise.szenen[naechste].titel)} →</button>`
                      : `<button class="knopf-haupt" id="neue-reise" title="Neue Reise, neue Papiere">${G.esc(reise.neu_knopf || '✈ Neue Reise')}</button>`}
                </div>
              </div>`;
            q('#nochmal').addEventListener('click', () => start(false));
            if (naechste) q('#weiter').addEventListener('click', () => ctx.zuStufe(naechste));
            else q('#neue-reise').addEventListener('click', () => {
                reisender(true);
                ctx.zuStufe(reise.start_stufe || stufen[0]);
            });
        }

        start(false);
        return () => { laufend = false; ctx.blaseWeg(); ctx.tafel.classList.remove('beim-zahlen'); };
    }

    SCHALTER_STUFEN.forEach(s => { Gorod.bausteine[s] = { start: schalter }; });
})();
