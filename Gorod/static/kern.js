// Город — Kern
// Lädt die Module, zeigt Startseite (Straße) und Modul-Ansicht, hält den
// Spielstand (sofort auf dem Server gespeichert) und die Geldbörse.
// Die Lernformen selbst stecken in static/bausteine/ und werden von den
// Modulen nur benutzt — ein neues Gebäude ist ein neuer Ordner in module/.

(function () {
    const G = window.Gorod = { bausteine: {}, stand: {}, module: [], inhalte: {} };
    const $ = (sel, root = document) => root.querySelector(sel);

    const STUFEN_TITEL = { entdecken: 'Entdecken', hoeren: 'Hören & Zeigen', dialog: 'Bestellen', bezahlen: 'Bezahlen', wo: 'Wo ist das?', etagen: 'Stockwerke', aufzug: 'Aufzug', pass: 'Passkontrolle', gepaeck: 'Gepäck', zoll: 'Zoll',
        fahrplan: 'Abfahrtstafel', fahrkarte: 'Fahrkarte', zug: 'Im Zug',
        einkaufen: 'Einkaufen', theke: 'Theke', kasse: 'Kasse', stundenplan: 'Stundenplan', unterricht: 'Im Unterricht', anprobe: 'Anprobe',
        rechnen: 'Mathe', literatur: 'Literatur', wege: 'Gehen & Fahren' };
    const START_GELD = { 1000: 1, 500: 2, 100: 4, 50: 2, 10: 10 };
    // Noch nicht gebaute Gebäude — als Ausblick auf der Straße
    const BALD = [
    ];

    // -----------------------------------------------------------------
    // Hilfen
    // -----------------------------------------------------------------
    G.mischen = (a) => {
        const b = a.slice();
        for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
        return b;
    };
    G.pause = (ms) => new Promise(r => setTimeout(r, ms));
    G.esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // Deutsche Frage zu „Где …?“: „Wo ist die Tasse?“ / „Wo sind die Bücher?“
    // Das Verb folgt dem Deutschen: часы́ ist russisch Plural, „die Uhr“ aber nicht
    // (solche Wörter tragen de_zahl: "sg").
    G.woFrageDe = (de, genus, deZahl) => `Wo ${genus === 'pl' && deZahl !== 'sg' ? 'sind' : 'ist'} ${de}?`;
    G.sterne = (n) => [0, 1, 2].map(i => `<span class="${i < n ? 'an' : 'aus'}" style="animation-delay:${i * 0.18}s">★</span>`).join('');

    // Satz zum Antippen. teile: Text oder { text, titel, erkl } (Grammatik-Stellen aus grammatik.js).
    // Jedes Wort mit Wörterbuch-Eintrag ist antippbar (Bedeutung, Grundform, Form); eine Grammatik-Stelle
    // zeigt ihre Regel und darunter die Wörter, aus denen sie besteht. Erklärt wird in `box`,
    // vorgelesen wird das Angetippte; nochmal antippen schließt das Feld wieder.
    const WORT_RE = /([А-Яа-яЁё́]+(?:-[А-Яа-яЁё́]+)*)/;
    const wortEintrag = (w) => (window.Grammatik && Grammatik.wort ? Grammatik.wort(w) : null);
    const flachWort = (w) => w.toLowerCase().replace(/́/g, '').replace(/ё/g, 'е');
    // „Form – Merkhilfe“: die Merkhilfe ist ein allgemeines Beispiel und steht in einer eigenen Zeile,
    // damit sie nicht als Aussage über den angetippten Satz gelesen wird
    const formUndTipp = (form) => { const i = form.indexOf(' – '); return i < 0 ? [form, ''] : [form.slice(0, i), form.slice(i + 3)]; };
    function wortHtml(wort, [grund, de, form]) {
        const gleich = flachWort(grund) === flachWort(wort);
        const [f, tipp] = formUndTipp(form);
        return `<div class="gb-kopf"><span class="ru">${G.esc(wort)}</span><span class="gb-titel gb-de">${G.esc(de)}</span></div>
          <p class="gb-wort">${gleich ? '' : `Grundform <b class="ru">${G.esc(grund)}</b> · `}${G.esc(f)}</p>
          ${tipp ? `<p class="gb-tipp">Tipp: ${G.esc(tipp)}</p>` : ''}`;
    }
    function stelleHtml(t) {
        const woerter = t.text.split(WORT_RE).filter((w, i) => i % 2 && wortEintrag(w));
        return `<div class="gb-kopf"><span class="ru">${G.esc(t.text)}</span>${t.titel ? `<span class="gb-titel">${G.esc(t.titel)}</span>` : ''}</div>
          ${G.esc(t.erkl).split('\n').map(z => `<p>${z}</p>`).join('')}
          ${woerter.length ? `<div class="gb-woerter">${woerter.map(w => {
              const [, de, form] = wortEintrag(w);
              return `<span><b class="ru">${G.esc(w)}</b> ${G.esc(de)} <i>${G.esc(formUndTipp(form)[0])}</i></span>`;
          }).join('')}</div>` : ''}`;
    }
    G.grammatikSatz = function (ziel, teile, box, sage) {
        ziel.innerHTML = '';
        box.innerHTML = '';
        box.hidden = true;
        let antippbar = false;
        const umschalten = (el, html, vorlesen) => {
            const offen = el.classList.contains('aktiv');
            if (box._aktiv) box._aktiv.classList.remove('aktiv');   // mehrere Sätze, ein Erklärfeld
            if (offen) { box.hidden = true; box._aktiv = null; return; }
            el.classList.add('aktiv');
            box._aktiv = el;
            box.innerHTML = html;
            box.hidden = false;
            if (sage) sage(vorlesen);
        };
        const knopf = (el, aktion, titel) => {
            el.tabIndex = 0;
            el.setAttribute('role', 'button');
            el.title = titel;
            // stopPropagation: Die Zeile im Gespräch spielt sonst den ganzen Satz ab
            el.addEventListener('click', (e) => { e.stopPropagation(); aktion(); });
            el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); aktion(); } });
            antippbar = true;
        };
        const woerterEinfuegen = (text) => text.split(WORT_RE).forEach((teil, i) => {
            const eintrag = i % 2 ? wortEintrag(teil) : null;
            if (!eintrag) { if (teil) ziel.append(teil); return; }
            const w = document.createElement('span');
            w.className = 'wort';
            w.textContent = teil;
            knopf(w, () => umschalten(w, wortHtml(teil, eintrag), teil), 'Wort erklären');
            ziel.appendChild(w);
        });
        teile.forEach(t => {
            if (typeof t === 'string' || !t.erkl) { woerterEinfuegen(typeof t === 'string' ? t : t.text); return; }
            const s = document.createElement('span');
            s.className = 'gram-stelle';
            s.textContent = t.text;
            knopf(s, () => umschalten(s, stelleHtml(t), t.text), 'Grammatik erklären');
            ziel.appendChild(s);
        });
        return antippbar;
    };

    // Erklärfeld zu einer Frage schließen (wenn die Frage verdeckt wird)
    G.gramZu = function (el) {
        const a = el.closest('.wo-frage') || el;
        const b = a.nextElementSibling;
        if (b && b.classList.contains('gram-box')) { b.hidden = true; b.innerHTML = ''; }
    };

    // Betonungszeichen selbst zeichnen: Die Handschrift (Caveat) hat kein passendes
    // Zeichen, der Browser setzt es aus einer Ersatzschrift daneben („одна ́па́чка“).
    // Aus „а́“ wird <span class="bt">а</span>, der Akzent kommt per CSS darüber.
    G.betonungMalen = function (el) {
        const knoten = [];
        const gang = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (gang.nextNode()) if (gang.currentNode.nodeValue.includes('́')) knoten.push(gang.currentNode);
        knoten.forEach(k => {
            const frag = document.createDocumentFragment();
            k.nodeValue.split(/(.́)/).forEach(teil => {
                if (!teil) return;
                if (teil.length === 2 && teil[1] === '́') {
                    const s = document.createElement('span');
                    s.className = 'bt';
                    s.textContent = teil[0];
                    frag.appendChild(s);
                } else frag.appendChild(document.createTextNode(teil.replace(/́/g, '')));
            });
            k.replaceWith(frag);
        });
    };

    // Leeres Erklärfeld am Ende eines Behälters (z. B. der Rückmeldung)
    G.gramBox = function (behaelter) {
        const b = document.createElement('div');
        b.className = 'gram-box';
        b.hidden = true;
        behaelter.appendChild(b);
        return b;
    };

    // Russischen Satz anzeigen; Stellen mit Erklärung findet static/grammatik.js.
    // box: Erklärfeld – ohne Angabe wird eins direkt hinter `anker` (Standard: el) angelegt.
    G.satz = function (el, text, { box, anker, stimme } = {}) {
        if (!box) {
            const a = anker || el.closest('.wo-frage') || el;
            const naechstes = a.nextElementSibling;
            box = naechstes && naechstes.classList.contains('gram-box') ? naechstes : null;
            if (!box) { box = document.createElement('div'); box.className = 'gram-box'; a.after(box); }
        }
        const teile = window.Grammatik ? Grammatik.teile(text) : [text];
        const mitStellen = G.grammatikSatz(el, teile, box, (t) => Stimmen.sage(t, stimme));
        if (mitStellen && !G.stand.wort_tipp) {
            G.stand.wort_tipp = true;
            G.speichern();
            G.toast('Tipp: Jedes russische Wort antippen – dann gibt es Bedeutung und Form. Gepunktet unterstrichene Stellen erklären die Grammatik.');
        }
        return mitStellen;
    };

    let toastTimer = null;
    G.toast = function (text, art = 'info') {
        const t = $('#toast');
        t.textContent = text;
        t.className = 'toast sichtbar ' + art;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('sichtbar'), art === 'fehler' ? 9000 : 4000);
    };
    Stimmen.beiStoerung = (text) => G.toast(text, 'fehler');

    // -----------------------------------------------------------------
    // Spielstand — jede Änderung geht sofort an den Server
    // -----------------------------------------------------------------
    let speicherTimer = null;
    function senden() {
        return fetch('/api/spielstand', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(G.stand)
        }).then(r => { if (!r.ok) throw new Error(r.status); })
          .catch(() => G.toast('Speichern fehlgeschlagen – läuft der Server noch?', 'fehler'));
    }
    G.speichern = function () {
        clearTimeout(speicherTimer);
        speicherTimer = setTimeout(senden, 250);
    };
    window.addEventListener('pagehide', () => {
        clearTimeout(speicherTimer);
        navigator.sendBeacon('/api/spielstand', new Blob([JSON.stringify(G.stand)], { type: 'application/json' }));
    });
    G.modulStand = function (id) {
        G.stand.module = G.stand.module || {};
        return (G.stand.module[id] = G.stand.module[id] || {});
    };

    // -----------------------------------------------------------------
    // Geldbörse
    // -----------------------------------------------------------------
    G.boerse = () => (G.stand.geldboerse = G.stand.geldboerse || { ...START_GELD });
    G.summe = (b) => Object.entries(b).reduce((s, [wert, anz]) => s + Number(wert) * anz, 0);
    // Bankkarte: eigenes Konto, unabhängig vom Bargeld
    G.konto = function (neu) {
        if (typeof neu === 'number') { G.stand.konto = neu; G.speichern(); G.geldAnzeigen(); }
        if (typeof G.stand.konto !== 'number') G.stand.konto = 5000;
        return G.stand.konto;
    };
    // Gehalt: einmal am Tag wird das Kartenkonto auf mindestens 10 000 ₽ aufgefüllt –
    // ein Einkauf in der Mode im GUM kostet bis zu 7 000 ₽, danach würde jede Karte abgelehnt
    const GEHALT = 10000;
    function zahltag() {
        const heute = new Date().toISOString().slice(0, 10);
        if (G.stand.zahltag === heute) return;
        G.stand.zahltag = heute;
        if (G.konto() < GEHALT) {
            G.stand.konto = GEHALT;
            setTimeout(() => G.toast(`Зарплата пришла! – Dein Gehalt ist da: ${GEHALT.toLocaleString('de-DE')} ₽ auf der Karte.`), 1200);
        }
        G.speichern();
    }
    G.geldAnzeigen = function () {
        $('#geld-betrag').textContent = G.summe(G.boerse()).toLocaleString('de-DE');
        $('#konto-betrag').textContent = G.konto().toLocaleString('de-DE');
    };
    // Reicht das Geld nicht, hilft die Oma aus
    G.geldSichern = function (betrag) {
        if (G.summe(G.boerse()) >= betrag) return false;
        const b = G.boerse();
        // in 2000er-Schritten, bis es reicht (Fahrkarten kosten mehr als ein Frühstück)
        let n = 0;
        while (G.summe(b) < betrag) { b[1000] = (b[1000] || 0) + 1; b[500] = (b[500] || 0) + 2; n++; }
        G.speichern(); G.geldAnzeigen();
        G.toast(`Ба́бушка дала́ тебе́ ${Zahlwort.rubel(2000 * n)}. – Oma hat dir ${2000 * n} Rubel gegeben.`, 'info');
        return true;
    };

    // -----------------------------------------------------------------
    // Kopfleiste: Stimme
    // -----------------------------------------------------------------
    function stimmenAuswahl() {
        const sel = $('#stimme');
        const liste = Stimmen.liste();
        sel.innerHTML = '';
        liste.forEach(v => {
            const o = document.createElement('option');
            o.value = v.name;
            const g = Stimmen.geschlecht(v);
            o.textContent = (g === 'female' ? '♀ ' : g === 'male' ? '♂ ' : '') + (v.azure ? v.label : v.name);
            sel.appendChild(o);
        });
        const gewuenscht = G.stand.erzaehler;
        if (gewuenscht && liste.some(v => v.name === gewuenscht)) Stimmen.waehlen(gewuenscht);
        if (Stimmen.erzaehler) sel.value = Stimmen.erzaehler.name;
    }
    $('#stimme').addEventListener('change', (e) => {
        Stimmen.waehlen(e.target.value);
        G.stand.erzaehler = e.target.value;
        G.speichern();
        Stimmen.sage('Приве́т! Я покажу́ тебе́ го́род.');
    });

    // -----------------------------------------------------------------
    // Ansichten
    // -----------------------------------------------------------------
    let aufraeumen = null;     // Aufräumen der laufenden Stufe
    let aktuellesModul = null;

    function ansicht(name) {
        // Die 3D-Stadt räumt auf, sobald man sie verlässt
        if (name !== 'stadt3d' && G.beende3D) G.beende3D();
        document.body.dataset.ansicht = name;
        $('#zur-karte').hidden = name === 'stadt';
        // Wer aus der 3D-Stadt ins Haus ging, kommt dorthin zurück
        $('#zur-karte').textContent = name === 'modul' && G.herkunft === '3d' ? '🏙️ Zurück in die Stadt' : '🗺️ Zur Karte';
    }
    G.ansicht = ansicht;
    // Für die 3D-Stadt: laufende Stufe beenden, ohne die Straße zu zeichnen
    G.verlasseModul = () => { beendeStufe(); aktuellesModul = null; };

    function zurueck() {
        if (document.body.dataset.ansicht === 'modul' && G.herkunft === '3d' && G.zeigeStadt3D) G.zeigeStadt3D();
        else zeigeStadt();
    }

    // Maus-Zurück / Alt+Pfeil darf nicht aus der App werfen: zurück zur Karte
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => {
        history.pushState(null, '', location.href);
        if (document.body.dataset.ansicht !== 'stadt') zurueck();
    });
    $('#zur-karte').addEventListener('click', zurueck);
    $('#logo').addEventListener('click', zeigeStadt);

    // ---------------- Startseite: die Straße ----------------
    function fassadePlatzhalter(b, i) {
        const hoehe = [210, 250, 190][i % 3];
        return `
        <div class="haus bald" style="--hoehe:${hoehe}px">
          <svg viewBox="0 0 200 ${hoehe}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="7 6">
            <rect x="8" y="10" width="184" height="${hoehe - 12}" rx="4" fill="rgba(255,255,255,.35)"/>
            ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${30 + c * 54}" y="${36 + r * 52}" width="32" height="34" rx="3"/>`).join('')).join('')}
          </svg>
          <div class="haus-schild"><span class="ru">${b.ru}</span><span class="de">${b.de} · bald</span></div>
        </div>`;
    }

    function zeigeStadt() {
        beendeStufe();
        Stimmen.stop();
        aktuellesModul = null;
        G.herkunft = null;
        ansicht('stadt');
        const haeuser = [];
        G.module.forEach(m => {
            const inh = G.inhalte[m.id];
            const st = G.modulStand(m.id);
            const gesamt = inh ? inh.woerter.length : 0;
            const ent = (st.entdeckt || []).length;
            haeuser.push(`
            <button class="haus offen" data-modul="${m.id}" style="--akzent:${m.farbe || 'var(--terrakotta)'}${m.breite ? `;--breite:${Number(m.breite)}px` : ''}">
              <img src="/module/${m.id}/${m.grafik.aussen}" alt="">
              <div class="haus-schild"><span class="ru">${m.titel.ru}</span><span class="de">${m.titel.de}${gesamt ? ` · ${ent}/${gesamt} Wörter` : ''}</span></div>
            </button>`);
        });
        BALD.forEach((b, i) => haeuser.splice(i === 0 ? 0 : haeuser.length, 0, fassadePlatzhalter(b, i)));
        $('#inhalt').innerHTML = `
        <section class="stadt">
          <div class="stadt-intro">
            <h1>Го́род</h1>
            <p>Eine kleine Stadt zum Russischlernen. Tippe auf ein Haus, um hineinzugehen.</p>
            <button class="knopf-haupt stadt3d-knopf" id="stadt3d-start">🚶 In 3D über den Roten Platz <span>→</span></button>
          </div>
          <div class="strasse">
            <div class="himmel"><span class="sonne"></span><span class="wolke w1"></span><span class="wolke w2"></span></div>
            <div class="haeuser">${haeuser.join('')}</div>
            <div class="gehweg"><span class="laeufer" aria-hidden="true">🚶</span></div>
            <div class="fahrbahn"><span class="schiene"></span><span class="schiene"></span></div>
          </div>
          <div class="modul-fehler" ${G.fehler.length ? '' : 'hidden'}>
            <strong>Module mit Fehlern (werden nicht gezeigt):</strong>
            <ul>${G.fehler.map(f => `<li>${G.esc(f)}</li>`).join('')}</ul>
          </div>
        </section>`;
        document.querySelectorAll('.haus.offen').forEach(h => h.addEventListener('click', () => hineingehen(h)));
        $('#stadt3d-start').addEventListener('click', () => G.zeigeStadt3D());
    }

    // Aus der 3D-Stadt direkt ins Haus (Satz beim Hineingehen wie auf der Straße;
    // die Metro gibt einen eigenen Satz mit, z. B. „Я иду́ в аэропо́рт.“)
    G.oeffneModul = function (id, satz, satzDe) {
        const m = G.module.find(x => x.id === id);
        if (!m) return;
        const ru = satz || m.satz_hin, de = satz ? satzDe : m.satz_hin_de;
        Stimmen.sage(ru || `Я иду́ ${m.praeposition} ${m.titel.ru}.`);
        if (ru) G.toast(ru.replace(/́/g, '') + (de ? ` – ${de}` : ''));
        zeigeModul(m.id, null, true);
    };

    async function hineingehen(haus) {
        const m = G.module.find(x => x.id === haus.dataset.modul);
        if (!m || document.body.classList.contains('unterwegs')) return;
        document.body.classList.add('unterwegs');
        const laeufer = $('.laeufer');
        const strasse = $('.strasse').getBoundingClientRect();
        const ziel = haus.getBoundingClientRect();
        laeufer.style.setProperty('--ziel', (ziel.left + ziel.width / 2 - strasse.left - 20) + 'px');
        laeufer.classList.add('geht');
        haus.classList.add('betreten');
        // Der Satz klingt im Gebäude zu Ende — nicht auf die Stimme warten
        Stimmen.sage(m.satz_hin || `Я иду́ ${m.praeposition} ${m.titel.ru}.`);
        if (m.satz_hin) G.toast(m.satz_hin.replace(/́/g, '') + (m.satz_hin_de ? ` – ${m.satz_hin_de}` : ''));
        await G.pause(1500);
        document.body.classList.remove('unterwegs');
        zeigeModul(m.id, null, true);
    }

    // ---------------- Modul-Ansicht ----------------
    async function zeigeModul(id, stufe, tonWeiter = false) {
        beendeStufe(!tonWeiter);
        const m = G.module.find(x => x.id === id);
        const inhalt = G.inhalte[id];
        aktuellesModul = m;
        ansicht('modul');
        $('#inhalt').innerHTML = `
        <section class="modul" style="--akzent:${m.farbe || 'var(--terrakotta)'}">
          <div class="modul-kopf">
            <h1><span class="ru">${m.titel.ru}</span><span class="de">${m.titel.de}</span></h1>
            <ol class="stufen">${m.stufen.map((s, i) =>
                `<li><button data-stufe="${s}"><span class="nr">${i + 1}</span>${(m.stufen_titel || {})[s] || STUFEN_TITEL[s] || s}</button></li>`).join('')}</ol>
          </div>
          <div class="modul-buehne">
            <div class="szene-rahmen"><div class="szene ${inhalt.raeume ? 'mit-raeumen' : ''}" id="szene">
              <div class="blase" id="blase" hidden></div>
              <div class="gram-box blase-gram" id="blase-gram" hidden></div>
              <button class="ganzes" id="ganzes" hidden>⤢ ${G.esc(inhalt.uebersicht || 'Übersicht')}</button>
            </div></div>
            <aside class="tafel" id="tafel"></aside>
          </div>
        </section>`;
        const svgText = await fetch(`/module/${id}/${m.grafik.innen}`).then(r => r.text());
        $('#szene').insertAdjacentHTML('afterbegin', svgText);
        const svg = $('#szene svg');
        svg.dataset.voll = svg.getAttribute('viewBox');
        kreidetafel(inhalt);
        if (inhalt.raeume) raumNamen(svg, inhalt.raeume);
        document.querySelectorAll('.stufen button').forEach(b => b.addEventListener('click', () => starteStufe(b.dataset.stufe)));
        starteStufe(stufe || m.stufen[0], !tonWeiter);
    }

    // Preise auf die Kreidetafel schreiben — eine Quelle: inhalt.json.
    // inhalt.tafel bestimmt Überschrift und welche Arten draufpassen.
    function kreidetafel(inhalt) {
        const g = document.getElementById('tafel-text');
        if (!g || !inhalt.menue) return;
        const ns = 'http://www.w3.org/2000/svg';
        const tafel = inhalt.tafel || {};
        const titel = document.getElementById('tafel-titel');
        if (titel && tafel.titel) titel.textContent = tafel.titel;
        const posten = inhalt.menue.filter(p => !tafel.arten || tafel.arten.includes(p.art));
        // Lange Namen kürzen: „минеральная вода с газом“ → „Вода с газом“
        const kurz = (ru) => ru.replace(/́/g, '').replace(/^минеральная /, '').replace(/^./, c => c.toUpperCase());
        posten.forEach((p, i) => {
            const y = 150 + i * 22;
            const name = document.createElementNS(ns, 'text');
            name.setAttribute('x', 64); name.setAttribute('y', y);
            name.textContent = kurz(p.ru);
            const preis = document.createElementNS(ns, 'text');
            preis.setAttribute('x', 270); preis.setAttribute('y', y); preis.setAttribute('text-anchor', 'end');
            preis.textContent = p.preis + ' ₽';
            g.append(name, preis);
        });
    }

    // ---------------- Zoom (viewBox-Kamerafahrt) ----------------
    let zoomToken = 0;
    const weich = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    // Ausschnitt eines Zimmers, im Seitenverhältnis des ganzen Bildes, mit Rand
    function zielAnsicht(svg, ansicht) {
        const [vx, vy, vw, vh] = svg.dataset.voll.split(/\s+/).map(Number);
        if (!ansicht) return [vx, vy, vw, vh];
        const [x, y, w, h] = ansicht, rand = 0.08, verh = vw / vh;
        let W = w * (1 + 2 * rand), H = h * (1 + 2 * rand);
        if (W / H < verh) W = H * verh; else H = W / verh;
        W = Math.min(W, vw); H = Math.min(H, vh);
        const X = Math.max(vx, Math.min(x + w / 2 - W / 2, vx + vw - W));
        const Y = Math.max(vy, Math.min(y + h / 2 - H / 2, vy + vh - H));
        return [X, Y, W, H];
    }

    function zoome(svg, ziel, dauer = 750) {
        const token = ++zoomToken;
        const start = svg.getAttribute('viewBox').split(/\s+/).map(Number);
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) dauer = 0;
        return new Promise(fertig => {
            const t0 = performance.now();
            function schritt(jetzt) {
                if (token !== zoomToken) return fertig();
                const t = dauer ? Math.min(1, (jetzt - t0) / dauer) : 1, e = weich(t);
                svg.setAttribute('viewBox', start.map((s, i) => (s + (ziel[i] - s) * e).toFixed(1)).join(' '));
                if (t < 1) requestAnimationFrame(schritt); else fertig();
            }
            requestAnimationFrame(schritt);
        });
    }

    // Namensschilder der Zimmer für die Gesamtansicht
    function raumNamen(svg, raeume) {
        const ns = 'http://www.w3.org/2000/svg';
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'raum-namen');
        g.setAttribute('pointer-events', 'none');
        svg.appendChild(g);
        raeume.forEach(r => {
            const [x, y] = r.schild ? [r.schild[0] - 16, r.schild[1] - 34] : r.ansicht;
            const schild = document.createElementNS(ns, 'g');
            const text = document.createElementNS(ns, 'text');
            text.setAttribute('x', x + 16); text.setAttribute('y', y + 34);
            text.textContent = r.ru;
            schild.appendChild(text);
            g.appendChild(schild);
            const b = text.getBBox();
            const bg = document.createElementNS(ns, 'rect');
            bg.setAttribute('x', b.x - 9); bg.setAttribute('y', b.y - 4);
            bg.setAttribute('width', b.width + 18); bg.setAttribute('height', b.height + 8);
            bg.setAttribute('rx', 8);
            schild.insertBefore(bg, text);
        });
    }

    // Tipp: pulsierender Goldrahmen um das Gesuchte, darüber ein hüpfender Pfeil.
    // Ein bloßes Leuchten war auf hellen Bildteilen kaum zu sehen.
    function tippRahmen(svg, el) {
        const ns = 'http://www.w3.org/2000/svg';
        svg.querySelectorAll('.tipp-rahmen').forEach(r => r.remove());
        let b;
        try { b = el.getBBox(); } catch (e) { return; }
        const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
        const ecken = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => {
            const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m);
        });
        const xs = ecken.map(p => p.x), ys = ecken.map(p => p.y);
        const x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
        const vollBreite = Number((svg.dataset.voll || '').split(/\s+/)[2]) || svg.viewBox.baseVal.width;
        const rand = vollBreite * 0.009, strich = vollBreite * 0.005, pf = vollBreite * 0.032;
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'tipp-rahmen');
        g.setAttribute('pointer-events', 'none');
        const r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', x1 - rand); r.setAttribute('y', y1 - rand);
        r.setAttribute('width', x2 - x1 + 2 * rand); r.setAttribute('height', y2 - y1 + 2 * rand);
        r.setAttribute('rx', rand * 1.4); r.setAttribute('stroke-width', strich);
        const mx = (x1 + x2) / 2, oben = y1 - rand - pf * 0.35;
        const pfeil = document.createElementNS(ns, 'path');
        pfeil.setAttribute('class', 'pfeil');
        pfeil.setAttribute('d', `M${mx} ${oben} l${-pf * 0.6} ${-pf * 0.75} h${pf * 0.35} v${-pf * 0.7} h${pf * 0.5} v${pf * 0.7} h${pf * 0.35} Z`);
        pfeil.setAttribute('stroke-width', strich * 0.5);
        g.append(r, pfeil);
        svg.appendChild(g);
    }

    function beendeStufe(tonStoppen = true) {
        if (aufraeumen) { try { aufraeumen(); } catch (e) { /* nichts */ } }
        aufraeumen = null;
        if (tonStoppen) Stimmen.stop();
    }

    function starteStufe(stufe, tonStoppen = true) {
        beendeStufe(tonStoppen);
        const m = aktuellesModul;
        const baustein = G.bausteine[stufe];
        document.querySelectorAll('.stufen button').forEach(b => b.classList.toggle('aktiv', b.dataset.stufe === stufe));
        const szene = $('#szene svg');
        szene.querySelectorAll('.hotspot, .raum').forEach(h => h.classList.remove('gewaehlt', 'richtig', 'falsch', 'tipp', 'aktiv'));
        // Jede Stufe beginnt in der Gesamtansicht
        zoomToken++;
        szene.setAttribute('viewBox', szene.dataset.voll);
        szene.classList.remove('gezoomt', 'namen-an');
        $('#ganzes').hidden = true;
        $('#blase').hidden = true;
        $('#blase-gram').hidden = true;
        if (!baustein) { $('#tafel').innerHTML = `<p>Baustein „${G.esc(stufe)}“ fehlt.</p>`; return; }
        const { ctx, loesen } = erzeugeKontext(m, stufe);
        const eigenes = baustein.start(ctx);
        // Die Stufe räumt ihres auf, der Kern löst den Klick-Empfang im Bild
        aufraeumen = () => { if (typeof eigenes === 'function') eigenes(); loesen(); };
    }

    function erzeugeKontext(m, stufe) {
        const szeneBox = $('#szene');
        const svg = $('#szene svg');
        const ctx = {
            modul: m,
            inhalt: G.inhalte[m.id],
            stufe,
            tafel: $('#tafel'),
            svg,
            buehne: szeneBox,       // HTML-Fläche des Bildes, für eigene Überlagerungen
            stand: G.modulStand(m.id),
            beiKlick: null,
            speichern: G.speichern,
            toast: G.toast,
            sage: Stimmen.sage,
            zuStufe: (s) => starteStufe(s),
            // Stufenleiste zeigt, wo man gerade ist (z. B. Bezahlen mitten im Dialog)
            stufeMarkieren: (s) => document.querySelectorAll('.stufen button').forEach(b => b.classList.toggle('aktiv', b.dataset.stufe === s)),
            markiere(hsId, klasse, dauer) {
                const el = svg.getElementById ? svg.getElementById(hsId) : svg.querySelector('#' + hsId);
                if (!el) return;
                el.classList.add(klasse);
                if (klasse === 'tipp') tippRahmen(svg, el);
                if (dauer) setTimeout(() => el.classList.remove(klasse), dauer);
            },
            entmarkiere(klasse) {
                svg.querySelectorAll('.' + klasse).forEach(e => e.classList.remove(klasse));
                if (klasse === 'tipp') svg.querySelectorAll('.tipp-rahmen').forEach(r => r.remove());
            },
            // x/y = Spitze der Blase (Anteil der Bildgröße), z. B. am Kopf der Figur
            blase(text, de, figur) {
                const b = $('#blase');
                const pos = (figur && figur.blase) || { x: 0.5, y: 0.3 };
                b.style.left = (pos.x * 100) + '%';
                b.style.top = (pos.y * 100) + '%';
                // Figuren am rechten Bildrand: Blase öffnet nach links
                b.classList.toggle('links', pos.seite === 'links');
                b.innerHTML = `<span class="ru"></span>${de ? `<span class="de">${G.esc(de)}</span>` : ''}`;
                // Wörter und Grammatik der Figur antippbar; die Erklärung erscheint unten im Bild
                // (in der Blase würde sie nach oben aus dem Bild wachsen)
                G.satz(b.querySelector('.ru'), text, { box: $('#blase-gram'), stimme: figur && figur.stimme });
                b.hidden = false;
                b.classList.remove('auf'); void b.offsetWidth; b.classList.add('auf');
            },
            blaseWeg() { $('#blase').hidden = true; $('#blase-gram').hidden = true; },

            // Räume (Module mit inhalt.raeume): Zoom in ein Zimmer und zurück
            raeume: G.inhalte[m.id].raeume || [],
            raum: null,
            beiRaum: null,          // (raumId) — Antippen eines Zimmers
            beiGanzes: null,        // Knopf „Übersicht“; ohne Angabe: zurückzoomen
            ganzesErlaubt: true,
            async zuRaum(id) {
                ctx.raum = id || null;
                svg.classList.toggle('gezoomt', !!id);
                svg.querySelectorAll('.raum').forEach(r => r.classList.toggle('aktiv', r.id === 'raum-' + id));
                $('#ganzes').hidden = !id || !ctx.ganzesErlaubt;
                const r = ctx.raeume.find(x => x.id === id);
                await zoome(svg, zielAnsicht(svg, r && r.ansicht));
            },
            namenZeigen(an) { svg.classList.toggle('namen-an', !!an); },
            raumVon(wort) { return ctx.raeume.find(r => r.id === wort.raum); }
        };
        // Klicks im Bild an die laufende Stufe weiterreichen. Bei Räumen gilt:
        // Übersicht → Zimmer antippen; im Zimmer → Dinge antippen.
        const klick = (e) => {
            if (ctx.raeume.length) {
                const raumEl = e.target.closest('.raum');
                const rid = raumEl ? raumEl.id.replace(/^raum-/, '') : null;
                if (!rid) return;
                if (rid !== ctx.raum) {
                    if (ctx.beiRaum) ctx.beiRaum(rid, e);
                    return;
                }
            }
            const hs = e.target.closest('.hotspot');
            if (hs && ctx.beiKlick) ctx.beiKlick(hs.id, e);
        };
        const ganzes = () => (ctx.beiGanzes ? ctx.beiGanzes() : ctx.zuRaum(null));
        svg.addEventListener('click', klick);
        $('#ganzes').addEventListener('click', ganzes);
        // Bausteine, in denen man ins Bild tippt, melden sich mit klickbar: true
        szeneBox.classList.toggle('klickbar', stufe === 'entdecken' || stufe === 'hoeren' || !!(G.bausteine[stufe] || {}).klickbar);
        const loesen = () => {
            svg.removeEventListener('click', klick);
            $('#ganzes').removeEventListener('click', ganzes);
            ctx.beiKlick = null; ctx.beiRaum = null;
        };
        return { ctx, loesen };
    }

    // -----------------------------------------------------------------
    // Start
    // -----------------------------------------------------------------
    async function start() {
        const [stand, mod] = await Promise.all([
            fetch('/api/spielstand').then(r => r.json()).catch(() => ({})),
            fetch('/api/module').then(r => r.json()),
            // Grammatik-Regeln: fehlen sie, gibt es eben keine Stellen zum Antippen
            fetch('/static/grammatik.json').then(r => r.json()).then(d => Grammatik.laden(d)).catch(() => {}),
            // Wörterbuch: fehlt es, sind eben nur die Grammatik-Stellen antippbar
            fetch('/static/woerterbuch.json').then(r => r.json()).then(d => Grammatik.ladenWoerter(d)).catch(() => {})
        ]);
        if (stand._warnung) { G.toast(stand._warnung, 'fehler'); delete stand._warnung; }
        G.stand = stand || {};
        G.module = mod.module;
        G.fehler = mod.fehler;
        await Promise.all(G.module.map(m =>
            fetch(`/api/module/${m.id}/inhalt`).then(r => r.json()).then(i => { G.inhalte[m.id] = i; })));
        zahltag();
        G.geldAnzeigen();
        Stimmen.laden(stimmenAuswahl);
        zeigeStadt();
    }
    start().catch(e => {
        $('#inhalt').innerHTML = `<div class="modul-fehler"><strong>Город konnte nicht starten:</strong> ${G.esc(e.message || e)}</div>`;
    });
})();
