// Baustein „Gehen & Fahren“ (Verben der Bewegung)
// Über dem Bild liegt eine kleine Szene: eine Person (zu Fuß) oder ein Fahrzeug bewegt sich
// von zu Hause zum Ziel – gerade unterwegs, regelmäßig (Wochentage leuchten), hin und zurück,
// umher, losgegangen (das Haus bleibt leer) oder nur geplant (blass). Darunter ein Satz mit
// Lücke; man wählt die Verbform. Die falschen Formen unterscheiden sich in dem Punkt, den man
// verwechselt (zu Fuß/fahren, eine Richtung/regelmäßig, Zeit); der Hinweis erklärt, was die
// gewählte Form bedeutet.
//
// Nutzt aus inhalt.json: wege { fragen[] } – erzeugt von werkzeuge/wege.py.
// Frage: muster, bild {art, mittel, ziel {icon, schild, farbe}, zeit, tage, ereignis, leer, geist},
//        vor? {text, de}, text (Lücke = …), de, richtig {text, satz, erklaerung}, falsch [{text, hinweis}]

(function () {
    const HAUS = 98, ZIEL = 500, FUSS = 216;
    const TAGE = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
    const MITTEL = { fuss: 'пешко́м', bus: 'на авто́бусе', auto: 'на маши́не', metro: 'на метро́', zug: 'на по́езде' };

    // ---------- Zeichnungen (viewBox 0 0 640 250) ----------
    const haus = () => `
      <g class="wege-haus">
        <rect x="24" y="130" width="92" height="70" fill="#f3ead9" stroke="#5e3920" stroke-width="2"/>
        <path d="M14 132 L70 92 L126 132 Z" fill="#c8553d" stroke="#9c3f2c" stroke-width="2" stroke-linejoin="round"/>
        <rect x="36" y="146" width="22" height="20" fill="#cfe6f0" stroke="#5e3920" stroke-width="1.5"/>
        <rect x="88" y="160" width="20" height="40" fill="#7a4a2b"/><circle cx="104" cy="181" r="1.8" fill="#f2d046"/>
        <text x="70" y="124" text-anchor="middle" class="wege-schild-text klein">дом</text>
      </g>`;

    const schild = (x, y, text, farbe) => `
      <rect x="${x - 62}" y="${y}" width="124" height="26" rx="5" fill="#fbf7ef" stroke="${farbe}" stroke-width="2.5"/>
      <text x="${x}" y="${y + 18}" text-anchor="middle" class="wege-schild-text">${Gorod.esc(text)}</text>`;

    function zielBild(z) {
        const f = z.farbe || '#5d6d7e';
        if (z.icon === 'stadt') return `
          <g class="wege-ziel">
            <rect x="452" y="118" width="34" height="82" fill="#9aa7b3"/><rect x="540" y="104" width="40" height="96" fill="#8593a0"/>
            <rect x="584" y="132" width="40" height="68" fill="#a9b4be"/>
            <rect x="492" y="146" width="46" height="54" fill="${f}"/>
            <path d="M494 146 Q515 112 536 146 Z" fill="${f}"/><path d="M509 125 Q515 92 521 125 Z" fill="#f2d046"/>
            <rect x="505" y="172" width="20" height="28" rx="10" fill="#4a3426"/>
            ${[0, 1, 2].map(r => [0, 1].map(c => `<rect x="${546 + c * 18}" y="${114 + r * 22}" width="9" height="11" fill="#f6eec9" opacity=".85"/>`).join('')).join('')}
            ${schild(538, 66, z.schild, f)}
          </g>`;
        if (z.icon === 'meer') return `
          <g class="wege-ziel">
            <path d="M440 200 Q520 186 640 190 V200 Z" fill="#ecd9a8"/>
            <rect x="540" y="150" width="100" height="44" fill="#6fa8d6"/>
            <path d="M540 160 q12 -6 24 0 t24 0 t24 0 t24 0 M540 176 q12 -6 24 0 t24 0 t24 0 t24 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>
            <path d="M478 200 L478 132" stroke="#5e3920" stroke-width="3"/><path d="M446 140 Q478 112 510 140 Z" fill="${f}"/>
            <circle cx="600" cy="92" r="16" fill="#f2c14e"/>
            ${schild(520, 72, z.schild, f)}
          </g>`;
        if (z.icon === 'datscha') return `
          <g class="wege-ziel">
            <rect x="486" y="140" width="96" height="60" fill="#c99a62" stroke="#7a4a2b" stroke-width="2"/>
            <path d="M478 142 L534 106 L590 142 Z" fill="#7a4a2b"/>
            <rect x="492" y="162" width="18" height="38" fill="#5e3920"/><rect x="540" y="156" width="26" height="20" fill="#cfe6f0" stroke="#7a4a2b"/>
            ${[0, 1, 2, 3, 4].map(i => `<rect x="${592 + i * 9}" y="170" width="5" height="30" fill="#e8d7b0"/>`).join('')}
            <path d="M604 170 L604 140" stroke="#3f8f5f" stroke-width="3"/><circle cx="604" cy="136" r="8" fill="#f2c14e"/><circle cx="604" cy="136" r="3.5" fill="#7a4a2b"/>
            ${schild(534, 70, z.schild, f)}
          </g>`;
        if (z.icon === 'park') return '';
        return `
          <g class="wege-ziel">
            <rect x="476" y="100" width="144" height="100" fill="${f}"/>
            <rect x="470" y="94" width="156" height="8" fill="#2a211c" opacity=".35"/>
            ${[0, 1].map(r => [0, 1, 2, 3].map(c => `<rect x="${526 + c * 22}" y="${114 + r * 34}" width="13" height="18" fill="#f6eec9" opacity=".9"/>`).join('')).join('')}
            <rect x="488" y="156" width="26" height="44" fill="#4a3426"/>
            ${schild(548, 62, z.schild, f)}
          </g>`;
    }

    // Park oder Stadt als ganze Kulisse (für „umher“)
    function kulisse(z) {
        if (z.icon === 'park') return [70, 190, 330, 470, 590].map((x, i) => `
          <g><rect x="${x - 4}" y="${150 + (i % 2) * 6}" width="8" height="${50 - (i % 2) * 6}" fill="#7a4a2b"/>
          <circle cx="${x}" cy="${136 + (i % 2) * 6}" r="${26 - (i % 2) * 4}" fill="${i % 2 ? '#5f9a4e' : '#4f8f46'}"/></g>`).join('') +
            `<rect x="270" y="186" width="40" height="5" fill="#7a4a2b"/><rect x="274" y="191" width="4" height="9" fill="#7a4a2b"/><rect x="302" y="191" width="4" height="9" fill="#7a4a2b"/>` +
            schild(560, 40, z.schild, z.farbe);
        return [[20, 120], [70, 90], [130, 140], [190, 110], [420, 100], [480, 130], [540, 80], [600, 120]].map(([x, y], i) => `
          <rect x="${x}" y="${y}" width="44" height="${200 - y}" fill="${i % 2 ? '#a9b4be' : '#8593a0'}"/>
          ${[0, 1, 2].map(r => `<rect x="${x + 8}" y="${y + 10 + r * 22}" width="9" height="11" fill="#f6eec9" opacity=".8"/><rect x="${x + 26}" y="${y + 10 + r * 22}" width="9" height="11" fill="#f6eec9" opacity=".8"/>`).join('')}`).join('') +
            schild(320, 40, z.schild, z.farbe);
    }

    const strasse = (mittel) => (mittel === 'zug' || mittel === 'metro')
        ? `<rect y="200" width="640" height="26" fill="#b9ad97"/>
           ${Array.from({ length: 33 }, (_, i) => `<rect x="${i * 20}" y="212" width="10" height="10" fill="#6b4a2f"/>`).join('')}
           <path d="M0 214 H640 M0 220 H640" stroke="#555" stroke-width="2.5"/>`
        : `<rect y="200" width="640" height="26" fill="#a9a59c"/>
           <path d="M0 213 H640" stroke="#f6f2e6" stroke-width="2" stroke-dasharray="14 12"/>`;

    function laeufer() {
        return `
          <g class="koerper">
            <g class="bein b1"><path d="M0 -20 L0 0" stroke="#2b3a55" stroke-width="5" stroke-linecap="round"/></g>
            <g class="bein b2"><path d="M0 -20 L0 0" stroke="#22304a" stroke-width="5" stroke-linecap="round"/></g>
            <path d="M0 -42 L0 -20" stroke="#c8553d" stroke-width="9" stroke-linecap="round"/>
            <g class="arm a1"><path d="M0 -38 L0 -24" stroke="#b5482f" stroke-width="4.5" stroke-linecap="round"/></g>
            <g class="arm a2"><path d="M0 -38 L0 -24" stroke="#c8553d" stroke-width="4.5" stroke-linecap="round"/></g>
            <circle cx="1" cy="-51" r="8.5" fill="#f2c7a6" stroke="#5e3920" stroke-width="1.4"/>
            <path d="M-7 -55 Q0 -63 8 -55" stroke="#5e3920" stroke-width="3" fill="none"/>
          </g>`;
    }

    function fahrzeug(mittel) {
        const rad = (x, r = 7) => `<g class="rad" transform="translate(${x} -7)"><circle r="${r}" fill="#2a2a2a"/><path d="M${-r + 2} 0 H${r - 2} M0 ${-r + 2} V${r - 2}" stroke="#aaa" stroke-width="1.5"/></g>`;
        const kopf = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#f2c7a6"/>`;
        if (mittel === 'auto') return `
          <g class="koerper"><g class="fz">
            <path d="M-38 -10 V-24 Q-36 -29 -28 -29 H-18 L-8 -42 H14 L27 -29 H34 Q40 -29 40 -22 V-10 Z" fill="#2b5fa8" stroke="#1d4277" stroke-width="1.5"/>
            <path d="M-5 -39 H12 L22 -29 H-13 Z" fill="#cfe6f0"/>${kopf(6, -33)}
            <rect x="34" y="-24" width="5" height="4" fill="#f2d046"/></g>
            ${rad(-22)}${rad(24)}
          </g>`;
        if (mittel === 'zug' || mittel === 'metro') {
            const f = mittel === 'zug' ? '#b8392b' : '#2b5fa8', t = mittel === 'zug' ? '#8a271c' : '#1d4277';
            return `
          <g class="koerper"><g class="fz">
            <path d="M-78 -12 V-46 Q-78 -50 -74 -50 H58 Q76 -50 80 -30 V-12 Z" fill="${f}" stroke="${t}" stroke-width="1.5"/>
            ${[-68, -46, -24, -2, 20].map(x => `<rect x="${x}" y="-43" width="16" height="13" rx="2" fill="#cfe6f0"/>`).join('')}
            <path d="M44 -43 H62 Q72 -42 74 -32 H44 Z" fill="#cfe6f0"/>${kopf(56, -36)}
            <rect x="-78" y="-26" width="158" height="4" fill="#fbf7ef" opacity=".7"/>
            ${mittel === 'metro' ? '<text x="-30" y="-15" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">М</text>' : ''}</g>
            ${[-62, -44, 40, 58].map(x => rad(x, 5.5)).join('')}
          </g>`;
        }
        return `
          <g class="koerper"><g class="fz">
            <rect x="-48" y="-46" width="96" height="38" rx="8" fill="#e8b630" stroke="#8a6a12" stroke-width="1.5"/>
            ${[-40, -20, 0, 20].map(x => `<rect x="${x}" y="-40" width="15" height="13" rx="2" fill="#cfe6f0"/>`).join('')}
            <rect x="38" y="-40" width="8" height="22" rx="2" fill="#cfe6f0"/>${kopf(28, -33)}
            <rect x="-48" y="-22" width="96" height="3" fill="#8a6a12" opacity=".5"/></g>
            ${rad(-28)}${rad(28)}
          </g>`;
    }

    function ereignis(art) {
        if (art === 'telefon') return `
          <g transform="translate(330 140)">
            <rect x="-7" y="-12" width="14" height="24" rx="3" fill="#2a211c"/><rect x="-5" y="-9" width="10" height="15" fill="#9fd3ff"/>
            <path class="welle" d="M12 -10 q6 10 0 20 M18 -14 q9 14 0 28" stroke="#c8553d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <text x="0" y="-22" text-anchor="middle" font-size="13" font-weight="700" fill="#c8553d">дзинь!</text>
          </g>`;
        if (art === 'regen') return `
          <g transform="translate(320 70)">
            <path d="M-46 10 Q-50 -14 -24 -14 Q-16 -34 8 -26 Q30 -32 36 -10 Q56 -8 50 10 Z" fill="#8a99a8"/>
            <g class="tropfen">${[-34, -18, -2, 14, 30].map((x, i) => `<path d="M${x} ${20 + (i % 2) * 8} l-4 12" stroke="#2b5fa8" stroke-width="2.5" stroke-linecap="round"/>`).join('')}</g>
          </g>`;
        return '';
    }

    // ---------- Bewegungsablauf je Muster ----------
    // Abschnitte: d (Sekunden), x [von, bis], a [Deckkraft von, bis], tag, leer, ereignis, steht
    function ablauf(f) {
        const b = f.bild;
        const A = (d, x0, x1, extra = {}) => ({ d, x: [x0, x1], a: [1, 1], ...extra });
        const runden = (tage) => {
            const liste = tage || [0, 1, 2];
            return liste.flatMap((t) => [
                A(1.3, HAUS, ZIEL, { tag: t }), A(0.35, ZIEL, ZIEL, { a: [0, 0], tag: t }),
                A(1.3, ZIEL, HAUS, { tag: t }), A(0.45, HAUS, HAUS, { a: [0, 0], tag: t, fertig: true })
            ]);
        };
        switch (f.muster) {
            case 'jetzt': return [A(0.5, 150, 175, { a: [0, 1] }), A(5, 175, 400), A(0.6, 400, 428, { a: [1, 0] }), A(0.4, 150, 150, { a: [0, 0] })];
            case 'regel': case 'zukunft_regel': return [...runden(b.tage), A(1, HAUS, HAUS, { a: [0, 0], ende: true })];
            case 'hin_zurueck': return [A(0.4, HAUS, HAUS, { a: [0, 1] }), A(2.6, HAUS, ZIEL), A(1, ZIEL, ZIEL, { a: [0, 0] }),
                A(2.6, ZIEL, HAUS), A(1.4, HAUS, HAUS, { steht: true })];
            case 'unterwegs': return [A(0.4, HAUS, HAUS, { a: [0, 1] }), A(2.6, HAUS, 300), A(3.4, 300, 300, { steht: true, ereignis: true }),
                A(0.5, 300, 300, { a: [1, 0], ereignis: true })];
            case 'los': return [A(0.4, HAUS, HAUS, { a: [0, 1] }), A(3, HAUS, ZIEL), A(0.3, ZIEL, ZIEL, { a: [1, 0] }), A(3.2, ZIEL, ZIEL, { a: [0, 0], leer: true })];
            case 'zukunft': return [A(0.4, HAUS, HAUS, { a: [0, 1] }), A(3, HAUS, ZIEL), A(0.4, ZIEL, ZIEL, { a: [1, 0] }), A(1.4, HAUS, HAUS, { a: [0, 0] })];
            case 'umher': {
                const p = [150, 420, 250, 480, 320, 150];
                const s = p.slice(1).map((x, i) => A(Math.abs(x - p[i]) / 110, p[i], x));
                s.splice(2, 0, A(0.7, 250, 250, { steht: true }));
                return s;
            }
        }
        return [A(3, HAUS, ZIEL)];
    }

    // Pfeile unter der Straße: wie man sich bewegt
    function spur(muster) {
        const pf = (d, cls = '') => `<path d="${d}" class="${cls}" marker-end="url(#wege-pfeil)"/>`;
        switch (muster) {
            case 'jetzt': return pf('M140 236 H460');
            case 'regel': return pf('M140 232 H460') + pf('M460 242 H140') + '<text x="300" y="248" class="wege-spur-text" text-anchor="middle"></text>';
            case 'zukunft_regel': return pf('M140 232 H460', 'gestrichelt') + pf('M460 242 H140', 'gestrichelt');
            case 'hin_zurueck': return pf('M140 232 H460') + pf('M460 242 H140');
            case 'unterwegs': return '<path d="M140 237 H300"/><circle cx="300" cy="237" r="5" class="punkt"/><path d="M312 237 H460" class="gestrichelt duenn"/>';
            case 'los': return pf('M140 237 H460');
            case 'zukunft': return pf('M140 237 H460', 'gestrichelt');
            case 'umher': return '<path d="M150 238 L420 229 L250 247 L480 229 L320 247 L150 238" class="duenn"/>';
        }
        return '';
    }

    Gorod.bausteine.wege = {
        start(ctx) {
            const G = Gorod;
            const alle = (ctx.inhalt.wege || {}).fragen || [];
            const q = (s) => ctx.tafel.querySelector(s);
            let deck = [], i = 0, richtig, fehlversuch, laufend = true, raf = 0, abschnitte = [], periode = 1, t0 = 0;

            const buehne = document.createElement('div');
            buehne.className = 'wege-buehne';
            ctx.buehne.appendChild(buehne);

            function szene(f) {
                const b = f.bild;
                const umher = f.muster === 'umher';
                const woche = (f.muster === 'regel' || f.muster === 'zukunft_regel')
                    ? (b.tage ? `<span class="wege-woche">${TAGE.map((t, n) => `<span data-tag="${n}" class="${b.tage.includes(n) ? 'plan' : ''}">${t}</span>`).join('')}</span>`
                        : `<span class="wege-woche">${[0, 1, 2].map(n => `<span data-tag="${n}" class="plan">${n + 1}×</span>`).join('')}</span>`)
                    : '';
                buehne.innerHTML = `
                  <div class="wege-karte${b.geist ? ' geplant' : ''}">
                    <div class="wege-chips">
                      <span class="wege-chip zeit">${b.geist ? '📅' : '🕒'} ${G.esc(b.zeit || '')}</span>
                      ${woche}
                      <span class="wege-chip mittel">${b.art === 'geh' ? '🚶' : '🚍'} ${G.esc(MITTEL[b.mittel] || '')}</span>
                    </div>
                    <svg viewBox="0 0 640 250" class="wege-svg" aria-hidden="true">
                      <defs>
                        <linearGradient id="wege-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f0"/><stop offset="1" stop-color="#f1f6ea"/></linearGradient>
                        <marker id="wege-pfeil" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#1f4e47"/></marker>
                      </defs>
                      <rect width="640" height="250" fill="url(#wege-himmel)"/>
                      ${umher ? kulisse(b.ziel) : haus() + zielBild(b.ziel)}
                      <rect y="226" width="640" height="24" fill="#9cc47a"/>
                      ${strasse(b.mittel)}
                      <g class="wege-spur">${spur(f.muster)}</g>
                      ${umher ? '' : `<g class="wege-leer" id="wege-leer"><path d="M84 92 q-10 -26 14 -30 q22 -2 22 16 q0 10 -12 14" fill="#fff" stroke="#5e3920" stroke-width="1.5"/><text x="102" y="86" text-anchor="middle" font-size="22" font-weight="700" fill="#c8553d">?</text></g>`}
                      <g class="wege-ereignis" id="wege-ereignis">${ereignis(b.ereignis)}</g>
                      <g id="wege-mover" class="wege-mover ${b.art}${b.geist ? ' geist' : ''}">${b.art === 'geh' ? laeufer() : fahrzeug(b.mittel)}</g>
                    </svg>
                  </div>`;
                abschnitte = ablauf(f);
                periode = abschnitte.reduce((s, a) => s + a.d, 0);
                t0 = performance.now();
                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(bild);
            }

            let blick = 1;
            function bild(jetzt) {
                if (!laufend) return;
                const mover = buehne.querySelector('#wege-mover');
                if (!mover) return;
                let t = ((jetzt - t0) / 1000) % periode, a = abschnitte[0];
                for (const s of abschnitte) { if (t <= s.d) { a = s; break; } t -= s.d; }
                const k = a.d ? Math.min(1, t / a.d) : 1;
                const x = a.x[0] + (a.x[1] - a.x[0]) * k;
                if (a.x[1] !== a.x[0]) blick = a.x[1] > a.x[0] ? 1 : -1;
                const alpha = a.a[0] + (a.a[1] - a.a[0]) * k;
                mover.setAttribute('transform', `translate(${x.toFixed(1)} ${FUSS}) scale(${blick} 1)`);
                mover.style.opacity = alpha.toFixed(2);
                mover.classList.toggle('laeuft', a.x[1] !== a.x[0] && !a.steht);
                const leer = buehne.querySelector('#wege-leer');
                if (leer) leer.classList.toggle('an', !!a.leer);
                buehne.querySelector('#wege-ereignis').classList.toggle('an', !!a.ereignis);
                // Wochentage: erledigt / gerade / geplant
                const idx = abschnitte.indexOf(a);
                const erledigt = new Set(abschnitte.slice(0, idx).filter(s => s.fertig).map(s => s.tag));
                if (a.fertig || a.ende) erledigt.add(a.tag);
                buehne.querySelectorAll('.wege-woche span').forEach(s => {
                    const n = +s.dataset.tag;
                    s.classList.toggle('war', erledigt.has(n) && !a.ende);
                    s.classList.toggle('jetzt', a.tag === n && !a.fertig);
                });
                raf = requestAnimationFrame(bild);
            }

            // ---------- Lernschritte: vom Leichten zum Schweren ----------
            const gleich = (o, r, ...stellen) => stellen.every(n => o.m[n] === r.m[n]);
            // Zeilen mit F(…) = zu Fuß, A(…) = mit Fahrzeug: Symbol vorn und eigene Zeilenfarbe
            const F = (...z) => Object.assign(z, { art: 'fuss' }), A = (...z) => Object.assign(z, { art: 'auto' });
            const SYMBOL = { fuss: '<span class="wm-symbol" title="zu Fuß">🚶</span>', auto: '<span class="wm-symbol" title="mit einem Fahrzeug">🚗</span>' };
            const tabelle = (kopf, zeilen) => `<table><tr>${kopf.map(k => `<th>${k}</th>`).join('')}</tr>${zeilen.map(z => `<tr${z.art ? ` class="wm-${z.art}"` : ''}><th>${z.art ? SYMBOL[z.art] : ''}${z[0]}</th>${z.slice(1).map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
            const PRAESENS = tabelle(['', 'я', 'ты', 'он/она́', 'мы', 'вы', 'они́'], [
                F('идти́', 'иду́', 'идёшь', 'идёт', 'идём', 'идёте', 'иду́т'), F('ходи́ть', 'хожу́', 'хо́дишь', 'хо́дит', 'хо́дим', 'хо́дите', 'хо́дят'),
                A('е́хать', 'е́ду', 'е́дешь', 'е́дет', 'е́дем', 'е́дете', 'е́дут'), A('е́здить', 'е́зжу', 'е́здишь', 'е́здит', 'е́здим', 'е́здите', 'е́здят')]);
            const VERGANGEN = (mitLos) => tabelle(['', 'er (-л)', 'sie (-ла)', 'mehrere (-ли)'], [
                F('ходи́ть → war dort', 'ходи́л', 'ходи́ла', 'ходи́ли'), A('е́здить → war dort', 'е́здил', 'е́здила', 'е́здили'),
                F('идти́ → unterwegs', 'шёл', 'шла', 'шли'), A('е́хать → unterwegs', 'е́хал', 'е́хала', 'е́хали'),
                ...(mitLos ? [F('пойти́ → ist los', 'пошёл', 'пошла́', 'пошли́'), A('пое́хать → ist los', 'пое́хал', 'пое́хала', 'пое́хали')] : [])]);
            const ZUKUNFT = tabelle(['', 'я', 'ты', 'он/она́', 'мы', 'вы', 'они́'], [
                F('пойти́<small>einmal</small>', 'пойду́', 'пойдёшь', 'пойдёт', 'пойдём', 'пойдёте', 'пойду́т'),
                A('пое́хать<small>einmal</small>', 'пое́ду', 'пое́дешь', 'пое́дет', 'пое́дем', 'пое́дете', 'пое́дут'),
                ['бу́ду + Inf.<small>regelmäßig</small>', 'бу́ду', 'бу́дешь', 'бу́дет', 'бу́дем', 'бу́дете', 'бу́дут']]);
            const STUFEN = [
                { titel: 'Zu Fuß oder fahren?', muster: ['jetzt'], filter: (o, r) => gleich(o, r, 1, 2), schritt: false,
                  info: `<p><b>идти́</b> = zu Fuß gehen. <b>е́хать</b> = fahren – mit Bus, Zug, Auto oder Metro.</p>
                         <p>Achtung, Deutsch sagt oft „gehen“ („nach Moskau gehen“). Russisch sagt идти́ nur, wenn man wirklich läuft.</p>
                         <p>Hier geht es nur um <b>jetzt gerade</b> (сейча́с). Schau im Bild: Läuft die Person, oder sitzt sie in einem Fahrzeug?</p>` },
                { titel: 'Jetzt oder regelmäßig?', muster: ['jetzt', 'regel'], filter: (o, r) => gleich(o, r, 0, 2), schritt: true,
                  info: `<p>Jedes Bewegungsverb hat ein Paar:</p>
                         <p><b>идти́ / е́хать</b> = <b>jetzt gerade</b> unterwegs, in eine Richtung. Сейча́с я иду́ в шко́лу.</p>
                         <p><b>ходи́ть / е́здить</b> = <b>regelmäßig</b>, immer wieder hin und zurück. Я хожу́ в шко́лу ка́ждый день.</p>
                         <p>Signalwörter für regelmäßig: ка́ждый день, по суббо́там, ча́сто, два ра́за в неде́лю.</p>${PRAESENS}` },
                { titel: 'Gegenwart komplett', muster: ['jetzt', 'regel', 'umher'], filter: () => true, schritt: true,
                  info: `<p>Neu: <b>ohne Ziel umher</b> – auch dafür nimmt man <b>ходи́ть / е́здить</b>: Я люблю́ ходи́ть по па́рку.</p>
                         <p>Jetzt sind alle vier Formen gemischt. Erst überlegen: Was zeigt das Bild? Dann zu Fuß oder fahren?</p>${PRAESENS}` },
                { titel: 'Vergangenheit: dort gewesen oder unterwegs?', muster: ['hin_zurueck', 'unterwegs'],
                  filter: (o, r) => gleich(o, r, 0, 2) && o.m[1] !== 'los', schritt: true,
                  info: `<p>In der Vergangenheit bekommt das Verb die Endung <b>-л</b> (er), <b>-ла</b> (sie), <b>-ли</b> (mehrere, auch мы).</p>
                         <p><b>ходи́л / е́здил</b> = war dort und ist <b>wieder zurück</b>. Die Antwort auf „Где ты был?“: Вчера́ я ходи́л в кино́.</p>
                         <p><b>шёл / е́хал</b> = war gerade <b>mitten auf dem Weg</b>, als etwas passierte: Когда́ я шёл домо́й, начался́ дождь.</p>
                         ${VERGANGEN(false)}` },
                { titel: 'Vergangenheit: losgegangen', muster: ['hin_zurueck', 'unterwegs', 'los'], filter: (o, r) => gleich(o, r, 0, 2), schritt: true,
                  info: `<p>Neu: <b>пошёл / пое́хал</b> = ist <b>losgegangen</b> und noch nicht zurück. Её нет до́ма. Она́ пошла́ в шко́лу.</p>
                         <p>Vergleiche: ходи́ла = war dort und ist wieder da. пошла́ = ist jetzt noch weg.</p>${VERGANGEN(true)}` },
                { titel: 'Zukunft: einmal oder regelmäßig?', muster: ['zukunft', 'zukunft_regel'], filter: (o, r) => gleich(o, r, 0, 2), schritt: true,
                  info: `<p><b>Einmal</b> (за́втра, в суббо́ту): <b>пойду́ / пое́ду</b>. Das sind Gegenwartsendungen, aber mit по- bedeuten sie Zukunft.</p>
                         <p><b>Regelmäßig</b> (ка́ждый день, по суббо́там): <b>бу́ду ходи́ть / бу́ду е́здить</b>.</p>${ZUKUNFT}` },
                { titel: 'Alles gemischt', muster: null, filter: () => true, schritt: false, runde: 10,
                  info: `<p>Jetzt ist alles gemischt, ohne Zwischenschritt: Gegenwart, Vergangenheit, Zukunft, zu Fuß und fahren.</p>
                         <ul>
                           <li><b>Gerade unterwegs:</b> иду́ / е́ду – <b>regelmäßig oder umher:</b> хожу́ / е́зжу</li>
                           <li><b>War dort:</b> ходи́л / е́здил – <b>mitten auf dem Weg:</b> шёл / е́хал – <b>ist los:</b> пошёл / пое́хал</li>
                           <li><b>Zukunft einmal:</b> пойду́ / пое́ду – <b>regelmäßig:</b> бу́ду ходи́ть / е́здить</li>
                         </ul>` },
            ];
            let stufe = 0, stufeInfo = false;

            function sterneVon(n) { return ((ctx.stand.wege_stufen || {})[n]) || 0; }

            function aufbauen() {
                const S = STUFEN[stufe];
                ctx.tafel.innerHTML = `
                  <header class="tafel-kopf">
                    <h2>Gehen &amp; Fahren</h2>
                    <div class="wege-stufen" role="tablist">${STUFEN.map((s, n) => `
                      <button class="wege-stufe${n === stufe ? ' aktiv' : ''}" data-n="${n}" title="${G.esc(s.titel)}">
                        <span class="nr">${n + 1}</span><span class="st">${'★'.repeat(sterneVon(n))}</span></button>`).join('')}
                    </div>
                    <p class="wege-stufe-titel">Schritt ${stufe + 1}: <strong>${G.esc(S.titel)}</strong></p>
                  </header>
                  <div class="hilfe-zeile">
                    <button class="hilfe-knopf" id="merk" title="Die Regel zu diesem Schritt (zählt nicht als Hilfe)">📋 Regel</button>
                  </div>
                  <div class="wege-merk" id="merkkarte" hidden>
                    ${S.info}
                    <button class="knopf-zweit klein" id="merk-zu">${stufeInfo ? 'Los geht’s ↓' : 'Alles klar – zur Aufgabe ↓'}</button>
                  </div>
                  <div class="wo-frage">
                    <button class="hoer-knopf klein" id="nochmal" title="Nochmal hören">🔊</button>
                    <div><div class="wege-vor" id="vor"></div><div class="fp-frage" id="frage"></div></div>
                  </div>
                  <div class="hilfe-zeile">
                    <button class="hilfe-knopf" id="uebersetzen" title="Satz auf Deutsch (zählt als Hilfe)"><span class="flagge" aria-hidden="true"></span>Übersetzung</button>
                    <span class="uebersetzung" id="uebersetzung"></span>
                  </div>
                  <div class="balken"><div id="balken-fuellung"></div></div>
                  <div class="wege-schritt" id="schritt" hidden></div>
                  <div class="wo-optionen" id="optionen"></div>
                  <div class="rueckmeldung" id="rueckmeldung"></div>
                  <div id="danach"></div>`;
                const merk = q('#merkkarte');
                if (stufeInfo) merk.hidden = false;      // neuer Schritt: erst die Regel zeigen
                q('#merk').addEventListener('click', () => { merk.hidden = !merk.hidden; });
                q('#merk-zu').addEventListener('click', () => { merk.hidden = true; q('.wo-frage').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
                ctx.tafel.querySelectorAll('.wege-stufe').forEach(b => b.addEventListener('click', () => stufeWaehlen(+b.dataset.n)));
                q('#nochmal').addEventListener('click', () => {
                    const f = deck[i]; if (!f) return;
                    if (q('#frage').dataset.geloest) ctx.sage(f.richtig.satz);
                    else if (f.vor) ctx.sage(f.vor.text, 'weiblich');
                    else ctx.toast('Erst die Lücke füllen – dann wird der ganze Satz vorgelesen.');
                });
                q('#uebersetzen').addEventListener('click', () => {
                    const f = deck[i]; if (!f) return;
                    fehlversuch = true;
                    q('#uebersetzung').textContent = (f.vor ? `„${f.vor.de}“ – ` : '') + `„${f.de}“`;
                    q('#uebersetzen').classList.add('benutzt');
                });
            }

            function stufeWaehlen(n) {
                stufeInfo = n !== ctx.stand.wege_stufe || !sterneVon(n);
                stufe = n;
                ctx.stand.wege_stufe = n;
                ctx.speichern();
                neueRunde();
            }

            function neueRunde() {
                // Muster und zu Fuß/fahren abwechselnd, damit jede Runde alles aus dem Schritt enthält
                const S = STUFEN[stufe];
                const pools = {};
                G.mischen(alle.filter(f => !S.muster || S.muster.includes(f.muster)))
                    .forEach(f => { const k = f.muster + '|' + f.bild.art; (pools[k] = pools[k] || []).push(f); });
                const schluessel = G.mischen(Object.keys(pools));
                deck = [];
                for (let n = 0; deck.length < (S.runde || 8) && n < 200; n++) {
                    const l = pools[schluessel[n % schluessel.length]];
                    if (l.length) deck.push(l.shift());
                }
                i = 0; richtig = 0;
                aufbauen();
                frage();
            }

            // Satz mit Lücke: … wird zu einem Kästchen
            function lueckeSetzen(el) {
                const gang = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                while (gang.nextNode()) {
                    const k = gang.currentNode, n = k.nodeValue.indexOf('…');
                    if (n < 0) continue;
                    const rest = k.splitText(n);
                    rest.nodeValue = rest.nodeValue.slice(1);
                    const l = document.createElement('span');
                    l.className = 'luecke'; l.textContent = '?';
                    rest.before(l);
                    break;
                }
            }

            function frage() {
                const f = deck[i];
                if (!f || !laufend) return;
                const S = STUFEN[stufe];
                fehlversuch = false;
                szene(f);
                q('#vor').textContent = f.vor ? `— ${f.vor.text}` : '';
                delete q('#frage').dataset.geloest;
                G.satz(q('#frage'), f.text);
                lueckeSetzen(q('#frage'));
                q('#uebersetzung').textContent = '';
                q('#uebersetzen').classList.remove('benutzt');
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#rueckmeldung').innerHTML = '';
                q('#danach').innerHTML = '';
                q('#optionen').innerHTML = '';
                if (S.schritt && f.schritt) zwischenschritt(f); else { q('#schritt').hidden = true; formen(f); }
                if (f.vor) ctx.sage(f.vor.text, 'weiblich');
            }

            // Schritt 1: Was zeigt das Bild? (auf Deutsch)
            function zwischenschritt(f) {
                const S = STUFEN[stufe];
                const box = q('#schritt');
                box.hidden = false;
                const wahl = Object.entries(f.schritt.texte).filter(([m]) => S.muster.includes(m));
                box.innerHTML = `
                  <div class="ws-kopf"><span class="ws-nr">1</span>${G.esc(f.schritt.frage)}</div>
                  <div class="ws-optionen">${G.mischen(wahl).map(([m, t]) => `<button class="antwort ws-option" data-m="${m}">${G.esc(t)}</button>`).join('')}</div>
                  <div class="ws-rm"></div>`;
                box.querySelectorAll('.ws-option').forEach(b => b.addEventListener('click', () => {
                    if (b.disabled) return;
                    if (b.dataset.m === f.muster) {
                        box.innerHTML = `
                          <div class="ws-kopf fertig"><span class="ws-nr">✓</span>${G.esc(f.schritt.texte[f.muster])}</div>
                          <div class="ws-merke">${G.esc(f.schritt.merke)}</div>
                          <div class="ws-kopf"><span class="ws-nr">2</span>Welche Form passt in die Lücke?</div>`;
                        formen(f);
                        return;
                    }
                    fehlversuch = true;
                    b.disabled = true;
                    b.classList.add('daneben');
                    box.querySelector('.ws-rm').textContent = f.schritt.bildhinweis;
                }));
            }

            // Schritt 2: die russische Form
            function formen(f) {
                const S = STUFEN[stufe];
                const box = q('#optionen');
                box.innerHTML = '';
                const r = { m: f.richtig.m };
                G.mischen([{ text: f.richtig.text, ok: true }, ...f.falsch.filter(o => !o.m || S.filter(o, r))]).forEach((o, n) => {
                    const b = document.createElement('button');
                    b.className = 'antwort wo-option';
                    b.style.animationDelay = (n * 0.05) + 's';
                    b.innerHTML = `<span class="ru">${G.esc(o.text)}</span>`;
                    b.addEventListener('click', () => waehle(o, b, f));
                    box.appendChild(b);
                });
            }

            function waehle(o, knopf, f) {
                if (!laufend || knopf.disabled) return;
                const rm = q('#rueckmeldung');
                if (o.ok) {
                    if (!fehlversuch) richtig++;
                    ctx.tafel.querySelectorAll('.wo-option').forEach(b => { b.disabled = true; });
                    knopf.classList.add('treffer');
                    const l = q('#frage .luecke');
                    if (l) { l.textContent = f.richtig.text; l.classList.add('gefuellt'); }
                    q('#frage').dataset.geloest = '1';
                    rm.className = 'rueckmeldung gut';
                    rm.innerHTML = `✓ <strong></strong><br><span class="klein">${G.esc(f.richtig.erklaerung)}<br>${G.esc(f.de)}</span>`;
                    G.satz(rm.querySelector('strong'), f.richtig.satz, { box: G.gramBox(rm) });
                    ctx.sage(f.richtig.satz);
                    q('#danach').innerHTML = `<button class="knopf-haupt" id="weiter">${i + 1 < deck.length ? 'Weiter' : 'Ergebnis'} <span>→</span></button>`;
                    q('#weiter').addEventListener('click', () => {
                        i++;
                        q('#balken-fuellung').style.width = (i / deck.length * 100) + '%';
                        if (i >= deck.length) ende(); else frage();
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
                const n = deck.length;
                const sterne = richtig >= n - 1 ? 3 : richtig >= Math.ceil(n * 0.6) ? 2 : 1;
                ctx.stand.wege_stufen = { ...(ctx.stand.wege_stufen || {}), [stufe]: Math.max(sterneVon(stufe), sterne) };
                ctx.speichern();
                q('#optionen').innerHTML = '';
                q('#schritt').hidden = true;
                q('#rueckmeldung').className = 'rueckmeldung';
                q('#rueckmeldung').innerHTML = '';
                q('.wo-frage').classList.add('fertig');
                const naechste = STUFEN[stufe + 1];
                q('#danach').innerHTML = `
                  <div class="ergebnis">
                    <div class="sterne">${G.sterne(sterne)}</div>
                    <p><strong>${richtig} von ${n}</strong> auf Anhieb richtig.</p>
                    ${sterne < 2 ? '<p class="klein">Tipp: Diesen Schritt noch einmal üben, bevor es weitergeht.</p>' : ''}
                    <div class="knopf-reihe">
                      <button class="knopf-zweit" id="nochmal-runde">↻ Nochmal</button>
                      ${naechste ? `<button class="knopf-haupt" id="naechste">Schritt ${stufe + 2}: ${G.esc(naechste.titel)} <span>→</span></button>`
                                 : '<button class="knopf-haupt" id="karte">Zur Karte</button>'}
                    </div>
                  </div>`;
                q('#nochmal-runde').addEventListener('click', () => { stufeInfo = false; neueRunde(); });
                if (naechste) q('#naechste').addEventListener('click', () => stufeWaehlen(stufe + 1));
                else q('#karte').addEventListener('click', () => document.getElementById('zur-karte').click());
                ctx.tafel.querySelectorAll('.wege-stufe .st')[stufe].textContent = '★'.repeat(sterneVon(stufe));
                ctx.sage(sterne === 3 ? 'Отли́чно!' : 'Хорошо́!');
            }

            if (!alle.length) {
                ctx.tafel.innerHTML = '<p>Für dieses Gebäude gibt es noch keine Sätze zu „Gehen & Fahren“.</p>';
                buehne.remove();
                return;
            }
            // Einstieg: zuletzt gewählter Schritt, sonst der erste noch nicht geschaffte
            const gemerkt = ctx.stand.wege_stufe;
            stufe = gemerkt !== undefined ? gemerkt : Math.max(0, STUFEN.findIndex((s, n) => sterneVon(n) < 2));
            stufeInfo = !sterneVon(stufe);
            neueRunde();
            return () => { laufend = false; cancelAnimationFrame(raf); buehne.remove(); };
        }
    };
})();
