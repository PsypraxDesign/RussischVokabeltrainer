// Baustein „Bezahlen“
// Rechnung mit verdeckter Summe: hören (oder selbst rechnen), dann Scheine
// und Münzen aus der Geldbörse auf den Teller legen. Wechselgeld kommt zurück.
//
// kassieren(ctx, box, betrag, posten) wird auch vom Dialog benutzt und löst
// auf, sobald bezahlt ist: { wechsel, hilfe } (hilfe = Summe angezeigt).

(function () {
    const WERTE = [1000, 500, 100, 50, 10];

    function schein(wert, extra = '') {
        const istMuenze = wert < 50;
        return `<span class="${istMuenze ? 'muenze' : 'schein'} w${wert} ${extra}" data-wert="${wert}">
                  <b>${wert}</b><small>${istMuenze ? '₽' : Zahlwort.rubel(wert).replace(/́/g, '')}</small>
                </span>`;
    }

    function wechselZerlegen(betrag) {
        const teile = {};
        WERTE.forEach(w => { const n = Math.floor(betrag / w); if (n) { teile[w] = n; betrag -= n * w; } });
        return teile;
    }

    function kassieren(ctx, box, betrag, posten) {
        const G = Gorod;
        return new Promise(resolve => {
            G.geldSichern(betrag);
            const boerse = G.boerse();
            const teller = {};
            let hilfe = false, fertig = false;

            box.innerHTML = `
              <div class="kasse">
                <div class="rechnung">
                  <div class="rechnung-kopf">Счёт</div>
                  <ul>${posten.map(p => `<li><span>${G.esc(p.ru)}</span><span>${p.preis} ₽</span></li>`).join('')}</ul>
                  <div class="rechnung-summe"><span>Итого́</span><span class="betrag verdeckt" id="betrag">??? ₽</span></div>
                  <div class="rechnung-knoepfe">
                    <button class="mini" id="hoeren">🔊 Betrag hören</button>
                    <button class="mini" id="zeigen" title="Betrag und Satz auf Deutsch"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                  </div>
                  <div class="uebersetzung klein-block" id="rechnung-de"></div>
                </div>
                <div class="zahl-bereich">
                  <div class="teller" id="teller"></div>
                  <div class="teller-summe" id="teller-summe"></div>
                  <div class="boerse" id="boerse"></div>
                  <button class="knopf-haupt" id="zahlen" disabled>Bezahlen</button>
                  <div class="kassen-meldung" id="meldung"></div>
                </div>
              </div>`;

            const $ = (s) => box.querySelector(s);
            const summe = (o) => Object.entries(o).reduce((s, [w, n]) => s + Number(w) * n, 0);

            function zeichnen() {
                $('#boerse').innerHTML = WERTE.map(w => {
                    const frei = (boerse[w] || 0) - (teller[w] || 0);
                    return frei > 0 ? `<button class="geld" data-wert="${w}" title="${w} ₽ auf den Teller">${schein(w)}${frei > 1 ? `<em>×${frei}</em>` : ''}</button>` : '';
                }).join('') || '<span class="leer">Die Börse ist leer.</span>';
                const aufTeller = WERTE.flatMap(w => Array(teller[w] || 0).fill(w));
                $('#teller').innerHTML = aufTeller.length
                    ? aufTeller.map(w => `<button class="geld klein" data-zurueck="${w}" title="zurücknehmen">${schein(w)}</button>`).join('')
                    : '<span class="teller-leer">Tippe auf Geld in deiner Börse.</span>';
                const t = summe(teller);
                $('#teller-summe').textContent = `Auf dem Teller: ${t.toLocaleString('de-DE')} ₽`;
                $('#zahlen').disabled = fertig || t === 0;
                // Nur die Knöpfe — die Schein-Grafik darin trägt auch data-wert
                $('#boerse').querySelectorAll('button[data-wert]').forEach(b => b.addEventListener('click', () => {
                    if (fertig) return;
                    teller[b.dataset.wert] = (teller[b.dataset.wert] || 0) + 1;
                    zeichnen();
                }));
                $('#teller').querySelectorAll('[data-zurueck]').forEach(b => b.addEventListener('click', () => {
                    if (fertig) return;
                    teller[b.dataset.zurueck]--;
                    zeichnen();
                }));
            }

            $('#hoeren').addEventListener('click', () => ctx.sage(`С вас ${Zahlwort.rubel(betrag)}.`, 'weiblich'));
            $('#zeigen').addEventListener('click', () => {
                hilfe = true;
                $('#rechnung-de').innerHTML = `„С вас ${G.esc(Zahlwort.rubel(betrag))}.“<br>Das macht ${betrag} Rubel.`;
                $('#betrag').textContent = `${betrag} ₽`;
                $('#betrag').classList.remove('verdeckt');
            });

            $('#zahlen').addEventListener('click', async () => {
                const t = summe(teller);
                const meldung = $('#meldung');
                if (t < betrag) {
                    const fehlt = betrag - t;
                    meldung.className = 'kassen-meldung schlecht';
                    meldung.innerHTML = `Das reicht nicht – es fehlen noch ${fehlt} ₽.`;
                    ctx.sage(`Э́того ма́ло. Ещё ${Zahlwort.rubel(fehlt)}, пожа́луйста.`, 'weiblich');
                    return;
                }
                fertig = true;
                Object.entries(teller).forEach(([w, n]) => { boerse[w] -= n; });
                const wechsel = t - betrag;
                Object.entries(wechselZerlegen(wechsel)).forEach(([w, n]) => { boerse[w] = (boerse[w] || 0) + n; });
                Object.keys(teller).forEach(w => { teller[w] = 0; });
                G.speichern();
                G.geldAnzeigen();
                $('#betrag').textContent = `${betrag} ₽`;
                $('#betrag').classList.remove('verdeckt');
                zeichnen();
                meldung.className = 'kassen-meldung gut';
                let satz;
                if (wechsel === 0) {
                    satz = 'Спаси́бо! Без сда́чи.';
                    meldung.innerHTML = `✓ Passend bezahlt. <span class="ru"></span>`;
                    G.satz(meldung.querySelector('.ru'), satz, { box: G.gramBox(meldung) });
                } else {
                    satz = `Спаси́бо! Ва́ша сда́ча — ${Zahlwort.rubel(wechsel)}.`;
                    meldung.innerHTML = `✓ Bezahlt, ${wechsel} ₽ Wechselgeld zurück. <span class="ru"></span>`;
                    G.satz(meldung.querySelector('.ru'), satz, { box: G.gramBox(meldung) });
                }
                box.querySelector('.kasse').classList.add('bezahlt');
                await ctx.sage(satz, 'weiblich');
                resolve({ wechsel, hilfe });
            });

            zeichnen();
        });
    }

    // Kurzer Piepton des Terminals (Web Audio, ohne Datei)
    function piep(ok) {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const tone = ok ? [988, 1319] : [330, 262];
            tone.forEach((f, i) => {
                const o = ac.createOscillator(), g = ac.createGain();
                o.frequency.value = f; o.type = 'sine';
                g.gain.setValueAtTime(0.0001, ac.currentTime + i * 0.13);
                g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + i * 0.13 + 0.01);
                g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.13 + 0.11);
                o.connect(g).connect(ac.destination);
                o.start(ac.currentTime + i * 0.13); o.stop(ac.currentTime + i * 0.13 + 0.12);
            });
            setTimeout(() => ac.close(), 600);
        } catch (e) { /* ohne Ton weiter */ }
    }

    // Kartenzahlung: Karte ans Terminal halten. Löst auf mit { karte: true }
    // oder — wenn das Konto nicht reicht — mit { abgelehnt: true }.
    function mitKarte(ctx, box, betrag, posten) {
        const G = Gorod;
        return new Promise(resolve => {
            box.innerHTML = `
              <div class="kasse karten-kasse">
                <div class="rechnung">
                  <div class="rechnung-kopf">Счёт</div>
                  <ul>${posten.map(p => `<li><span>${G.esc(p.ru)}</span><span>${p.preis} ₽</span></li>`).join('')}</ul>
                  <div class="rechnung-summe"><span>Итого́</span><span class="betrag">${betrag} ₽</span></div>
                </div>
                <div class="terminal-bereich">
                  <div class="terminal" id="terminal">
                    <div class="terminal-schirm" id="schirm">
                      <span class="t-klein">К опла́те</span>
                      <span class="t-betrag">${betrag} ₽</span>
                      <span class="t-hinweis">Приложи́те ка́рту</span>
                    </div>
                    <div class="terminal-tasten">${'<i></i>'.repeat(12)}</div>
                  </div>
                  <button class="bankkarte" id="karte" title="Karte ans Terminal halten">
                    <span class="bk-bank">Го́род·Банк</span>
                    <span class="bk-chip"></span>
                    <span class="bk-funk">)))</span>
                    <span class="bk-nummer">•••• 2026</span>
                  </button>
                  <button class="mini" id="terminal-de"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                  <div class="uebersetzung klein-block" id="terminal-uebersetzung"></div>
                  <div class="konto-zeile">Auf dem Konto: <strong id="konto">${G.konto().toLocaleString('de-DE')} ₽</strong></div>
                  <div class="kassen-meldung" id="meldung"></div>
                </div>
              </div>`;
            const $ = (s) => box.querySelector(s);
            let fertig = false;
            $('#terminal-de').addEventListener('click', () => {
                $('#terminal-uebersetzung').innerHTML = 'К опла́те – zu zahlen<br>Приложи́те ка́рту – Halten Sie die Karte ans Gerät.<br>Опла́чено – bezahlt · Отка́з – abgelehnt';
            });
            $('#karte').addEventListener('click', async () => {
                if (fertig) return;
                fertig = true;
                $('#karte').classList.add('angelegt');
                await G.pause(800);
                const schirm = $('#schirm');
                if (G.konto() < betrag) {
                    piep(false);
                    schirm.classList.add('abgelehnt');
                    schirm.innerHTML = '<span class="t-betrag">Отка́з</span><span class="t-hinweis">Недоста́точно средств</span>';
                    $('#meldung').className = 'kassen-meldung schlecht';
                    $('#meldung').innerHTML = 'Abgelehnt – auf dem Konto ist nicht genug Geld. <span class="ru">Недоста́точно средств.</span>';
                    await ctx.sage('Отка́з. Недоста́точно средств. Мо́жет быть, нали́чными?', 'weiblich');
                    resolve({ abgelehnt: true });
                    return;
                }
                piep(true);
                G.konto(G.konto() - betrag);
                $('#konto').textContent = `${G.konto().toLocaleString('de-DE')} ₽`;
                schirm.classList.add('ok');
                schirm.innerHTML = '<span class="t-betrag">✓</span><span class="t-hinweis">Опла́чено</span>';
                box.querySelector('.kasse').classList.add('bezahlt');
                const satz = 'Опла́та прошла́. Спаси́бо!';
                $('#meldung').className = 'kassen-meldung gut';
                $('#meldung').innerHTML = `✓ Mit Karte bezahlt. <span class="ru"></span>`;
                G.satz($('#meldung .ru'), satz, { box: G.gramBox($('#meldung')) });
                await ctx.sage(satz, 'weiblich');
                resolve({ karte: true });
            });
        });
    }

    Gorod.bausteine.bezahlen = {
        kassieren,
        mitKarte,

        // Eigene Stufe: Bezahlen üben mit zufälligen Rechnungen aus dem Menü
        start(ctx) {
            const G = Gorod;
            let laufend = true;
            ctx.tafel.innerHTML = `
              <header class="tafel-kopf">
                <h2>Bezahlen üben</h2>
                <p>Hör den Betrag und lege das passende Geld auf den Teller.</p>
              </header>
              <div id="kasse-box"></div>
              <div id="danach"></div>`;

            async function runde() {
                if (!laufend) return;
                const menue = ctx.inhalt.menue || [];
                const posten = G.mischen(menue).slice(0, 2 + Math.floor(Math.random() * 2));
                const betrag = posten.reduce((s, p) => s + p.preis, 0);
                ctx.tafel.querySelector('#danach').innerHTML = '';
                const fertig = kassieren(ctx, ctx.tafel.querySelector('#kasse-box'), betrag, posten);
                ctx.sage(`С вас ${Zahlwort.rubel(betrag)}.`, 'weiblich');
                await fertig;
                if (!laufend) return;
                ctx.tafel.querySelector('#danach').innerHTML =
                    `<button class="knopf-haupt" id="naechste">Nächste Rechnung <span>→</span></button>`;
                ctx.tafel.querySelector('#naechste').addEventListener('click', runde);
            }
            runde();
            return () => { laufend = false; };
        }
    };
})();
