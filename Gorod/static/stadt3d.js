// Город in 3D: eine begehbare Stadt (three.js, lokal unter /static/vendor/).
// Man geht zu Fuß oder fährt Auto zwischen den Gebäuden. Hinein geht es auf drei Wegen:
// aufs Haus (oder sein Schild, seinen goldenen Ring) klicken, in die Tür hineinlaufen
// oder vor der Tür Enter drücken. Oben steht, auf welcher Straße man ist
// („Вы на проспе́кте Ми́ра“ – Präpositiv mit на), unten rechts eine kleine Karte.
// Gebäude, die hier nicht eigens gestaltet sind, bekommen ein einfaches Haus in ihrer Farbe.

(function () {
    const G = Gorod;
    let THREE = null;
    let beenden = null;

    // ---------------- Stadtplan ----------------
    // Prospekt entlang x (z = 0), Querstraßen entlang z bei x = pos
    const STRASSEN = [
        { achse: 'x', pos: 0, breite: 14, von: -260, bis: 260, ru: 'проспе́кт Ми́ра', wo: 'на проспе́кте Ми́ра', de: 'auf dem Friedensprospekt' },
        { achse: 'z', pos: -75, breite: 10, von: -95, bis: 95, ru: 'у́лица Пу́шкина', wo: 'на у́лице Пу́шкина', de: 'in der Puschkinstraße' },
        { achse: 'z', pos: 5, breite: 10, von: -95, bis: 95, ru: 'Садо́вая у́лица', wo: 'на Садо́вой у́лице', de: 'in der Gartenstraße' },
        { achse: 'z', pos: 85, breite: 10, von: -95, bis: 95, ru: 'у́лица Толсто́го', wo: 'на у́лице Толсто́го', de: 'in der Tolstoistraße' },
    ];
    // Bauplätze: n = Nordseite (Tür nach +z), s = Südseite (Tür nach −z)
    const PLAETZE = {
        cafe: { x: -110, z: -22, seite: 'n' }, dom: { x: -38, z: -28, seite: 'n' },
        vysotka: { x: 42, z: -26, seite: 'n' }, shkola: { x: 128, z: -30, seite: 'n' },
        vokzal: { x: -118, z: 30, seite: 's' }, supermarket: { x: -36, z: 26, seite: 's' },
        aeroport: { x: 135, z: 40, seite: 's' },
    };
    const FREIE_PLAETZE = [{ x: 42, z: 24, seite: 's' }, { x: -160, z: -24, seite: 'n' }, { x: 190, z: -26, seite: 'n' }, { x: -175, z: 30, seite: 's' }];
    const GRENZE = { x: 255, z: 140 };
    const GELB = 0xffb300;

    // ---------------- Hilfen für Grafik ----------------
    const farbe = (c) => new THREE.Color(c);
    function mat(c, extra) { return new THREE.MeshLambertMaterial({ color: c, ...extra }); }
    function kiste(w, h, d, material, x = 0, y = 0, z = 0) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        m.position.set(x, y + h / 2, z);
        m.castShadow = true; m.receiveShadow = true;
        return m;
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
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(0xffffff, { map: schildTextur(text, hinter, vorder) }));
        return m;
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
    function namensschild(ru, de, c) {
        const t = leinwand(512, 170, (g, w, h) => {
            g.fillStyle = c; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 28); g.fill();
            g.lineWidth = 6; g.strokeStyle = '#fbf7ef'; g.stroke();
            g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.font = '700 70px "PT Serif", Georgia, serif'; g.fillText(ru, w / 2, 70, w - 40);
            g.font = '600 32px Manrope, "Segoe UI", sans-serif'; g.globalAlpha = 0.85; g.fillText(de, w / 2, 128, w - 40);
        });
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
        sp.scale.set(15, 5, 1);
        return sp;
    }

    // ---------------- Gebäude ----------------
    // Jeder Bauer liefert eine Gruppe mit der Tür bei (0, 0, tiefe/2) und die Maße
    const BAUER = {
        cafe() {
            const g = new THREE.Group();
            g.add(wandKiste(20, 9, 14, fassade(5, 2, '#f3dcbc', '#9fcde3', true), fassade(4, 2, '#f3dcbc'), '#b8392b'));
            for (let i = 0; i < 6; i++) {   // gestreifte Markise
                const streifen = kiste(20 / 6, 0.3, 3, mat(i % 2 ? 0xfbf7ef : 0x1f4e47), -10 + 20 / 12 + i * 20 / 6, 4.3, 8);
                streifen.rotation.x = 0.35; g.add(streifen);
            }
            const s = schild('КАФЕ', 8, 1.8, '#1f4e47', '#e8c879'); s.position.set(0, 7.6, 7.02); g.add(s);
            g.add(kiste(1.5, 0.9, 1.5, mat(0x5e3920), 7, 0, 10), kiste(1.5, 0.9, 1.5, mat(0x5e3920), -7, 0, 10));   // Tische draußen
            return { g, breite: 20, tiefe: 14, hoehe: 9 };
        },
        dom() {
            const g = new THREE.Group();
            g.add(wandKiste(22, 12, 16, fassade(5, 3, '#efe4cf', '#9fcde3', true), fassade(4, 3, '#efe4cf'), '#3e4855'));
            const dach = giebeldach(24, 7, 17, 0x3e4855); dach.position.y = 12; g.add(dach);
            g.add(kiste(1.6, 4, 1.6, mat(0x8a5a44), 6, 14, -2));                       // Schornstein
            const garage = kiste(9, 4.5, 10, mat(0xe9dcc2), 15.5, 0, 3); g.add(garage);
            g.add(kiste(9.4, 0.4, 10.4, mat(0x3e4855), 15.5, 4.5, 3));
            g.add(kiste(6, 3.4, 0.2, mat(0xc9bda6), 15.5, 0, 8.05));                  // Garagentor
            const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), mat(0x4fb3e0));
            pool.rotation.x = -Math.PI / 2; pool.position.set(-17, 0.06, 2); g.add(pool);
            g.add(kiste(10, 0.15, 6, mat(0xcdbfa6), -17, 0, 2)); pool.position.y = 0.2;
            return { g, breite: 22, tiefe: 16, hoehe: 19, extra: [{ x: 15.5, z: 3, w: 9, d: 10 }, { x: -17, z: 2, w: 10, d: 6 }] };
        },
        vysotka() {
            const g = new THREE.Group();
            g.add(wandKiste(16, 46, 16, fassade(5, 13, '#e6dfd2', '#9fcde3', true), fassade(5, 13, '#e6dfd2'), '#7c5ea8'));
            g.add(kiste(16.4, 1.2, 16.4, mat(0x7c5ea8), 0, 46, 0));
            g.add(kiste(6, 0.4, 3, mat(0x7c5ea8), 0, 3.6, 9.2));                     // Vordach
            g.add(kiste(0.3, 3, 0.3, mat(0x9aa1a7), 0, 47, 0));                       // Antenne
            return { g, breite: 16, tiefe: 16, hoehe: 48 };
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
        vokzal() {
            const g = new THREE.Group();
            g.add(wandKiste(44, 11, 16, fassade(11, 2, '#e9c9a5', '#9fcde3', true), fassade(4, 2, '#e9c9a5'), '#b8392b'));
            g.add(kiste(12, 22, 12, mat(0xf3dcbc), 0, 0, 0));
            const spitze = new THREE.Mesh(new THREE.ConeGeometry(6.5, 9, 4), mat(0x1f4e47));
            spitze.position.y = 26.5; spitze.rotation.y = Math.PI / 4; spitze.castShadow = true; g.add(spitze);
            const s = schild('ВОКЗАЛ', 10, 2, '#1f4e47', '#e8c879'); s.position.set(0, 16, 6.02); g.add(s);
            return { g, breite: 44, tiefe: 16, hoehe: 31 };
        },
        supermarket() {
            const g = new THREE.Group();
            g.add(wandKiste(32, 8, 22, fassade(8, 1, '#f4efe6', '#7fb3cf', true, '#e9ecee'), fassade(5, 1, '#f4efe6'), '#c9c1b2'));
            g.add(kiste(32.6, 1.4, 22.6, mat(0x3f8f5f), 0, 8, 0));
            const s = schild('СУПЕРМАРКЕТ', 18, 3, '#3f8f5f', '#ffffff'); s.position.set(0, 10.8, 11.32); g.add(s);
            for (let i = 0; i < 4; i++) g.add(kiste(1.4, 1.1, 2, mat(0x9aa1a7), 10 + i * 1.7, 0, 13.5));   // Einkaufswagen
            return { g, breite: 32, tiefe: 22, hoehe: 12 };
        },
        aeroport() {
            const g = new THREE.Group();
            g.add(wandKiste(60, 10, 22, fassade(15, 2, '#e9ecee', '#7fb3cf', true, '#e9ecee'), fassade(5, 2, '#e9ecee'), '#3e4855'));
            const dach = kiste(64, 1, 26, mat(0x3e4855), 0, 10, 0); g.add(dach);
            const s = schild('АЭРОПОРТ', 16, 2.6, '#2b6f9e', '#ffffff'); s.position.set(0, 12.6, 11.02); g.add(s);
            const turm = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 26, 16), mat(0xdfe3e6));
            turm.position.set(34, 13, -6); turm.castShadow = true; g.add(turm);
            const kanzel = new THREE.Mesh(new THREE.CylinderGeometry(4, 3, 4, 16), mat(0x9fcde3));
            kanzel.position.set(34, 28, -6); g.add(kanzel);
            g.add(kiste(9, 0.6, 9, mat(0x3e4855), 34, 30, -6));
            return { g, breite: 60, tiefe: 22, hoehe: 14, extra: [{ x: 34, z: -6, w: 6, d: 6 }] };
        },
    };
    function standardHaus(m) {
        const g = new THREE.Group();
        const c = m.farbe || '#c8553d';
        g.add(wandKiste(18, 10, 14, fassade(4, 2, '#efe4cf', '#9fcde3', true), fassade(3, 2, '#efe4cf'), c));
        const s = schild(m.titel.ru.replace(/́/g, '').toUpperCase(), 10, 1.8, c, '#ffffff'); s.position.set(0, 8.5, 7.02); g.add(s);
        return { g, breite: 18, tiefe: 14, hoehe: 10 };
    }

    // ---------------- Fahrzeuge und Figuren ----------------
    function auto(c) {
        const g = new THREE.Group();
        g.add(kiste(2.1, 0.9, 4.4, mat(c), 0, 0.45, 0));
        g.add(kiste(1.8, 0.75, 2.2, mat(0xbfe0ee), 0, 1.35, -0.2));
        const rad = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 14);
        [[-1, -1.4], [1, -1.4], [-1, 1.4], [1, 1.4]].forEach(([x, z]) => {
            const r = new THREE.Mesh(rad, mat(0x2a2a2a)); r.rotation.z = Math.PI / 2; r.position.set(x * 1.05, 0.42, z); g.add(r);
        });
        g.add(kiste(0.5, 0.25, 0.1, mat(0xfff6c9, { emissive: 0x665a20 }), -0.6, 0.75, 2.22), kiste(0.5, 0.25, 0.1, mat(0xfff6c9, { emissive: 0x665a20 }), 0.6, 0.75, 2.22));
        return g;
    }
    function figur() {
        const g = new THREE.Group();
        const beine = [kiste(0.28, 0.85, 0.3, mat(0x2c3e50), -0.17, 0, 0), kiste(0.28, 0.85, 0.3, mat(0x2c3e50), 0.17, 0, 0)];
        beine.forEach(b => g.add(b));
        g.add(kiste(0.8, 0.95, 0.45, mat(0xc8553d), 0, 0.85, 0));
        const kopf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat(0xf2c7a6)); kopf.position.y = 2.1; kopf.castShadow = true; g.add(kopf);
        const muetze = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x2b5fa8)); muetze.position.y = 2.15; g.add(muetze);
        g.userData.beine = beine;
        return g;
    }
    function flugzeug() {
        const g = new THREE.Group();
        const rumpf = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 14, 14), mat(0xfbfbfb)); rumpf.rotation.x = Math.PI / 2; g.add(rumpf);
        const nase = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), mat(0xfbfbfb)); nase.position.z = 7; g.add(nase);
        g.add(kiste(16, 0.25, 2.6, mat(0xd9dde0), 0, -0.2, 0.5));
        g.add(kiste(0.25, 3, 2.2, mat(0x2b6f9e), 0, 0.6, -6));
        g.add(kiste(5, 0.2, 1.4, mat(0xd9dde0), 0, 0.3, -6.3));
        g.traverse(o => { o.castShadow = true; });
        return g;
    }
    function zug() {
        const g = new THREE.Group();
        g.add(kiste(4, 4.2, 14, mat(0xb8392b), 0, 0.6, 0));
        g.add(kiste(3.4, 1.6, 0.2, mat(0xbfe0ee), 0, 2.8, 7.02));
        for (let i = 1; i <= 3; i++) g.add(kiste(3.8, 3.8, 15, mat(0x2f6b4f), 0, 0.6, -i * 15.6), kiste(3.9, 0.3, 15, mat(0xe2b43c), 0, 2.6, -i * 15.6));
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
            <div class="s3-laden" id="s3-laden"><span class="s3-kran">🏗️</span><span>Die Stadt wird gebaut …</span></div>
            <div class="s3-ort" id="s3-ort"><span class="ru"></span><span class="de"></span></div>
            <div class="s3-knoepfe">
              <button class="s3-knopf" id="s3-modus" title="Zu Fuß gehen oder Auto fahren (Taste F)">🚗 Auto fahren</button>
              <button class="s3-knopf" id="s3-hilfe-knopf" title="Steuerung">?</button>
            </div>
            <div class="s3-hilfe" id="s3-hilfe">
              <strong>So bewegst du dich</strong>
              <span><kbd>W</kbd> <kbd>↑</kbd> vorwärts · <kbd>S</kbd> <kbd>↓</kbd> rückwärts</span>
              <span><kbd>A</kbd> <kbd>D</kbd> <kbd>←</kbd> <kbd>→</kbd> drehen · <kbd>Shift</kbd> rennen</span>
              <span>Maus ziehen: umschauen · Mausrad: näher/weiter</span>
              <span><kbd>F</kbd> Auto / zu Fuß</span>
              <span><strong>Hineingehen:</strong> aufs Haus klicken, durch die Tür laufen oder <kbd>Enter</kbd></span>
              <span class="klein">Goldene Ringe zeigen die Türen.</span>
            </div>
            <div class="s3-tuer" id="s3-tuer" hidden></div>
            <div class="s3-steuer" aria-label="Steuerung">
              <button data-taste="vor">▲</button><button data-taste="links">◀</button><button data-taste="zurueck">▼</button><button data-taste="rechts">▶</button>
            </div>
            <canvas class="s3-karte" id="s3-karte" width="220" height="140"></canvas>
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
        szene.fog = new THREE.Fog('#d7ecf4', 120, 330);
        const kamera = new THREE.PerspectiveCamera(60, 1, 0.5, 900);

        szene.add(new THREE.HemisphereLight(0xffffff, 0x8aa070, 1.6));
        const sonne = new THREE.DirectionalLight(0xfff2d6, 2.2);
        sonne.castShadow = true;
        sonne.shadow.mapSize.set(2048, 2048);
        Object.assign(sonne.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300 });
        szene.add(sonne, sonne.target);

        // Boden, Straßen, Gehwege
        const boden = new THREE.Mesh(new THREE.PlaneGeometry(700, 500), mat(0x8fbf6a));
        boden.rotation.x = -Math.PI / 2; boden.receiveShadow = true; szene.add(boden);
        const asphalt = mat(0x55595e), gehweg = mat(0xcfc8bb), strich = mat(0xf6f2e6);
        STRASSEN.forEach(s => {
            const lang = s.bis - s.von, mitte = (s.von + s.bis) / 2;
            const [w, d, x, z] = s.achse === 'x' ? [lang, s.breite, mitte, s.pos] : [s.breite, lang, s.pos, mitte];
            const geh = new THREE.Mesh(new THREE.BoxGeometry(s.achse === 'x' ? w : w + 6, 0.12, s.achse === 'x' ? d + 6 : d), gehweg);
            geh.position.set(x, 0.06, z); geh.receiveShadow = true; szene.add(geh);
            const fahrbahn = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), asphalt);
            fahrbahn.position.set(x, 0.08, z); fahrbahn.receiveShadow = true; szene.add(fahrbahn);
            for (let t = s.von + 4; t < s.bis - 4; t += 8) {
                if (STRASSEN.some(o => o !== s && Math.abs(t - o.pos) < o.breite / 2 + 1 && o.achse !== s.achse)) continue;
                const st2 = new THREE.Mesh(new THREE.BoxGeometry(s.achse === 'x' ? 4 : 0.3, 0.02, s.achse === 'x' ? 0.3 : 4), strich);
                st2.position.set(s.achse === 'x' ? t : s.pos, 0.16, s.achse === 'x' ? s.pos : t); szene.add(st2);
            }
        });
        // Gleise hinter dem Bahnhof, Landebahn hinter dem Flughafen
        const gleisZ = 62;
        szene.add(kiste(420, 0.1, 6, mat(0x9a8f80), -60, 0.02, gleisZ));
        [-1.3, 1.3].forEach(o => szene.add(kiste(420, 0.18, 0.25, mat(0x6b6f74), -60, 0.12, gleisZ + o)));
        const bahn = new THREE.Mesh(new THREE.BoxGeometry(200, 0.1, 16), mat(0x4a4e52));
        bahn.position.set(150, 0.05, 105); bahn.receiveShadow = true; szene.add(bahn);
        for (let x = 60; x < 245; x += 14) { const m = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 0.6), strich); m.position.set(x, 0.12, 105); szene.add(m); }

        // Gebäude
        const haeuser = [], hindernisse = [];
        let frei = 0;
        G.module.forEach(m => {
            const platz = PLAETZE[m.id] || FREIE_PLAETZE[frei++];
            if (!platz) return;
            const bau = (BAUER[m.id] || (() => standardHaus(m)))();
            const dreh = platz.seite === 's' ? Math.PI : 0;
            bau.g.position.set(platz.x, 0, platz.z);
            bau.g.rotation.y = dreh;
            szene.add(bau.g);
            const vorn = platz.seite === 's' ? -1 : 1;
            const tuer = { x: platz.x, z: platz.z + vorn * (bau.tiefe / 2 + 1.6) };
            hindernisse.push({ x: platz.x, z: platz.z, w: bau.breite, d: bau.tiefe });
            (bau.extra || []).forEach(e => hindernisse.push({ x: platz.x + (vorn > 0 ? e.x : -e.x), z: platz.z + (vorn > 0 ? e.z : -e.z), w: e.w, d: e.d }));
            const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.9, 40), new THREE.MeshBasicMaterial({ color: GELB, transparent: true, opacity: 0.8 }));
            ring.rotation.x = -Math.PI / 2; ring.position.set(tuer.x, 0.2, tuer.z); szene.add(ring);
            const name = namensschild(m.titel.ru, m.titel.de, m.farbe || '#c8553d');
            name.position.set(platz.x, bau.hoehe + 6, platz.z); szene.add(name);
            haeuser.push({ m, tuer, ring, platz, farbe: m.farbe || '#c8553d', w: bau.breite, d: bau.tiefe, gruppe: bau.g, name });
        });

        // Bäume und Laternen am Prospekt
        const stamm = mat(0x7a4a2b), krone = mat(0x4f8f46), lampe = mat(0x3a3f44);
        const istFrei = (x, z) => !hindernisse.some(h => Math.abs(x - h.x) < h.w / 2 + 3 && Math.abs(z - h.z) < h.d / 2 + 3)
            && !STRASSEN.some(s => s.achse === 'z' && Math.abs(x - s.pos) < s.breite / 2 + 4);
        for (let x = -250; x <= 250; x += 18) {
            [-11, 11].forEach((z, i) => {
                const xx = x + (i ? 9 : 0);
                if (!istFrei(xx, z)) return;
                if ((x / 18) % 2 === 0) {
                    const b = new THREE.Group();
                    b.add(kiste(0.5, 2.4, 0.5, stamm));
                    const k = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 10), krone); k.position.y = 3.6; k.castShadow = true; b.add(k);
                    b.position.set(xx, 0, z); szene.add(b);
                } else {
                    const l = new THREE.Group();
                    l.add(kiste(0.2, 5.5, 0.2, lampe));
                    const kugel = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat(0xfff3c4, { emissive: 0x6b5a20 })); kugel.position.y = 5.7; l.add(kugel);
                    l.position.set(xx, 0, z); szene.add(l);
                }
            });
        }
        // Bäume auf den Wiesen (fester Zufall, damit die Stadt immer gleich aussieht)
        let saat = 7;
        const zufall = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
        const wiesenBaum = mat(0x5f9a4e);
        for (let i = 0, n = 0; i < 400 && n < 90; i++) {
            const x = -250 + zufall() * 500, z = -135 + zufall() * 270;
            if (Math.abs(z) < 16 || !istFrei(x, z) || Math.abs(z - gleisZ) < 8 || (x > 40 && z > 90 && z < 120)) continue;
            n++;
            const b = new THREE.Group(), gr = 0.8 + zufall() * 0.7;
            b.add(kiste(0.5 * gr, 2.2 * gr, 0.5 * gr, stamm));
            const k = new THREE.Mesh(new THREE.ConeGeometry(2.2 * gr, 5 * gr, 9), zufall() < 0.5 ? krone : wiesenBaum);
            k.position.y = 4.4 * gr; k.castShadow = true; b.add(k);
            b.position.set(x, 0, z); szene.add(b);
        }

        // Wolken
        const wolken = [];
        for (let i = 0; i < 9; i++) {
            const w = new THREE.Group();
            for (let k = 0; k < 4; k++) {
                const s = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x888888 }));
                s.position.set(k * 5 - 8, Math.random() * 2, Math.random() * 4); w.add(s);
            }
            w.position.set(-250 + Math.random() * 500, 70 + Math.random() * 25, -150 + Math.random() * 300);
            szene.add(w); wolken.push(w);
        }

        // Verkehr: Autos auf dem Prospekt und den Querstraßen, Zug, Flugzeug
        const verkehr = [];
        const FARBEN = [0x2b5fa8, 0xe2b43c, 0x3f8f5f, 0x7c5ea8, 0xf2f2f2, 0x2a2a2a];
        for (let i = 0; i < 6; i++) {
            const a = auto(FARBEN[i]); const richtung = i % 2 ? 1 : -1;
            a.position.set(-250 + i * 85, 0, richtung * 3.4); a.rotation.y = richtung > 0 ? -Math.PI / 2 : Math.PI / 2;
            szene.add(a); verkehr.push({ obj: a, achse: 'x', richtung, tempo: 9 + i, spur: richtung * 3.4, von: -255, bis: 255 });
        }
        [STRASSEN[1], STRASSEN[3]].forEach((s, i) => {
            const a = auto(FARBEN[(i + 3) % 6]); const richtung = i ? 1 : -1;
            a.position.set(s.pos + richtung * 2.4, 0, 0); a.rotation.y = richtung > 0 ? 0 : Math.PI;
            szene.add(a); verkehr.push({ obj: a, achse: 'z', richtung, tempo: 8, spur: s.pos + richtung * 2.4, von: -92, bis: 92 });
        });
        const eisenbahn = zug(); eisenbahn.rotation.y = Math.PI / 2; eisenbahn.position.set(-260, 0, gleisZ); szene.add(eisenbahn);
        const flieger = flugzeug(); szene.add(flieger);

        // Spieler: Figur und Auto
        const ich = figur(), meinAuto = auto(0xc8302a);
        szene.add(ich, meinAuto);
        const s = { x: st.x ?? 5, z: st.z ?? 12, dreh: st.dreh ?? Math.PI, tempo: 0, auto: !!st.auto };
        const parkplatz = { x: s.x + 4, z: s.z };
        let kameraAbstand = 1, blickDreh = 0, zeit = 0, letzteStrasse, letzteTuer = null, laufendId = 0;
        const tasten = new Set();

        function setzeModus(auto) {
            if (auto && !s.auto && Math.hypot(meinAuto.position.x - s.x, meinAuto.position.z - s.z) > 9) {
                // Auto kommt herbeigefahren, wenn man weit weg ist
                meinAuto.position.set(s.x + 3, 0, s.z);
            }
            s.auto = auto; s.tempo = 0;
            if (auto) { s.x = meinAuto.position.x; s.z = meinAuto.position.z; s.dreh = meinAuto.rotation.y; }
            else { s.x = meinAuto.position.x + Math.cos(s.dreh) * 2.4; s.z = meinAuto.position.z - Math.sin(s.dreh) * 2.4; }
            ich.visible = !auto;
            document.getElementById('s3-modus').textContent = auto ? '🚶 Aussteigen' : '🚗 Auto fahren';
            G.toast(auto ? 'Я е́ду на маши́не. – Ich fahre mit dem Auto.' : 'Я иду́ пешко́м. – Ich gehe zu Fuß.');
        }
        meinAuto.position.set(parkplatz.x, 0, parkplatz.z); meinAuto.rotation.y = s.dreh;
        if (s.auto) { meinAuto.position.set(s.x, 0, s.z); ich.visible = false; document.getElementById('s3-modus').textContent = '🚶 Aussteigen'; }

        // Kollision mit Häusern und Stadtrand
        function schiebeRaus(r) {
            s.x = Math.max(-GRENZE.x, Math.min(GRENZE.x, s.x));
            s.z = Math.max(-GRENZE.z, Math.min(GRENZE.z, s.z));
            hindernisse.forEach(h => {
                const dx = s.x - h.x, dz = s.z - h.z, px = h.w / 2 + r - Math.abs(dx), pz = h.d / 2 + r - Math.abs(dz);
                if (px > 0 && pz > 0) {
                    if (px < pz) s.x += Math.sign(dx || 1) * px; else s.z += Math.sign(dz || 1) * pz;
                    s.tempo *= 0.3;
                }
            });
        }

        function strasseHier() {
            return STRASSEN.find(t => t.achse === 'x'
                ? Math.abs(s.z - t.pos) < t.breite / 2 + 3 && s.x > t.von && s.x < t.bis
                : Math.abs(s.x - t.pos) < t.breite / 2 + 3 && s.z > t.von && s.z < t.bis) || null;
        }

        // Karte unten rechts
        const karte = document.getElementById('s3-karte'), kg = karte.getContext('2d');
        const KX = (x) => (x + 260) / 520 * karte.width, KZ = (z) => (z + 150) / 300 * karte.height;
        function zeichneKarte() {
            kg.clearRect(0, 0, karte.width, karte.height);
            kg.fillStyle = 'rgba(143,191,106,.92)'; kg.fillRect(0, 0, karte.width, karte.height);
            kg.fillStyle = '#6b6f74';
            STRASSEN.forEach(t => t.achse === 'x' ? kg.fillRect(KX(t.von), KZ(t.pos - t.breite / 2), KX(t.bis) - KX(t.von), Math.max(3, t.breite / 300 * karte.height))
                : kg.fillRect(KX(t.pos - t.breite / 2), KZ(t.von), Math.max(2.5, t.breite / 520 * karte.width), KZ(t.bis) - KZ(t.von)));
            kg.fillStyle = '#8a8f94'; kg.fillRect(KX(50), KZ(97), KX(250) - KX(50), 4);
            haeuser.forEach(h => {
                kg.fillStyle = h.farbe;
                kg.fillRect(KX(h.platz.x - h.w / 2), KZ(h.platz.z - h.d / 2), h.w / 520 * karte.width, h.d / 300 * karte.height);
            });
            kg.save(); kg.translate(KX(s.x), KZ(s.z)); kg.rotate(-s.dreh + Math.PI);
            kg.fillStyle = '#fff'; kg.strokeStyle = '#c8302a'; kg.lineWidth = 2;
            kg.beginPath(); kg.moveTo(0, -7); kg.lineTo(5, 5); kg.lineTo(0, 2); kg.lineTo(-5, 5); kg.closePath(); kg.fill(); kg.stroke();
            kg.restore();
        }

        // ---------------- Eingaben ----------------
        const TASTEN = { KeyW: 'vor', ArrowUp: 'vor', KeyS: 'zurueck', ArrowDown: 'zurueck', KeyA: 'links', ArrowLeft: 'links', KeyD: 'rechts', ArrowRight: 'rechts', ShiftLeft: 'renn', ShiftRight: 'renn' };
        const imFeld = (e) => /^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName || '');
        function runter(e) {
            if (imFeld(e)) return;
            if (TASTEN[e.code]) { tasten.add(TASTEN[e.code]); e.preventDefault(); }
            if (e.code === 'KeyF') setzeModus(!s.auto);
            if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyE') { e.preventDefault(); eintreten(); }
        }
        function hoch(e) { if (TASTEN[e.code]) tasten.delete(TASTEN[e.code]); }
        addEventListener('keydown', runter); addEventListener('keyup', hoch);
        const loslassen = () => tasten.clear();
        addEventListener('blur', loslassen);

        // Ziehen = umschauen; kurzer Klick ohne Ziehen = auf ein Haus zeigen
        let ziehen = null, klickStart = null;
        const strahl = new THREE.Raycaster(), zeiger = new THREE.Vector2();
        renderer.domElement.addEventListener('pointerdown', (e) => {
            ziehen = e.clientX; klickStart = { x: e.clientX, y: e.clientY };
            renderer.domElement.setPointerCapture(e.pointerId);
        });
        renderer.domElement.addEventListener('pointermove', (e) => { if (ziehen === null) return; blickDreh -= (e.clientX - ziehen) * 0.006; ziehen = e.clientX; });
        renderer.domElement.addEventListener('pointerup', (e) => {
            ziehen = null;
            if (!klickStart || Math.hypot(e.clientX - klickStart.x, e.clientY - klickStart.y) > 6) return;
            const r = renderer.domElement.getBoundingClientRect();
            zeiger.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            strahl.setFromCamera(zeiger, kamera);
            const treffer = strahl.intersectObjects(haeuser.flatMap(h => [h.gruppe, h.ring, h.name]), true)[0];
            if (!treffer) return;
            const h = haeuser.find(x => { let o = treffer.object; while (o) { if (o === x.gruppe || o === x.ring || o === x.name) return true; o = o.parent; } return false; });
            if (h) eintreten(h);
        });
        renderer.domElement.addEventListener('pointermove', (e) => {
            if (ziehen !== null) return;
            const r = renderer.domElement.getBoundingClientRect();
            zeiger.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            strahl.setFromCamera(zeiger, kamera);
            const ueber = strahl.intersectObjects(haeuser.flatMap(h => [h.gruppe, h.ring, h.name]), true).length > 0;
            renderer.domElement.classList.toggle('ueber-haus', ueber);
        });
        renderer.domElement.addEventListener('wheel', (e) => { kameraAbstand = Math.max(0.5, Math.min(2.2, kameraAbstand + e.deltaY * 0.001)); e.preventDefault(); }, { passive: false });
        buehne.querySelectorAll('.s3-steuer button').forEach(b => {
            const an = (e) => { e.preventDefault(); tasten.add(b.dataset.taste); };
            const aus = () => tasten.delete(b.dataset.taste);
            b.addEventListener('pointerdown', an); b.addEventListener('pointerup', aus); b.addEventListener('pointerleave', aus); b.addEventListener('pointercancel', aus);
        });
        // Knöpfe geben den Tastaturfokus sofort zurück – sonst löst Enter den Knopf aus statt die Tür
        document.getElementById('s3-modus').addEventListener('click', (e) => { setzeModus(!s.auto); e.currentTarget.blur(); });
        const hilfe = document.getElementById('s3-hilfe');
        document.getElementById('s3-hilfe-knopf').addEventListener('click', (e) => { hilfe.classList.toggle('zu'); e.currentTarget.blur(); });
        setTimeout(() => hilfe.classList.add('zu'), 9000);

        function naechsteTuer() {
            let best = null, bd = s.auto ? 11 : 7;
            haeuser.forEach(h => { const d = Math.hypot(h.tuer.x - s.x, h.tuer.z - s.z); if (d < bd) { bd = d; best = h; } });
            return best;
        }
        let tritt = false;
        function eintreten(h = naechsteTuer()) {
            if (!h) { G.toast('Hier ist keine Tür. Geh zu einem goldenen Ring – oder klick auf ein Haus.'); return; }
            if (tritt) return;
            tritt = true;
            speichern();
            buehne.classList.add('blende');
            setTimeout(() => G.oeffneModul(h.m.id), 450);
        }
        const tuerBox = document.getElementById('s3-tuer');
        tuerBox.addEventListener('click', () => eintreten());

        function speichern() {
            Object.assign(st, { x: +s.x.toFixed(1), z: +s.z.toFixed(1), dreh: +s.dreh.toFixed(2), auto: s.auto });
            G.speichern();
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

            // Bewegung
            const vor = tasten.has('vor') ? 1 : tasten.has('zurueck') ? -1 : 0;
            const drehen = (tasten.has('links') ? 1 : 0) - (tasten.has('rechts') ? 1 : 0);
            if (s.auto) {
                const max = tasten.has('renn') ? 34 : 22;
                s.tempo += (vor * (vor * s.tempo < 0 ? 40 : 14) - Math.sign(s.tempo) * (vor ? 0 : 8)) * dt;
                if (!vor && Math.abs(s.tempo) < 0.4) s.tempo = 0;
                s.tempo = Math.max(-8, Math.min(max, s.tempo));
                s.dreh += drehen * dt * 1.7 * Math.min(1, Math.abs(s.tempo) / 6) * Math.sign(s.tempo || 1);
            } else {
                s.tempo = vor * (tasten.has('renn') ? 11 : 5.5);
                s.dreh += drehen * dt * 2.6;
            }
            s.x += Math.sin(s.dreh) * s.tempo * dt;
            s.z += Math.cos(s.dreh) * s.tempo * dt;
            schiebeRaus(s.auto ? 2 : 0.6);
            const obj = s.auto ? meinAuto : ich;
            obj.position.set(s.x, 0, s.z); obj.rotation.y = s.dreh;
            if (!s.auto) {
                const schwung = s.tempo ? Math.sin(zeit * (Math.abs(s.tempo) > 6 ? 16 : 10)) * 0.5 : 0;
                ich.userData.beine[0].rotation.x = schwung; ich.userData.beine[1].rotation.x = -schwung;
                ich.position.y = s.tempo ? Math.abs(Math.sin(zeit * 10)) * 0.08 : 0;
            }
            if (s.tempo) blickDreh *= 0.96;     // beim Gehen dreht die Kamera langsam hinter die Figur zurück

            // In die Tür hineinlaufen: auf dem Ring stehen und weiter aufs Haus zugehen
            const nah = !s.auto && vor > 0 && naechsteTuer();
            if (nah && Math.hypot(nah.tuer.x - s.x, nah.tuer.z - s.z) < 2.6) {
                const zumHaus = Math.sin(s.dreh) * (nah.platz.x - nah.tuer.x) + Math.cos(s.dreh) * (nah.platz.z - nah.tuer.z);
                druck = zumHaus > 0 ? druck + dt : 0;
                if (druck > 0.3) eintreten(nah);
            } else druck = 0;

            // Kamera hinter der Figur
            const abstand = (s.auto ? 16 : 11) * kameraAbstand, hoehe = (s.auto ? 8 : 6.5) * Math.max(0.8, kameraAbstand);
            const k = s.dreh + Math.PI + blickDreh;
            kamPos.set(s.x + Math.sin(k) * abstand, hoehe, s.z + Math.cos(k) * abstand);
            if (ersterFrame) { kamera.position.copy(kamPos); ersterFrame = false; } else kamera.position.lerp(kamPos, 1 - Math.pow(0.002, dt));
            // Blick etwas vor die Figur und nach oben – so sieht man Häuser und Namensschilder
            blickZiel.set(s.x + Math.sin(s.dreh) * 8, s.auto ? 4 : 4.5, s.z + Math.cos(s.dreh) * 8);
            kamera.lookAt(blickZiel);
            sonne.position.set(s.x + 40, 80, s.z + 30); sonne.target.position.set(s.x, 0, s.z);

            // Verkehr: Autos halten vor Fußgängern
            verkehr.forEach(v => {
                const o = v.obj, entlang = v.achse === 'x' ? o.position.x : o.position.z;
                const vorne = v.achse === 'x' ? { x: entlang + v.richtung * 5, z: v.spur } : { x: v.spur, z: entlang + v.richtung * 5 };
                const halt = Math.hypot(vorne.x - s.x, vorne.z - s.z) < 4.5;
                let neu = entlang + (halt ? 0 : v.richtung * v.tempo * dt);
                if (neu > v.bis) neu = v.von; if (neu < v.von) neu = v.bis;
                if (v.achse === 'x') o.position.x = neu; else o.position.z = neu;
            });
            // Zug: fährt ein, hält am Bahnhof, fährt weiter
            const takt = zeit % 46;
            const zx = takt < 14 ? -260 + (takt / 14) * 145 : takt < 24 ? -115 : -115 + ((takt - 24) / 22) * 400;
            eisenbahn.position.x = zx;
            // Flugzeug kreist über dem Flughafen
            const w = zeit * 0.12;
            flieger.position.set(140 + Math.cos(w) * 90, 45 + Math.sin(w * 2) * 4, 70 + Math.sin(w) * 60);
            flieger.rotation.set(0, -w, -0.25);
            wolken.forEach(c => { c.position.x += dt * 1.5; if (c.position.x > 300) c.position.x = -300; });
            haeuser.forEach(h => { h.ring.material.opacity = 0.55 + Math.sin(zeit * 4) * 0.3; h.ring.scale.setScalar(1 + Math.sin(zeit * 4) * 0.06); });

            // Anzeige: Straße und Tür
            const strasse = strasseHier();
            if (strasse !== letzteStrasse) {
                letzteStrasse = strasse;
                const ort = document.getElementById('s3-ort');
                ort.querySelector('.ru').textContent = strasse ? `Вы ${strasse.wo}` : 'Вы гуля́ете по го́роду';
                ort.querySelector('.de').textContent = strasse ? `Sie sind ${strasse.de}` : 'Sie spazieren durch die Stadt';
                ort.classList.remove('neu'); void ort.offsetWidth; ort.classList.add('neu');
                if (strasse) Stimmen.sage(`Вы ${strasse.wo}.`);
            }
            const tuer = naechsteTuer();
            if (tuer !== letzteTuer) {
                letzteTuer = tuer;
                tuerBox.hidden = !tuer;
                if (tuer) {
                    tuerBox.innerHTML = `<span class="ru">${G.esc(tuer.m.titel.ru)}</span><span class="de">${G.esc(tuer.m.titel.de)}</span><span class="los">⏎ Hineingehen</span>`;
                    Stimmen.sage(`Э́то ${tuer.m.titel.ru}.`);
                }
            }
            zeichneKarte();
            renderer.render(szene, kamera);
        }
        document.getElementById('s3-laden').remove();
        schritt();

        const speicherTakt = setInterval(speichern, 5000);
        beenden = () => {
            cancelAnimationFrame(laufendId);
            clearInterval(speicherTakt);
            speichern();
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
