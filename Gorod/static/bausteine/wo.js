// Baustein „Wo ist das?“ (für Module mit Räumen)
// Ein Ding leuchtet in seinem Zimmer auf, die Stimme fragt „Где …?“.
// Man wählt die richtige Wo-Form: в ва́нной, на ку́хне, во дворе́, в саду́ …
// Die falschen Antworten sind typische Fehler: falsche Präposition
// („в ку́хне“), Grundform statt Präpositiv („в спа́льня“, „в сад“ = wohin?)
// oder ein anderes Zimmer.

(function () {
    const RUNDEN = 10;
    const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const ohneBetonung = (t) => t.replace(/́/g, '');

    // Falsche, aber plausible Formen zu einem Zimmer
    function fehlformen(r) {
        const [praep, ...rest] = r.wo.split(' ');
        const p = praep === 'во' ? 'в' : praep;
        const formen = [];
        formen.push(`${p} ${r.ru}`);                                  // Grundform: „в спа́льня“, „в сад“
        if (praep === 'во') formen.push(`в ${rest.join(' ')}`);       // „в дворе́“ statt „во дворе́“
        else formen.push(`${p === 'в' ? 'на' : 'в'} ${rest.join(' ')}`); // „в ку́хне“, „на спа́льне“
        return formen;
    }

    Gorod.bausteine.wo = {
        start(ctx) {
            const G = Gorod;
            const raeume = ctx.raeume;
            const woerter = ctx.inhalt.woerter.filter(w => w.raum);
            let deck, i, richtig, fehlversuch, laufend = true;
            ctx.ganzesErlaubt = false;

            if (!raeume.length) {
                ctx.tafel.innerHTML = '<p>Dieses Gebäude hat keine Zimmer.</p>';
                return;
            }

            function aufbauen() {
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>Wo ist das?</h2>
                    <p>Wo steht, liegt oder hängt das? Wähle die richtige Form.</p>
                  </header>
                  <div class="wo-frage">
                    <button class="hoer-knopf klein" id="nochmal" title="Nochmal hören">🔊</button>
                    <div><div class="wo-wort" id="wort"></div><div class="wo-de" id="wort-de"></div></div>
                  </div>
                  <div class="hilfe-zeile">
                    <button class="hilfe-knopf" id="uebersetzen" title="Frage und Zimmer auf Deutsch (zählt als Hilfe)"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                    <span class="uebersetzung" id="uebersetzung"></span>
                  </div>
                  <div class="balken"><div id="balken-fuellung"></div></div>
                  <div class="wo-optionen" id="optionen"></div>
                  <div class="rueckmeldung" id="rueckmeldung"></div>
                  <div id="danach"></div>`;
                ctx.tafel.querySelector('#nochmal').addEventListener('click', () => {
                    const w = deck[i]; if (w) ctx.sage(`Где ${w.ru}?`);
                });
                ctx.tafel.querySelector('#uebersetzen').addEventListener('click', () => {
                    const w = deck[i];
                    if (!w) return;
                    const r = ctx.raumVon(w);
                    fehlversuch = true;     // mit Hilfe zählt nicht als „auf Anhieb“
                    ctx.tafel.querySelector('#uebersetzung').innerHTML =
                        `„Где ${G.esc(w.ru)}?“ – ${G.esc(G.woFrageDe(w.de, w.genus, w.de_zahl))}<br>Das Zimmer: <strong>${G.esc(r.ru)}</strong> – ${G.esc(r.de)}`;
                    ctx.tafel.querySelector('#uebersetzen').classList.add('benutzt');
                });
            }

            function neueRunde() {
                // Möglichst verschiedene Zimmer: erst je Zimmer ein Ding, dann auffüllen
                const proRaum = G.mischen(raeume).map(r => G.mischen(woerter.filter(w => w.raum === r.id))[0]).filter(Boolean);
                deck = proRaum.slice(0, RUNDEN);
                i = 0; richtig = 0;
                aufbauen();
                frage();
            }

            async function frage() {
                const w = deck[i];
                if (!w || !laufend) return;
                fehlversuch = false;
                const r = ctx.raumVon(w);
                ctx.tafel.querySelector('#wort').textContent = w.ru;
                ctx.tafel.querySelector('#wort-de').textContent = w.de;
                ctx.tafel.querySelector('#rueckmeldung').className = 'rueckmeldung';
                ctx.tafel.querySelector('#rueckmeldung').innerHTML = '';
                ctx.tafel.querySelector('#danach').innerHTML = '';
                ctx.tafel.querySelector('#uebersetzung').innerHTML = '';
                ctx.tafel.querySelector('#uebersetzen').classList.remove('benutzt');
                ctx.entmarkiere('gewaehlt');
                await ctx.zuRaum(r.id);
                if (!laufend) return;
                ctx.markiere(w.hotspot, 'gewaehlt');
                ctx.sage(`Где ${w.ru}?`);

                // Kein Zimmer als „falsch“ anbieten, das auch stimmen würde
                // (die Sauna liegt im Keller: „в подва́ле“ wäre nicht falsch)
                const anderes = G.mischen(raeume.filter(x => x.id !== r.id && x.wo !== r.etage && x.etage !== r.wo))[0];
                const optionen = G.mischen([
                    { text: r.wo, richtig: true },
                    ...fehlformen(r).map(t => ({ text: t })),
                    { text: anderes.wo, anderesZimmer: anderes }
                ]);
                const box = ctx.tafel.querySelector('#optionen');
                box.innerHTML = '';
                optionen.forEach((o, n) => {
                    const b = document.createElement('button');
                    b.className = 'antwort wo-option';
                    b.style.animationDelay = (n * 0.05) + 's';
                    b.innerHTML = `<span class="ru">${G.esc(o.text)}</span>`;
                    b.addEventListener('click', () => waehle(o, b, w, r));
                    box.appendChild(b);
                });
            }

            function waehle(o, knopf, w, r) {
                if (!laufend || knopf.disabled) return;
                const rm = ctx.tafel.querySelector('#rueckmeldung');
                const satz = `${gross(w.ru)} ${r.wo}.`;
                if (o.richtig) {
                    if (!fehlversuch) richtig++;
                    ctx.tafel.querySelectorAll('.wo-option').forEach(b => { b.disabled = true; });
                    knopf.classList.add('treffer');
                    ctx.markiere(w.hotspot, 'richtig', 1400);
                    rm.className = 'rueckmeldung gut';
                    rm.innerHTML = `✓ <strong>${G.esc(satz)}</strong><br><span class="klein">${G.esc(w.de)} – ${G.esc(r.wo_de)}${r.hinweis ? ' · ' + G.esc(r.hinweis) : ''}</span>`;
                    ctx.sage(satz);
                    ctx.tafel.querySelector('#danach').innerHTML = `<button class="knopf-haupt" id="weiter">${i + 1 < deck.length ? 'Weiter' : 'Ergebnis'} <span>→</span></button>`;
                    ctx.tafel.querySelector('#weiter').addEventListener('click', () => {
                        i++;
                        ctx.tafel.querySelector('#balken-fuellung').style.width = (i / deck.length * 100) + '%';
                        if (i >= deck.length) ende(); else frage();
                    });
                    return;
                }
                fehlversuch = true;
                knopf.classList.add('daneben');
                knopf.disabled = true;
                rm.className = 'rueckmeldung schlecht';
                rm.innerHTML = erklaerung(o, r);
            }

            // Erklärung passend zum Fehler — nicht der allgemeine Zimmer-Hinweis,
            // der mit dem Fehler oft nichts zu tun hat (früher: „Die russische
            // Sauna heißt ба́ня“ als Antwort auf „на са́уне“).
            function erklaerung(o, r) {
                const gewaehlt = `„${G.esc(ohneBetonung(o.text))}“`;
                const richtig = `<strong>${G.esc(r.wo)}</strong>`;
                const [praep] = r.wo.split(' ');
                const grundform = `${praep === 'во' ? 'в' : praep} ${r.ru}`;
                if (o.anderesZimmer) {
                    return `${gewaehlt} heißt ${G.esc(o.anderesZimmer.wo_de)} – schau, in welchem Zimmer es leuchtet.`;
                }
                if (o.text === grundform) {
                    // Männliche Wörter ohne Endung: Grundform = Akkusativ = „wohin?“
                    const wohin = /[бвгджзклмнпрстфхцчшщ]$/.test(ohneBetonung(r.ru))
                        ? ` (${gewaehlt} hieße „wohin?“ – dorthin gehen.)` : '';
                    return `${gewaehlt} ist die Grundform. Auf <strong>Где?</strong> steht das Wort im Präpositiv: ${G.esc(r.ru)} → ${richtig}.${wohin}`;
                }
                // Präposition falsch, Endung richtig
                if (praep === 'во') {
                    return `Die Endung stimmt. Vor zwei Mitlauten wie дв- wird в zu <strong>во</strong> – das spricht sich leichter: ${richtig}.`;
                }
                if (praep === 'на') {
                    return `Die Endung stimmt, aber ${G.esc(r.ru)} ist eine Ausnahme: hier steht <strong>на</strong>, nicht в – ${richtig}.`;
                }
                return `Die Endung stimmt, aber die Präposition nicht. Hier steht <strong>в</strong> („in“): ${richtig}. ` +
                    `<strong>на</strong> („auf“) gilt nur für Ausnahmen wie на ку́хне.`;
            }

            function ende() {
                const sterne = richtig >= 9 ? 3 : richtig >= 6 ? 2 : 1;
                ctx.stand.wo_bestes = Math.max(ctx.stand.wo_bestes || 0, richtig);
                ctx.speichern();
                ctx.entmarkiere('gewaehlt');
                ctx.zuRaum(null);
                ctx.tafel.querySelector('#optionen').innerHTML = '';
                ctx.tafel.querySelector('#rueckmeldung').innerHTML = '';
                ctx.tafel.querySelector('#rueckmeldung').className = 'rueckmeldung';
                ctx.tafel.querySelector('.wo-frage').classList.add('fertig');
                ctx.tafel.querySelector('#danach').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${richtig} von ${deck.length}</strong> auf Anhieb richtig.</p>
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="nochmal-runde">↻ Nochmal</button>
                      ${ctx.modul.stufen.includes('etagen')
                          ? '<button class="knopf-haupt" id="weiter-stufe">Weiter: Stockwerke <span>→</span></button>'
                          : '<button class="knopf-haupt" id="karte">Zur Karte</button>'}
                    </div>
                  </div>`;
                ctx.tafel.querySelector('#nochmal-runde').addEventListener('click', neueRunde);
                const karte = ctx.tafel.querySelector('#karte');
                if (karte) karte.addEventListener('click', () => document.getElementById('zur-karte').click());
                const weiterStufe = ctx.tafel.querySelector('#weiter-stufe');
                if (weiterStufe) weiterStufe.addEventListener('click', () => ctx.zuStufe('etagen'));
                ctx.sage(sterne === 3 ? 'Отли́чно!' : 'Хорошо́!');
            }

            neueRunde();
            return () => { laufend = false; ctx.entmarkiere('gewaehlt'); ctx.ganzesErlaubt = true; };
        }
    };
})();
