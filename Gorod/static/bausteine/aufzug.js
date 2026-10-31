// Baustein „Aufzug“ (Ordnungszahlen mit dem Aufzug im Hochhaus)
// Über das Bild legt sich ein Hochhaus (высо́тка) mit fahrendem Aufzug und
// einem Tastenfeld. Drei Aufgabenarten:
//   hören  – „Мне на седьмо́й эта́ж“ (wohin, Akk.) oder „Ба́бушка живёт на
//            пя́том этаже́“ (wo, Präp.) → Taste drücken, der Aufzug fährt
//   sehen  – der Aufzug hält, „На како́м мы этаже́?“ → Form wählen
//   falle  – „im 3. Stock“ (deutsch gezählt) → на четвёртом этаже́
// Optional aus inhalt.json: etagen { stockwerke, bewohner[] {ru, de} }.

(function () {
    const SEKUNDEN_JE_ETAGE = 0.32;
    const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const ohneBetonung = (t) => t.replace(/́/g, '');
    const FAMILIEN = ['Schmidt', 'Müller', 'Wagner', 'Becker', 'Hoffmann'];
    const BEWOHNER = [
        { ru: 'Ба́бушка', de: 'Oma' }, { ru: 'Дя́дя Ва́ня', de: 'Onkel Wanja' },
        { ru: 'Тётя Ма́ша', de: 'Tante Mascha' }, { ru: 'Мой друг Макси́м', de: 'Mein Freund Maxim' }
    ];

    function gong() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            [784, 1047].forEach((f, k) => {
                const o = ac.createOscillator(), g = ac.createGain();
                o.type = 'sine'; o.frequency.value = f;
                const t = ac.currentTime + k * 0.22;
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
                o.connect(g).connect(ac.destination);
                o.start(t); o.stop(t + 0.65);
            });
            setTimeout(() => ac.close(), 1200);
        } catch (e) { /* ohne Ton weiter */ }
    }

    // ---------------- Das Hochhaus als SVG ----------------
    function hochhausSvg(max) {
        const H = 46, boden = 70 + max * H, oben = 70;
        const y = (n) => boden - n * H;                    // Oberkante von Etage n
        let fenster = '', nummern = '', linien = '';
        for (let n = 1; n <= max; n++) {
            const yo = y(n);
            [58, 98, 204, 244].forEach((x, k) => {
                const hell = (n * 7 + k * 3) % 5 < 2;
                fenster += `<rect x="${x}" y="${yo + 11}" width="26" height="22" rx="2" fill="${hell ? '#f6d98a' : '#a9cfe0'}" stroke="#fbf7ef" stroke-width="2"/>`;
                if ((n + k) % 3 === 0) fenster += `<rect x="${x - 3}" y="${yo + 33}" width="32" height="5" fill="#c9bda6"/>`;
            });
            linien += `<path d="M44 ${yo} H276" stroke="#d3c4a6" stroke-width="1.5"/>`;
            nummern += `<g class="etage-nr" data-etage="${n}"><circle cx="22" cy="${yo + H / 2}" r="12"/><text x="22" y="${yo + H / 2 + 5}">${n}</text></g>`;
        }
        return `
        <svg class="hochhaus" viewBox="0 0 300 ${boden + 34}" aria-hidden="true">
          <rect x="40" y="${oben - 14}" width="240" height="16" fill="#8a7f70"/>
          <path d="M210 ${oben - 14} V${oben - 40} M200 ${oben - 32} H220 M204 ${oben - 24} H216" stroke="#6b6b6b" stroke-width="2.5"/>
          <rect x="40" y="${oben}" width="240" height="${max * H}" fill="#e8dcc4"/>
          ${linien}
          ${fenster}
          <rect x="136" y="${oben}" width="48" height="${max * H}" fill="#3a3f44"/>
          <g id="kabine" style="transform: translateY(${y(1) - y(1)}px)">
            <rect x="140" y="${y(1) + 4}" width="40" height="${H - 8}" rx="2" fill="#d9dde0"/>
            <circle cx="160" cy="${y(1) + 16}" r="5" fill="#f2c7a6"/>
            <path d="M154 ${y(1) + 38} L156 ${y(1) + 22} L164 ${y(1) + 22} L166 ${y(1) + 38}Z" fill="#c8553d"/>
            <rect class="tuer-l" x="140" y="${y(1) + 4}" width="20" height="${H - 8}" fill="#b8bec3"/>
            <rect class="tuer-r" x="160" y="${y(1) + 4}" width="20" height="${H - 8}" fill="#aab0b5"/>
          </g>
          <rect x="0" y="${boden}" width="300" height="34" fill="#6e655c"/>
          <rect x="210" y="${boden - 30}" width="40" height="30" fill="#5e3920"/>
          <path d="M204 ${boden - 30} H256 L250 ${boden - 38} H210Z" fill="#c8553d"/>
          ${nummern}
        </svg>`;
    }

    Gorod.bausteine.aufzug = {
        start(ctx) {
            const G = Gorod, Z = Zahlwort;
            const cfg = ctx.inhalt.etagen || {};
            const max = Math.min(cfg.stockwerke || 12, 20);
            const bewohner = cfg.bewohner || BEWOHNER;
            const H = 46;
            let laufend = true, deck, i, richtig, fehler, hilfe, gesperrt, aktuell = 1, fahrt = 0;

            // ---------- Bühne über dem Bild ----------
            const lage = document.createElement('div');
            lage.className = 'aufzug-buehne';
            const reihen = [];
            for (let r = Math.ceil(max / 3) - 1; r >= 0; r--) {
                for (let c = 1; c <= 3; c++) { const n = r * 3 + c; if (n <= max) reihen.push(n); }
            }
            lage.innerHTML = `
              ${hochhausSvg(max)}
              <div class="aufzug-panel gesperrt" id="panel">
                <div class="aufzug-anzeige"><span id="pfeil"></span><span id="anzeige">1</span></div>
                <div class="aufzug-tasten">${reihen.map(n => `<button class="taste" data-etage="${n}">${n}</button>`).join('')}</div>
                <div class="aufzug-schild">${G.esc(cfg.haus || 'высо́тка')} · ${max} ${ohneBetonung(Z.form(max, 'эта́ж', 'этажа́', 'этаже́й'))}</div>
              </div>`;
            ctx.buehne.appendChild(lage);
            const kabine = lage.querySelector('#kabine');
            const panel = lage.querySelector('#panel');

            function anzeigen(n, pfeil) {
                lage.querySelector('#anzeige').textContent = n;
                lage.querySelector('#pfeil').textContent = pfeil || '';
                lage.querySelectorAll('.etage-nr').forEach(e => e.classList.toggle('jetzt', Number(e.dataset.etage) === n));
            }
            anzeigen(1);

            // Kabine zur Etage fahren; Anzeige zählt mit, Gong, Türen auf
            function fahre(ziel) {
                const token = ++fahrt;
                const start = aktuell, weg = Math.abs(ziel - start);
                kabine.classList.remove('offen');
                if (!weg) { kabine.classList.add('offen'); return Promise.resolve(); }
                const dauer = weg * SEKUNDEN_JE_ETAGE * 1000 + 400;
                const pfeil = ziel > start ? '▲' : '▼';
                return new Promise(fertig => {
                    const t0 = performance.now();
                    function schritt(jetzt) {
                        if (token !== fahrt || !laufend) return fertig();
                        const t = Math.min(1, (jetzt - t0) / dauer);
                        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                        const pos = start + (ziel - start) * e;
                        kabine.style.transform = `translateY(${-(pos - 1) * H}px)`;
                        anzeigen(Math.round(pos), t < 1 ? pfeil : '');
                        if (t < 1) requestAnimationFrame(schritt);
                        else { aktuell = ziel; gong(); kabine.classList.add('offen'); fertig(); }
                    }
                    requestAnimationFrame(schritt);
                });
            }

            // ---------- Tafel ----------
            ctx.tafel.innerHTML = `
              <header class="tafel-kopf">
                <h2>Aufzug</h2>
                <p>Russisch zählt das Erdgeschoss mit: <strong>пе́рвый эта́ж</strong> ist das Erdgeschoss.</p>
              </header>
              <div class="wo-frage">
                <button class="hoer-knopf klein" id="nochmal" title="Nochmal hören">🔊</button>
                <div><div class="wo-wort etagen-frage" id="frage-ru"></div><div class="wo-de" id="frage-de"></div></div>
              </div>
              <div class="hilfe-zeile">
                <button class="hilfe-knopf" id="uebersetzen" title="Auf Deutsch (zählt als Hilfe)"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                <span class="uebersetzung" id="uebersetzung"></span>
              </div>
              <div class="balken"><div id="balken-fuellung"></div></div>
              <div class="tasten-hinweis" id="tasten-hinweis" hidden>👉 Drücke die Taste im Aufzug.</div>
              <div class="wo-optionen" id="optionen"></div>
              <div class="rueckmeldung" id="rueckmeldung"></div>
              <div id="danach"></div>`;
            const q = (s) => ctx.tafel.querySelector(s);

            function zufallEtage(ohne) {
                let n;
                do { n = 1 + Math.floor(Math.random() * max); } while (ohne.includes(n));
                return n;
            }

            function neueRunde() {
                const typen = G.mischen(['hoerenAkk', 'hoerenAkk', 'hoerenPraep', 'hoerenPraep', 'sehen', 'sehen', 'sehen', 'sehen', 'falle', 'falle']);
                let vorher = aktuell;
                deck = typen.map(typ => {
                    if (typ === 'falle') return { typ, deutsch: Math.floor(Math.random() * Math.min(9, max - 2)) };
                    const n = zufallEtage([vorher]);
                    vorher = n;
                    return { typ, n };
                });
                i = 0; richtig = 0;
                q('#danach').innerHTML = '';
                q('.wo-frage').classList.remove('fertig');
                aufgabe();
            }

            // Was gesprochen wird und was die Übersetzung zeigt
            function texte(a) {
                if (a.typ === 'hoerenAkk') {
                    return { ru: `Мне на ${Z.ordinal(a.n)} эта́ж, пожа́луйста.`, de: `Ich möchte in die ${a.n}. Etage, bitte.`, stimme: Math.random() < 0.5 ? 'weiblich' : 'maennlich' };
                }
                if (a.typ === 'hoerenPraep') {
                    a.wer = a.wer || bewohner[Math.floor(Math.random() * bewohner.length)];
                    return { ru: `${a.wer.ru} живёт на ${Z.ordinal(a.n, 'praep')} этаже́. Пое́хали!`, de: `${a.wer.de} wohnt in der ${a.n}. Etage. Los geht's!`, stimme: 'erzaehler' };
                }
                if (a.typ === 'sehen') return { ru: 'На како́м мы этаже́?', de: 'Auf welcher Etage sind wir?', stimme: 'erzaehler' };
                return { ru: '', de: '', stimme: 'erzaehler' };
            }

            async function aufgabe() {
                const a = deck[i];
                if (!a || !laufend) return;
                fehler = 0; hilfe = false; gesperrt = false;
                q('#rueckmeldung').className = 'rueckmeldung'; q('#rueckmeldung').innerHTML = '';
                q('#danach').innerHTML = ''; q('#optionen').innerHTML = '';
                q('#uebersetzung').innerHTML = ''; q('#uebersetzen').classList.remove('benutzt');
                lage.querySelectorAll('.taste').forEach(t => t.classList.remove('leuchtet', 'falsch', 'tipp'));
                const t = texte(a);

                if (a.typ === 'hoerenAkk' || a.typ === 'hoerenPraep') {
                    q('#frage-ru').innerHTML = '<span class="verdeckt">… … …</span>';
                    G.gramZu(q('#frage-ru'));
                    q('#frage-de').textContent = 'Hör zu – wohin geht die Fahrt?';
                    q('#tasten-hinweis').hidden = false;
                    panel.classList.remove('gesperrt');
                    kabine.classList.add('offen');
                    ctx.sage(t.ru, t.stimme);
                } else if (a.typ === 'sehen') {
                    q('#tasten-hinweis').hidden = true;
                    panel.classList.add('gesperrt');
                    q('#frage-ru').textContent = '…';
                    G.gramZu(q('#frage-ru'));
                    q('#frage-de').textContent = 'Der Aufzug fährt …';
                    await fahre(a.n);
                    if (!laufend) return;
                    G.satz(q('#frage-ru'), t.ru);
                    q('#frage-de').textContent = 'Schau auf die Anzeige.';
                    ctx.sage(t.ru);
                    optionen(a, [
                        { text: `на ${Z.ordinal(a.n, 'praep')} этаже́`, richtig: true },
                        { text: `на ${Z.ordinal(a.n)} эта́ж`, art: 'akk' },
                        ...G.mischen([a.n - 1, a.n + 1].filter(m => m >= 1 && m <= max)).slice(0, 2)
                            .map(m => ({ text: `на ${Z.ordinal(m, 'praep')} этаже́`, art: 'andere', m }))
                    ].slice(0, 4));
                } else {
                    q('#tasten-hinweis').hidden = true;
                    panel.classList.add('gesperrt');
                    a.familie = a.familie || FAMILIEN[Math.floor(Math.random() * FAMILIEN.length)];
                    G.gramZu(q('#frage-ru'));
                    q('#frage-ru').textContent = `Familie ${a.familie} wohnt ${a.deutsch === 0 ? 'im Erdgeschoss' : `im ${a.deutsch}. Stock`}.`;
                    q('#frage-de').textContent = 'So zählt man in Deutschland. Wie sagt man das auf Russisch?';
                    const r = a.deutsch + 1;
                    const falsche = [];
                    if (a.deutsch >= 1) falsche.push({ text: `на ${Z.ordinal(a.deutsch, 'praep')} этаже́`, art: 'falle' });
                    falsche.push({ text: `на ${Z.ordinal(r)} эта́ж`, art: 'akk' });
                    falsche.push({ text: `на ${Z.ordinal(r + 1, 'praep')} этаже́`, art: 'andere', m: r + 1 });
                    optionen(a, [{ text: `на ${Z.ordinal(r, 'praep')} этаже́`, richtig: true }, ...falsche].slice(0, 4));
                }
            }

            function optionen(a, liste) {
                const box = q('#optionen');
                box.innerHTML = '';
                G.mischen(liste).forEach((o, n) => {
                    const b = document.createElement('button');
                    b.className = 'antwort wo-option';
                    b.style.animationDelay = (n * 0.05) + 's';
                    b.innerHTML = `<span class="ru">${G.esc(o.text)}</span>`;
                    b.addEventListener('click', () => waehle(a, o, b));
                    box.appendChild(b);
                });
            }

            // ---------- Antworten ----------
            async function richtigGeloest(satz, satzDe) {
                gesperrt = true;
                if (fehler === 0 && !hilfe) richtig++;
                const rm = q('#rueckmeldung');
                rm.className = 'rueckmeldung gut';
                rm.innerHTML = `✓ <strong></strong><br><span class="klein">${G.esc(satzDe)}</span>`;
                G.satz(rm.querySelector('strong'), satz, { box: G.gramBox(rm) });
                ctx.sage(satz);
                q('#danach').innerHTML = `<button class="knopf-haupt" id="weiter">${i + 1 < deck.length ? 'Weiter' : 'Ergebnis'} <span>→</span></button>`;
                q('#weiter').addEventListener('click', () => {
                    i++;
                    q('#balken-fuellung').style.width = (i / deck.length * 100) + '%';
                    if (i >= deck.length) ende(); else aufgabe();
                });
            }

            lage.querySelectorAll('.taste').forEach(taste => taste.addEventListener('click', async () => {
                const a = deck[i];
                if (!a || gesperrt || panel.classList.contains('gesperrt')) return;
                const n = Number(taste.dataset.etage);
                const rm = q('#rueckmeldung');
                if (n === a.n) {
                    gesperrt = true;
                    panel.classList.add('gesperrt');
                    taste.classList.add('leuchtet');
                    lage.querySelectorAll('.taste').forEach(t => t.classList.remove('tipp'));
                    q('#tasten-hinweis').hidden = true;
                    const t = texte(a);
                    G.satz(q('#frage-ru'), t.ru);
                    await fahre(n);
                    if (!laufend) return;
                    taste.classList.remove('leuchtet');
                    const praep = `на ${Z.ordinal(n, 'praep')} этаже́`;
                    richtigGeloest(`${gross(Z.ordinal(n))} эта́ж – мы ${praep}.`, `Die ${n}. Etage – wir sind in der ${n}. Etage.`);
                    return;
                }
                fehler++;
                taste.classList.add('falsch');
                setTimeout(() => taste.classList.remove('falsch'), 700);
                rm.className = 'rueckmeldung schlecht';
                rm.innerHTML = `${n} ist <strong>${G.esc(Z.ordinal(n))}</strong> (der ${n}.). Hör noch einmal hin.` +
                    (fehler >= 2 ? '<br><span class="klein">Tipp: Die richtige Taste blinkt.</span>' : '');
                ctx.sage(Z.ordinal(n));
                if (fehler >= 2) lage.querySelector(`.taste[data-etage="${a.n}"]`).classList.add('tipp');
            }));

            async function waehle(a, o, knopf) {
                if (gesperrt || knopf.disabled) return;
                const rm = q('#rueckmeldung');
                if (o.richtig) {
                    q('#optionen').querySelectorAll('.wo-option').forEach(b => { b.disabled = true; });
                    knopf.classList.add('treffer');
                    if (a.typ === 'falle') {
                        const r = a.deutsch + 1;
                        gesperrt = true;
                        await fahre(r);
                        gesperrt = false;
                        if (!laufend) return;
                        richtigGeloest(`Они́ живу́т на ${Z.ordinal(r, 'praep')} этаже́.`,
                            `Deutsch ${a.deutsch === 0 ? 'Erdgeschoss' : a.deutsch + '. Stock'} = russisch ${Z.ordinal(r)} эта́ж.`);
                    } else {
                        richtigGeloest(`Мы на ${Z.ordinal(a.n, 'praep')} этаже́.`, `Wir sind in der ${a.n}. Etage.`);
                    }
                    return;
                }
                fehler++;
                knopf.classList.add('daneben');
                knopf.disabled = true;
                rm.className = 'rueckmeldung schlecht';
                const ziel = a.typ === 'falle' ? a.deutsch + 1 : a.n;
                const richtigForm = `<strong>на ${G.esc(Z.ordinal(ziel, 'praep'))} этаже́</strong>`;
                if (o.art === 'akk') {
                    rm.innerHTML = `„${G.esc(ohneBetonung(o.text))}“ heißt „wohin?“ (Akkusativ) – so sagt man es im Aufzug zum Hinfahren. ` +
                        `Hier fragt <strong>Где?</strong> nach dem Ort: Präpositiv ${richtigForm}.`;
                } else if (o.art === 'falle') {
                    rm.innerHTML = `Das ist die deutsche Zählung. In Russland ist das Erdgeschoss schon <strong>пе́рвый эта́ж</strong> – ` +
                        `also eins mehr: ${richtigForm}.`;
                } else {
                    rm.innerHTML = a.typ === 'falle'
                        ? `Eins zu viel – zum deutschen Stock zählt man genau eins dazu: ${richtigForm}.`
                        : `„${G.esc(ohneBetonung(o.text))}“ ist die ${o.m}. Etage – schau auf die Anzeige im Aufzug.`;
                }
            }

            // ---------- Übersetzung (zählt als Hilfe) ----------
            q('#uebersetzen').addEventListener('click', () => {
                const a = deck[i];
                if (!a || gesperrt) return;
                hilfe = true;
                q('#uebersetzen').classList.add('benutzt');
                const t = texte(a);
                if (a.typ === 'falle') {
                    q('#uebersetzung').innerHTML = 'Tipp: Der deutsche Stock plus eins – das Erdgeschoss ist russisch <strong>пе́рвый эта́ж</strong>.';
                } else {
                    G.satz(q('#frage-ru'), t.ru);
                    q('#uebersetzung').textContent = t.de;
                }
            });
            q('#nochmal').addEventListener('click', () => {
                const a = deck[i];
                if (!a) return;
                const t = texte(a);
                if (t.ru) ctx.sage(t.ru, t.stimme);
            });

            function ende() {
                const sterne = richtig >= 9 ? 3 : richtig >= 6 ? 2 : 1;
                ctx.stand.aufzug_bestes = Math.max(ctx.stand.aufzug_bestes || 0, richtig);
                ctx.speichern();
                panel.classList.add('gesperrt');
                q('#optionen').innerHTML = '';
                q('#rueckmeldung').className = 'rueckmeldung'; q('#rueckmeldung').innerHTML = '';
                q('#tasten-hinweis').hidden = true;
                q('.wo-frage').classList.add('fertig');
                q('#danach').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${richtig} von ${deck.length}</strong> auf Anhieb richtig.</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="karte">Zur Karte</button>
                      <button class="knopf-haupt" id="nochmal-runde">↻ Nochmal</button>
                    </div>
                  </div>`;
                q('#nochmal-runde').addEventListener('click', neueRunde);
                q('#karte').addEventListener('click', () => document.getElementById('zur-karte').click());
                ctx.sage(sterne === 3 ? 'Отли́чно!' : 'Хорошо́!');
            }

            neueRunde();
            return () => { laufend = false; fahrt++; lage.remove(); };
        }
    };
})();
