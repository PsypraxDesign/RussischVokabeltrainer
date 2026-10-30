// Baustein „Entdecken“ (Wimmelbild)
// Im Bild antippen, was man sieht: Wort, Bedeutung, Genus, ein Beispielsatz.
// Nutzt aus inhalt.json: woerter[] mit id, ru, de, genus, hotspot, satz?, hinweis?
// Mit inhalt.raeume[] (z. B. Wohnhaus): erst ein Zimmer antippen (Zoom), dann
// die Dinge darin. Fehlt ein Satz, entsteht er aus dem Zimmer: „Крова́ть в спа́льне.“

(function () {
    const GENUS = { m: 'männlich', f: 'weiblich', n: 'sächlich', pl: 'Plural' };
    const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);

    Gorod.bausteine.entdecken = {
        start(ctx) {
            const G = Gorod;
            const woerter = ctx.inhalt.woerter;
            const raeume = ctx.raeume;
            const stand = ctx.stand;
            stand.entdeckt = stand.entdeckt || [];

            ctx.tafel.innerHTML = `
              <header class="tafel-kopf">
                <h2>Entdecken</h2>
                <p>${raeume.length ? 'Tippe auf ein Zimmer – dann auf alles, was du darin siehst.' : 'Tippe im Bild auf alles, was du siehst.'}</p>
              </header>
              <div class="raum-zeile" id="raum-zeile" hidden></div>
              <div class="wortkarte leer" id="wortkarte"></div>
              <div class="fortschritt">
                <div class="perlen" id="perlen">${woerter.map(w => `<i data-id="${w.id}"></i>`).join('')}</div>
                <span id="zaehler"></span>
              </div>
              <button class="knopf-haupt" id="weiter">Weiter: Hören &amp; Zeigen <span>→</span></button>`;

            const karte = ctx.tafel.querySelector('#wortkarte');
            const raumZeile = ctx.tafel.querySelector('#raum-zeile');
            ctx.tafel.querySelector('#weiter').addEventListener('click', () => ctx.zuStufe('hoeren'));

            function fortschritt() {
                ctx.tafel.querySelectorAll('#perlen i').forEach(p => p.classList.toggle('an', stand.entdeckt.includes(p.dataset.id)));
                ctx.tafel.querySelector('#zaehler').textContent = `${stand.entdeckt.length} von ${woerter.length} entdeckt`;
            }

            function sprechKnoepfe(wurzel) {
                wurzel.querySelectorAll('.sprich').forEach(b => b.addEventListener('click', () => ctx.sage(b.dataset.text)));
            }

            function einblenden() {
                karte.classList.remove('rein'); void karte.offsetWidth; karte.classList.add('rein');
            }

            // ---------- Übersicht (nur mit Räumen) ----------
            function uebersicht() {
                ctx.entmarkiere('gewaehlt');
                raumZeile.hidden = true;
                ctx.namenZeigen(true);
                karte.classList.remove('leer');
                karte.innerHTML = `
                  <div class="haus-liste">${raeume.map(r => {
                      const alle = woerter.filter(w => w.raum === r.id);
                      const ent = alle.filter(w => stand.entdeckt.includes(w.id)).length;
                      return `<button class="raum-chip ${ent === alle.length ? 'fertig' : ''}" data-raum="${r.id}">
                        <span class="ru">${G.esc(r.ru)}</span><span class="zahl">${ent}/${alle.length}</span></button>`;
                  }).join('')}</div>`;
                einblenden();
                karte.querySelectorAll('.raum-chip').forEach(b => b.addEventListener('click', () => betrete(b.dataset.raum)));
            }

            // ---------- Ein Zimmer ----------
            async function betrete(rid) {
                const r = raeume.find(x => x.id === rid);
                if (!r) return;
                ctx.entmarkiere('gewaehlt');
                ctx.namenZeigen(false);
                raumKarte(r);
                ctx.sage(`Э́то ${r.ru}.`);
                await ctx.zuRaum(rid);
            }

            function raumKarte(r) {
                // Russisch zählt das Erdgeschoss mit: второ́й эта́ж = deutscher 1. Stock
                const nr = r.etage_nr || (/второ́м/.test(r.etage || '') ? 2 : 0);
                raumZeile.hidden = true;
                karte.classList.remove('leer');
                karte.innerHTML = `
                  <div class="wk-oben"><span class="genus g-raum">Zimmer</span></div>
                  <button class="wk-ru sprich" data-text="${G.esc(r.ru)}">${G.esc(r.ru)}<span class="lautsprecher">🔊</span></button>
                  <div class="wk-de">${G.esc(r.de)}</div>
                  <div class="raum-fakten">
                    <span class="lbl">Wo?</span><button class="sprich" data-text="${G.esc(r.wo)}">${G.esc(r.wo)}</button><span class="de">${G.esc(r.wo_de)}</span>
                    ${r.etage ? `<span class="lbl">Lage</span><button class="sprich" data-text="${G.esc(r.etage)}">${G.esc(r.etage)}</button><span class="de">${G.esc(r.etage_de || '')}</span>` : ''}
                  </div>
                  ${r.hinweis ? `<div class="wk-hinweis">💡 ${G.esc(r.hinweis)}</div>` : ''}
                  ${nr >= 2 ? `<div class="wk-hinweis">💡 Russisch zählt das Erdgeschoss mit: ${Zahlwort.ordinal(nr)} эта́ж ist bei uns der ${nr - 1}. Stock.</div>` : ''}
                  ${nr === 1 ? '<div class="wk-hinweis">💡 пе́рвый эта́ж ist das Erdgeschoss – Russisch zählt es mit.</div>' : ''}
                  <p class="klein">${woerter.some(w => w.raum === r.id) ? 'Tippe im Zimmer auf die Dinge.' : 'Hier gibt es nichts zu entdecken – nur das Wort selbst.'}</p>`;
                einblenden();
                sprechKnoepfe(karte);
            }

            function zeige(w) {
                ctx.entmarkiere('gewaehlt');
                ctx.markiere(w.hotspot, 'gewaehlt');
                const neu = !stand.entdeckt.includes(w.id);
                const r = ctx.raumVon(w);
                const satz = w.satz || (r ? `${gross(w.ru)} ${r.wo}.` : '');
                if (r) {
                    raumZeile.hidden = false;
                    raumZeile.innerHTML = `<span>${G.esc(r.ru)}</span> · ${G.esc(r.etage || '')}`;
                }
                karte.classList.remove('leer');
                karte.innerHTML = `
                  <div class="wk-oben">
                    <span class="genus g-${w.genus}">${GENUS[w.genus] || ''}</span>
                    ${neu ? '<span class="neu">neu</span>' : ''}
                  </div>
                  <button class="wk-ru sprich" data-text="${G.esc(w.ru)}">${G.esc(w.ru)}<span class="lautsprecher">🔊</span></button>
                  <div class="wk-de">${G.esc(w.de)}</div>
                  ${satz ? `<button class="wk-satz sprich" data-text="${G.esc(satz)}">${G.esc(satz)}<span class="lautsprecher">🔊</span></button>` : ''}
                  ${w.hinweis ? `<div class="wk-hinweis">💡 ${G.esc(w.hinweis)}</div>` : ''}`;
                einblenden();
                sprechKnoepfe(karte);
                ctx.sage(w.ru);
                if (neu) {
                    stand.entdeckt.push(w.id);
                    ctx.speichern();
                    fortschritt();
                    if (stand.entdeckt.length === woerter.length) {
                        ctx.toast(`Молоде́ц! Alle ${woerter.length} Wörter entdeckt.`, 'gut');
                        ctx.tafel.querySelector('#weiter').classList.add('lockt');
                    }
                }
            }

            ctx.beiKlick = (hsId) => {
                const w = woerter.find(x => x.hotspot === hsId);
                if (w) zeige(w);
            };

            if (raeume.length) {
                ctx.beiRaum = (rid) => betrete(rid);
                ctx.beiGanzes = async () => { uebersicht(); await ctx.zuRaum(null); };
                uebersicht();
            } else {
                karte.innerHTML = `<div class="leer-hinweis"><span class="finger">👆</span>${G.esc(ctx.inhalt.entdecken_hinweis || 'Was ist das? Tippe auf etwas im Bild.')}</div>`;
            }
            fortschritt();

            return () => { ctx.entmarkiere('gewaehlt'); ctx.namenZeigen(false); };
        }
    };
})();
