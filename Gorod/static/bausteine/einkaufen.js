// Baustein „Einkaufen“ (Supermarkt)
// Ein russischer Einkaufszettel wird vorgelesen („три я́блока, два паке́та молока́,
// шесть яи́ц“). Man tippt die Waren im Regal an – jedes Antippen legt eins in den
// Korb. Geübt wird Zahl + Kasus: 1 → Nominativ, 2–4 → Genitiv Singular, ab 5 → Genitiv Plural.
// Die Mengen stehen nur als Wörter da; erst „Prüfen“ verrät, was nicht stimmt.
//
// Nutzt aus inhalt.json: reise.reisende[].liste [{ware, menge, text, de, bild}], .liste_satz
// (ware = id eines Wortes mit Klickfläche). Der Einkauf gilt danach für Theke und Kasse.
// Texte lassen sich mit inhalt.einkaufen_text überschreiben (Schule: „Ranzen packen“).

(function () {
    Gorod.bausteine.einkaufen = {
        klickbar: true,
        start(ctx) {
            const G = Gorod;
            const woerter = ctx.inhalt.woerter;
            let wer, korb, hinweise, uebersetzt, laufend = true;
            const q = (s) => ctx.tafel.querySelector(s);
            const wortVon = (id) => woerter.find(w => w.id === id);
            const T = {
                titel: 'Einkaufen', anleitung: 'Hör dir den Zettel an und tippe die Waren im Regal an – so oft, wie es dasteht.',
                zettel: 'Спи́сок поку́пок', korb: 'Корзи́на', leer: 'Noch leer. Tippe im Bild auf die Waren.',
                fertig: 'Alles im Korb!', weiter: 'Weiter zur Theke', lob: 'Молоде́ц! Всё есть.',
                tipp: 'Tipp: оди́н/одна́ = 1, два/две = 2, три = 3, четы́ре = 4, пять = 5, шесть = 6.',
                ...(ctx.inhalt.einkaufen_text || {})
            };

            function start() {
                wer = G.reiseWaehlen(ctx, false);
                korb = {};
                hinweise = 0;
                uebersetzt = false;
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>${G.esc(T.titel)}</h2>
                    <p>${G.esc(T.anleitung)}</p>
                  </header>
                  <div class="einkaufszettel">
                    <div class="ez-kopf">
                      <span class="ez-titel">${G.esc(T.zettel)}</span>
                      <button class="hoer-knopf klein" id="vorlesen" title="Zettel vorlesen">🔊</button>
                    </div>
                    <ul>${wer.liste.map(p => `<li data-ware="${p.ware}">
                        <button class="ez-ru" data-text="${G.esc(p.text)}">${G.esc(p.text)}</button>
                        <span class="ez-de">${G.esc(p.de)}</span>
                        <span class="ez-stand" data-stand="${p.ware}"></span></li>`).join('')}</ul>
                    <button class="hilfe-knopf" id="ez-uebersetzen" title="Zettel auf Deutsch (zählt als Hilfe)"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                  </div>
                  <div class="korb">
                    <div class="korb-kopf">${G.esc(T.korb)} <small>– antippen nimmt eins heraus</small></div>
                    <div class="korb-inhalt" id="korb"><span class="korb-leer">${G.esc(T.leer)}</span></div>
                  </div>
                  <div class="hinweis-karte" id="hinweis" hidden></div>
                  <div class="knopf-reihe" id="danach"><button class="knopf-haupt" id="pruefen" disabled>✓ Prüfen</button></div>`;
                q('#vorlesen').addEventListener('click', () => ctx.sage(wer.liste_satz));
                ctx.tafel.querySelectorAll('.ez-ru').forEach(b => b.addEventListener('click', () => ctx.sage(b.dataset.text)));
                q('#ez-uebersetzen').addEventListener('click', () => {
                    if (!uebersetzt) hinweise++;
                    uebersetzt = true;
                    q('.einkaufszettel').classList.add('mit-de');
                    q('#ez-uebersetzen').classList.add('benutzt');
                });
                q('#pruefen').addEventListener('click', pruefen);
                ctx.sage(wer.liste_satz);
            }

            function hinweis(text) {
                const h = q('#hinweis');
                if (!text) { h.hidden = true; return; }
                h.innerHTML = text;
                h.hidden = false;
                h.classList.remove('auf'); void h.offsetWidth; h.classList.add('auf');
            }

            function zeichneKorb() {
                const box = q('#korb');
                const drin = Object.entries(korb).filter(([, n]) => n > 0);
                box.innerHTML = drin.length ? drin.map(([id, n]) => {
                    const w = wortVon(id), p = wer.liste.find(x => x.ware === id);
                    return `<button class="korb-ware" data-ware="${id}" title="${G.esc(w.de)} – eins herausnehmen">
                      <span class="kw-bild">${(p && p.bild) || '🛒'}</span><span class="kw-name">${G.esc(w.ru)}</span><b>×${n}</b></button>`;
                }).join('') : `<span class="korb-leer">${G.esc(T.leer)}</span>`;
                box.querySelectorAll('.korb-ware').forEach(b => b.addEventListener('click', () => {
                    korb[b.dataset.ware]--;
                    aktualisieren();
                }));
                wer.liste.forEach(p => {
                    const el = q(`[data-stand="${p.ware}"]`);
                    const n = korb[p.ware] || 0;
                    el.textContent = n ? `×${n}` : '';
                    el.closest('li').classList.remove('falsch', 'richtig');
                });
            }

            function aktualisieren() {
                zeichneKorb();
                hinweis(null);
                q('#pruefen').disabled = !Object.values(korb).some(n => n > 0);
            }

            // „+1“ fliegt vom Regal hoch
            function plusEins(e, bild) {
                const r = ctx.buehne.getBoundingClientRect();
                const s = document.createElement('span');
                s.className = 'plus-eins';
                s.textContent = `+1 ${bild || ''}`;
                s.style.left = (e.clientX - r.left) + 'px';
                s.style.top = (e.clientY - r.top) + 'px';
                ctx.buehne.appendChild(s);
                setTimeout(() => s.remove(), 900);
            }

            ctx.beiKlick = (hsId, e) => {
                if (!laufend) return;
                const w = woerter.find(x => x.hotspot === hsId);
                if (!w) return;
                const p = wer.liste.find(x => x.ware === w.id);
                if (!p) {
                    hinweise++;
                    ctx.markiere(hsId, 'falsch', 600);
                    hinweis(w.an_der_theke
                        ? `„${G.esc(w.ru)}“ – ${G.esc(w.de)} gibt es gleich an der Theke.`
                        : `„${G.esc(w.ru)}“ – ${G.esc(w.de)}: Das steht nicht auf dem Zettel.`);
                    ctx.sage(w.ru);
                    return;
                }
                korb[w.id] = (korb[w.id] || 0) + 1;
                ctx.markiere(hsId, 'richtig', 400);
                plusEins(e, p.bild);
                aktualisieren();
                ctx.sage(w.ru);
            };

            function pruefen() {
                const fehler = [];
                wer.liste.forEach(p => {
                    const n = korb[p.ware] || 0;
                    q(`li[data-ware="${p.ware}"]`).classList.toggle('falsch', n !== p.menge);
                    q(`li[data-ware="${p.ware}"]`).classList.toggle('richtig', n === p.menge);
                    if (n !== p.menge) fehler.push(n === 0
                        ? `<strong>${G.esc(p.text)}</strong> fehlt noch.`
                        : `<strong>${G.esc(p.text)}</strong>: Du hast ${n} im Korb – ${n < p.menge ? 'zu wenig' : 'zu viel'}.`);
                });
                if (fehler.length) {
                    hinweise++;
                    hinweis(fehler.join('<br>') + (uebersetzt ? '' : `<br><span class="klein">${G.esc(T.tipp)}</span>`));
                    return;
                }
                fertig();
            }

            function fertig() {
                const sterne = hinweise === 0 ? 3 : hinweise <= 2 ? 2 : 1;
                ctx.stand.einkaeufe = (ctx.stand.einkaeufe || 0) + 1;
                ctx.speichern();
                ctx.tafel.querySelectorAll('.korb-ware').forEach(b => { b.disabled = true; });
                const weiter = ctx.modul.stufen[ctx.modul.stufen.indexOf('einkaufen') + 1];
                q('#danach').outerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${G.esc(T.fertig)}</strong></p>
                    <p class="klein">${hinweise === 0 ? 'Ganz ohne Hilfe – отли́чно!' : `${hinweise} Hilfe${hinweise > 1 ? 'n' : ''} gebraucht.`}</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="nochmal">↻ Noch einmal</button>
                      ${weiter ? `<button class="knopf-haupt" id="weiter">${G.esc(T.weiter)} <span>→</span></button>` : ''}
                    </div>
                  </div>`;
                q('#nochmal').addEventListener('click', start);
                const wb = q('#weiter');
                if (wb) wb.addEventListener('click', () => ctx.zuStufe(weiter));
                ctx.sage(T.lob);
            }

            start();
            return () => { laufend = false; ctx.buehne.querySelectorAll('.plus-eins').forEach(s => s.remove()); };
        }
    };
})();
