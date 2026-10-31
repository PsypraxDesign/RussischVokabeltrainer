# Город — Russisch lernen in einer Stadtsimulation

Plan (Claude-Doc): https://claude.ai/artifact/HqsuTV5UJEyAuCahCwgMrF
Stand 29.10.2026: Gebäude cafe, dom (Villa), vysotka (Hochhaus), aeroport (Flughafen), vokzal (Bahnhof),
supermarket (Supermarkt), shkola (Schule).

@../../PSYCHO_TEST_PROGRAMMIERUNG/_shared/frontend-design.md

## Aufbau
- `server.py` (Flask, Port 5083): liefert Kern + Module, prüft Module beim Start,
  speichert den Spielstand sofort in `daten/spielstand.json` (vorherige Fassung `.bak`).
- `static/` = Kern: `kern.js` (Karte, Modul-Ansicht, Stufenleiste, Spielstand,
  Geldbörse, Zurück-Sperre), `stimmen.js`, `zahlwort.js`, `kern.css`.
- `static/bausteine/` = Lernformen, von allen Modulen genutzt:
  `entdecken` (Wimmelbild), `hoeren` (Hören & Zeigen), `dialog`, `bezahlen`, `wo`,
  `etagen`, `aufzug`, `schalter` (Stufen `pass`/`gepaeck`/`zoll` am Flughafen, `fahrkarte`/`zug`
  am Bahnhof, `theke`/`kasse` im Supermarkt), `fahrplan` (Abfahrtstafel, auch `stundenplan`), `einkaufen` (Einkaufszettel / Ranzen packen),
  Schalter-Stufe `unterricht`, `rechnen` (Mathe), `literatur` (Buch mit Vorlesen) – alle Schule.
  `wege` (Gehen & Fahren: идти́/ходи́ть/е́хать/е́здить/пойти́ mit bewegter Szene, Inhalt aus `werkzeuge/wege.py`) – Bahnhof.
  Inhalte von Flughafen, Bahnhof, Supermarkt und Schule erzeugen die Skripte
  in `werkzeuge/` – dort ändern, nicht im JSON.
- Grammatik zum Antippen: `static/grammatik.js` + Regeln aus `werkzeuge/grammatik_regeln.py`
  (→ `static/grammatik.json`); Bausteine zeigen russische Sätze über `Gorod.satz()`.
  Prüfen mit `node werkzeuge/grammatik_pruefen.js`. Details in `MODULE.md`.
- `module/<id>/` = ein Gebäude; Vertrag in `MODULE.md`. Neues Gebäude = neuer Ordner.
- `static/stadt3d.js` = begehbare 3D-Stadt (three.js 0.170 lokal in `static/vendor/`, MIT).
  Bauplätze und eigens gestaltete Häuser stehen dort in `PLAETZE` / `BAUER`; ein neues Modul
  bekommt automatisch ein einfaches Haus in seiner Farbe auf einem freien Platz.
- Start: `start_gorod.bat` (App-Fenster per `--app`).

## Regeln
- Stimmen/Schlüssel NICHT kopieren: der Server reicht `../Vokabeltrainer/api-key.js`,
  `js/tts.js`, `js/azure-tts.js` unter `/geteilt/` durch.
- Ton erst nach dem ersten Klick (Autoplay-Sperre): `Stimmen.darfTon()`.
- Keine Tastatureingabe für Russisch — nur antippen, wählen, (später) sprechen.
- Russische Texte mit Betonungszeichen (U+0301); die Sprachausgabe entfernt sie.
- Personalien/Adressen in Inhalten nur erfunden.
- Tests: headless mit puppeteer-core aus `../Vokabeltrainer/node_modules`, gegen
  einen eigenen Testserver (`GOROD_PORT=5090`, `GOROD_DATEN=<scratchpad>`), Screenshots
  ansehen (Design-Loop, siehe frontend-design.md). Den Server des Nutzers nie beenden.
