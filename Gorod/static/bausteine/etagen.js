// Baustein „Stockwerke“ (Ordnungszahlen direkt im Gebäude)
// Nutzt inhalt.raeume[].etage_nr (1 = Erdgeschoss). Drei Aufgabenarten:
//   zimmer – ein Zimmer leuchtet: „На како́м этаже́ де́тская?“ → Form wählen
//   hoeren – „Иди́ на тре́тий эта́ж!“ / „Ма́ма на второ́м этаже́“ → Stockwerk antippen
//   falle  – „Das Atelier ist im 2. Stock (deutsch)“ → на тре́тьем этаже́
// Für das Aufzug-Spiel im Hochhaus siehe aufzug.js.

(function () {
    const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const ohneBetonung = (t) => t.replace(/́/g, '');
    const LEUTE = [
        { ru: 'Ма́ма', de: 'Mama', pron: 'она́', pron_de: 'sie' },
        { ru: 'Па́па', de: 'Papa', pron: 'он', pron_de: 'er' },
        { ru: 'Ба́бушка', de: 'Oma', pron: 'она́', pron_de: 'sie' },
        { ru: 'Ко́шка', de: 'Die Katze', pron: 'она́', pron_de: 'sie' }
    ];
    const deStock = (n) => (n === 1 ? 'im Erdgeschoss' : `im ${n - 1}. Stock`);

    Gorod.bausteine.etagen = {
        start(ctx) {
            const G = Gorod, Z = Zahlwort;
            const raeume = ctx.raeume.filter(r => r.etage_nr);
            if (!raeume.length) { ctx.tafel.innerHTML = '<p>Dieses Gebäude hat keine Stockwerke.</p>'; return; }
            const stockwerke = [...new Set(raeume.map(r => r.etage_nr))].sort((a, b) => a - b);
            const extra = ctx.raeume.filter(r => !r.etage_nr && /^(на|в) /.test(r.wo) && ['cherdak', 'podval'].includes(r.id));
            let laufend = true, deck, i, richtig, fehler, hilfe, gesperrt;
            ctx.ganzesErlaubt = false;
            ctx.svg.classList.add('ohne-etagen');      // die Beschriftung verriete die Antwort

            ctx.tafel.innerHTML = `
              <header class="tafel-kopf">
                <h2>Stockwerke</h2>
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
              <div class="tasten-hinweis" id="tipp-hinweis" hidden>👉 Tippe im Bild auf ein Zimmer in diesem Stockwerk.</div>
              <div class="wo-optionen" id="optionen"></div>
              <div class="rueckmeldung" id="rueckmeldung"></div>
              <div id="danach"></div>`;
            const q = (s) => ctx.tafel.querySelector(s);
            const zufall = (liste) => liste[Math.floor(Math.random() * liste.length)];
            const wo = (n) => `на ${Z.ordinal(n, 'praep')} этаже́`;

            function etageLeuchten(n, klasse, dauer) {
                raeume.filter(r => r.etage_nr === n).forEach(r => ctx.markiere('raum-' + r.id, klasse, dauer));
            }

            function neueRunde() {
                const typen = G.mischen(['zimmer', 'zimmer', 'zimmer', 'zimmer', 'hoeren', 'hoeren', 'hoeren', 'falle', 'falle', 'falle']);
                deck = typen.map(typ => (typ === 'hoeren'
                    ? { typ, n: zufall(stockwerke), wer: zufall(LEUTE), akk: Math.random() < 0.5 }
                    : { typ, r: zufall(raeume) }));
                i = 0; richtig = 0;
                q('#danach').innerHTML = '';
                q('.wo-frage').classList.remove('fertig');
                aufgabe();
            }

            function texte(a) {
                if (a.typ === 'zimmer') return { ru: `На како́м этаже́ ${a.r.ru}?`, de: `Auf welcher Etage ist ${a.r.de}?` };
                if (a.typ === 'hoeren') {
                    return a.akk
                        ? { ru: `Иди́ на ${Z.ordinal(a.n)} эта́ж!`, de: `Geh in die ${a.n}. Etage (russisch gezählt)!` }
                        : { ru: `${a.wer.ru} ${wo(a.n)}. Где ${a.wer.pron}?`, de: `${a.wer.de} ist in der ${a.n}. Etage. Wo ist ${a.wer.pron_de}?` };
                }
                return { ru: '', de: '' };
            }

            async function aufgabe() {
                const a = deck[i];
                if (!a || !laufend) return;
                fehler = 0; hilfe = false; gesperrt = false;
                ['#rueckmeldung', '#danach', '#optionen', '#uebersetzung'].forEach(s => { q(s).innerHTML = ''; });
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#uebersetzen').classList.remove('benutzt');
                q('#tipp-hinweis').hidden = true;
                ctx.entmarkiere('gewaehlt'); ctx.entmarkiere('tipp');
                ctx.svg.classList.add('ohne-etagen');
                if (ctx.raum) await ctx.zuRaum(null);
                const t = texte(a);

                if (a.typ === 'zimmer') {
                    ctx.markiere('raum-' + a.r.id, 'gewaehlt');
                    G.satz(q('#frage-ru'), t.ru);
                    q('#frage-de').textContent = 'Das leuchtende Zimmer – welches Stockwerk?';
                    ctx.sage(t.ru);
                    const n = a.r.etage_nr;
                    const liste = stockwerke.map(m => ({ text: wo(m), richtig: m === n, art: 'andere', m }));
                    liste.push(extra.length ? { text: zufall(extra).wo, art: 'extra' } : { text: `на ${Z.ordinal(n)} эта́ж`, art: 'akk' });
                    optionen(a, liste);
                } else if (a.typ === 'hoeren') {
                    q('#frage-ru').innerHTML = '<span class="verdeckt">… … …</span>';
                    G.gramZu(q('#frage-ru'));
                    q('#frage-de').textContent = 'Hör zu – welches Stockwerk?';
                    q('#tipp-hinweis').hidden = false;
                    ctx.sage(t.ru);
                } else {
                    const n = a.r.etage_nr;
                    ctx.markiere('raum-' + a.r.id, 'gewaehlt');
                    q('#frage-ru').textContent = `${gross(ohneBetonung(a.r.de))} ist ${deStock(n)}.`;
                    G.gramZu(q('#frage-ru'));
                    q('#frage-de').textContent = 'So zählt man in Deutschland. Wie sagt man das auf Russisch?';
                    const liste = [{ text: wo(n), richtig: true }];
                    if (n > 1) liste.push({ text: wo(n - 1), art: 'falle' });
                    liste.push({ text: `на ${Z.ordinal(n)} эта́ж`, art: 'akk' });
                    liste.push({ text: wo(n + 1), art: 'zuviel' });
                    optionen(a, liste.slice(0, 4));
                }
            }

            function optionen(a, liste) {
                const box = q('#optionen');
                G.mischen(liste).forEach((o, k) => {
                    const b = document.createElement('button');
                    b.className = 'antwort wo-option';
                    b.style.animationDelay = (k * 0.05) + 's';
                    b.innerHTML = `<span class="ru">${G.esc(o.text)}</span>`;
                    b.addEventListener('click', () => waehle(a, o, b));
                    box.appendChild(b);
                });
            }

            function geloest(satz, satzDe) {
                gesperrt = true;
                if (fehler === 0 && !hilfe) richtig++;
                ctx.svg.classList.remove('ohne-etagen');       // jetzt darf die Beschriftung zur Bestätigung erscheinen
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

            function waehle(a, o, knopf) {
                if (gesperrt || knopf.disabled) return;
                const n = a.r.etage_nr;
                if (o.richtig) {
                    q('#optionen').querySelectorAll('.wo-option').forEach(b => { b.disabled = true; });
                    knopf.classList.add('treffer');
                    etageLeuchten(n, 'richtig', 1500);
                    geloest(`${gross(a.r.ru)} ${wo(n)}.`,
                        a.typ === 'falle' ? `Deutsch ${n === 1 ? 'Erdgeschoss' : `${n - 1}. Stock`} = russisch ${Z.ordinal(n)} эта́ж.` : `${gross(a.r.de)} – in der ${n}. Etage (russisch gezählt).`);
                    return;
                }
                fehler++;
                knopf.classList.add('daneben');
                knopf.disabled = true;
                const rm = q('#rueckmeldung');
                rm.className = 'rueckmeldung schlecht';
                const richtigForm = `<strong>${G.esc(wo(n))}</strong>`;
                if (o.art === 'akk') {
                    rm.innerHTML = `„${G.esc(ohneBetonung(o.text))}“ heißt „wohin?“ (Akkusativ). Gefragt ist <strong>Где?</strong> – der Ort, also Präpositiv.`;
                } else if (o.art === 'falle') {
                    rm.innerHTML = `Das ist die deutsche Zählung. In Russland ist das Erdgeschoss schon <strong>пе́рвый эта́ж</strong> – also eins mehr: ${richtigForm}.`;
                } else if (o.art === 'zuviel') {
                    rm.innerHTML = `Eins zu viel – zum deutschen Stock zählt man genau eins dazu: ${richtigForm}.`;
                } else if (o.art === 'extra') {
                    rm.innerHTML = `„${G.esc(ohneBetonung(o.text))}“ ist ein anderer Teil des Hauses. Schau, welches Zimmer leuchtet.`;
                } else {
                    rm.innerHTML = `„${G.esc(ohneBetonung(o.text))}“ ist die ${o.m}. Etage. Zähle von unten: Das Erdgeschoss ist <strong>пе́рвый эта́ж</strong>.`;
                }
            }

            // Stockwerk im Bild antippen (Aufgabe „hoeren“)
            ctx.beiRaum = (rid) => {
                const a = deck[i];
                if (!a || a.typ !== 'hoeren' || gesperrt) return;
                const r = ctx.raeume.find(x => x.id === rid);
                const rm = q('#rueckmeldung');
                if (r && r.etage_nr === a.n) {
                    q('#tipp-hinweis').hidden = true;
                    G.satz(q('#frage-ru'), texte(a).ru);
                    ctx.entmarkiere('tipp');
                    etageLeuchten(a.n, 'richtig', 1500);
                    geloest(a.akk ? `${gross(Z.ordinal(a.n))} эта́ж – ${r.ru} ${wo(a.n)}.` : `${a.wer.ru} ${r.wo}, ${wo(a.n)}.`,
                        a.akk ? `Die ${a.n}. Etage – ${r.de} liegt dort.` : `${a.wer.de} ist ${r.wo_de}, in der ${a.n}. Etage.`);
                    return;
                }
                fehler++;
                ctx.markiere('raum-' + rid, 'falsch', 800);
                rm.className = 'rueckmeldung schlecht';
                rm.innerHTML = r && r.etage_nr
                    ? `${G.esc(r.ru)} ist ${G.esc(wo(r.etage_nr))} – die ${r.etage_nr}. Etage. Hör noch einmal hin.`
                    : `${G.esc(r ? r.ru : 'Das')} ist kein nummeriertes Stockwerk. Hör noch einmal hin.`;
                if (fehler >= 2) etageLeuchten(a.n, 'tipp');
            };

            // ---------- Übersetzung (zählt als Hilfe) ----------
            q('#uebersetzen').addEventListener('click', () => {
                const a = deck[i];
                if (!a || gesperrt) return;
                hilfe = true;
                q('#uebersetzen').classList.add('benutzt');
                if (a.typ === 'falle') {
                    q('#uebersetzung').innerHTML = 'Tipp: deutscher Stock plus eins – das Erdgeschoss ist russisch <strong>пе́рвый эта́ж</strong>.';
                    return;
                }
                const t = texte(a);
                G.satz(q('#frage-ru'), t.ru);
                q('#uebersetzung').textContent = t.de;
                ctx.svg.classList.remove('ohne-etagen');      // Beschriftung als zusätzliche Hilfe
            });
            q('#nochmal').addEventListener('click', () => { const a = deck[i]; if (a && texte(a).ru) ctx.sage(texte(a).ru); });

            function ende() {
                const sterne = richtig >= 9 ? 3 : richtig >= 6 ? 2 : 1;
                ctx.stand.etagen_bestes = Math.max(ctx.stand.etagen_bestes || 0, richtig);
                ctx.speichern();
                ctx.entmarkiere('gewaehlt');
                ctx.svg.classList.remove('ohne-etagen');
                q('#optionen').innerHTML = '';
                q('#rueckmeldung').className = 'rueckmeldung'; q('#rueckmeldung').innerHTML = '';
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
            return () => {
                laufend = false;
                ctx.entmarkiere('gewaehlt'); ctx.entmarkiere('tipp');
                ctx.svg.classList.remove('ohne-etagen');
            };
        }
    };
})();
