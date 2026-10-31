// Baustein „Abfahrtstafel“ (Bahnhof) – auch als „Stundenplan“ (Schule, Kreidetafel)
// Über dem Bild klappt eine Fallblatt-Tafel auf (Zeiten, Ziele, Gleise, Verspätungen)
// bzw. schreibt sich eine Kreidetafel Buchstabe für Buchstabe (stil: "kreide").
// Die Stimme fragt: „С како́го пути́ …?“, „Во ско́лько …?“, „Куда́ …?“ – man liest
// die Tafel und wählt die Antwort. Falsche Antworten sind typische Fehler
// (Ordnungszahl im Genitiv, в + Akkusativ, мину́т nach 5+) mit Erklärung.
//
// Nutzt aus inhalt.json: inhalt[<stufe>] (fahrplan / stundenplan):
//   titel, titel_de, stufe_titel, stil?, und entweder zuege[] (Bahnhof: id, nr, ziel, zeit, weg,
//   status, verspaetet?) oder spalten[] + zeilen[] {id, zellen[]} + raster (CSS-Spalten).
// Frage: zug | zeile, text, de, richtig {text, de}, falsch [{text, hinweis}]

(function () {
    const RUNDEN = 8;
    const ZEICHEN = 'АБВГДЕЖЗИКЛМНОПРСТУФЯ0123456789';

    // Kreide: Buchstaben erscheinen nacheinander
    function schreibe(el, ziel, warten) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = ziel; return; }
        const zeichen = [...ziel];
        let n = 0;
        setTimeout(function schritt() {
            if (!el.isConnected) return;
            el.textContent = zeichen.slice(0, ++n).join('');
            if (n < zeichen.length) setTimeout(schritt, 38);
        }, warten);
    }

    // Fallblatt: Zeichen rattern durch, bis der Text von links nach rechts steht
    function klappe(el, ziel, dauer) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = ziel; return; }
        const t0 = performance.now();
        (function schritt() {
            const p = (performance.now() - t0) / dauer;
            if (p >= 1 || !el.isConnected) { el.textContent = ziel; return; }
            el.textContent = [...ziel].map((c, i) => (/[\s:.\-]/.test(c) || i / ziel.length < p - 0.25)
                ? c : ZEICHEN[Math.floor(Math.random() * ZEICHEN.length)]).join('');
            setTimeout(schritt, 55);
        })();
    }

    const baustein = {
        start(ctx) {
            const G = Gorod;
            const fp = ctx.inhalt[ctx.stufe] || ctx.inhalt.fahrplan;
            const kreide = fp.stil === 'kreide';
            const zeileVon = (f) => f.zeile || f.zug;
            let deck, i, richtig, fehlversuch, laufend = true;
            const q = (s) => ctx.tafel.querySelector(s);

            // ---------- Tafel über dem Bild ----------
            const buehne = document.createElement('div');
            const spalten = fp.spalten || ['Вре́мя', '№', 'Куда́', 'Путь', 'Примеча́ние'];
            const zeilen = fp.zeilen || fp.zuege.map(z => ({
                id: z.id, spaet: z.verspaetet, zellen: [z.zeit, z.nr, z.ziel, String(z.weg), z.status] }));
            const klassen = fp.spalten_klassen || (fp.zuege ? ['', '', 'ziel', 'weg', 'status'] : []);
            buehne.className = 'fahrplan-buehne' + (kreide ? ' kreide' : '');
            buehne.innerHTML = `
              <div class="abfahrt-tafel" ${fp.raster ? `style="--raster:${G.esc(fp.raster)}"` : ''}>
                <div class="at-kopf"><span>${G.esc(fp.titel || 'ОТПРАВЛЕ́НИЕ')}</span><span class="at-de">${G.esc(fp.titel_de || 'Abfahrt')}</span></div>
                <div class="at-zeile at-spalten">${spalten.map(t => `<span>${G.esc(t)}</span>`).join('')}</div>
                ${zeilen.map(z => `<div class="at-zeile ${z.spaet ? 'spaet' : ''}" data-zeile="${z.id}">${
                    z.zellen.map((c, n) => `<span class="fb ${klassen[n] || ''}" data-t="${G.esc(c)}"></span>`).join('')}</div>`).join('')}
              </div>`;
            ctx.buehne.appendChild(buehne);
            const breite = spalten.length;
            buehne.querySelectorAll('.fb').forEach((el, n) => kreide
                ? schreibe(el, el.dataset.t, 250 + Math.floor(n / breite) * 420 + (n % breite) * 70)
                : klappe(el, el.dataset.t, 500 + Math.floor(n / breite) * 160 + (n % breite) * 60));

            function aufbauen() {
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>${G.esc(fp.stufe_titel || 'Abfahrtstafel')}</h2>
                    <p>Lies die Tafel und beantworte die Frage.</p>
                  </header>
                  <div class="wo-frage">
                    <button class="hoer-knopf klein" id="nochmal" title="Nochmal hören">🔊</button>
                    <div><div class="fp-frage" id="frage"></div></div>
                  </div>
                  <div class="hilfe-zeile">
                    <button class="hilfe-knopf" id="uebersetzen" title="Frage auf Deutsch (zählt als Hilfe)"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                    <span class="uebersetzung" id="uebersetzung"></span>
                  </div>
                  <div class="balken"><div id="balken-fuellung"></div></div>
                  <div class="wo-optionen" id="optionen"></div>
                  <div class="rueckmeldung" id="rueckmeldung"></div>
                  <div id="danach"></div>`;
                q('#nochmal').addEventListener('click', () => { const f = deck[i]; if (f) ctx.sage(f.text); });
                q('#uebersetzen').addEventListener('click', () => {
                    const f = deck[i];
                    if (!f) return;
                    fehlversuch = true;      // mit Hilfe zählt nicht als „auf Anhieb“
                    q('#uebersetzung').textContent = `„${f.de}“`;
                    q('#uebersetzen').classList.add('benutzt');
                });
            }

            // Möglichst jede Frage zu einem anderen Zug, Fragearten gemischt
            function neueRunde() {
                const gemischt = G.mischen(fp.fragen);
                const zuege = new Set();
                deck = [];
                gemischt.forEach(f => { if (deck.length < RUNDEN && !zuege.has(zeileVon(f))) { deck.push(f); zuege.add(zeileVon(f)); } });
                gemischt.forEach(f => { if (deck.length < RUNDEN && !deck.includes(f)) deck.push(f); });
                i = 0; richtig = 0;
                aufbauen();
                frage();
            }

            function frage() {
                const f = deck[i];
                if (!f || !laufend) return;
                fehlversuch = false;
                buehne.querySelectorAll('.at-zeile').forEach(z => z.classList.remove('markiert'));
                G.satz(q('#frage'), f.text);
                q('#uebersetzung').textContent = '';
                q('#uebersetzen').classList.remove('benutzt');
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#rueckmeldung').innerHTML = '';
                q('#danach').innerHTML = '';
                const box = q('#optionen');
                box.innerHTML = '';
                G.mischen([{ ...f.richtig, ok: true }, ...f.falsch]).forEach((o, n) => {
                    const b = document.createElement('button');
                    b.className = 'antwort wo-option';
                    b.style.animationDelay = (n * 0.05) + 's';
                    b.innerHTML = `<span class="ru">${G.esc(o.text)}</span>`;
                    b.addEventListener('click', () => waehle(o, b, f));
                    box.appendChild(b);
                });
                ctx.sage(f.text);
            }

            function waehle(o, knopf, f) {
                if (!laufend || knopf.disabled) return;
                const rm = q('#rueckmeldung');
                if (o.ok) {
                    if (!fehlversuch) richtig++;
                    ctx.tafel.querySelectorAll('.wo-option').forEach(b => { b.disabled = true; });
                    knopf.classList.add('treffer');
                    const zeile = buehne.querySelector(`.at-zeile[data-zeile="${zeileVon(f)}"]`);
                    if (zeile) zeile.classList.add('markiert');
                    rm.className = 'rueckmeldung gut';
                    rm.innerHTML = `✓ <strong></strong><br><span class="klein">${G.esc(o.de || '')}</span>`;
                    G.satz(rm.querySelector('strong'), o.text, { box: G.gramBox(rm) });
                    ctx.sage(o.text);
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
                ctx.stand[ctx.stufe + '_bestes'] = Math.max(ctx.stand[ctx.stufe + '_bestes'] || 0, richtig);
                ctx.speichern();
                buehne.querySelectorAll('.at-zeile').forEach(z => z.classList.remove('markiert'));
                q('#optionen').innerHTML = '';
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#rueckmeldung').innerHTML = '';
                q('.wo-frage').classList.add('fertig');
                const weiter = ctx.modul.stufen[ctx.modul.stufen.indexOf(ctx.stufe) + 1];
                q('#danach').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${richtig} von ${deck.length}</strong> auf Anhieb richtig.</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="nochmal-runde">↻ Nochmal</button>
                      ${weiter
                          ? `<button class="knopf-haupt" id="weiter-stufe">Weiter <span>→</span></button>`
                          : '<button class="knopf-haupt" id="karte">Zur Karte</button>'}
                    </div>
                  </div>`;
                q('#nochmal-runde').addEventListener('click', neueRunde);
                const karte = q('#karte');
                if (karte) karte.addEventListener('click', () => document.getElementById('zur-karte').click());
                const ws = q('#weiter-stufe');
                if (ws) ws.addEventListener('click', () => ctx.zuStufe(weiter));
                ctx.sage(sterne === 3 ? 'Отли́чно!' : 'Хорошо́!');
            }

            neueRunde();
            return () => { laufend = false; buehne.remove(); };
        }
    };
    Gorod.bausteine.fahrplan = baustein;
    Gorod.bausteine.stundenplan = baustein;
})();
