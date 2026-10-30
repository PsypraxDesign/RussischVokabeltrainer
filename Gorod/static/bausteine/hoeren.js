// Baustein „Hören & Zeigen“
// Die Stimme fragt „Где …?“, man tippt im Bild auf die richtige Stelle.
// Zehn Fragen; wer zweimal danebenliegt, bekommt einen Tipp im Bild.
// Mit Räumen: einige Fragen nach Zimmern (Gesamtansicht), die übrigen nach
// Dingen — dafür fährt das Bild ins passende Zimmer.

(function () {
    const RUNDEN = 10;
    const ZIMMERFRAGEN = 3;

    Gorod.bausteine.hoeren = {
        start(ctx) {
            const G = Gorod;
            const woerter = ctx.inhalt.woerter;
            const raeume = ctx.raeume;
            let deck, i, richtig, fehler, gesperrt, hilfe, laufend = true;
            ctx.ganzesErlaubt = false;

            function aufbauen() {
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>Hören &amp; Zeigen</h2>
                    <p>Hör zu und tippe im Bild auf das, was gesucht wird.</p>
                  </header>
                  <div class="hoer-buehne">
                    <button class="hoer-knopf" id="nochmal" title="Nochmal hören">🔊</button>
                    <div class="hoer-frage" id="frage">…</div>
                  </div>
                  <div class="hilfe-zeile">
                    <button class="hilfe-knopf" id="uebersetzen" title="Frage auf Deutsch anzeigen (zählt als Hilfe)"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                    <span class="uebersetzung" id="uebersetzung"></span>
                  </div>
                  <div class="balken"><div id="balken-fuellung"></div></div>
                  <div class="rueckmeldung" id="rueckmeldung"></div>
                  <div id="ergebnis"></div>`;
                ctx.tafel.querySelector('#nochmal').addEventListener('click', fragen);
                ctx.tafel.querySelector('#uebersetzen').addEventListener('click', uebersetzen);
            }

            // Frage aufdecken: russisch und deutsch. Zählt nicht als „auf Anhieb“.
            function uebersetzen() {
                const f = aktuelles();
                if (!f || gesperrt) return;
                hilfe = true;
                ctx.tafel.querySelector('#frage').innerHTML = `Где <strong>${G.esc(f.ru)}</strong>?`;
                ctx.tafel.querySelector('#uebersetzung').textContent = G.woFrageDe(f.de, f.genus, f.deZahl);
                ctx.tafel.querySelector('#uebersetzen').classList.add('benutzt');
            }

            function neueRunde() {
                if (raeume.length) {
                    const zimmer = G.mischen(raeume).slice(0, ZIMMERFRAGEN).map(r => ({ art: 'raum', ru: r.ru, de: r.de, ziel: r.id }));
                    const dinge = G.mischen(woerter).slice(0, RUNDEN - ZIMMERFRAGEN).map(w => ({ art: 'ding', ru: w.ru, de: w.de, genus: w.genus, deZahl: w.de_zahl, ziel: w.hotspot, raum: w.raum }));
                    deck = G.mischen(zimmer.concat(dinge));
                } else {
                    deck = G.mischen(woerter).slice(0, RUNDEN).map(w => ({ art: 'ding', ru: w.ru, de: w.de, genus: w.genus, deZahl: w.de_zahl, ziel: w.hotspot }));
                }
                i = 0; richtig = 0; fehler = 0; gesperrt = false;
                aufbauen();
                fragen();
            }

            const aktuelles = () => deck[i];

            async function fragen() {
                const f = aktuelles();
                if (!f || !laufend) return;
                const knopf = ctx.tafel.querySelector('#nochmal');
                ctx.tafel.querySelector('#frage').innerHTML = `Где <span class="verdeckt">…</span>?`;
                ctx.tafel.querySelector('#uebersetzung').textContent = '';
                ctx.tafel.querySelector('#uebersetzen').classList.remove('benutzt');
                hilfe = false;
                if (raeume.length) {
                    // Zimmerfrage in der Gesamtansicht, Dingfrage im Zimmer
                    const ziel = f.art === 'raum' ? null : f.raum;
                    if (ctx.raum !== ziel) await ctx.zuRaum(ziel);
                    if (!laufend) return;
                }
                knopf.classList.add('spricht');
                ctx.sage(`Где ${f.ru}?`).then(() => knopf.classList.remove('spricht'));
                const naechstes = deck[i + 1];
                if (naechstes) Stimmen.vorabladen(`Где ${naechstes.ru}?`);
            }

            function fortschritt() {
                ctx.tafel.querySelector('#balken-fuellung').style.width = (i / deck.length * 100) + '%';
            }

            // Gemeinsame Auswertung für Dinge und Zimmer
            function antwort(getroffen, elementId, getipptRu, getipptDe) {
                if (gesperrt || !laufend) return;
                const f = aktuelles();
                const rm = ctx.tafel.querySelector('#rueckmeldung');
                const zielId = f.art === 'raum' ? 'raum-' + f.ziel : f.ziel;
                if (getroffen) {
                    gesperrt = true;
                    if (fehler === 0 && !hilfe) richtig++;
                    ctx.entmarkiere('tipp');
                    ctx.markiere(zielId, 'richtig', 1300);
                    ctx.tafel.querySelector('#frage').innerHTML = `Где <strong>${G.esc(f.ru)}</strong>?`;
                    rm.className = 'rueckmeldung gut';
                    rm.innerHTML = `✓ <strong>${G.esc(f.ru)}</strong> – ${G.esc(f.de)}`;
                    ctx.sage(f.ru);
                    setTimeout(() => {
                        if (!laufend) return;
                        i++; fehler = 0; gesperrt = false;
                        fortschritt();
                        rm.className = 'rueckmeldung'; rm.innerHTML = '';
                        if (i >= deck.length) ende(); else fragen();
                    }, 1500);
                } else {
                    fehler++;
                    ctx.markiere(elementId, 'falsch', 900);
                    rm.className = 'rueckmeldung schlecht';
                    rm.innerHTML = `Das ist <strong>${G.esc(getipptRu)}</strong> – ${G.esc(getipptDe)}.` +
                        (fehler >= 2 ? '<br><span class="klein">Tipp: Der goldene Rahmen mit dem Pfeil zeigt es dir.</span>' : ' Hör noch einmal hin.');
                    ctx.sage(getipptRu);
                    if (fehler >= 2) ctx.markiere(zielId, 'tipp');
                }
            }

            ctx.beiKlick = (hsId) => {
                const f = aktuelles();
                if (!f || f.art !== 'ding') return;
                const getippt = woerter.find(x => x.hotspot === hsId);
                if (!getippt) return;
                antwort(hsId === f.ziel, hsId, getippt.ru, getippt.de);
            };

            ctx.beiRaum = (rid) => {
                const f = aktuelles();
                if (!f || f.art !== 'raum') return;      // im Zimmer: andere Zimmer zählen nicht
                const r = raeume.find(x => x.id === rid);
                antwort(rid === f.ziel, 'raum-' + rid, r.ru, r.de);
            };

            function ende() {
                const sterne = richtig >= 9 ? 3 : richtig >= 6 ? 2 : 1;
                ctx.stand.hoeren_bestes = Math.max(ctx.stand.hoeren_bestes || 0, richtig);
                ctx.speichern();
                const weiterStufe = ctx.modul.stufen[ctx.modul.stufen.indexOf('hoeren') + 1];
                const weiterTitel = { dialog: 'Bestellen', wo: 'Wo ist das?', bezahlen: 'Bezahlen', etagen: 'Stockwerke', aufzug: 'Aufzug' }[weiterStufe];
                ctx.tafel.querySelector('#ergebnis').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${richtig} von ${deck.length}</strong> auf Anhieb richtig.</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="nochmal-runde">↻ Nochmal</button>
                      ${weiterStufe ? `<button class="knopf-haupt" id="weiter">Weiter: ${weiterTitel || weiterStufe} <span>→</span></button>` : ''}
                    </div>
                  </div>`;
                ctx.tafel.querySelector('.hoer-buehne').classList.add('fertig');
                ctx.tafel.querySelector('#nochmal-runde').addEventListener('click', neueRunde);
                const w = ctx.tafel.querySelector('#weiter');
                if (w) w.addEventListener('click', () => ctx.zuStufe(weiterStufe));
                ctx.sage(sterne === 3 ? 'Отли́чно!' : 'Хорошо́!');
            }

            neueRunde();
            return () => { laufend = false; ctx.entmarkiere('tipp'); ctx.ganzesErlaubt = true; };
        }
    };
})();
