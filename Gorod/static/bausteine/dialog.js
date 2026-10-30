// Baustein „Dialog mit Antwortauswahl“
// Eine Figur spricht (Sprechblase im Bild + Stimme), man wählt eine Antwort.
// Unpassende Antworten bekommen einen Hinweis statt eines roten Kreuzes.
//
// Nutzt aus inhalt.json: dialog { start, figuren, auftraege, knoten }, menue[]
// Knoten: sprecher, text, de, optionen[] | auswahl{art, muster, muster_de},
//         weiter?, aktion? ("servieren" | "bezahlen")
// Option: text, de, weiter? | hinweis? | ende?

(function () {
    Gorod.bausteine.dialog = {
        start(ctx) {
            const G = Gorod;
            const d = ctx.inhalt.dialog;
            const menue = ctx.inhalt.menue || [];
            const fig = d.figuren;
            let laufend = true, auftrag, bestellt, hinweise, zahlart;

            const stimmeVon = (sprecher) => (fig[sprecher] && fig[sprecher].stimme) || 'erzaehler';
            const summe = () => bestellt.reduce((s, id) => s + menue.find(m => m.id === id).preis, 0);
            const ersetze = (t) => String(t || '')
                .replace('{summe}', Zahlwort.rubel(summe()))
                .replace('{summe_de}', `${summe()} Rubel`);
            const q = (s) => ctx.tafel.querySelector(s);

            function neu() {
                auftrag = { ...d.auftraege[Math.floor(Math.random() * d.auftraege.length)] };
                // Bezahlart würfelt der Baustein aus, wenn der Dialog danach fragt
                if (d.zahlarten) auftrag.zahlart = Math.random() < 0.5 ? 'bar' : 'karte';
                bestellt = []; hinweise = 0; zahlart = null;
                ctx.svg.querySelectorAll('.aufgetischt').forEach(e => e.classList.remove('da'));
                const mitDe = !!ctx.stand.uebersetzung;
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>Bestellen</h2>
                    <label class="schalter" title="Alle Sätze immer auch auf Deutsch zeigen"><input type="checkbox" id="uebersetzung" ${mitDe ? 'checked' : ''}><span><span class="flagge" aria-hidden="true"></span>immer übersetzen</span></label>
                  </header>
                  <div class="zettel"><span class="zettel-titel">Dein Zettel</span><span class="zettel-text">Bestelle ${G.esc(auftrag.de)}.${auftrag.zahlart ? ` Bezahle ${auftrag.zahlart === 'bar' ? 'bar' : 'mit Karte'}.` : ''}</span></div>
                  ${speisekarte()}
                  <div class="gespraech ${mitDe ? 'mit-de' : ''}" id="gespraech"></div>
                  <div class="hinweis-karte" id="hinweis" hidden></div>
                  <div class="antworten ${mitDe ? 'mit-de' : ''}" id="antworten"></div>
                  <div id="kasse-box"></div>`;
                ctx.tafel.querySelectorAll('.mk-posten').forEach(b => b.addEventListener('click', () => ctx.sage(b.dataset.text)));
                q('#uebersetzung').addEventListener('change', (e) => {
                    ctx.stand.uebersetzung = e.target.checked;
                    ctx.speichern();
                    q('#gespraech').classList.toggle('mit-de', e.target.checked);
                    q('#antworten').classList.toggle('mit-de', e.target.checked);
                });
                knoten(d.start);
            }

            function zeile(sprecher, ru, de) {
                const div = document.createElement('div');
                div.className = 'zeile ' + (sprecher === 'ich' ? 'ich' : 'sie');
                const name = sprecher === 'ich' ? 'Ich' : (fig[sprecher] && fig[sprecher].name) || '';
                div.innerHTML = `<span class="zeile-wer">${G.esc(name)}</span>
                  <span class="zeile-text"><button class="zeile-ru" title="Nochmal anhören">${G.esc(ru)}</button>${de ? '<button class="zeile-hilfe" title="Auf Deutsch"><span class="flagge" aria-hidden="true"></span></button>' : ''}</span>
                  <span class="zeile-de">${G.esc(de || '')}</span>`;
                div.querySelector('.zeile-ru').addEventListener('click', () => ctx.sage(ru, stimmeVon(sprecher)));
                const hilfeKnopf = div.querySelector('.zeile-hilfe');
                if (hilfeKnopf) hilfeKnopf.addEventListener('click', () => div.classList.toggle('offen'));
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
                const k = { ...d.knoten[id], id };
                const text = ersetze(k.text), de = ersetze(k.de);
                q('#antworten').innerHTML = '';
                zeile(k.sprecher, text, de);
                ctx.blase(text, ctx.stand.uebersetzung ? de : null, fig[k.sprecher]);
                await ctx.sage(text, stimmeVon(k.sprecher));
                if (!laufend) return;

                if (k.aktion === 'servieren') await servieren();
                if (k.aktion === 'bezahlen') {
                    ctx.stufeMarkieren('bezahlen');
                    // Platz für die Kasse: Zettel und Gesprächsverlauf klappen ein
                    ctx.tafel.classList.add('beim-zahlen');
                    const verlauf = q('#gespraech');
                    verlauf.scrollTop = verlauf.scrollHeight;
                    const posten = bestellt.map(x => menue.find(m => m.id === x));
                    const bz = Gorod.bausteine.bezahlen;
                    let erg;
                    if (zahlart === 'karte') {
                        const versuch = bz.mitKarte(ctx, q('#kasse-box'), summe(), posten);
                        q('#kasse-box').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        erg = await versuch;
                        if (!laufend) return;
                        if (erg.abgelehnt) {
                            // Karte abgelehnt: bar weiter
                            await G.pause(700);
                            zahlart = 'bar';
                            erg = await bz.kassieren(ctx, q('#kasse-box'), summe(), posten);
                        }
                    } else {
                        const kassiert = bz.kassieren(ctx, q('#kasse-box'), summe(), posten);
                        q('#kasse-box').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        erg = await kassiert;
                    }
                    if (!laufend) return;
                    if (erg.hilfe) hinweise++;
                    ctx.stufeMarkieren('dialog');
                    await G.pause(900);
                    if (!laufend) return;
                    q('#kasse-box').innerHTML = '';
                    ctx.tafel.classList.remove('beim-zahlen');
                }
                if (!laufend) return;
                if (k.optionen || k.auswahl) zeigeOptionen(k);
                else if (k.weiter) knoten(k.weiter);
            }

            async function servieren() {
                for (const id of bestellt) {
                    const m = menue.find(x => x.id === id);
                    const el = m && m.auf_dem_tisch && ctx.svg.getElementById(m.auf_dem_tisch);
                    if (el) el.classList.add('da');
                    await G.pause(450);
                }
                await G.pause(500);
            }

            const ohneBetonung = (t) => t.replace(/́/g, '');

            function optionenFuer(k) {
                if (k.optionen) {
                    // Bezahlart prüfen: steht auf dem Zettel etwas anderes, gibt es einen Hinweis
                    return k.optionen.map(o => (o.zahlart && auftrag.zahlart && o.zahlart !== auftrag.zahlart)
                        ? { ...o, hinweis: `Auf deinem Zettel steht: ${auftrag.zahlart === 'bar' ? 'bar' : 'mit Karte'} bezahlen.` }
                        : o);
                }
                const a = k.auswahl;
                const fehltNoch = (art) => auftrag.teile.some(id => !bestellt.includes(id) && (menue.find(m => m.id === id) || {}).art === art);
                const liste = menue.filter(m => m.art === a.art && !bestellt.includes(m.id)).map(m => {
                    const text = a.muster.replace('{akk}', m.akk || m.ru).replace('{ru}', m.ru);
                    const de = a.muster_de.replace('{de}', m.de);
                    return auftrag.teile.includes(m.id)
                        ? { text, de, weiter: a.wiederholen ? k.id : k.weiter, bestellt: m.id }
                        : { text, de, hinweis: `„${ohneBetonung(m.ru)}“ heißt ${m.de} – auf deinem Zettel steht etwas anderes.` };
                });
                if (a.abschluss) {
                    liste.push(fehltNoch(a.art)
                        ? { ...a.abschluss, hinweis: 'Auf deinem Zettel steht noch etwas, das du bestellen sollst.' }
                        : { ...a.abschluss, weiter: k.weiter });
                }
                return liste;
            }

            // Aufklappbare Speisekarte: jeder Posten zum Antippen und Anhören
            function speisekarte() {
                const arten = ctx.inhalt.arten || {};
                const gruppen = Object.keys(arten).map(art => {
                    const posten = menue.filter(m => m.art === art);
                    if (!posten.length) return '';
                    return `<div class="mk-gruppe"><h4>${G.esc(arten[art].ru)} <small>${G.esc(arten[art].de)}</small></h4>
                      ${posten.map(m => `<button class="mk-posten sprich" data-text="${G.esc(m.ru)}" title="${G.esc(m.de)}">
                        <span class="mk-name">${G.esc(m.ru)}</span><span class="mk-punkte"></span><span class="mk-preis">${m.preis} ₽</span></button>`).join('')}</div>`;
                }).join('');
                return gruppen ? `<details class="menue-karte"><summary><span class="mk-titel">Меню́</span> Speisekarte – antippen zum Anhören</summary><div class="mk-inhalt">${gruppen}</div></details>` : '';
            }

            function zeigeOptionen(k) {
                const box = q('#antworten');
                box.innerHTML = '';
                G.mischen(optionenFuer(k)).forEach((o, i) => {
                    const b = document.createElement('button');
                    b.className = 'antwort';
                    b.style.animationDelay = (i * 0.06) + 's';
                    b.innerHTML = `<span class="ru">${G.esc(o.text)}</span><span class="de">${G.esc(o.de)}</span>`;
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
                if (o.bestellt) bestellt.push(o.bestellt);
                if (o.zahlart) zahlart = o.zahlart;
                if (o.ende) return abschluss();
                knoten(o.weiter || k.weiter);
            }

            function abschluss() {
                const sterne = hinweise === 0 ? 3 : hinweise <= 2 ? 2 : 1;
                ctx.stand.bestellungen = (ctx.stand.bestellungen || 0) + 1;
                ctx.speichern();
                ctx.blaseWeg();
                q('#antworten').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>Bestellung geschafft!</strong> Du hast ${G.esc(auftrag.de)} bestellt und ${summe()} ₽ ${zahlart === 'karte' ? 'mit Karte' : 'bar'} bezahlt.</p>
                    <p class="klein">${hinweise === 0 ? 'Ganz ohne Hinweis – отли́чно!' : `${hinweise} Hinweis${hinweise > 1 ? 'e' : ''} gebraucht.`}</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="karte">Zur Karte</button>
                      <button class="knopf-haupt" id="nochmal">↻ Noch einmal bestellen</button>
                    </div>
                  </div>`;
                q('#nochmal').addEventListener('click', neu);
                q('#karte').addEventListener('click', () => document.getElementById('zur-karte').click());
            }

            neu();
            return () => {
                laufend = false;
                ctx.tafel.classList.remove('beim-zahlen');
                ctx.blaseWeg();
                ctx.svg.querySelectorAll('.aufgetischt').forEach(e => e.classList.remove('da'));
            };
        }
    };
})();
