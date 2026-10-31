// Baustein „Literatur“ (Schule, уро́к литерату́ры)
// Über dem Bild liegt ein aufgeschlagenes Buch: links eine Zeichnung, rechts der Text.
// Die Lehrerin liest Zeile für Zeile vor (die Zeilen erscheinen nacheinander); jede Zeile
// lässt sich antippen – nochmal hören und auf Deutsch sehen. Danach Fragen zum Text.
//
// Nutzt aus inhalt.json: literatur { stimme, texte[] }
// Text:  id, titel, autor, jahr, bild (repka | lukomorye | vorona | parus), hinweis,
//        zeilen [{ru, de}], fragen [{text, de, zeile?, richtig {text, de}, falsch [{text, hinweis}]}]

(function () {
    // Kleine Zeichnungen fürs Buch (viewBox 0 0 200 200)
    const BILDER = {
        repka: `<rect y="150" width="200" height="50" fill="#8a5a3a"/>
            <path d="M100 60 Q70 40 60 70 M100 60 Q100 30 115 45 M100 60 Q130 40 140 70" stroke="#3f8f5f" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M100 60 Q60 80 65 120 Q70 160 100 175 Q130 160 135 120 Q140 80 100 60Z" fill="#f2d046" stroke="#c9a42c" stroke-width="3"/>
            <g><circle cx="30" cy="112" r="9" fill="#f2c7a6"/><rect x="22" y="121" width="16" height="28" rx="5" fill="#5d7f96"/></g>
            <g><circle cx="14" cy="122" r="8" fill="#f2c7a6"/><rect x="7" y="130" width="14" height="20" rx="5" fill="#c8553d"/></g>
            <g><circle cx="178" cy="138" r="5" fill="#9aa1a7"/><path d="M182 140 Q192 142 196 136" stroke="#9aa1a7" stroke-width="2" fill="none"/></g>`,
        lukomorye: `<rect width="200" height="200" fill="#dff0f6"/><path d="M0 160 Q50 150 100 162 T200 158 V200 H0Z" fill="#6fa8d6"/>
            <rect x="92" y="90" width="18" height="90" fill="#7a4a2b"/>
            <circle cx="100" cy="70" r="46" fill="#4f8f46"/><circle cx="70" cy="88" r="28" fill="#5f9a4e"/><circle cx="132" cy="86" r="30" fill="#5f9a4e"/>
            <ellipse cx="101" cy="132" rx="22" ry="8" fill="none" stroke="#e2b43c" stroke-width="4" stroke-dasharray="6 3"/>
            <g fill="#2a2a2a"><ellipse cx="128" cy="126" rx="10" ry="7"/><circle cx="137" cy="118" r="6"/><path d="M134 113 l2 -6 l3 5 M139 113 l3 -5 l1 6"/><path d="M118 126 Q110 118 114 110" stroke="#2a2a2a" stroke-width="3" fill="none"/></g>`,
        vorona: `<rect width="200" height="200" fill="#e3f0f4"/><rect y="170" width="200" height="30" fill="#8fbf6a"/>
            <path d="M60 20 L20 120 H100 Z M60 60 L10 170 H110 Z" fill="#2f6b4f"/><rect x="54" y="165" width="12" height="15" fill="#7a4a2b"/>
            <g><ellipse cx="78" cy="78" rx="14" ry="10" fill="#2a2a2a"/><circle cx="90" cy="70" r="7" fill="#2a2a2a"/><path d="M96 70 L106 73 L96 75Z" fill="#3a3a3a"/>
            <path d="M101 73 L110 77 L104 81 Z" fill="#f2c14e"/></g>
            <g><path d="M120 170 Q125 140 150 140 Q172 140 176 160 L176 170Z" fill="#e07b39"/><path d="M172 150 L190 135 L184 156Z" fill="#e07b39"/>
            <path d="M120 165 Q100 160 96 146" stroke="#e07b39" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="182" cy="146" r="2" fill="#2a2a2a"/></g>`,
        parus: `<rect width="200" height="200" fill="#e8eef2"/><circle cx="150" cy="50" r="20" fill="#f6f2e6" opacity="0.9"/>
            <rect y="120" width="200" height="80" fill="#6fa8d6"/><path d="M0 140 Q25 134 50 140 T100 140 T150 140 T200 140" stroke="#fff" stroke-width="2" fill="none" opacity="0.6"/>
            <path d="M100 40 L100 118 L60 118 Z" fill="#fbfbfb" stroke="#c9d3d9" stroke-width="2"/><path d="M104 60 L104 118 L132 118 Z" fill="#f3f3f3"/>
            <path d="M60 120 H140 L128 132 H72 Z" fill="#7a4a2b"/>
            <rect width="200" height="200" fill="#ffffff" opacity="0.18"/>`
    };

    Gorod.bausteine.literatur = {
        start(ctx) {
            const G = Gorod;
            const daten = ctx.inhalt.literatur;
            const stimme = daten.stimme || 'weiblich';
            let text, i, richtig, fehlversuch, laufend = true, liestToken = 0;
            const q = (s) => ctx.tafel.querySelector(s);

            const buehne = document.createElement('div');
            buehne.className = 'buch-buehne';
            ctx.buehne.appendChild(buehne);

            function waehleText(weiter) {
                const n = daten.texte.length;
                ctx.stand.literatur_nr = ((ctx.stand.literatur_nr || 0) + (weiter ? 1 : 0)) % n;
                ctx.speichern();
                return daten.texte[ctx.stand.literatur_nr];
            }

            function buch() {
                buehne.innerHTML = `
                  <div class="buch">
                    <div class="buch-seite links"><svg viewBox="0 0 200 200" aria-hidden="true">${BILDER[text.bild] || ''}</svg></div>
                    <div class="buch-seite rechts">
                      <div class="buch-kopf"><span class="buch-autor">${G.esc(text.autor)}</span><span class="buch-titel">${G.esc(text.titel)}</span></div>
                      <div class="buch-text">${text.zeilen.map((z, n) => `
                        <button class="buch-zeile" data-n="${n}"><span class="ru">${G.esc(z.ru)}</span><span class="de">${G.esc(z.de)}</span></button>`).join('')}</div>
                    </div>
                  </div>`;
                buehne.querySelectorAll('.buch-zeile').forEach(b => b.addEventListener('click', () => {
                    liestToken++;           // Vorlesen anhalten, wenn man selbst tippt
                    buehne.querySelectorAll('.buch-zeile').forEach(x => x.classList.remove('liest'));
                    b.classList.add('da', 'offen', 'liest');
                    ctx.sage(text.zeilen[b.dataset.n].ru, stimme);
                }));
            }

            async function vorlesen() {
                const token = ++liestToken;
                const zeilen = [...buehne.querySelectorAll('.buch-zeile')];
                for (const z of zeilen) {
                    if (token !== liestToken || !laufend) return;
                    zeilen.forEach(x => x.classList.remove('liest'));
                    z.classList.add('da', 'liest');
                    await ctx.sage(text.zeilen[z.dataset.n].ru, stimme);
                    await G.pause(350);
                }
                if (token === liestToken) zeilen.forEach(x => x.classList.remove('liest'));
            }

            // ---------- Phase 1: lesen ----------
            function lesen(weiter) {
                text = waehleText(weiter);
                buch();
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>Literatur</h2>
                    <p>Мари́я Ива́новна liest vor. Tippe auf eine Zeile, um sie noch einmal zu hören und die Übersetzung zu sehen.</p>
                  </header>
                  <div class="lit-karte">
                    <div class="lit-titel">${G.esc(text.titel)}</div>
                    <div class="lit-autor">${G.esc(text.autor)}${text.jahr ? ` · ${G.esc(String(text.jahr))}` : ''}</div>
                    ${text.hinweis ? `<div class="wk-hinweis">💡 ${G.esc(text.hinweis)}</div>` : ''}
                  </div>
                  <div class="knopf-reihe">
                    <button class="knopf-zweit" id="vorlesen">▶ Noch einmal vorlesen</button>
                    <button class="knopf-haupt" id="zu-fragen">Fragen zum Text <span>→</span></button>
                  </div>`;
                q('#vorlesen').addEventListener('click', () => vorlesen());
                q('#zu-fragen').addEventListener('click', () => fragenStart());
                vorlesen();
            }

            // ---------- Phase 2: Fragen ----------
            function fragenStart() {
                liestToken++;
                buehne.querySelectorAll('.buch-zeile').forEach(x => x.classList.add('da'));
                buehne.querySelectorAll('.buch-zeile').forEach(x => x.classList.remove('liest'));
                i = 0; richtig = 0;
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>${G.esc(text.titel)}</h2>
                    <p>Fragen zum Text – der Text bleibt im Buch stehen.</p>
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
                q('#nochmal').addEventListener('click', () => { const f = text.fragen[i]; if (f) ctx.sage(f.text, stimme); });
                q('#uebersetzen').addEventListener('click', () => {
                    const f = text.fragen[i]; if (!f) return;
                    fehlversuch = true;
                    q('#uebersetzung').textContent = `„${f.de}“`;
                    q('#uebersetzen').classList.add('benutzt');
                });
                frage();
            }

            function frage() {
                const f = text.fragen[i];
                if (!f || !laufend) return;
                fehlversuch = false;
                buehne.querySelectorAll('.buch-zeile').forEach(x => x.classList.remove('liest'));
                G.satz(q('#frage'), f.text, { stimme });
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
                ctx.sage(f.text, stimme);
            }

            function waehle(o, knopf, f) {
                if (!laufend || knopf.disabled) return;
                const rm = q('#rueckmeldung');
                if (o.ok) {
                    if (!fehlversuch) richtig++;
                    ctx.tafel.querySelectorAll('.wo-option').forEach(b => { b.disabled = true; });
                    knopf.classList.add('treffer');
                    if (f.zeile !== undefined) {
                        const z = buehne.querySelector(`.buch-zeile[data-n="${f.zeile}"]`);
                        if (z) { z.classList.add('liest'); z.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
                    }
                    rm.className = 'rueckmeldung gut';
                    rm.innerHTML = `✓ <strong></strong><br><span class="klein">${G.esc(o.de || '')}</span>`;
                    G.satz(rm.querySelector('strong'), o.text, { box: G.gramBox(rm) });
                    ctx.sage(o.text, stimme);
                    q('#danach').innerHTML = `<button class="knopf-haupt" id="weiter">${i + 1 < text.fragen.length ? 'Weiter' : 'Ergebnis'} <span>→</span></button>`;
                    q('#weiter').addEventListener('click', () => {
                        i++;
                        q('#balken-fuellung').style.width = (i / text.fragen.length * 100) + '%';
                        if (i >= text.fragen.length) ende(); else frage();
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
                const n = text.fragen.length;
                const sterne = richtig === n ? 3 : richtig >= n - 1 ? 2 : 1;
                ctx.stand.literatur_gelesen = [...new Set([...(ctx.stand.literatur_gelesen || []), text.id])];
                ctx.speichern();
                q('#optionen').innerHTML = '';
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#rueckmeldung').innerHTML = '';
                q('.wo-frage').classList.add('fertig');
                q('#danach').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${richtig} von ${n}</strong> auf Anhieb richtig.</p>
                    <p class="klein">Gelesen: ${(ctx.stand.literatur_gelesen || []).length} von ${daten.texte.length} Texten.</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="nochmal-text">↻ Noch einmal</button>
                      <button class="knopf-haupt" id="naechster">Nächster Text <span>→</span></button>
                    </div>
                  </div>`;
                q('#nochmal-text').addEventListener('click', () => lesen(false));
                q('#naechster').addEventListener('click', () => lesen(true));
                ctx.sage(sterne === 3 ? 'Отли́чно! Пять!' : 'Хорошо́!', stimme);
            }

            lesen(false);
            return () => { laufend = false; liestToken++; buehne.remove(); };
        }
    };
})();
