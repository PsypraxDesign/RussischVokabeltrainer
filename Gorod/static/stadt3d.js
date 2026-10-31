// Город in 3D: Moskaus alte Mitte zum Herumlaufen (three.js, lokal unter /static/vendor/).
// Roter Platz mit Kreml und Basilius-Kathedrale; Café und Supermarkt liegen im Kaufhaus GUM.
// Über die Große Moskwa-Brücke geht es nach Samoskworetschje (Wohnhaus, Schule) und auf die
// Sperlingsberge zur Universität (MGU). Bahnhof und Flughafen erreicht man mit der Metro
// («Охо́тный Ряд»). Es gibt nur Fußgänger.
// Hinein geht es auf drei Wegen: aufs Haus (oder sein Schild, seinen goldenen Ring) klicken,
// in die Tür hineinlaufen oder vor der Tür Enter drücken. Oben steht, wo man ist
// („Вы на Кра́сной пло́щади“ – Präpositiv mit на/в), unten rechts eine kleine Karte.
// Neue Module bekommen ein einfaches Haus in ihrer Farbe in Kitai-Gorod.

(function () {
    const G = Gorod;
    let THREE = null;
    let beenden = null;

    // ---------------- Stadtplan ----------------
    // Norden = −z (oben auf der Karte). Kreml im Westen, GUM im Osten, Basilius im Süden,
    // dahinter die Moskwa.
    const ORTE = [   // die erste passende Fläche gilt – Kleines vor Großem
        { x: [20, 48], z: [158, 202], wo: 'на Большо́м Москворе́цком мосту́', de: 'auf der Großen Moskwa-Brücke' },
        { x: [-36, 38], z: [-128, 95], wo: 'на Кра́сной пло́щади', de: 'auf dem Roten Platz' },
        { x: [-36, 62], z: [95, 158], wo: 'на Васи́льевском спу́ске', de: 'auf dem Wassiljewski-Hang' },
        { x: [-160, -36], z: [144, 158], wo: 'на Кремлёвской на́бережной', de: 'auf dem Kremlufer' },
        { x: [-160, 170], z: [-215, -128], wo: 'на Мане́жной пло́щади', de: 'auf dem Manegeplatz' },
        { x: [38, 170], z: [62, 158], wo: 'на Варва́рке', de: 'in der Warwarka-Straße' },
        { x: [38, 170], z: [-128, 62], wo: 'в Кита́й-го́роде', de: 'in Kitai-Gorod' },
        { x: [20, 48], z: [202, 262], wo: 'на Большо́й Орды́нке', de: 'in der Großen Ordynka' },
        { x: [-160, 170], z: [202, 262], wo: 'в Замоскворе́чье', de: 'in Samoskworetschje' },
        { x: [-160, 170], z: [262, 360], wo: 'на Воробьёвых гора́х', de: 'auf den Sperlingsbergen' },
    ];
    // Bauplätze; blick = wohin die Tür zeigt (n = −z, s = +z, o = +x, w = −x)
    const PLAETZE = {
        cafe: { x: 36.5, z: -60, blick: 'w' }, supermarket: { x: 36.5, z: 24, blick: 'w' },   // im GUM
        zhenskaya: { x: 36.5, z: -86, blick: 'w' }, muzhskaya: { x: 36.5, z: 50, blick: 'w' }, // Mode im GUM
        dom: { x: 6, z: 230, blick: 'o' }, shkola: { x: 64, z: 230, blick: 'w' },             // Samoskworetschje
        vysotka: { x: 34, z: 318, blick: 'n' },                                                // Universität
    };
    const FREIE_PLAETZE = [{ x: 122, z: -70, blick: 'w' }, { x: 122, z: 0, blick: 'w' }, { x: 122, z: 90, blick: 'w' },
        { x: 70, z: -178, blick: 's' }, { x: -80, z: -178, blick: 's' }];
    // Bahnhof und Flughafen liegen nicht in der Altstadt: hin geht es mit der Metro
    const METRO = { x: 0, z: -178, blick: 's' };
    const METRO_ZIELE = {
        vokzal: {
            ru: 'Комсомо́льская', zusatz: 'Ленингра́дский · Яросла́вский · Каза́нский вокза́л', de: 'Zu den drei Bahnhöfen', icon: '🚆',
            ankunft: 'Вы́ход к вокза́лам.', ankunftDe: 'Ausgang zu den Bahnhöfen.',
            satz: 'Я иду́ на вокза́л.', satzDe: 'Ich gehe zum Bahnhof.',
            linien: [{ farbe: '#e42313', nr: 1, stationen: ['Охо́тный Ряд', 'Лубя́нка', 'Чи́стые пруды́', 'Кра́сные Воро́та', 'Комсомо́льская'] }],
        },
        aeroport: {
            ru: 'Аэропо́рт Вну́ково', zusatz: 'переса́дка на ста́нции «Парк Побе́ды»', de: 'Zum Flughafen Wnukowo', icon: '✈️',
            ankunft: 'Вы́ход к аэропо́рту.', ankunftDe: 'Ausgang zum Flughafen.',
            satz: 'Я иду́ в аэропо́рт.', satzDe: 'Ich gehe in den Flughafen.',
            linien: [{ farbe: '#0072ba', nr: 3, stationen: ['Пло́щадь Револю́ции', 'Арба́тская', 'Смоле́нская', 'Ки́евская', 'Парк Побе́ды'] },
                { farbe: '#f2c200', nr: 8, stationen: ['Парк Побе́ды', 'Ми́нская', '…', 'Со́лнцево', '…', 'Аэропо́рт Вну́ково'] }],
        },
    };
    // Lenin-Mausoleum vor der Kremlmauer (unter dem Senatsturm) mit einer kurzen Geschichtsstunde
    const MAUSOLEUM = { x: -27, z: -5, blick: 'o' };
    const GESCHICHTE = {
        karten: [
            { jahr: 'Name', ru: 'Ра́ньше сло́во «кра́сный» зна́чило «краси́вый».', de: 'Früher bedeutete das Wort „rot“ (кра́сный) „schön“.',
              info: 'Der Rote Platz ist also eigentlich der „schöne Platz“ – der Name ist viel älter als die Sowjetunion. Heute heißt schön краси́вый.' },
            { jahr: '1917', ru: 'В 1917 году́ в Росси́и была́ револю́ция.', de: '1917 gab es in Russland eine Revolution.',
              info: 'In der Oktoberrevolution übernahmen die Bolschewiki unter Wladimir Lenin die Macht. в … году́ = im Jahr …; была́ ist die Vergangenheit von быть – weiblich, weil револю́ция weiblich ist.' },
            { jahr: '1922', ru: 'В 1922 году́ был со́здан Сове́тский Сою́з — СССР.', de: '1922 wurde die Sowjetunion gegründet – die UdSSR.',
              info: 'СССР = Сою́з Сове́тских Социалисти́ческих Респу́блик. Moskau wurde ihre Hauptstadt.' },
            { jahr: '1924', ru: 'Ле́нин у́мер в 1924 году́.', de: 'Lenin starb 1924.',
              info: 'Er starb am 21. Januar 1924. Sein Leichnam wurde einbalsamiert; noch im selben Jahr stand hier ein Mausoleum aus Holz.' },
            { jahr: '1930', ru: 'В 1930 году́ постро́или мавзоле́й из ка́мня.', de: '1930 baute man das Mausoleum aus Stein.',
              info: 'Der Architekt Alexei Schtschussew entwarf die Stufenpyramide aus rotem Granit und dunklem Labradorit. постро́или ohne Subjekt heißt „man baute“; из + Genitiv: из ка́мня = aus Stein.' },
            { jahr: '1945', ru: '24 ию́ня 1945 го́да на Кра́сной пло́щади был Пара́д Побе́ды.', de: 'Am 24. Juni 1945 fand auf dem Roten Platz die Siegesparade statt.',
              info: 'Die Staatsführung stand auf der Tribüne des Mausoleums. Soldaten warfen erbeutete deutsche Fahnen vor dem Mausoleum nieder.' },
            { jahr: '1991', ru: 'В 1991 году́ СССР распа́лся.', de: '1991 zerfiel die UdSSR.',
              info: 'Aus den Sowjetrepubliken wurden 15 eigene Staaten, darunter Russland. Das Mausoleum blieb – bis heute wird gestritten, ob Lenin begraben werden soll.' },
            { jahr: 'Heute', ru: 'Сего́дня в мавзоле́й мо́жно войти́ беспла́тно, но фотографи́ровать нельзя́.', de: 'Heute kann man das Mausoleum kostenlos besuchen, aber fotografieren darf man nicht.',
              info: 'мо́жно = man darf, нельзя́ = man darf nicht – beide mit Infinitiv. Hinter dem Mausoleum liegen an der Kremlmauer Gräber, in der Mauer Urnen, zum Beispiel die von Juri Gagarin.' },
        ],
        quiz: [
            { ru: 'Что ра́ньше зна́чило сло́во «кра́сный»?', de: 'Was bedeutete das Wort „кра́сный“ früher?', optionen: ['краси́вый', 'большо́й', 'ста́рый'] },
            { ru: 'Когда́ у́мер Ле́нин?', de: 'Wann starb Lenin?', optionen: ['в 1924 году́', 'в 1917 году́', 'в 1945 году́'] },
            { ru: 'Из чего́ постро́или мавзоле́й в 1930 году́?', de: 'Woraus baute man 1930 das Mausoleum?', optionen: ['из ка́мня', 'из де́рева', 'из стекла́'],
              erkl: 'Das erste Mausoleum von 1924 war aus Holz – из де́рева.' },
            { ru: 'Что бы́ло на Кра́сной пло́щади 24 ию́ня 1945 го́да?', de: 'Was fand am 24. Juni 1945 auf dem Roten Platz statt?', optionen: ['Пара́д Побе́ды', 'револю́ция', 'конце́рт'] },
            { ru: 'Что случи́лось в 1991 году́?', de: 'Was geschah 1991?', optionen: ['СССР распа́лся', 'Ле́нин у́мер', 'постро́или ГУМ'] },
        ],
    };
    const GRENZE = { x: [-150, 160], z: [-205, 352] };
    const DREH = { s: 0, n: Math.PI, o: Math.PI / 2, w: -Math.PI / 2 };
    const KREML = { ost: -38, nord: -130, sued: 144, west: -240 };
    const FLUSS = { z: [160, 200], bruecke: [22.8, 45.2], wasser: -2.4 };
    const ZIEGEL = 0xa8382e;
    const GELB = 0xffb300;
    const START = { x: 2, z: -112, dreh: 0 };     // Nordende des Platzes, Blick auf Basilius

    // ---------------- Hilfen für Grafik ----------------
    const farbe = (c) => new THREE.Color(c);
    function mat(c, extra) { return new THREE.MeshLambertMaterial({ color: c, ...extra }); }
    const gold = () => mat(0xd9a93a, { emissive: 0x3a2800 });
    function kiste(w, h, d, material, x = 0, y = 0, z = 0) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        m.position.set(x, y + h / 2, z);
        m.castShadow = true; m.receiveShadow = true;
        return m;
    }
    function zylinder(r, h, seiten, material, x = 0, y = 0, z = 0, rOben = r) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rOben, r, h, seiten), material);
        m.position.set(x, y + h / 2, z);
        m.castShadow = true; m.receiveShadow = true;
        return m;
    }
    function kegel(r, h, seiten, material, x = 0, y = 0, z = 0) {
        const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seiten), material);
        m.position.set(x, y + h / 2, z);
        if (seiten === 4) m.rotation.y = Math.PI / 4;
        m.castShadow = true;
        return m;
    }
    // Zwiebelkuppel als Drehkörper (Höhe h, größter Radius r)
    // Profil: schmaler Hals, runder Bauch, lang ausgezogene Spitze
    const ZWIEBEL = [[0.55, 0], [0.7, 0.04], [0.88, 0.12], [0.99, 0.24], [1, 0.32], [0.95, 0.42], [0.82, 0.52], [0.62, 0.62],
        [0.42, 0.71], [0.26, 0.8], [0.15, 0.89], [0.08, 0.98], [0.04, 1.06], [0, 1.14]];
    function zwiebel(r, h, material, x = 0, y = 0, z = 0) {
        const m = new THREE.Mesh(new THREE.LatheGeometry(ZWIEBEL.map(([a, b]) => new THREE.Vector2(a * r, b * h)), 24), material);
        m.position.set(x, y, z); m.castShadow = true;
        return m;
    }
    function stern(r, c, leuchten) {
        const s = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
            const w = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r;
            if (i) s.lineTo(Math.cos(w) * rr, Math.sin(w) * rr); else s.moveTo(Math.cos(w) * rr, Math.sin(w) * rr);
        }
        const geo = new THREE.ExtrudeGeometry(s, { depth: r * 0.25, bevelEnabled: true, bevelThickness: r * 0.08, bevelSize: r * 0.06, bevelSegments: 1 });
        geo.center();
        return new THREE.Mesh(geo, mat(c, { emissive: leuchten }));
    }
    function leinwand(w, h, malen) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        malen(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
    }
    function wiederholt(t, x, y) {
        const k = t.clone(); k.needsUpdate = true;
        k.wrapS = k.wrapT = THREE.RepeatWrapping; k.repeat.set(x, y);
        return k;
    }
    // Fassade mit Fensterraster (optional Tür unten in der Mitte)
    function fassade(spalten, reihen, wand, glas = '#9fcde3', tuer = false, rahmen = '#fbf7ef') {
        return leinwand(64 * spalten, 64 * reihen, (g, w, h) => {
            g.fillStyle = wand; g.fillRect(0, 0, w, h);
            for (let r = 0; r < reihen; r++) for (let s = 0; s < spalten; s++) {
                if (tuer && r === reihen - 1 && Math.abs(s - (spalten - 1) / 2) < 0.6) continue;
                const x = s * 64 + 14, y = r * 64 + 12;
                g.fillStyle = rahmen; g.fillRect(x - 3, y - 3, 42, 46);
                g.fillStyle = Math.random() < 0.18 ? '#ffe3a0' : glas; g.fillRect(x, y, 36, 40);
            }
            if (tuer) {
                const x = w / 2 - 26;
                g.fillStyle = '#5e3920'; g.fillRect(x, h - 58, 52, 58);
                g.fillStyle = '#d6a446'; g.fillRect(x + 40, h - 30, 5, 5);
            }
        });
    }
    function wandKiste(w, h, d, vorn, seite, dach = '#6b7a86') {
        const mats = [mat(0xffffff, { map: seite }), mat(0xffffff, { map: seite }), mat(dach), mat(dach),
            mat(0xffffff, { map: vorn }), mat(0xffffff, { map: seite })];
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
        m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true;
        return m;
    }
    function schildTextur(text, hinter, vorder, schrift = '700 72px "PT Serif", Georgia, serif') {
        return leinwand(512, 128, (g, w, h) => {
            g.fillStyle = hinter; g.fillRect(0, 0, w, h);
            g.fillStyle = vorder; g.font = schrift; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(text, w / 2, h / 2 + 4, w - 30);
        });
    }
    function schild(text, w, h, hinter, vorder) {
        return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(0xffffff, { map: schildTextur(text, hinter, vorder) }));
    }
    function giebeldach(w, h, d, c) {
        const s = new THREE.Shape();
        s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
        const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
        geo.translate(0, 0, -d / 2);
        const m = new THREE.Mesh(geo, mat(c)); m.castShadow = true;
        return m;
    }
    // Schwebendes Namensschild über dem Haus (dreht sich zur Kamera)
    function namensschild(ru, de, c, breite = 15) {
        const t = leinwand(512, 170, (g, w, h) => {
            g.fillStyle = c; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 28); g.fill();
            g.lineWidth = 6; g.strokeStyle = '#fbf7ef'; g.stroke();
            g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.font = '700 70px "PT Serif", Georgia, serif'; g.fillText(ru, w / 2, 70, w - 40);
            g.font = '600 32px Manrope, "Segoe UI", sans-serif'; g.globalAlpha = 0.85; g.fillText(de, w / 2, 128, w - 40);
        });
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
        sp.scale.set(breite, breite / 3, 1);
        return sp;
    }
    // Muster für Kuppeln und Zeltdächer (Basilius)
    function muster(art, a, b) {
        const t = leinwand(256, 256, (g, w, h) => {
            g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b;
            if (art === 'spirale') {
                for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, h); g.lineTo(i * 32 + 16, h); g.lineTo(i * 32 + 144, 0); g.lineTo(i * 32 + 128, 0); g.fill(); }
            } else if (art === 'zickzack') {
                for (let r = 0; r < 8; r++) {
                    g.beginPath();
                    for (let i = 0; i <= 16; i++) g.lineTo(i * 16, r * 32 + (i % 2 ? 0 : 14));
                    for (let i = 16; i >= 0; i--) g.lineTo(i * 16, r * 32 + 14 + (i % 2 ? 0 : 14));
                    g.fill();
                }
            } else if (art === 'rauten') {
                for (let r = 0; r < 8; r++) for (let i = 0; i < 9; i++) {
                    const cx = i * 32 + (r % 2) * 16, cy = r * 32 + 16;
                    g.beginPath(); g.moveTo(cx, cy - 13); g.lineTo(cx + 12, cy); g.lineTo(cx, cy + 13); g.lineTo(cx - 12, cy); g.fill();
                }
            } else {
                for (let i = 0; i < 16; i += 2) g.fillRect(i * 16, 0, 16, h);
            }
        });
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return mat(0xffffff, { map: t });
    }
    // Pflaster: Steinreihen mit leicht schwankender Farbe
    function pflaster(grund, stein, breite = 32) {
        let saat = 11;
        const rnd = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
        const [r, gr, b] = [1, 3, 5].map(i => parseInt(stein.slice(i, i + 2), 16));
        return leinwand(256, 256, (g) => {
            g.fillStyle = grund; g.fillRect(0, 0, 256, 256);
            for (let z = 0; z < 16; z++) for (let i = -1; i < 256 / breite; i++) {
                const f = 0.82 + rnd() * 0.3;
                g.fillStyle = `rgb(${r * f | 0},${gr * f | 0},${b * f | 0})`;
                g.beginPath(); g.roundRect(i * breite + (z % 2) * breite / 2 + 1.5, z * 16 + 1.5, breite - 3, 13, 4); g.fill();
            }
        });
    }
    function uhrTextur() {
        return leinwand(256, 256, (g, w) => {
            const m = w / 2;
            g.fillStyle = '#1d1d22'; g.beginPath(); g.arc(m, m, 122, 0, 7); g.fill();
            g.lineWidth = 10; g.strokeStyle = '#d9a93a'; g.stroke();
            g.fillStyle = '#d9a93a';
            for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.arc(m + Math.sin(a) * 98, m - Math.cos(a) * 98, i % 3 ? 6 : 11, 0, 7); g.fill(); }
            g.strokeStyle = '#d9a93a'; g.lineCap = 'round';
            g.lineWidth = 12; g.beginPath(); g.moveTo(m, m); g.lineTo(m + 50, m - 22); g.stroke();
            g.lineWidth = 8; g.beginPath(); g.moveTo(m, m); g.lineTo(m - 16, m - 84); g.stroke();
        });
    }
    // Zifferblätter auf allen vier Seiten eines quadratischen Turms
    function uhren(g, y, halb, r) {
        const m = mat(0xffffff, { map: uhrTextur() });
        [[0, 0, halb], [Math.PI, 0, -halb], [Math.PI / 2, halb, 0], [-Math.PI / 2, -halb, 0]].forEach(([dreh, x, z]) => {
            const u = new THREE.Mesh(new THREE.CircleGeometry(r, 32), m);
            u.position.set(x * 1.004, y, z * 1.004); u.rotation.y = dreh; g.add(u);
        });
    }
    function drehe(x, z, t) { return [x * Math.cos(t) + z * Math.sin(t), -x * Math.sin(t) + z * Math.cos(t)]; }

    // ---------------- Kreml ----------------
    function zinnenGeo() {      // Schwalbenschwanz-Zinne
        const s = new THREE.Shape();
        s.moveTo(-0.8, 0); s.lineTo(0.8, 0); s.lineTo(0.8, 1.6); s.lineTo(1.05, 2.4); s.lineTo(0, 1.75); s.lineTo(-1.05, 2.4); s.lineTo(-0.8, 1.6); s.closePath();
        const geo = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false });
        geo.translate(0, 0, -0.45);
        return geo;
    }
    function turm(art, sterne) {
        const g = new THREE.Group();
        const ziegel = mat(ZIEGEL), weiss = mat(0xf1ece2), gruen = mat(0x3f6b4a);
        if (art === 'rund') {
            g.add(zylinder(6.5, 22, 20, ziegel, 0, 0, 0, 5.9));
            g.add(zylinder(6.4, 2.6, 20, ziegel, 0, 22, 0));
            g.add(kegel(6, 12, 16, gruen, 0, 24.6, 0));
            g.add(zylinder(1.2, 3, 8, ziegel, 0, 36.6, 0), kegel(1.5, 4, 8, gruen, 0, 39.6, 0));
        } else if (art === 'klein') {
            g.add(kiste(8, 17, 8, ziegel), kiste(8.8, 1, 8.8, weiss, 0, 17, 0));
            g.add(kegel(6.2, 11, 4, gruen, 0, 18, 0));
        } else {      // Spasskaja, Nikolskaja und weitere Türme mit Rubinstern
            const spass = art === 'spasskaja', b = spass ? 13 : 10, h1 = spass ? 22 : 20;
            g.add(kiste(b, h1, b, ziegel));
            if (art !== 'stern') g.add(kiste(0.3, 8, 4.6, mat(0x2a1d18), b / 2, 0, 0));    // Tor zum Platz
            g.add(kiste(b + 0.6, 1, b + 0.6, weiss, 0, h1, 0));
            const b2 = b - 2, h2 = spass ? 12 : 8;
            g.add(kiste(b2, h2, b2, spass ? ziegel : weiss, 0, h1 + 1, 0));
            if (spass) uhren(g, h1 + 1 + h2 / 2, b2 / 2 + 0.02, 3.4);
            const y3 = h1 + 1 + h2, zelt = spass ? 16 : 13, r = spass ? 2.2 : 1.8;
            g.add(zylinder(b2 / 2 - 0.6, 7, 8, weiss, 0, y3, 0, b2 / 2 - 1));
            g.add(kegel(b2 / 2 - 0.8, zelt, 8, gruen, 0, y3 + 7, 0));
            const st = stern(r, 0xd62a1e, 0x7a0a05);
            st.position.y = y3 + 7 + zelt + r + 0.4; g.add(st); sterne.push(st);
            g.add(zylinder(0.25, 1.4, 6, gold(), 0, y3 + 7 + zelt - 0.6, 0));
        }
        return g;
    }
    function kathedrale(szene, x, z, w, d, h, kuppel) {
        const weiss = mat(0xf3eee4);
        szene.add(kiste(w, h, d, weiss, x, 0, z));
        [[0, 0, 1], [-1, -1, 0.75], [1, -1, 0.75], [-1, 1, 0.75], [1, 1, 0.75]].forEach(([sx, sz, f]) => {
            const px = x + sx * w * 0.28, pz = z + sz * d * 0.28;
            szene.add(zylinder(2.2 * f, 5 * f, 16, weiss, px, h, pz));
            szene.add(zwiebel(2.6 * f, 5.5 * f, kuppel, px, h + 5 * f, pz));
            kreuz(szene, px, h + 5 * f + 5.5 * f * 1.14, pz, 1.3 * f);
        });
    }
    function kreml(szene, hindernisse, sterne) {
        const ziegel = mat(ZIEGEL);
        const { ost, nord, sued, west } = KREML;
        const zinnen = [];
        [[ost, nord, ost, sued], [west, sued, ost, sued], [west, nord, ost, nord], [west, nord, west, sued]].forEach(([x1, z1, x2, z2]) => {
            const lang = Math.hypot(x2 - x1, z2 - z1), w = Math.atan2(z2 - z1, x2 - x1);
            const m = kiste(lang, 12, 4, ziegel); m.position.set((x1 + x2) / 2, 6, (z1 + z2) / 2); m.rotation.y = -w; szene.add(m);
            for (let t = 1.3; t < lang; t += 2.6) zinnen.push([x1 + Math.cos(w) * t, z1 + Math.sin(w) * t, -w]);
        });
        const inst = new THREE.InstancedMesh(zinnenGeo(), ziegel, zinnen.length);
        const d = new THREE.Object3D();
        zinnen.forEach(([x, z, r], i) => { d.position.set(x, 12, z); d.rotation.set(0, r, 0); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); });
        inst.castShadow = true; szene.add(inst);
        hindernisse.push({ x: (west + ost) / 2 - 1, z: (nord + sued) / 2, w: ost - west + 6, d: sued - nord + 4 });
        [[ost, 88, 'spasskaja'], [ost, -95, 'nikolskaja'], [ost, -5, 'klein'],
            [ost, nord, 'rund'], [ost, sued, 'rund'], [west, nord, 'rund'], [west, sued, 'rund'],
            [-95, sued, 'klein'], [-145, sued, 'klein'], [-195, sued, 'stern'], [-100, nord, 'klein'], [-170, nord, 'stern'], [west, 0, 'stern']]
            .forEach(([x, z, art]) => { const t = turm(art, sterne); t.position.set(x, 0, z); szene.add(t); });

        // Senat: gelb, grüne Kuppel mit Fahne
        const senat = wandKiste(56, 16, 16, fassade(14, 3, '#e8c873', '#6d8597', false, '#fbf3df'), fassade(4, 3, '#e8c873', '#6d8597', false, '#fbf3df'), '#5d8a6a');
        senat.position.set(-80, 8, -10); szene.add(senat);
        szene.add(zylinder(6, 4, 24, mat(0xe8c873), -80, 16, -10));
        const kuppel = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4f7d5c));
        kuppel.position.set(-80, 20, -10); szene.add(kuppel);
        szene.add(kiste(0.25, 9, 0.25, mat(0x8a8f94), -80, 25, -10));
        const fahne = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3), mat(0xffffff, {
            side: THREE.DoubleSide, map: leinwand(90, 60, (g) => { [['#ffffff', 0], ['#1c57a5', 20], ['#d52b1e', 40]].forEach(([c, y]) => { g.fillStyle = c; g.fillRect(0, y, 90, 20); }); })
        }));
        fahne.position.set(-77.7, 32.4, -10); szene.add(fahne);

        // Glockenturm Iwan der Große und Kathedralen mit goldenen Kuppeln
        const weiss = mat(0xf3eee4);
        [[6.5, 0, 20], [5.4, 20, 14], [4.4, 34, 12]].forEach(([r, y, h]) => szene.add(zylinder(r, h, 8, weiss, -115, y, 60, r * 0.94)));
        szene.add(zylinder(3, 6, 16, weiss, -115, 46, 60), zwiebel(3.4, 7, gold(), -115, 52, 60));
        kreuz(szene, -115, 52 + 7 * 1.14, 60, 1.8);
        kathedrale(szene, -90, 95, 22, 18, 15, gold());
        kathedrale(szene, -138, 92, 18, 16, 13, mat(0xc9ced2, { emissive: 0x222222 }));
        kathedrale(szene, -78, 58, 13, 13, 11, gold());
        // Großer Kremlpalast am Fluss
        const palast = wandKiste(70, 20, 22, fassade(18, 3, '#efe2c4', '#6d8597', false, '#fbf7ef'), fassade(6, 3, '#efe2c4', '#6d8597', false, '#fbf7ef'), '#5d8a6a');
        palast.position.set(-175, 10, 118); szene.add(palast);
    }

    // ---------------- Basilius-Kathedrale ----------------
    function basilius() {
        const g = new THREE.Group();
        const weiss = mat(0xf1ece2);
        const ziegel = mat(0xffffff, {
            map: wiederholt(leinwand(128, 256, (c, w, h) => {
                c.fillStyle = '#b03a2e'; c.fillRect(0, 0, w, h);
                c.fillStyle = '#f1ece2'; c.fillRect(0, 0, w, 10); c.fillRect(0, h * 0.5, w, 8); c.fillRect(0, h - 12, w, 12);
                c.strokeStyle = '#f1ece2'; c.lineWidth = 6;
                c.beginPath(); c.moveTo(34, h * 0.45); c.lineTo(34, h * 0.22); c.arc(64, h * 0.22, 30, Math.PI, 0); c.lineTo(94, h * 0.45); c.stroke();
                c.fillStyle = '#3a3f4a'; c.fillRect(52, h * 0.24, 24, h * 0.18);
                c.beginPath(); c.arc(64, h * 0.8, 26, Math.PI, 0); c.stroke();
            }), 4, 1),
        });
        // Trommel unter der Kuppel: weiß mit schmalen Bogenfenstern
        const trommel = mat(0xffffff, {
            map: wiederholt(leinwand(128, 64, (c, w, h) => {
                c.fillStyle = '#f1ece2'; c.fillRect(0, 0, w, h);
                c.fillStyle = '#c8302a'; c.fillRect(0, 0, w, 6); c.fillRect(0, h - 6, w, 6);
                c.fillStyle = '#3a3f4a';
                [16, 48, 80, 112].forEach(x => { c.beginPath(); c.roundRect(x - 6, 16, 12, 34, [6, 6, 0, 0]); c.fill(); });
            }), 3, 1),
        });
        const ACHT = Math.PI / 8;     // Kokoschniki sitzen mittig auf den Seiten des Achtecks
        g.add(kiste(32, 6, 32, ziegel), kiste(32.6, 0.8, 32.6, weiss, 0, 6, 0));

        // Mittelturm: Achteck, zwei Reihen Kokoschniki, hohes Zeltdach, kleine goldene Zwiebel
        g.add(zylinder(6, 18, 8, ziegel, 0, 6.8, 0), zylinder(6.3, 0.6, 8, weiss, 0, 24.8, 0));
        kokoschniki(g, 5.75, 25.4, 8, 1.6, ACHT);
        g.add(zylinder(5.2, 3, 8, ziegel, 0, 25.4, 0, 5));
        kokoschniki(g, 4.95, 28.4, 8, 1.25, 0);
        const zelt = muster('rauten', '#f1ece2', '#c8302a'); zelt.map.repeat.set(4, 3);
        g.add(kegel(4.8, 16, 8, zelt, 0, 28.4, 0));
        g.add(zylinder(1.1, 2.4, 12, trommel, 0, 43.4, 0));
        const mitte = prachtKuppel(2.2, 3.6, gold(), 10, 0); mitte.position.y = 45.8; g.add(mitte);
        kreuz(g, 0, 45.8 + 3.6 * 1.14, 0, 1.4);

        // Vier große Kapellen (Himmelsrichtungen) und vier kleine (dazwischen), jede mit eigener Zwiebel:
        // [Muster, Farbe a, Farbe b, Rippen, Drall (Umdrehungen von unten bis zur Spitze)]
        const GROSS = [['band', '#c8302a', '#2f7d4a', 10, 0.55], ['zickzack', '#e8b830', '#2f7d4a', 12, 0],
            ['band', '#2b5fa8', '#f1ece2', 12, -0.6], ['rauten', '#2f7d4a', '#e8b830', 14, 0]];
        const KLEIN = [['band', '#e8b830', '#c8302a', 8, 0.45], ['band', '#2f7d4a', '#e8b830', 10, 0],
            ['rauten', '#2b5fa8', '#e8b830', 10, 0], ['band', '#c8302a', '#f1ece2', 8, -0.5]];
        for (let i = 0; i < 4; i++) {
            const w = i * Math.PI / 2, x = Math.sin(w) * 11, z = Math.cos(w) * 11;
            const [art, a, b, rippen, drall] = GROSS[i];
            g.add(zylinder(3.8, 15, 8, ziegel, x, 6.8, z), zylinder(4, 0.5, 8, weiss, x, 21.8, z));
            kokoschniki(g, 3.65, 22.3, 8, 1.1, ACHT, x, z);
            g.add(zylinder(2.1, 5, 16, trommel, x, 22.3, z));
            const k = prachtKuppel(3.5, 7.5, kuppelMat(art, a, b, rippen), rippen, drall); k.position.set(x, 27.3, z); g.add(k);
            kreuz(g, x, 27.3 + 7.5 * 1.14, z, 1.7);

            const w2 = w + Math.PI / 4, x2 = Math.sin(w2) * 10.5, z2 = Math.cos(w2) * 10.5;
            const [art2, a2, b2, rippen2, drall2] = KLEIN[i];
            g.add(zylinder(2.6, 11, 8, ziegel, x2, 6.8, z2), zylinder(2.8, 0.4, 8, weiss, x2, 17.8, z2));
            kokoschniki(g, 2.5, 18.2, 8, 0.75, ACHT, x2, z2);
            g.add(zylinder(1.45, 3.6, 16, trommel, x2, 18.2, z2));
            const k2 = prachtKuppel(2.5, 5.4, kuppelMat(art2, a2, b2, rippen2), rippen2, drall2); k2.position.set(x2, 21.8, z2); g.add(k2);
            kreuz(g, x2, 21.8 + 5.4 * 1.14, z2, 1.3);
        }
        // Glockenturm daneben: offene Glockenstube, grünes Zeltdach, kleine Zwiebel
        g.add(kiste(5, 13, 5, ziegel, 13.5, 0, -13.5), kiste(5.4, 0.5, 5.4, weiss, 13.5, 13, -13.5), kiste(4.2, 3.2, 4.2, mat(0x2a1d18), 13.5, 13.5, -13.5));
        g.add(kiste(5.4, 0.5, 5.4, weiss, 13.5, 16.7, -13.5), kegel(3.6, 7, 8, mat(0x3f6b4a), 13.5, 17.2, -13.5));
        const glocke = prachtKuppel(1.1, 2.2, mat(0x3f6b4a), 8, 0); glocke.position.set(13.5, 24, -13.5); g.add(glocke);
        kreuz(g, 13.5, 24 + 2.2 * 1.14, -13.5, 1);
        return g;
    }
    // Zwiebelkuppel mit echten Rippen; mit Drall drehen sich Rippen und Farbbänder gemeinsam zur Spitze
    function prachtKuppel(r, h, material, rippen = 8, drall = 0) {
        const geo = new THREE.LatheGeometry(ZWIEBEL.map(([a, b]) => new THREE.Vector2(a * r, b * h)), 64);
        const pos = geo.attributes.position, uv = geo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            const t = uv.getY(i), u = uv.getX(i) + drall * t;
            uv.setX(i, u);
            if (!rippen) continue;
            const f = 1 + 0.08 * Math.abs(Math.sin(Math.PI * rippen * u)) * Math.sin(Math.PI * Math.min(1, t / 0.8));
            pos.setX(i, pos.getX(i) * f); pos.setZ(i, pos.getZ(i) * f);
        }
        geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, material); m.castShadow = true;
        return m;
    }
    // Farbe einer Kuppel; bei 'band' ist jedes Farbband genau eine Rippe breit
    function kuppelMat(art, a, b, rippen) {
        if (art !== 'band') return muster(art, a, b);
        const t = leinwand(256, 8, (g) => {
            g.fillStyle = a; g.fillRect(0, 0, 128, 8); g.fillStyle = b; g.fillRect(128, 0, 128, 8);
            g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(0, 0, 4, 8); g.fillRect(126, 0, 4, 8);
        });
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rippen / 2, 1);
        return mat(0xffffff, { map: t });
    }
    // Kokoschniki: Kranz spitzbogiger Ziergiebel (weiß gerahmt, rot gefüllt) um einen Turm
    function kokoschniki(g, r, y, n, gr, versatz = 0, x0 = 0, z0 = 0) {
        const form = (s) => {
            const f = new THREE.Shape();
            f.moveTo(-s, 0); f.quadraticCurveTo(-s, s * 1.1, 0, s * 1.6); f.quadraticCurveTo(s, s * 1.1, s, 0); f.closePath();
            return new THREE.ShapeGeometry(f, 8);
        };
        const weiss = mat(0xf1ece2, { side: THREE.DoubleSide }), rot = mat(0xb03a2e, { side: THREE.DoubleSide });
        const aussen = form(gr), innen = form(gr * 0.68);
        for (let i = 0; i < n; i++) {
            const w = versatz + i * 2 * Math.PI / n;
            [[aussen, weiss, 0, 0], [innen, rot, 0.04, gr * 0.12]].forEach(([geo, m, vor, hoch]) => {
                const k = new THREE.Mesh(geo, m);
                k.position.set(x0 + Math.sin(w) * (r + vor), y + hoch, z0 + Math.cos(w) * (r + vor)); k.rotation.y = w;
                g.add(k);
            });
        }
    }
    // Orthodoxes Kreuz (goldener Knauf, Querbalken, schräger Fußbalken)
    function kreuz(g, x, y, z, s) {
        const m = gold();
        g.add(new THREE.Mesh(new THREE.SphereGeometry(s * 0.14, 12, 8), m).translateX(x).translateY(y + s * 0.08).translateZ(z));
        g.add(kiste(s * 0.07, s, s * 0.07, m, x, y + s * 0.1, z), kiste(s * 0.5, s * 0.07, s * 0.07, m, x, y + s * 0.75, z));
        const fuss = kiste(s * 0.32, s * 0.06, s * 0.06, m, x, y + s * 0.3, z); fuss.rotation.z = -0.35; g.add(fuss);
    }

    // ---------------- GUM, Museum und Nachbarn ----------------
    function gumTextur(buchten) {
        const t = leinwand(128, 256, (g, w) => {
            g.fillStyle = '#ecd9c3'; g.fillRect(0, 0, w, 256);
            g.fillStyle = '#dcc3a6'; g.fillRect(0, 0, 8, 256); g.fillRect(w - 8, 0, 8, 256);
            g.fillRect(0, 0, w, 10); g.fillRect(0, 86, w, 6); g.fillRect(0, 170, w, 6);
            const bogen = (x, y, b, hh, glas) => {
                g.fillStyle = '#f8f0e4'; g.beginPath(); g.roundRect(x - 3, y - 3, b + 6, hh + 4, [b / 2 + 3, b / 2 + 3, 0, 0]); g.fill();
                g.fillStyle = glas; g.beginPath(); g.roundRect(x, y, b, hh, [b / 2, b / 2, 0, 0]); g.fill();
            };
            bogen(22, 22, 30, 54, '#6b8396'); bogen(76, 22, 30, 54, '#6b8396');
            bogen(22, 106, 30, 54, '#6b8396'); bogen(76, 106, 30, 54, '#6b8396');
            bogen(16, 186, 42, 66, '#4d6475'); bogen(70, 186, 42, 66, '#4d6475');
        });
        t.wrapS = THREE.RepeatWrapping; t.repeat.set(buchten, 1);
        return mat(0xffffff, { map: t });
    }
    function gum() {      // Fassade nach Westen (−x) zum Platz
        const g = new THREE.Group();
        const L = 162, B = 32, H = 18, dach = mat(0x8d969c);
        const lang = gumTextur(L / 9), kurz = gumTextur(4);
        const k = new THREE.Mesh(new THREE.BoxGeometry(B, H, L), [lang, lang, dach, dach, kurz, kurz]);
        k.position.y = H / 2; k.castShadow = k.receiveShadow = true; g.add(k);
        // Glasdächer der drei Passagen
        const glas = new THREE.MeshLambertMaterial({ color: 0xbcd7e4, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
        [-9, 0, 9].forEach(x => {
            const v = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, L - 8, 20, 1, true, -Math.PI / 2, Math.PI), glas);
            v.rotation.x = -Math.PI / 2; v.position.set(x, H, 0); g.add(v);
        });
        // Türmchen mit grünen Zeltdächern und das Hauptportal
        const stein = mat(0xe6d2bb), gruen = mat(0x4f7d5c);
        for (let z = -81; z <= 81; z += 27) {
            if (!z) continue;
            g.add(kiste(4, 6, 4, stein, -B / 2 + 1.5, H, z), kegel(3, 5, 4, gruen, -B / 2 + 1.5, H + 6, z));
        }
        g.add(kiste(4, 26, 16, stein, -B / 2 - 1, 0, 0), kiste(0.3, 10, 7, mat(0x3a2c24), -B / 2 - 3.05, 0, 0));
        [-6, 6].forEach(z => g.add(kiste(3.4, 6, 3.4, stein, -B / 2 - 1, 26, z), kegel(2.6, 6, 4, gruen, -B / 2 - 1, 32, z)));
        const s = schild('ГУМ', 8, 2.6, '#3f6b4a', '#f3e2b0');
        s.position.set(-B / 2 - 3.06, 13.5, 0); s.rotation.y = -Math.PI / 2; g.add(s);
        return g;
    }
    // Eingang im GUM für Café und Supermarkt (Rückseite an der Fassade)
    // Schaufensterpuppe auf Sockel: Kleid (Damen) oder Anzug mit Krawatte (Herren)
    function puppe(art, c) {
        const g = new THREE.Group(), weiss = mat(0xece7df), stoff = mat(c);
        g.add(zylinder(0.7, 0.5, 16, mat(0x8a8f94)));
        if (art === 'kleid') g.add(zylinder(0.85, 2.2, 16, stoff, 0, 0.5, 0, 0.32), zylinder(0.32, 0.9, 12, stoff, 0, 2.7, 0, 0.42));
        else {
            g.add(kiste(0.26, 1.6, 0.3, mat(0x2c3e50), -0.17, 0.5, 0), kiste(0.26, 1.6, 0.3, mat(0x2c3e50), 0.17, 0.5, 0));
            g.add(kiste(0.85, 1.4, 0.45, stoff, 0, 2.1, 0), kiste(0.12, 0.8, 0.05, mat(0xb8392b), 0, 2.6, 0.24));
        }
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), weiss).translateY(3.85));
        return g;
    }
    function portal(text, c, terrasse, puppen) {
        const g = new THREE.Group();
        const stein = mat(0xe3cdb2);
        g.add(kiste(1.6, 9, 3, stein, -4.2, 0, 0), kiste(1.6, 9, 3, stein, 4.2, 0, 0), kiste(10, 2.4, 3, stein, 0, 9, 0));
        g.add(kiste(6.8, 9, 0.3, mat(0x3a2c24), 0, 0, -1.2), kiste(5.6, 6, 0.2, mat(0x9fcde3), 0, 0, -1));
        const s = schild(text, 8.4, 1.7, c, '#ffffff'); s.position.set(0, 10.2, 1.52); g.add(s);
        const markise = kiste(9, 0.25, 2.2, mat(c), 0, 8.2, 2.3); markise.rotation.x = 0.3; g.add(markise);
        if (terrasse) [-7.5, 7.5].forEach(x => {
            g.add(zylinder(0.8, 1, 12, mat(0x5e3920), x, 0, 6), zylinder(0.08, 2.6, 6, mat(0x5e3920), x, 1, 6));
            g.add(kegel(2.4, 1, 12, mat(0xfbf7ef), x, 3.4, 6));
        });
        if (puppen) puppen.farben.forEach((f, i) => { const p = puppe(puppen.art, f); p.position.set(i ? 6.8 : -6.8, 0, 1.4); p.rotation.y = i ? -0.3 : 0.3; g.add(p); });
        return { g, breite: 10, tiefe: 3, hoehe: 11.4, schildY: 15, schildVorn: true, schildBreite: 11 };
    }
    function museum() {     // Historisches Museum, Front nach Süden zum Platz
        const g = new THREE.Group();
        g.add(wandKiste(38, 20, 22, fassade(9, 4, '#a63a2c', '#4b5560', false, '#f1ece2'), fassade(5, 4, '#a63a2c', '#4b5560', false, '#f1ece2'), '#7f8a90'));
        const ziegel = mat(0xa63a2c), silber = mat(0xd5dade);
        [[-17, 9, 6, 32], [17, 9, 6, 32], [-9, 10, 4, 26], [9, 10, 4, 26], [0, 11, 7, 28]].forEach(([x, z, b, h]) => {
            g.add(kiste(b, h, b, ziegel, x, 0, z), kegel(b * 0.75, b * 1.8, 4, silber, x, h, z), zwiebel(0.6, 1.2, gold(), x, h + b * 1.8, z));
        });
        return g;
    }
    function kirchlein(wand, kuppel) {      // kleine Kirche (Kasaner Kathedrale, Kirchen an der Warwarka)
        const g = new THREE.Group();
        g.add(kiste(10, 9, 12, mat(wand)), kiste(10.4, 0.8, 12.4, mat(0xf1ece2), 0, 9, 0));
        g.add(zylinder(2.6, 4, 8, mat(0xf1ece2), 0, 9.8, 0), zwiebel(3, 5.5, mat(kuppel), 0, 13.8, 0));
        g.add(zylinder(0.15, 2.2, 6, gold(), 0, 19.6, 0));
        return g;
    }
    function altbau(w, h, d, wand) {
        const sp = (n) => Math.max(2, Math.round(n / 4));
        return wandKiste(w, h, d, fassade(sp(w), sp(h), wand), fassade(sp(d), sp(h), wand), '#7b6f68');
    }

    // ---------------- Gebäude der Module ----------------
    // Jeder Bauer liefert eine Gruppe mit der Tür bei (0, 0, tiefe/2) und die Maße
    const BAUER = {
        cafe: () => portal('КАФЕ', '#1f4e47', true),
        supermarket: () => portal('СУПЕРМАРКЕТ', '#3f8f5f', false),
        zhenskaya: (m) => portal('ЖЕНСКАЯ ОДЕЖДА', m.farbe || '#9b3d6b', false, { art: 'kleid', farben: [0xc8302a, 0x2b5fa8] }),
        muzhskaya: (m) => portal('МУЖСКАЯ ОДЕЖДА', m.farbe || '#2b4a6b', false, { art: 'anzug', farben: [0x4a4f57, 0x2b3f63] }),
        dom() {
            const g = new THREE.Group();
            g.add(wandKiste(22, 12, 16, fassade(5, 3, '#efe4cf', '#9fcde3', true), fassade(4, 3, '#efe4cf'), '#3e4855'));
            const dach = giebeldach(24, 7, 17, 0x3e4855); dach.position.y = 12; g.add(dach);
            g.add(kiste(1.6, 4, 1.6, mat(0x8a5a44), 6, 14, -2));                       // Schornstein
            g.add(kiste(9, 4.5, 10, mat(0xe9dcc2), 15.5, 0, 3), kiste(9.4, 0.4, 10.4, mat(0x3e4855), 15.5, 4.5, 3));
            g.add(kiste(6, 3.4, 0.2, mat(0xc9bda6), 15.5, 0, 8.05));                  // Garagentor
            const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), mat(0x4fb3e0));
            pool.rotation.x = -Math.PI / 2; pool.position.set(-17, 0.2, 2); g.add(pool);
            g.add(kiste(10, 0.15, 6, mat(0xcdbfa6), -17, 0, 2));
            return { g, breite: 22, tiefe: 16, hoehe: 19, extra: [{ x: 15.5, z: 3, w: 9, d: 10 }, { x: -17, z: 2, w: 10, d: 6 }] };
        },
        shkola() {
            const g = new THREE.Group();
            g.add(wandKiste(40, 12, 14, fassade(10, 2, '#f0c9a0', '#9fcde3', true), fassade(4, 2, '#f0c9a0'), '#a0523a'));
            g.add(kiste(10, 18, 10, mat(0xf0c9a0), 0, 0, 0));
            const dach = giebeldach(12, 5, 12, 0xa0523a); dach.position.y = 18; g.add(dach);
            const uhr = new THREE.Mesh(new THREE.CircleGeometry(2, 32), mat(0xffffff, { map: leinwand(128, 128, (c) => {
                c.fillStyle = '#fbf7ef'; c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fill();
                c.lineWidth = 8; c.strokeStyle = '#a0523a'; c.stroke();
                c.lineCap = 'round'; c.strokeStyle = '#2a2a2a'; c.lineWidth = 7;
                c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 24); c.moveTo(64, 64); c.lineTo(92, 74); c.stroke();
            }) }));
            uhr.position.set(0, 15, 5.02); g.add(uhr);
            const s = schild('ШКОЛА', 9, 1.8, '#1f4e47', '#e8c879'); s.position.set(0, 10.5, 7.02); g.add(s);
            for (let i = -1; i <= 1; i += 2) g.add(kiste(14, 1.2, 0.2, mat(0x3f8f5f), i * 13, 0, 12));   // Zaun
            return { g, breite: 40, tiefe: 14, hoehe: 23 };
        },
        vysotka() {      // Hauptgebäude der Lomonossow-Universität: gestuft, Spitze mit Stern
            const g = new THREE.Group();
            const sand = '#e2d3b5', glas = '#5f7a8c', rahmen = '#f3ebdc', hell = mat(0xe2d3b5);
            const block = (w, h, d, y, x = 0) => {
                const m = wandKiste(w, h, d, fassade(Math.round(w / 3), Math.round(h / 3.4), sand, glas, false, rahmen),
                    fassade(Math.round(d / 3), Math.round(h / 3.4), sand, glas, false, rahmen), '#b9a888');
                m.position.set(x, y + h / 2, 0); return m;
            };
            g.add(block(36, 62, 28, 0), block(28, 16, 22, 62), block(20, 12, 16, 78), block(12, 10, 11, 90));
            g.add(kegel(4.2, 32, 8, gold(), 0, 100, 0));
            const st = stern(2.6, 0xe6c04a, 0x5a4000); st.position.y = 135; g.add(st); g.userData.stern = st;
            uhren(g, 70, 11.02, 3.6);
            [-1, 1].forEach(sx => {
                g.add(block(40, 34, 20, 0, sx * 38), block(14, 48, 14, 0, sx * 62), block(9, 8, 9, 48, sx * 62));
                g.add(kegel(2.4, 12, 8, gold(), sx * 62, 56, 0));
                [-1, 1].forEach(sz => g.add(kiste(2, 6, 2, hell, sx * 16, 62, sz * 12), kegel(1, 3, 4, gold(), sx * 16, 68, sz * 12)));
            });
            // Säulenportal mit Treppe
            for (let i = -2.5; i <= 2.5; i++) g.add(zylinder(0.8, 14, 12, mat(0xf3ebdc), i * 3, 0.6, 16.5));
            g.add(kiste(20, 0.6, 8, mat(0xcfc6b4), 0, 0, 16), kiste(19, 2.4, 5, hell, 0, 14.6, 15.5), kiste(8, 9, 0.3, mat(0x5e3920), 0, 0, 14.1));
            const s = schild('МГУ', 8, 1.8, '#7c5ea8', '#ffffff'); s.position.set(0, 15.8, 18.02); g.add(s);
            return {
                g, breite: 36, tiefe: 36, hoehe: 136, schildY: 26, schildBreite: 18, schildVorn: true,
                extra: [{ x: -38, z: 0, w: 40, d: 20 }, { x: 38, z: 0, w: 40, d: 20 }, { x: -62, z: 0, w: 14, d: 14 }, { x: 62, z: 0, w: 14, d: 14 }],
            };
        },
    };
    function standardHaus(m) {
        const g = new THREE.Group();
        const c = m.farbe || '#c8553d';
        g.add(wandKiste(18, 10, 14, fassade(4, 2, '#efe4cf', '#9fcde3', true), fassade(3, 2, '#efe4cf'), c));
        const s = schild(m.titel.ru.replace(/́/g, '').toUpperCase(), 10, 1.8, c, '#ffffff'); s.position.set(0, 8.5, 7.02); g.add(s);
        return { g, breite: 18, tiefe: 14, hoehe: 10 };
    }
    function metroEingang() {     // Treppe nach unten, Pylon mit rotem М
        const g = new THREE.Group();
        const granit = mat(0x8d8a86);
        g.add(kiste(10.6, 1.1, 0.8, granit, 0, 0, -5.6), kiste(0.8, 1.1, 12, granit, -5, 0, 0), kiste(0.8, 1.1, 12, granit, 5, 0, 0));
        const treppe = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 11), mat(0xffffff, {
            map: leinwand(128, 160, (c, w, h) => {
                const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, '#1b1d21'); v.addColorStop(1, '#6d6a66');
                c.fillStyle = v; c.fillRect(0, 0, w, h);
                c.fillStyle = 'rgba(255,255,255,.22)'; for (let y = 6; y < h; y += 10) c.fillRect(0, y, w, 2);
            }),
        }));
        treppe.rotation.x = -Math.PI / 2; treppe.position.set(0, 0.12, 0); g.add(treppe);
        const m = leinwand(256, 256, (c, w) => {
            c.fillStyle = '#ffffff'; c.beginPath(); c.arc(w / 2, w / 2, 124, 0, 7); c.fill();
            // Der Deckel des Zylinders liegt um 90° gedreht – das М daher gegengedreht zeichnen
            c.translate(w / 2, w / 2); c.rotate(-Math.PI / 2);
            c.fillStyle = '#d52b1e'; c.font = '900 190px "Arial Black", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText('М', 0, 12);
        });
        // Hoher Mast mit leuchtendem М: ragt über das Historische Museum und ist vom Roten Platz aus zu sehen
        const leuchtM = mat(0xffffff, { map: m, emissive: 0x555555 });
        const zeichen = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.6, 48), [mat(0xd52b1e, { emissive: 0x4a0a05 }), leuchtM, leuchtM]);
        // Der Mast steht seitlich, so dass das М vom Platz aus zwischen Museumstürmen und Tor hindurch zu sehen ist
        zeichen.rotation.x = Math.PI / 2; zeichen.position.set(16, 52, 2); g.add(zeichen);
        g.add(kiste(1, 48.4, 1, mat(0x5a5f66), 16, 0, 2), kiste(2.2, 1.2, 2.2, mat(0x5a5f66), 16, 0, 2));
        // kleines М in Augenhöhe direkt am Eingang
        const kleinM = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 32), [mat(0xd52b1e), leuchtM, leuchtM]);
        kleinM.rotation.x = Math.PI / 2; kleinM.position.set(7.6, 6.5, 4.5); g.add(kleinM);
        g.add(kiste(0.4, 5.1, 0.4, mat(0x5a5f66), 7.6, 0, 4.3));
        // Großes Schild über dem Eingang: МЕТРО und der Stationsname, vorn und hinten lesbar
        const tafel = leinwand(1024, 256, (c, w, h) => {
            c.fillStyle = '#fbf7ef'; c.fillRect(0, 0, w, h);
            c.fillStyle = '#d52b1e'; c.fillRect(0, 0, w, 14); c.fillRect(0, h - 14, w, 14);
            c.beginPath(); c.arc(128, h / 2, 92, 0, 7); c.fill();
            c.fillStyle = '#fff'; c.font = '900 130px "Arial Black", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText('М', 128, h / 2 + 8);
            c.fillStyle = '#d52b1e'; c.font = '900 104px "Arial Black", Arial, sans-serif'; c.textAlign = 'left';
            c.fillText('МЕТРО', 256, 92, 720);
            c.fillStyle = '#1f2a44'; c.font = '700 64px "PT Serif", Georgia, serif';
            c.fillText('«Охотный Ряд»', 260, 190, 720);
        });
        const tafelMat = mat(0xffffff, { map: tafel, emissive: 0x3a3a3a }), rahmen = mat(0xd52b1e);
        const brett = new THREE.Mesh(new THREE.BoxGeometry(14, 3.5, 0.4), [rahmen, rahmen, rahmen, rahmen, tafelMat, tafelMat]);
        brett.position.set(0, 7.2, -5.6); brett.castShadow = true; g.add(brett);
        g.add(kiste(0.5, 9, 0.5, mat(0x5a5f66), -7.25, 0, -5.6), kiste(0.5, 9, 0.5, mat(0x5a5f66), 7.25, 0, -5.6));
        g.add(kiste(14.8, 0.35, 1.2, mat(0x5a5f66), 0, 9, -5.6));      // Dachleiste
        return { g, breite: 15.5, tiefe: 12, hoehe: 9, schildY: 16, extra: [{ x: 16, z: 2, w: 2.2, d: 2.2 }, { x: 7.6, z: 4.3, w: 0.5, d: 0.5 }] };
    }

    function mausoleum() {      // Stufenpyramide aus rotem Granit und dunklem Labradorit, oben ein Säulenpavillon
        const g = new THREE.Group();
        const rot = mat(0x7a2620), dunkel = mat(0x2b2224), grau = mat(0x6d6468);
        let y = 0;
        [[24, 18, 3, rot], [22.4, 16.6, 0.5, dunkel], [20, 14.5, 2.6, rot], [18.4, 13, 0.5, dunkel], [15, 11, 2.4, rot], [13, 9.4, 0.5, dunkel], [10.5, 7.8, 1.6, rot]]
            .forEach(([w, d, h, m]) => { g.add(kiste(w, h, d, m, 0, y, 0)); y += h; });
        [-3.6, -1.2, 1.2, 3.6].forEach(x => [-2.6, 2.6].forEach(z => g.add(zylinder(0.22, 2.2, 8, dunkel, x, y, z))));
        g.add(kiste(10, 0.6, 7.4, rot, 0, y + 2.2, 0));
        const inschrift = schild('ЛЕНИН', 7, 1.5, '#1d1a1c', '#a23a2e'); inschrift.position.set(0, 4.8, 7.27); g.add(inschrift);
        g.add(kiste(2.6, 2.6, 0.2, dunkel, 0, 0, 9.02));
        // Tribünen links und rechts, dahinter Silbertannen an der Mauer
        [-1, 1].forEach(sx => {
            for (let j = 0; j < 4; j++) g.add(kiste(16, 0.8 * (4 - j), 2.2, grau, sx * 21, 0, -3 + j * 2.2));
            [22, 34].forEach(x => g.add(kegel(2, 7, 9, mat(0x5f8a8f), sx * x, 0, -7.5)));
        });
        return { g, breite: 24, tiefe: 18, hoehe: 13.4, schildY: 20, extra: [{ x: -21, z: 0.3, w: 16, d: 9 }, { x: 21, z: 0.3, w: 16, d: 9 }] };
    }

    // ---------------- Figuren ----------------
    function figur(hemd = 0xc8553d, hose = 0x2c3e50, muetze = 0x2b5fa8) {
        const g = new THREE.Group();
        const beine = [kiste(0.28, 0.85, 0.3, mat(hose), -0.17, 0, 0), kiste(0.28, 0.85, 0.3, mat(hose), 0.17, 0, 0)];
        beine.forEach(b => g.add(b));
        g.add(kiste(0.8, 0.95, 0.45, mat(hemd), 0, 0.85, 0));
        const kopf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat(0xf2c7a6)); kopf.position.y = 2.1; kopf.castShadow = true; g.add(kopf);
        const haube = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(muetze ?? 0x5a3a22));
        haube.position.y = 2.15; g.add(haube);
        g.userData.beine = beine;
        return g;
    }
    function boot() {
        const g = new THREE.Group();
        g.add(kiste(3.2, 0.9, 11, mat(0xf4f1ea), 0, -0.5, 0), kiste(3.3, 0.25, 11.1, mat(0x2b5fa8), 0, 0.15, 0));
        g.add(kiste(2.5, 1.1, 5.5, mat(0xbfe0ee), 0, 0.4, -0.5), kiste(2.7, 0.2, 6, mat(0xf4f1ea), 0, 1.5, -0.5));
        return g;
    }

    // ---------------- Start ----------------
    G.zeigeStadt3D = async function () {
        if (beenden) beenden();
        if (G.verlasseModul) G.verlasseModul();
        G.herkunft = '3d';
        G.ansicht('stadt3d');
        const inhalt = document.getElementById('inhalt');
        inhalt.innerHTML = `
          <section class="stadt3d" id="stadt3d">
            <div class="s3-laden" id="s3-laden"><span class="s3-kran">🏗️</span><span>Moskau wird gebaut …</span></div>
            <div class="s3-ort" id="s3-ort"><span class="ru"></span><span class="de"></span></div>
            <div class="s3-knoepfe">
              <button class="s3-knopf" id="s3-hilfe-knopf" title="Steuerung">?</button>
            </div>
            <div class="s3-hilfe" id="s3-hilfe">
              <strong>So bewegst du dich</strong>
              <span><kbd>W</kbd> <kbd>↑</kbd> vorwärts · <kbd>S</kbd> <kbd>↓</kbd> rückwärts</span>
              <span><kbd>A</kbd> <kbd>D</kbd> <kbd>←</kbd> <kbd>→</kbd> drehen · <kbd>Shift</kbd> rennen</span>
              <span>Maus ziehen: umschauen (nach unten ziehen = hochschauen) · Mausrad: näher/weiter</span>
              <span><strong>Hineingehen:</strong> aufs Haus klicken, durch die Tür laufen oder <kbd>Enter</kbd></span>
              <span>Café, Supermarkt, Damen- und Herrenmode sind im GUM · 🚇 Metro zu Bahnhof und Flughafen · 📜 Geschichtsstunde am Mausoleum</span>
              <span class="klein">Goldene Ringe zeigen die Türen.</span>
            </div>
            <div class="s3-tuer" id="s3-tuer" hidden></div>
            <div class="s3-steuer" aria-label="Steuerung">
              <button data-taste="vor">▲</button><button data-taste="links">◀</button><button data-taste="zurueck">▼</button><button data-taste="rechts">▶</button>
            </div>
            <canvas class="s3-karte" id="s3-karte" width="168" height="288"></canvas>
            <div class="s3-metro" id="s3-metro" hidden></div>
            <div class="s3-metro" id="s3-lektion" hidden></div>
          </section>`;
        const buehne = document.getElementById('stadt3d');
        const kopf = document.querySelector('.kopf');
        buehne.style.top = kopf.getBoundingClientRect().bottom + 'px';

        try {
            THREE = THREE || await import('/static/vendor/three.module.min.js');
            await Promise.all([document.fonts.load('700 70px "PT Serif"'), document.fonts.load('600 32px Manrope')]).catch(() => {});
        } catch (e) {
            document.getElementById('s3-laden').innerHTML = `<span>3D konnte nicht starten: ${G.esc(e.message || e)}</span>`;
            return;
        }
        if (!document.getElementById('stadt3d')) return;     // inzwischen weggeklickt
        baueStadt(buehne);
    };

    function baueStadt(buehne) {
        const st = G.stand.stadt3d = G.stand.stadt3d || {};
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        buehne.prepend(renderer.domElement);

        const szene = new THREE.Scene();
        szene.background = farbe('#bfe3f2');
        szene.fog = new THREE.Fog('#d7ecf4', 190, 720);
        const kamera = new THREE.PerspectiveCamera(60, 1, 0.5, 1500);

        szene.add(new THREE.HemisphereLight(0xffffff, 0x8aa070, 1.6));
        const sonne = new THREE.DirectionalLight(0xfff2d6, 2.2);
        sonne.castShadow = true;
        sonne.shadow.mapSize.set(2048, 2048);
        Object.assign(sonne.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300 });
        szene.add(sonne, sonne.target);

        const hindernisse = [], sterne = [];
        // Boden: Wiese nördlich und südlich der Moskwa, darauf Pflaster
        const wiese = mat(0x8fbf6a);
        [[-700, FLUSS.z[0]], [FLUSS.z[1], 800]].forEach(([z1, z2]) => {
            const b = new THREE.Mesh(new THREE.PlaneGeometry(1400, z2 - z1), wiese);
            b.rotation.x = -Math.PI / 2; b.position.set(0, 0, (z1 + z2) / 2); b.receiveShadow = true; szene.add(b);
        });
        const kopfstein = pflaster('#3b3c40', '#5d5e63'), granitPlatten = pflaster('#9b968c', '#b9b3a7', 64), gehweg = pflaster('#a49f95', '#c3bdb1', 48);
        function flaeche(x1, x2, z1, z2, textur, kachel, y) {
            const f = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat(0xffffff, { map: wiederholt(textur, (x2 - x1) / kachel, (z2 - z1) / kachel) }));
            f.rotation.x = -Math.PI / 2; f.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); f.receiveShadow = true; szene.add(f);
        }
        flaeche(-36, 38, -128, 160, kopfstein, 8, 0.04);        // Roter Platz und Wassiljewski-Hang
        flaeche(-160, 175, -235, -128, granitPlatten, 14, 0.03); // Manegeplatz
        flaeche(38, 175, -128, 160, gehweg, 12, 0.03);           // Kitai-Gorod und Warwarka
        flaeche(-250, -36, 146, 160, granitPlatten, 14, 0.03);   // Kremlufer
        flaeche(-160, 175, 200, 212, granitPlatten, 14, 0.03);   // Ufer gegenüber
        flaeche(20, 48, 212, 300, kopfstein, 8, 0.04);           // Große Ordynka
        flaeche(-14, 82, 262, 300, granitPlatten, 14, 0.03);     // Vorplatz der Universität

        // Moskwa mit Ufermauern, Brücke und Ausflugsboot
        const wasserTex = leinwand(128, 128, (g) => {
            g.fillStyle = '#3f7f9f'; g.fillRect(0, 0, 128, 128);
            g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2;
            for (let i = 0; i < 14; i++) { const x = (i * 37) % 128, y = (i * 53) % 128; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 4, x + 16, y); g.stroke(); }
        });
        wasserTex.wrapS = wasserTex.wrapT = THREE.RepeatWrapping; wasserTex.repeat.set(60, 2);
        const wasser = new THREE.Mesh(new THREE.PlaneGeometry(1400, FLUSS.z[1] - FLUSS.z[0]), mat(0xffffff, { map: wasserTex }));
        wasser.rotation.x = -Math.PI / 2; wasser.position.set(0, FLUSS.wasser, (FLUSS.z[0] + FLUSS.z[1]) / 2); szene.add(wasser);
        const granit = mat(0x8d8a86);
        FLUSS.z.forEach((z, i) => {
            szene.add(kiste(1400, 3, 1.2, granit, 0, -3, z + (i ? 0.6 : -0.6)));
            [[-700, FLUSS.bruecke[0] - 0.4], [FLUSS.bruecke[1] + 0.4, 700]].forEach(([a, b]) => szene.add(kiste(b - a, 1.1, 0.6, granit, (a + b) / 2, 0, z + (i ? 0.3 : -0.3))));
        });
        const bx = (FLUSS.bruecke[0] + FLUSS.bruecke[1]) / 2, bl = FLUSS.z[1] - FLUSS.z[0] + 6, bm = (FLUSS.z[0] + FLUSS.z[1]) / 2;
        szene.add(kiste(25, 0.8, bl, granit, bx, -0.76, bm));
        [FLUSS.bruecke[0] - 0.4, FLUSS.bruecke[1] + 0.4].forEach(x => szene.add(kiste(0.8, 1.2, bl - 2, granit, x, 0, bm)));
        [172, 188].forEach(z => szene.add(kiste(22, 1.9, 3, granit, bx, -2.7, z)));
        hindernisse.push({ x: (-700 + FLUSS.bruecke[0]) / 2, z: bm, w: 700 + FLUSS.bruecke[0], d: FLUSS.z[1] - FLUSS.z[0] });
        hindernisse.push({ x: (FLUSS.bruecke[1] + 700) / 2, z: bm, w: 700 - FLUSS.bruecke[1], d: FLUSS.z[1] - FLUSS.z[0] });
        const schiff = boot(); schiff.position.set(-300, FLUSS.wasser, 186); schiff.rotation.y = Math.PI / 2; szene.add(schiff);

        // Kreml, Basilius, GUM, Museum, Tor, Kasaner Kathedrale, Minin und Poscharski
        kreml(szene, hindernisse, sterne);
        const bas = basilius(); bas.position.set(14, 0, 122); szene.add(bas);
        hindernisse.push({ x: 14, z: 122, w: 32, d: 32 });
        const kaufhaus = gum(); kaufhaus.position.set(54, 0, -19); szene.add(kaufhaus);
        hindernisse.push({ x: 54, z: -19, w: 32, d: 162 }, { x: 37, z: -19, w: 4, d: 16 });
        const gumName = namensschild('ГУМ', 'Kaufhaus · Café, Supermarkt, Mode', '#3f6b4a', 17);
        gumName.position.set(34, 40, -19); szene.add(gumName);
        const mus = museum(); mus.position.set(-13, 0, -140); szene.add(mus);
        hindernisse.push({ x: -13, z: -140, w: 40, d: 26 });
        const ziegelTor = mat(0xa63a2c), gruen = mat(0x3f6b4a);
        [11, 21].forEach(x => { szene.add(kiste(4, 14, 4, ziegelTor, x, 0, -138), kegel(3, 9, 4, gruen, x, 14, -138), zwiebel(0.5, 1, gold(), x, 23, -138)); hindernisse.push({ x, z: -138, w: 4, d: 4 }); });
        szene.add(kiste(14, 4, 4, ziegelTor, 16, 10, -138));
        const kasan = kirchlein(0xc0473a, 0x3f6b4a); kasan.position.set(29, 0, -122); szene.add(kasan);
        hindernisse.push({ x: 29, z: -122, w: 10, d: 12 });
        [[95, 118, 0xf1ece2, 0xd9a93a], [132, 128, 0xe9c46a, 0x3f6b4a]].forEach(([x, z, w, k]) => {
            const c = kirchlein(w, k); c.position.set(x, 0, z); szene.add(c); hindernisse.push({ x, z, w: 10, d: 12 });
        });
        // Denkmal für Minin und Poscharski: Minin steht und weist zum Kreml, Poscharski sitzt mit Schild
        const bronze = mat(0x5b5236, { emissive: 0x111008 });
        szene.add(kiste(5.4, 0.6, 3.8, granit, 14, 0, 97), kiste(4.6, 3.4, 3, granit, 14, 0.6, 97), kiste(5, 0.4, 3.4, granit, 14, 4, 97));
        szene.add(kiste(2.4, 1.2, 0.1, bronze, 14, 1.8, 98.55));     // Relieftafel
        szene.add(zylinder(0.75, 3, 12, bronze, 13.1, 4.4, 97, 0.4), new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), bronze).translateX(13.1).translateY(7.8).translateZ(97));
        const arm = kiste(0.22, 1.7, 0.22, bronze, 0, 0, 0); arm.geometry.translate(0, -0.85, 0);
        arm.position.set(12.8, 7.2, 97); arm.rotation.z = -2.2; szene.add(arm);           // weist nach Westen zum Kreml
        szene.add(kiste(1.1, 0.8, 1, bronze, 15.2, 4.4, 97), zylinder(0.5, 1.6, 12, bronze, 15.2, 5.2, 97, 0.35));
        szene.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), bronze).translateX(15.2).translateY(7.1).translateZ(97));
        const schildchen = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), bronze); schildchen.position.set(15.9, 5.4, 97.5); schildchen.rotation.y = 0.6; szene.add(schildchen);
        hindernisse.push({ x: 14, z: 97, w: 5.4, d: 3.8 });

        // Altbauten am Rand: Kitai-Gorod, Manegeplatz, Samoskworetschje
        const PASTELL = ['#e9c46a', '#a8d5ba', '#e8b4a8', '#a9c4dd', '#efe2c4', '#d9a6c4', '#f2d0a4'];
        let n = 0;
        const altbauHin = (x, z, w, h, d) => { const a = altbau(w, h, d, PASTELL[n++ % PASTELL.length]); a.position.x = x; a.position.z = z; szene.add(a); hindernisse.push({ x, z, w, d }); };
        for (let z = -200; z <= 150; z += 30) altbauHin(178, z, 22, 14 + (n % 3) * 4, 26);
        for (let x = -150; x <= 170; x += 32) altbauHin(x, -224, 28, 16 + (n % 4) * 3, 20);
        [[-120, 225], [-86, 228], [-52, 222], [110, 226], [146, 222]].forEach(([x, z]) => altbauHin(x, z, 26, 12 + (n % 3) * 3, 18));

        // Namenstafeln an den historischen Gebäuden (antippen = vorlesen)
        const tafeln = [];
        function tafelAn(x, y, z, blick, ru, de, w = 4) {
            const t = leinwand(1024, 360, (c, cw, ch) => {
                const v = c.createLinearGradient(0, 0, 0, ch); v.addColorStop(0, '#3b342b'); v.addColorStop(1, '#251f19');
                c.fillStyle = v; c.fillRect(0, 0, cw, ch);
                c.strokeStyle = '#c9a24a'; c.lineWidth = 10; c.strokeRect(14, 14, cw - 28, ch - 28);
                c.lineWidth = 3; c.strokeRect(30, 30, cw - 60, ch - 60);
                c.fillStyle = '#e6c56c'; c.textAlign = 'center'; c.textBaseline = 'middle';
                c.font = '700 74px "PT Serif", Georgia, serif'; c.fillText(ru, cw / 2, 140, cw - 100);
                c.fillStyle = '#d8cdb4'; c.font = '600 42px Manrope, "Segoe UI", sans-serif'; c.fillText(de, cw / 2, 250, cw - 100);
            });
            const h = w * 360 / 1024, d = DREH[blick];
            const platte = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), [mat(0x8a6d2e), mat(0x8a6d2e), mat(0x8a6d2e), mat(0x8a6d2e), mat(0xffffff, { map: t, emissive: 0x1a1a1a }), mat(0x8a6d2e)]);
            platte.position.set(x + Math.sin(d) * 0.08, y, z + Math.cos(d) * 0.08); platte.rotation.y = d;
            platte.userData.tafel = { ru, de };
            szene.add(platte); tafeln.push(platte);
        }
        tafelAn(4, 3, 105.9, 'n', 'Храм Васи́лия Блаже́нного', 'Basilius-Kathedrale · 1555–1561', 5.4);
        tafelAn(14, 2.3, 95.5, 'n', 'Па́мятник Ми́нину и Пожа́рскому', 'Denkmal für Minin und Poscharski · 1818', 4.2);
        tafelAn(37.9, 3, -34, 'w', 'ГУМ – Гла́вный универса́льный магази́н', 'Kaufhaus GUM · 1893', 5.4);
        tafelAn(-30, 3.2, -127.95, 's', 'Госуда́рственный истори́ческий музе́й', 'Historisches Museum · eröffnet 1883', 5.4);
        tafelAn(21, 4, -135.95, 's', 'Воскресе́нские воро́та', 'Auferstehungstor · 1680, wiederaufgebaut 1995', 3.6);
        tafelAn(29, 3, -115.95, 's', 'Каза́нский собо́р', 'Kasaner Kathedrale · 1636, wiederaufgebaut 1993', 4.6);
        tafelAn(-31.5, 4, 92.4, 'o', 'Спа́сская ба́шня', 'Erlöserturm · 1491', 3.6);
        tafelAn(-35.95, 4, -86, 'o', 'Нико́льская ба́шня', 'Nikolausturm · 1491', 3.6);
        tafelAn(-35.95, 4, 40, 'o', 'Моско́вский Кремль', 'Moskauer Kreml · Mauer 1485–1495', 4.6);
        tafelAn(-17.95, 1.6, 1.5, 'o', 'Мавзоле́й Ле́нина', 'Lenin-Mausoleum · 1930', 3.4);
        tafelAn(95, 3, 111.95, 'n', 'Це́рковь Варва́ры', 'Kirche der hl. Barbara · 1804', 4.2);
        tafelAn(132, 3, 121.95, 'n', 'Це́рковь Макси́ма Блаже́нного', 'Kirche des hl. Maximus · 1699', 4.6);
        szene.add(kiste(1, 3.6, 1, granit, 20.6, 0, 156.2));
        tafelAn(20.6, 2.4, 155.7, 'n', 'Большо́й Москворе́цкий мост', 'Große Moskwa-Brücke · 1938', 3.4);
        hindernisse.push({ x: 20.6, z: 156.2, w: 1, d: 1 });
        if (G.module.some(m => m.id === 'vysotka')) {
            const u = PLAETZE.vysotka;
            tafelAn(u.x - 12, 3.4, u.z - 14.02, 'n', 'МГУ и́мени Ломоно́сова', 'Lomonossow-Universität · Hauptgebäude 1953', 5.4);
        }

        // Gebäude der Module; Bahnhof und Flughafen erreicht man mit der Metro
        const haeuser = [];
        function stelle(platz, bau, eintrag) {
            const t = DREH[platz.blick];
            bau.g.position.set(platz.x, 0, platz.z); bau.g.rotation.y = t; szene.add(bau.g);
            const [tx, tz] = drehe(0, bau.tiefe / 2 + 1.6, t);
            const tuer = { x: platz.x + tx, z: platz.z + tz };
            const quer = Math.abs(Math.sin(t)) > 0.5;
            hindernisse.push({ x: platz.x, z: platz.z, w: quer ? bau.tiefe : bau.breite, d: quer ? bau.breite : bau.tiefe });
            (bau.extra || []).forEach(e => {
                const [ex, ez] = drehe(e.x, e.z, t);
                hindernisse.push({ x: platz.x + ex, z: platz.z + ez, w: quer ? e.d : e.w, d: quer ? e.w : e.d });
            });
            const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.9, 40), new THREE.MeshBasicMaterial({ color: GELB, transparent: true, opacity: 0.8 }));
            ring.rotation.x = -Math.PI / 2; ring.position.set(tuer.x, 0.2, tuer.z); szene.add(ring);
            const name = namensschild(eintrag.titel.ru, eintrag.titel.de, eintrag.farbe, bau.schildBreite);
            const ort = bau.schildVorn ? tuer : platz;
            name.position.set(ort.x, bau.schildY ?? bau.hoehe + 6, ort.z); szene.add(name);
            if (bau.g.userData.stern) sterne.push(bau.g.userData.stern);
            haeuser.push({ ...eintrag, tuer, ring, platz, w: quer ? bau.tiefe : bau.breite, d: quer ? bau.breite : bau.tiefe, gruppe: bau.g, name });
        }
        let frei = 0;
        G.module.forEach(m => {
            if (METRO_ZIELE[m.id]) return;
            const platz = PLAETZE[m.id] || FREIE_PLAETZE[frei++];
            if (!platz) return;
            const bau = (BAUER[m.id] || (() => standardHaus(m)))(m);
            stelle(platz, bau, { m, titel: m.titel, farbe: m.farbe || '#c8553d' });
        });
        const metroZiele = G.module.filter(m => METRO_ZIELE[m.id]);
        if (metroZiele.length) stelle(METRO, metroEingang(), { metro: true, titel: { ru: 'метро́', de: 'Metro · Bahnhöfe & Flughafen' }, farbe: '#d52b1e' });
        stelle(MAUSOLEUM, mausoleum(), { lektion: true, titel: { ru: 'мавзоле́й Ле́нина', de: 'Lenin-Mausoleum · Geschichtsstunde' }, farbe: '#7a2620' });

        // Brunnen vor der Universität
        szene.add(kiste(30, 0.8, 10, granit, 34, 0, 281));
        const brunnen = new THREE.Mesh(new THREE.PlaneGeometry(28.4, 8.4), mat(0x6fb6d6, { emissive: 0x0a2a3a }));
        brunnen.rotation.x = -Math.PI / 2; brunnen.position.set(34, 0.7, 281); szene.add(brunnen);
        hindernisse.push({ x: 34, z: 281, w: 30, d: 10 });
        const fontaenen = [-10, -5, 0, 5, 10].map(dx => {
            const f = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 4, 8), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
            f.position.set(34 + dx, 2.7, 281); szene.add(f); return f;
        });

        // Bäume und Laternen
        const stamm = mat(0x7a4a2b), krone = mat(0x4f8f46), krone2 = mat(0x5f9a4e), lampe = mat(0x3a3f44), licht = mat(0xfff3c4, { emissive: 0x6b5a20 });
        const istFrei = (x, z, r = 3) => !hindernisse.some(h => Math.abs(x - h.x) < h.w / 2 + r && Math.abs(z - h.z) < h.d / 2 + r)
            && !haeuser.some(h => Math.hypot(x - h.tuer.x, z - h.tuer.z) < 7);
        let saat = 7;
        const zufall = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
        function baum(x, z, gr = 1, rund = false) {
            const b = new THREE.Group();
            b.add(kiste(0.5 * gr, 2.4 * gr, 0.5 * gr, stamm));
            const k = rund ? new THREE.Mesh(new THREE.SphereGeometry(2.2 * gr, 12, 10), krone) : new THREE.Mesh(new THREE.ConeGeometry(2.2 * gr, 5 * gr, 9), zufall() < 0.5 ? krone : krone2);
            k.position.y = (rund ? 3.8 : 4.4) * gr; k.castShadow = true; b.add(k);
            b.position.set(x, 0, z); szene.add(b);
        }
        // Wiesen und Gärten: Alexandergarten, Kremlinneres, Samoskworetschje, Sperlingsberge
        [[[-150, -45], [-205, -140], 26], [[-232, -48], [-124, 138], 34], [[75, 160], [-120, 55], 14], [[-150, 175], [212, 262], 30], [[-150, 175], [262, 352], 60]].forEach(([[x1, x2], [z1, z2], anzahl]) => {
            for (let i = 0, k = 0; i < anzahl * 8 && k < anzahl; i++) {
                const x = x1 + zufall() * (x2 - x1), z = z1 + zufall() * (z2 - z1);
                const imKreml = x < KREML.ost && z > KREML.nord && z < KREML.sued;
                if (!imKreml && !istFrei(x, z)) continue;
                if (imKreml && z > -124 && z < 140 && [[-80, -10, 32, 12], [-115, 60, 9, 9], [-90, 95, 15, 13], [-138, 92, 13, 12], [-78, 58, 10, 10], [-175, 118, 39, 15]]
                    .some(([bx, bz, hw, hd]) => Math.abs(x - bx) < hw && Math.abs(z - bz) < hd)) continue;
                if (z > 262 && z < 340 && x > -44 && x < 112) continue;      // Universität mit Vorplatz frei
                if (x > 18 && x < 50 && z > 200 && z < 300) continue;        // Ordynka frei
                k++; baum(x, z, 0.8 + zufall() * 0.7, zufall() < 0.4);
            }
        });
        for (let z = 214; z < 300; z += 12) [-14, 82].forEach(x => { if (istFrei(x, z, 1)) baum(x, z, 0.9, true); });     // Allee vor der Universität
        function laterne(x, z) {
            const l = new THREE.Group();
            l.add(kiste(0.2, 5.5, 0.2, lampe));
            const kugel = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), licht); kugel.position.y = 5.7; l.add(kugel);
            l.position.set(x, 0, z); szene.add(l);
        }
        for (let x = -150; x <= 170; x += 16) { if (x < 18 || x > 50) { laterne(x, 157); laterne(x, 203); } }
        for (let z = 162; z <= 198; z += 12) { laterne(FLUSS.bruecke[0] + 0.6, z); laterne(FLUSS.bruecke[1] - 0.6, z); }
        for (let x = -140; x <= 160; x += 28) if (istFrei(x, -168, 1)) laterne(x, -168);
        for (let z = 214; z <= 296; z += 14) { laterne(19, z); laterne(49, z); }

        // Wolken
        const wolken = [];
        for (let i = 0; i < 12; i++) {
            const w = new THREE.Group();
            for (let k = 0; k < 4; k++) {
                const s = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x888888 }));
                s.position.set(k * 5 - 8, Math.random() * 2, Math.random() * 4); w.add(s);
            }
            w.position.set(-300 + Math.random() * 600, 80 + Math.random() * 30, -250 + Math.random() * 650);
            szene.add(w); wolken.push(w);
        }

        // Passanten: gehen auf festen Wegen hin und her und warten, wenn man im Weg steht
        const WEGE = [[[-12, -112], [-12, 86]], [[8, -118], [24, 86]], [[30, -95], [-8, 66]], [[-30, 140], [62, 150]], [[-14, -200], [-14, -158]],
            [[-120, -185], [140, -185]], [[30, 150], [30, 245]], [[38, 152], [40, 290]], [[-20, 296], [90, 296]], [[-120, 152], [-40, 152]],
            [[90, -110], [90, 110]], [[60, 70], [150, 90]]];
        const HEMDEN = [0x2b5fa8, 0xe2b43c, 0x3f8f5f, 0x7c5ea8, 0xc8553d, 0x8a5a44, 0xf2f2f2, 0x1f4e47, 0xd9a6c4];
        const leute = [];
        WEGE.forEach(([a, b], i) => {
            for (let k = 0; k < 2; k++) {
                const f = figur(HEMDEN[(i * 2 + k) % HEMDEN.length], k ? 0x3a3f44 : 0x4a5568, (i + k) % 3 ? null : 0xb8392b);
                szene.add(f);
                leute.push({ f, a, b, t: (k * 0.5 + i * 0.13) % 1, richtung: k ? -1 : 1, tempo: 1.1 + ((i + k) % 4) * 0.25, lang: Math.hypot(b[0] - a[0], b[1] - a[1]) });
            }
        });

        // Spieler
        const ich = figur();
        szene.add(ich);
        const neu = st.welt !== 'moskva';     // Spielstand aus der alten Stadt: am Roten Platz beginnen
        const s = { x: neu ? START.x : st.x, z: neu ? START.z : st.z, dreh: neu ? START.dreh : st.dreh ?? 0, tempo: 0 };
        let kameraAbstand = 1, blickDreh = 0, blickHoch = 0, ziehenY = 0, zeit = 0, letzterOrt, letzteTuer = null, laufendId = 0, pause = false, aus = false;
        const tasten = new Set();

        // Kollision mit Häusern und Stadtrand
        function schiebeRaus(r) {
            s.x = Math.max(GRENZE.x[0], Math.min(GRENZE.x[1], s.x));
            s.z = Math.max(GRENZE.z[0], Math.min(GRENZE.z[1], s.z));
            hindernisse.forEach(h => {
                const dx = s.x - h.x, dz = s.z - h.z, px = h.w / 2 + r - Math.abs(dx), pz = h.d / 2 + r - Math.abs(dz);
                if (px > 0 && pz > 0) {
                    if (px < pz) s.x += Math.sign(dx || 1) * px; else s.z += Math.sign(dz || 1) * pz;
                    s.tempo *= 0.3;
                }
            });
        }
        const ortHier = () => ORTE.find(o => s.x >= o.x[0] && s.x <= o.x[1] && s.z >= o.z[0] && s.z <= o.z[1]) || null;

        // Karte unten rechts (Norden oben)
        const karte = document.getElementById('s3-karte'), kg = karte.getContext('2d');
        const KX0 = -160, KX1 = 180, KZ0 = -230, KZ1 = 355;
        const KX = (x) => (x - KX0) / (KX1 - KX0) * karte.width, KZ = (z) => (z - KZ0) / (KZ1 - KZ0) * karte.height;
        const rechteck = (x1, z1, x2, z2, c) => { kg.fillStyle = c; kg.fillRect(KX(x1), KZ(z1), KX(x2) - KX(x1), KZ(z2) - KZ(z1)); };
        function zeichneKarte() {
            kg.clearRect(0, 0, karte.width, karte.height);
            rechteck(KX0, KZ0, KX1, KZ1, 'rgba(143,191,106,.94)');
            rechteck(-36, -128, 38, 160, '#6d6e72');
            rechteck(-160, -235, 175, -128, '#b1aca2'); rechteck(38, -128, 175, 160, '#bdb7ab');
            rechteck(20, 212, 48, 300, '#6d6e72'); rechteck(-14, 262, 82, 300, '#b1aca2');
            rechteck(KX0, FLUSS.z[0], KX1, FLUSS.z[1], '#4f8fb3');
            rechteck(FLUSS.bruecke[0], FLUSS.z[0], FLUSS.bruecke[1], FLUSS.z[1], '#a39d92');
            rechteck(KREML.west, KREML.nord, KREML.ost, KREML.sued, '#d79a8f');
            kg.strokeStyle = '#a8382e'; kg.lineWidth = 2.5; kg.strokeRect(KX(KREML.west), KZ(KREML.nord), KX(KREML.ost) - KX(KREML.west), KZ(KREML.sued) - KZ(KREML.nord));
            rechteck(38, -100, 70, 62, '#e3cdb2');                     // GUM
            rechteck(-33, -153, 7, -127, '#a63a2c');                   // Museum
            kg.fillStyle = '#e8b830'; kg.beginPath(); kg.arc(KX(14), KZ(122), 4, 0, 7); kg.fill();
            kg.fillStyle = '#c8302a'; kg.beginPath(); kg.arc(KX(14), KZ(122), 2, 0, 7); kg.fill();
            haeuser.forEach(h => {
                if (h.metro) {
                    kg.fillStyle = '#d52b1e'; kg.beginPath(); kg.arc(KX(h.platz.x), KZ(h.platz.z), 6, 0, 7); kg.fill();
                    kg.fillStyle = '#fff'; kg.font = '900 9px Arial, sans-serif'; kg.textAlign = 'center'; kg.textBaseline = 'middle'; kg.fillText('М', KX(h.platz.x), KZ(h.platz.z) + 0.5);
                    return;
                }
                rechteck(h.platz.x - h.w / 2, h.platz.z - h.d / 2, h.platz.x + h.w / 2, h.platz.z + h.d / 2, h.farbe);
            });
            kg.save(); kg.translate(KX(s.x), KZ(s.z)); kg.rotate(-s.dreh + Math.PI);
            kg.fillStyle = '#fff'; kg.strokeStyle = '#c8302a'; kg.lineWidth = 2;
            kg.beginPath(); kg.moveTo(0, -8); kg.lineTo(5.5, 5.5); kg.lineTo(0, 2); kg.lineTo(-5.5, 5.5); kg.closePath(); kg.fill(); kg.stroke();
            kg.restore();
        }

        // ---------------- Eingaben ----------------
        const TASTEN = { KeyW: 'vor', ArrowUp: 'vor', KeyS: 'zurueck', ArrowDown: 'zurueck', KeyA: 'links', ArrowLeft: 'links', KeyD: 'rechts', ArrowRight: 'rechts', ShiftLeft: 'renn', ShiftRight: 'renn' };
        const imFeld = (e) => /^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName || '');
        function runter(e) {
            if (imFeld(e) || pause) return;
            if (TASTEN[e.code]) { tasten.add(TASTEN[e.code]); e.preventDefault(); }
            if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyE') { e.preventDefault(); eintreten(); }
        }
        function hoch(e) { if (TASTEN[e.code]) tasten.delete(TASTEN[e.code]); }
        addEventListener('keydown', runter); addEventListener('keyup', hoch);
        const loslassen = () => tasten.clear();
        addEventListener('blur', loslassen);

        // Ziehen = umschauen; kurzer Klick ohne Ziehen = auf ein Haus zeigen
        let ziehen = null, klickStart = null;
        const strahl = new THREE.Raycaster(), zeiger = new THREE.Vector2();
        const zielObjekte = () => haeuser.flatMap(h => [h.gruppe, h.ring, h.name]);
        function treffer(e) {
            const r = renderer.domElement.getBoundingClientRect();
            zeiger.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            strahl.setFromCamera(zeiger, kamera);
            const t = strahl.intersectObjects(zielObjekte(), true)[0];
            if (!t) return null;
            return haeuser.find(x => { let o = t.object; while (o) { if (o === x.gruppe || o === x.ring || o === x.name) return true; o = o.parent; } return false; });
        }
        renderer.domElement.addEventListener('pointerdown', (e) => {
            ziehen = e.clientX; ziehenY = e.clientY; klickStart = { x: e.clientX, y: e.clientY };
            renderer.domElement.setPointerCapture(e.pointerId);
        });
        renderer.domElement.addEventListener('pointermove', (e) => {
            if (ziehen !== null) {
                // seitwärts ziehen = umschauen, nach unten ziehen = an Türmen und Kuppeln hochschauen
                blickDreh -= (e.clientX - ziehen) * 0.006; ziehen = e.clientX;
                blickHoch = Math.max(-3, Math.min(40, blickHoch + (e.clientY - ziehenY) * 0.12)); ziehenY = e.clientY;
                return;
            }
            renderer.domElement.classList.toggle('ueber-haus', !!treffer(e) || !!tafelTreffer());
        });
        // Tafel unter dem Zeiger (der Strahl ist durch treffer() schon gesetzt)
        function tafelTreffer() {
            const t = strahl.intersectObjects(tafeln, false)[0];
            return t && t.distance < 60 ? t.object.userData.tafel : null;
        }
        renderer.domElement.addEventListener('pointerup', (e) => {
            ziehen = null;
            if (pause || !klickStart || Math.hypot(e.clientX - klickStart.x, e.clientY - klickStart.y) > 6) return;
            const h = treffer(e);
            // nur wenn die Tafel vorn liegt, nicht hinter einem anderen Gebäude
            const vorn = tafelTreffer() && strahl.intersectObjects(szene.children, true).find(x => x.object.visible && !x.object.isSprite);
            const tafel = vorn && vorn.object.userData.tafel;
            if (tafel) { Stimmen.sage(tafel.ru); G.toast(`${tafel.ru.replace(/́/g, '')} – ${tafel.de}`); return; }
            if (h) eintreten(h);
        });
        renderer.domElement.addEventListener('wheel', (e) => { kameraAbstand = Math.max(0.5, Math.min(2.2, kameraAbstand + e.deltaY * 0.001)); e.preventDefault(); }, { passive: false });
        buehne.querySelectorAll('.s3-steuer button').forEach(b => {
            const an = (e) => { e.preventDefault(); tasten.add(b.dataset.taste); };
            const ab = () => tasten.delete(b.dataset.taste);
            b.addEventListener('pointerdown', an); b.addEventListener('pointerup', ab); b.addEventListener('pointerleave', ab); b.addEventListener('pointercancel', ab);
        });
        // Knöpfe geben den Tastaturfokus sofort zurück – sonst löst Enter den Knopf aus statt die Tür
        const hilfe = document.getElementById('s3-hilfe');
        document.getElementById('s3-hilfe-knopf').addEventListener('click', (e) => { hilfe.classList.toggle('zu'); e.currentTarget.blur(); });
        setTimeout(() => hilfe.classList.add('zu'), 9000);

        function naechsteTuer() {
            let best = null, bd = 7;
            haeuser.forEach(h => { const d = Math.hypot(h.tuer.x - s.x, h.tuer.z - s.z); if (d < bd) { bd = d; best = h; } });
            return best;
        }
        let tritt = false;
        function eintreten(h = naechsteTuer()) {
            if (!h) { G.toast('Hier ist keine Tür. Geh zu einem goldenen Ring – oder klick auf ein Haus.'); return; }
            if (tritt || pause) return;
            if (h.metro) { metroOeffnen(); return; }
            if (h.lektion) { lektionOeffnen(); return; }
            tritt = true;
            speichern();
            buehne.classList.add('blende');
            setTimeout(() => G.oeffneModul(h.m.id), 450);
        }
        const tuerBox = document.getElementById('s3-tuer');
        tuerBox.addEventListener('click', () => eintreten());

        function speichern() {
            Object.assign(st, { welt: 'moskva', x: +s.x.toFixed(1), z: +s.z.toFixed(1), dreh: +s.dreh.toFixed(2) });
            delete st.auto;
            G.speichern();
        }

        // ---------------- Metro ----------------
        const metroBox = document.getElementById('s3-metro');
        const ohneBetonung = (t) => t.replace(/́/g, '');
        function linienBild(z) {
            return z.linien.map((l, i) => `${i ? '<span class="metro-um">переса́дка</span>' : ''}<span class="metro-chip" style="--linie:${l.farbe}">${l.nr}</span>`).join('');
        }
        function metroOeffnen() {
            pause = true; tasten.clear(); speichern();
            Stimmen.sage('Я иду́ в метро́.');
            G.toast('Я иду в метро. – Ich gehe in die Metro.');
            metroBox.hidden = false;
            metroBox.innerHTML = `
              <div class="metro-tafel">
                <div class="metro-kopf"><span class="metro-m">М</span>
                  <div><span class="ru">Ста́нция «Охо́тный Ряд»</span><span class="de">Metro am Roten Platz, mit Übergang zur Station «Пло́щадь Револю́ции» – wohin fährst du?</span></div></div>
                <div class="metro-ziele">${metroZiele.map(m => {
                    const z = METRO_ZIELE[m.id];
                    const anzahl = new Set(z.linien.flatMap(l => l.stationen).filter(x => x !== '…')).size - 1;
                    return `<button class="metro-ziel" data-ziel="${m.id}">
                      <span class="metro-icon">${z.icon}</span>
                      <span class="metro-text"><span class="ru">${z.ru}</span><span class="zusatz">${z.zusatz}</span><span class="de">${z.de} · ${anzahl} Stationen</span></span>
                      <span class="metro-linien">${linienBild(z)}</span></button>`;
                }).join('')}</div>
                <button class="knopf-zweit metro-hoch" id="metro-hoch">⬆ Zurück auf den Roten Platz</button>
              </div>`;
            metroBox.querySelectorAll('.metro-ziel').forEach(b => b.addEventListener('click', () => metroFahrt(b.dataset.ziel)));
            document.getElementById('metro-hoch').addEventListener('click', metroSchliessen);
        }
        function metroSchliessen() {
            metroBox.hidden = true; metroBox.innerHTML = ''; pause = false;
            Stimmen.sage('Вы на Кра́сной пло́щади.');
        }
        async function metroFahrt(id) {
            const z = METRO_ZIELE[id];
            // Halte der Fahrt; beim Umsteigen bekommt der letzte Halt der alten Linie die neue Farbe
            const halte = [];
            z.linien.forEach((l, i) => l.stationen.forEach((name, k) => {
                if (i && !k) { halte[halte.length - 1].umsteigen = l.farbe; return; }
                halte.push({ ru: name, farbe: l.farbe });
            }));
            const n = halte.length;
            metroBox.innerHTML = `
              <div class="metro-fahrt">
                <div class="metro-tunnel halt" id="metro-tunnel">
                  <div class="metro-wand"><span class="metro-schild" id="metro-schild"></span></div>
                  <svg class="metro-zug" viewBox="0 0 800 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                    ${[-30, 410].map(x => `<g transform="translate(${x} 0)">
                      <rect x="0" y="14" width="420" height="96" rx="14" fill="#2f5d9e"/>
                      <rect x="0" y="80" width="420" height="10" fill="#f2f2f2"/>
                      ${[30, 120, 210, 300].map(w => `<rect x="${w}" y="30" width="56" height="34" rx="5" fill="#ffe9b3"/>`).join('')}
                      ${[94, 184, 274, 364].map(t => `<rect x="${t}" y="26" width="20" height="78" rx="3" fill="#24497d"/>`).join('')}
                      ${[40, 90, 330, 380].map(r => `<circle cx="${r}" cy="114" r="9" fill="#222"/>`).join('')}</g>`).join('')}
                  </svg>
                  <span class="metro-umsteigen" id="metro-umsteigen" hidden>🚶 переса́дка</span>
                </div>
                <div class="metro-ansage"><span class="ru" id="metro-ru"></span><span class="de" id="metro-de"></span></div>
                <div class="gram-box" id="metro-gram" hidden></div>
                <div class="metro-linie">
                  ${halte.slice(1).map((h, i) => `<span class="metro-strecke" style="left:${i / (n - 1) * 100}%;width:${100 / (n - 1)}%;--linie:${h.farbe}"></span>`).join('')}
                  ${halte.map((h, i) => `<span class="metro-halt${h.ru === '…' ? ' durch' : ''}${i % 2 ? ' unten' : ''}${!i ? ' erste' : ''}${i === n - 1 ? ' letzte' : ''}${!i || i === n - 1 || h.umsteigen ? ' wichtig' : ''}" style="left:${i / (n - 1) * 100}%;--linie:${h.umsteigen || h.farbe}">${h.ru === '…' ? '' : `<span>${h.ru}</span>`}</span>`).join('')}
                  <span class="metro-wagen" id="metro-wagen" style="left:0%">🚇</span>
                </div>
                <button class="knopf-zweit" id="metro-schnell">⏩ Schneller ankommen</button>
              </div>`;
            const tunnel = document.getElementById('metro-tunnel'), schild = document.getElementById('metro-schild');
            const wagen = document.getElementById('metro-wagen'), umsteigen = document.getElementById('metro-umsteigen');
            let schnell = false;
            document.getElementById('metro-schnell').addEventListener('click', () => { schnell = true; Stimmen.stop(); wagen.style.transition = 'none'; });
            const vorbei = () => aus || !metroBox.isConnected;
            const warte = (ms) => G.pause(schnell ? 0 : ms);
            const sprich = (ru, de, max = 6000) => {
                G.satz(document.getElementById('metro-ru'), ru, { box: document.getElementById('metro-gram') });
                document.getElementById('metro-de').textContent = de;
                return schnell ? Promise.resolve() : Promise.race([Stimmen.sage(ru), G.pause(max)]);
            };
            const naechste = (i) => halte.slice(i + 1).find(h => h.ru !== '…');

            schild.textContent = halte[0].ru;
            let ansage = sprich(`Осторо́жно, две́ри закрыва́ются! Сле́дующая ста́нция — «${naechste(0).ru}».`,
                `Vorsicht, die Türen schließen! Nächste Station: ${ohneBetonung(naechste(0).ru)}.`);
            await Promise.all([ansage, warte(900)]);
            for (let i = 0; i < n - 1; i++) {
                if (vorbei()) return;
                const ziel = halte[i + 1], durch = ziel.ru === '…', dauer = durch ? 900 : 2000;
                tunnel.classList.remove('halt'); tunnel.classList.add('faehrt');
                if (!schnell) wagen.style.transition = `left ${dauer}ms ease-in-out`;
                wagen.style.left = `${(i + 1) / (n - 1) * 100}%`;
                await Promise.all([ansage, warte(dauer)]);
                if (durch) { ansage = Promise.resolve(); continue; }
                if (vorbei()) return;
                tunnel.classList.remove('faehrt'); tunnel.classList.add('halt');
                schild.textContent = ziel.ru;
                const letzte = i + 1 === n - 1;
                if (letzte) {
                    await Promise.all([sprich(`Ста́нция «${ziel.ru}». ${z.ankunft}`, `Station ${ohneBetonung(ziel.ru)}. ${z.ankunftDe}`), warte(1500)]);
                    break;
                }
                if (ziel.umsteigen) {
                    umsteigen.hidden = false;
                    await Promise.all([sprich(`Ста́нция «${ziel.ru}». Переса́дка на жёлтую ли́нию.`, `Station ${ohneBetonung(ziel.ru)}. Umsteigen in die gelbe Linie.`), warte(2200)]);
                    umsteigen.hidden = true;
                } else {
                    await Promise.all([sprich(`Ста́нция «${ziel.ru}».`, `Station ${ohneBetonung(ziel.ru)}.`), warte(1100)]);
                }
                if (vorbei()) return;
                const weiter = naechste(i + 1);
                ansage = sprich(`Осторо́жно, две́ри закрыва́ются! Сле́дующая ста́нция — «${weiter.ru}».`,
                    `Vorsicht, die Türen schließen! Nächste Station: ${ohneBetonung(weiter.ru)}.`);
                await warte(700);
            }
            if (vorbei()) return;
            buehne.classList.add('blende');
            await G.pause(450);
            if (vorbei()) return;
            G.oeffneModul(id, z.satz, z.satzDe);
        }

        // ---------------- Geschichtsstunde am Mausoleum ----------------
        // Zeitleiste mit je einem einfachen Satz (antippbare Grammatik, vorgelesen), danach ein kurzes Quiz.
        // In GESCHICHTE.quiz steht die richtige Antwort jeweils zuerst; angezeigt wird gemischt.
        const lektionBox = document.getElementById('s3-lektion');
        const KARTEN = GESCHICHTE.karten, QUIZ = GESCHICHTE.quiz;
        const lektionKopf = (de) => `
            <div class="metro-kopf"><span class="lektion-symbol">📜</span>
              <div><span class="ru">Уро́к исто́рии</span><span class="de">${de}</span></div>
              <button class="s3-knopf lektion-zu" title="Zurück auf den Roten Platz">✕</button></div>`;
        function lektionSchliessen() {
            Stimmen.stop();
            lektionBox.hidden = true; lektionBox.innerHTML = ''; pause = false;
        }
        function lektionOeffnen() {
            pause = true; tasten.clear(); speichern();
            lektionBox.hidden = false;
            lektionKarte(0);
        }
        function lektionKarte(i) {
            const k = KARTEN[i];
            lektionBox.innerHTML = `
              <div class="metro-tafel lektion">
                ${lektionKopf(`Geschichtsstunde am Lenin-Mausoleum · ${i + 1} von ${KARTEN.length}`)}
                <div class="lektion-zeit">${KARTEN.map((x, j) => `<button class="${j === i ? 'an' : j < i ? 'war' : ''}" data-j="${j}">${x.jahr}</button>`).join('')}</div>
                <div class="lektion-karte">
                  <div class="lektion-jahr">${k.jahr === 'Name' ? 'Кра́сная пло́щадь' : k.jahr === 'Heute' ? 'Сего́дня' : k.jahr}</div>
                  <div class="lektion-satz"><span class="ru"></span><button class="hilfe-knopf" title="Nochmal hören">🔊</button></div>
                  <div class="lektion-de">${k.de}</div>
                  <p class="lektion-info">${k.info}</p>
                </div>
                <div class="lektion-knoepfe">
                  <button class="knopf-zweit" data-geh="${i - 1}" ${i ? '' : 'disabled'}>← Zurück</button>
                  <button class="knopf-haupt" data-geh="${i + 1}">${i < KARTEN.length - 1 ? 'Weiter' : 'Zum Quiz'} <span>→</span></button>
                </div>
              </div>`;
            const satz = lektionBox.querySelector('.lektion-satz');
            G.satz(satz.querySelector('.ru'), k.ru, { anker: satz });
            satz.querySelector('.hilfe-knopf').addEventListener('click', () => Stimmen.sage(k.ru));
            lektionBox.querySelector('.lektion-zu').addEventListener('click', lektionSchliessen);
            lektionBox.querySelectorAll('.lektion-zeit button').forEach(b => b.addEventListener('click', () => lektionKarte(+b.dataset.j)));
            lektionBox.querySelectorAll('[data-geh]').forEach(b => b.addEventListener('click', () => {
                const j = +b.dataset.geh;
                if (j >= KARTEN.length) lektionQuiz(0, 0); else lektionKarte(j);
            }));
            Stimmen.sage(k.ru);
        }
        function lektionQuiz(q, punkte) {
            const f = QUIZ[q], richtig = f.optionen[0];
            let erster = true;
            lektionBox.innerHTML = `
              <div class="metro-tafel lektion">
                ${lektionKopf(`Quiz · Frage ${q + 1} von ${QUIZ.length}`)}
                <div class="lektion-karte">
                  <div class="lektion-satz"><span class="ru"></span><button class="hilfe-knopf" title="Nochmal hören">🔊</button></div>
                  <div class="lektion-de">${f.de}</div>
                  <div class="lektion-optionen">${G.mischen([...f.optionen]).map(o => `<button class="lektion-option" data-o="${G.esc(o)}">${G.esc(o)}</button>`).join('')}</div>
                  <div class="lektion-rueck" hidden></div>
                </div>
                <div class="lektion-knoepfe"><span></span><button class="knopf-haupt" id="lektion-weiter" hidden>${q < QUIZ.length - 1 ? 'Nächste Frage' : 'Ergebnis'} <span>→</span></button></div>
              </div>`;
            const satz = lektionBox.querySelector('.lektion-satz');
            G.satz(satz.querySelector('.ru'), f.ru, { anker: satz });
            satz.querySelector('.hilfe-knopf').addEventListener('click', () => Stimmen.sage(f.ru));
            lektionBox.querySelector('.lektion-zu').addEventListener('click', lektionSchliessen);
            const rueck = lektionBox.querySelector('.lektion-rueck'), weiter = document.getElementById('lektion-weiter');
            lektionBox.querySelectorAll('.lektion-option').forEach(b => b.addEventListener('click', () => {
                if (b.disabled) return;
                if (b.dataset.o === richtig) {
                    if (erster) punkte++;
                    b.classList.add('gut');
                    lektionBox.querySelectorAll('.lektion-option').forEach(x => { x.disabled = true; });
                    rueck.hidden = false; rueck.className = 'lektion-rueck gut';
                    rueck.textContent = `✓ Richtig!${f.erkl ? ' ' + f.erkl : ''}`;
                    Stimmen.sage(`Пра́вильно! ${richtig}.`);
                    weiter.hidden = false; weiter.focus();
                } else {
                    erster = false;
                    b.classList.add('falsch'); b.disabled = true;
                    rueck.hidden = false; rueck.className = 'lektion-rueck falsch';
                    rueck.textContent = 'Nicht ganz – schau noch einmal in die Zeitleiste oben, dann versuch es nochmal.';
                }
            }));
            weiter.addEventListener('click', () => (q < QUIZ.length - 1 ? lektionQuiz(q + 1, punkte) : lektionEnde(punkte)));
            Stimmen.sage(f.ru);
        }
        function lektionEnde(punkte) {
            const n = QUIZ.length, sterne = punkte === n ? 3 : punkte >= n - 1 ? 2 : 1;
            const alt = st.geschichte || {};
            st.geschichte = { beste: Math.max(alt.beste || 0, punkte), von: n };
            speichern();
            const lob = sterne === 3 ? 'Отли́чно!' : sterne === 2 ? 'Хорошо́!' : 'Непло́хо!';
            lektionBox.innerHTML = `
              <div class="metro-tafel lektion">
                ${lektionKopf('Geschichtsstunde geschafft')}
                <div class="lektion-karte lektion-ende">
                  <div class="sterne">${G.sterne(sterne)}</div>
                  <div class="lektion-jahr">${lob}</div>
                  <div class="lektion-de">${punkte} von ${n} Fragen beim ersten Versuch richtig${st.geschichte.beste > punkte ? ` · Bestes Ergebnis: ${st.geschichte.beste} von ${n}` : ''}.</div>
                </div>
                <div class="lektion-knoepfe">
                  <button class="knopf-zweit" id="lektion-nochmal">↻ Nochmal lesen</button>
                  <button class="knopf-haupt" id="lektion-platz">Zurück auf den Platz <span>→</span></button>
                </div>
              </div>`;
            Stimmen.sage(lob);
            lektionBox.querySelector('.lektion-zu').addEventListener('click', lektionSchliessen);
            document.getElementById('lektion-nochmal').addEventListener('click', () => lektionKarte(0));
            document.getElementById('lektion-platz').addEventListener('click', lektionSchliessen);
        }

        // ---------------- Bild für Bild ----------------
        function groesse() {
            const r = buehne.getBoundingClientRect();
            renderer.setSize(r.width, r.height, false);
            kamera.aspect = r.width / Math.max(1, r.height); kamera.updateProjectionMatrix();
        }
        addEventListener('resize', groesse); groesse();
        const uhr = new THREE.Clock();
        const kamPos = new THREE.Vector3(), blickZiel = new THREE.Vector3();
        let ersterFrame = true, druck = 0;

        function schritt() {
            laufendId = requestAnimationFrame(schritt);
            const dt = Math.min(uhr.getDelta(), 0.05);
            zeit += dt;

            // Bewegung (zu Fuß; Shift = rennen)
            const vor = pause ? 0 : tasten.has('vor') ? 1 : tasten.has('zurueck') ? -1 : 0;
            const drehen = pause ? 0 : (tasten.has('links') ? 1 : 0) - (tasten.has('rechts') ? 1 : 0);
            s.tempo = vor * (tasten.has('renn') ? 14 : 6.5);
            s.dreh += drehen * dt * 2.6;
            s.x += Math.sin(s.dreh) * s.tempo * dt;
            s.z += Math.cos(s.dreh) * s.tempo * dt;
            schiebeRaus(0.6);
            ich.position.set(s.x, 0, s.z); ich.rotation.y = s.dreh;
            const schwung = s.tempo ? Math.sin(zeit * (Math.abs(s.tempo) > 7 ? 16 : 10)) * 0.5 : 0;
            ich.userData.beine[0].rotation.x = schwung; ich.userData.beine[1].rotation.x = -schwung;
            ich.position.y = s.tempo ? Math.abs(Math.sin(zeit * 10)) * 0.08 : 0;
            if (s.tempo) blickDreh *= 0.96;     // beim Gehen dreht die Kamera langsam hinter die Figur zurück

            // In die Tür hineinlaufen: auf dem Ring stehen und weiter aufs Haus zugehen
            const nah = vor > 0 && naechsteTuer();
            if (nah && Math.hypot(nah.tuer.x - s.x, nah.tuer.z - s.z) < 2.6) {
                const zumHaus = Math.sin(s.dreh) * (nah.platz.x - nah.tuer.x) + Math.cos(s.dreh) * (nah.platz.z - nah.tuer.z);
                druck = zumHaus > 0 ? druck + dt : 0;
                if (druck > 0.3) { druck = 0; eintreten(nah); }
            } else druck = 0;

            // Kamera hinter der Figur, Blick etwas nach oben – so sieht man Türme und Schilder
            const abstand = 11 * kameraAbstand, hoehe = 6.5 * Math.max(0.8, kameraAbstand);
            const k = s.dreh + Math.PI + blickDreh;
            kamPos.set(s.x + Math.sin(k) * abstand, hoehe, s.z + Math.cos(k) * abstand);
            if (ersterFrame) { kamera.position.copy(kamPos); ersterFrame = false; } else kamera.position.lerp(kamPos, 1 - Math.pow(0.002, dt));
            if (s.tempo) blickHoch *= 0.97;     // beim Gehen senkt sich der Blick langsam wieder
            blickZiel.set(s.x + Math.sin(s.dreh) * 8, 5 + blickHoch, s.z + Math.cos(s.dreh) * 8);
            kamera.lookAt(blickZiel);
            sonne.position.set(s.x + 40, 80, s.z + 30); sonne.target.position.set(s.x, 0, s.z);

            // Passanten
            leute.forEach(p => {
                const x = p.a[0] + (p.b[0] - p.a[0]) * p.t, z = p.a[1] + (p.b[1] - p.a[1]) * p.t;
                const wartet = Math.hypot(x - s.x, z - s.z) < 1.8;
                if (!wartet) p.t += p.richtung * p.tempo * dt / p.lang;
                if (p.t > 1) { p.t = 1; p.richtung = -1; }
                if (p.t < 0) { p.t = 0; p.richtung = 1; }
                p.f.position.set(x, wartet ? 0 : Math.abs(Math.sin(zeit * 8 + p.lang)) * 0.06, z);
                p.f.rotation.y = Math.atan2((p.b[0] - p.a[0]) * p.richtung, (p.b[1] - p.a[1]) * p.richtung);
                const sw = wartet ? 0 : Math.sin(zeit * 8 + p.lang) * 0.45;
                p.f.userData.beine[0].rotation.x = sw; p.f.userData.beine[1].rotation.x = -sw;
            });
            // Sterne drehen sich langsam im Wind, Boot fährt, Wasser fließt, Brunnen sprudelt
            sterne.forEach((t, i) => { t.rotation.y = Math.sin(zeit * 0.3 + i) * 0.6; });
            schiff.position.x += dt * 6; if (schiff.position.x > 320) schiff.position.x = -320;
            wasserTex.offset.x = (wasserTex.offset.x + dt * 0.02) % 1;
            fontaenen.forEach((f, i) => { f.scale.y = 0.75 + Math.abs(Math.sin(zeit * 2 + i)) * 0.5; });
            wolken.forEach(c => { c.position.x += dt * 1.5; if (c.position.x > 340) c.position.x = -340; });
            haeuser.forEach(h => { h.ring.material.opacity = 0.55 + Math.sin(zeit * 4) * 0.3; h.ring.scale.setScalar(1 + Math.sin(zeit * 4) * 0.06); });

            // Anzeige: Ort und Tür
            const ort = ortHier();
            if (ort !== letzterOrt) {
                letzterOrt = ort;
                const box = document.getElementById('s3-ort');
                box.querySelector('.ru').textContent = ort ? `Вы ${ort.wo}` : 'Вы гуля́ете по Москве́';
                box.querySelector('.de').textContent = ort ? `Sie sind ${ort.de}` : 'Sie spazieren durch Moskau';
                box.classList.remove('neu'); void box.offsetWidth; box.classList.add('neu');
                if (!pause) Stimmen.sage(ort ? `Вы ${ort.wo}.` : 'Вы гуля́ете по Москве́.');
            }
            const tuer = pause ? null : naechsteTuer();
            if (tuer !== letzteTuer) {
                letzteTuer = tuer;
                tuerBox.hidden = !tuer;
                if (tuer) {
                    tuerBox.innerHTML = `<span class="ru">${G.esc(tuer.titel.ru)}</span><span class="de">${G.esc(tuer.titel.de)}</span><span class="los">${tuer.metro ? '⏎ Hinunter zur Metro' : tuer.lektion ? '⏎ Geschichtsstunde' : '⏎ Hineingehen'}</span>`;
                    Stimmen.sage(`Э́то ${tuer.titel.ru}.`);
                }
            }
            zeichneKarte();
            renderer.render(szene, kamera);
        }
        document.getElementById('s3-laden').remove();
        schritt();

        const speicherTakt = setInterval(() => { if (!pause) speichern(); }, 5000);
        beenden = () => {
            aus = true;
            cancelAnimationFrame(laufendId);
            clearInterval(speicherTakt);
            if (!pause) speichern();
            removeEventListener('keydown', runter); removeEventListener('keyup', hoch);
            removeEventListener('blur', loslassen); removeEventListener('resize', groesse);
            szene.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                [].concat(o.material || []).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
            });
            renderer.dispose();
            renderer.domElement.remove();
            beenden = null;
        };
    }

    G.beende3D = () => { if (beenden) beenden(); };
})();
