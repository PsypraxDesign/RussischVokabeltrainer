# Modul-Beschreibung (Vertrag zwischen Kern und Gebäude)

Jedes Gebäude ist ein Ordner unter `module/<id>/` (id: Kleinbuchstaben, Ziffern,
`-`, `_`). Der Server prüft jedes Modul beim Start (`pruefe_modul` in
`server.py`); Module mit Fehlern erscheinen nicht auf der Karte, die Fehler
stehen auf der Startseite.

```
module/cafe/
  modul.json     – Steckbrief
  inhalt.json    – Wörter, Menü, Dialog
  grafik/
    aussen.svg   – Fassade für die Straße
    innen.svg    – Innenraum mit Klickflächen
```

## modul.json

| Feld | Pflicht | Bedeutung |
| --- | --- | --- |
| `titel` | ja | `{ "ru": "кафе́", "de": "Café" }` |
| `praeposition` | ja | `в` oder `на` (Я иду́ в/на …) |
| `satz_hin`, `satz_hin_de` | nein | gesprochen beim Hineingehen |
| `stufen` | ja | Reihenfolge der Bausteine: `entdecken`, `hoeren`, `dialog`, `bezahlen`, `wo`, `etagen`, `aufzug`, `pass`, `gepaeck`, `zoll`, `fahrplan`, `fahrkarte`, `zug`, `einkaufen`, `theke`, `kasse`, `stundenplan`, `unterricht`, `rechnen`, `literatur`, `wege` |
| `grafik` | ja | `{ "aussen": "grafik/aussen.svg", "innen": "grafik/innen.svg" }` |
| `stufen_titel` | nein | eigene Namen in der Stufenleiste, z. B. `{ "einkaufen": "Ranzen packen" }` |
| `farbe` | nein | Akzentfarbe des Gebäudes |
| `breite` | nein | Breite der Fassade auf der Straße in px (Standard 215) |

## inhalt.json

- `woerter[]`: `id`, `ru` (mit Betonung ◌́), `de`, `hotspot` (Pflicht);
  `genus` (`m`/`f`/`n`/`pl`), `satz`, `hinweis` (optional). `de_zahl: "sg"`, wenn das russische
  Wort Plural ist, das deutsche aber nicht (часы́ = die Uhr) – für die übersetzte Frage „Wo ist …?“.
- `menue[]` (für Dialog/Bezahlen): `id`, `ru`, `de` (im Akkusativ-Sinn: „einen Tee“),
  `art` (frei wählbar, z. B. `getraenk`/`essen`/`extra`), `preis` (₽), optional `akk`
  (russischer Akkusativ, wenn er sich vom Nominativ unterscheidet: „минера́льную во́ду“),
  `auf_dem_tisch` (SVG-id), `hinweis`.
- `arten{}`: Überschriften der Speisekarte je Art, `{ "getraenk": { "ru": "Напи́тки", "de": "Getränke" } }`.
- `raeume[]` (optional, z. B. Wohnhaus): `id`, `ru`, `de`, `wo` (Präpositiv: „на ку́хне“), `wo_de`,
  `etage`, `etage_de`, `ansicht` [x, y, Breite, Höhe] im Bild, `hinweis`. Jedes Wort bekommt dann
  `raum`. Im Bild ist jedes Zimmer eine `<g id="raum-<id>" class="raum">` mit einer Fläche
  `class="raum-flaeche"`. Ermöglicht Zoom ins Zimmer und die Stufe `wo` („Wo ist das?“).
  `uebersicht`: Beschriftung des Zurück-Knopfs (z. B. „Ganzes Haus“).
  `etage_nr` (1 = Erdgeschoss) für die Stufe `etagen` (Stockwerke im Haus); `schild` [x, y]
  setzt das Namensschild (nötig bei nicht rechteckigen Räumen wie dem Dachboden).
- `entdecken_hinweis`: Text im leeren Wimmelbild.
- `etagen` (für die Stufe `aufzug`, optional): `haus` (Schild am Tastenfeld), `stockwerke` (bis 20),
  `bewohner[]` {`ru`, `de`} für Sätze wie „Ба́бушка живёт на пя́том этаже́“. Die Stufe legt ein
  Hochhaus mit Aufzug über das Bild; Ordnungszahlen liefert `Zahlwort.ordinal(n, 'nom'|'praep'|'gen')`.
- `tafel`: was auf die Kreidetafel im Bild passt, `{ "titel": "Напитки", "arten": ["getraenk"] }`.
- `dialog`: `start`, `figuren` (`stimme`: `weiblich`/`maennlich`, `name`, `blase` {x, y}
  als Anteil der Bildgröße, `seite: "links"` für Figuren am rechten Rand), `auftraege[]` (`de`, `teile[]` = Menü-ids), `knoten{}`.
  Knoten: `sprecher`, `text`, `de`, dann `optionen[]` oder `auswahl`
  (`art`, `muster` mit `{ru}`, `muster_de` mit `{de}`), `weiter`, `aktion`
  (`servieren`, `bezahlen`). Platzhalter im Text: `{summe}`, `{summe_de}`.
  Option: `text`, `de`, dann `weiter` oder `hinweis` (unpassend → Hinweis, bleibt)
  oder `ende: true`; optional `zahlart` (`bar`/`karte`).
  `auswahl`: Platzhalter `{akk}` (Akkusativ, sonst `ru`) oder `{ru}`; `wiederholen: true`
  fragt nach jeder Wahl erneut (für Extras), `abschluss` = Schluss-Option („Э́то всё“),
  richtig erst, wenn alles dieser Art vom Zettel bestellt ist.
  `dialog.zahlarten: true` würfelt pro Auftrag „bar“ oder „mit Karte“ aus; bei `aktion:
  "bezahlen"` öffnet sich dann Barkasse oder Kartenterminal (abgelehnt → bar).

- `reise` (für die Schalter-Stufen `pass`, `gepaeck`, `zoll`, `fahrkarte`, `zug`, `theke`, `kasse`,
  Baustein `schalter.js`):
  `figuren` (wie beim Dialog; `erzaehler` für Erzählsätze), `reisende[]` und `szenen{<stufe>}`.
  Reisende(r): `id`, `geschlecht` (`m`/`f`, bestimmt die eigene Stimme), `pass` {`familie`, `imya`,
  `otchestvo`, `geburt`}, `gepaeck` {`art`: `chemodan`/`sumka`/`ryukzak`, `farbe`, `gross`},
  `zettel{<stufe>: [Zeilen auf Deutsch]}`, `p{}` (Platzhalter `{…}` für Texte) und
  `felder{}` = `{ richtig: {text, de}, falsch: [{text, de, hinweis}] }`.
  Szene: `titel`, `zettel_titel`, `geschafft`, `start`, `knoten{}`. Knoten: `sprecher`, `text`, `de`,
  dann `optionen[]` (wie beim Dialog) oder `feld` (Antworten aus dem Feld der Reisenden),
  `weiter`, `pause` (ms), `aktion`: `stempel` (Pass), `bezahlen` (Kasse/Terminal, braucht
  `reisende[].preis`, optional `posten` als Text oder [{ru, preis}]), `drucken` (Fahrkarte erscheint),
  `scannen` (Waren aus `posten` laufen mit Piep über den Scanner). `reise.start_stufe`: wo eine
  neue Reise beginnt (Supermarkt: `einkaufen`). Optionen mit `zahlart`
  (`bar`/`karte`) werden gegen `reisende[].zahlart` geprüft. Statt `pass` kann eine Reise eine
  Fahrkarte `bilet` {`poezd`, `abfahrt`, `datum`, `ziel`, `wagen`, `mesto`, `klasse`, `preis`} haben;
  `szene.bilet_drucken: true` zeigt sie erst nach `drucken`. `reise.neu_knopf` beschriftet den
  Knopf für die nächste Reise. Eine Reise gilt für alle Schalter, bis man
  „Neue Reise“ wählt. Erzeugt werden Flughafen, Bahnhof und Supermarkt per Skript (`werkzeuge/aeroport_inhalt.py`,
  `werkzeuge/vokzal_inhalt.py`, `werkzeuge/supermarket_inhalt.py`, `werkzeuge/shkola_inhalt.py`), damit alle Formen
  einheitlich sind – Namen und Daten der Reisenden sind erfunden.

- `stundenplan` (Stufe `stundenplan`, derselbe Baustein): statt `zuege` gibt es `spalten[]`, `zeilen[]`
  {`id`, `zellen[]`} und `raster` (CSS-Spalten); `stil: "kreide"` schreibt die Tafel mit Kreide.
  Fragen verweisen mit `zeile` auf eine Zeile. `einkaufen_text` passt die Texte des Einkaufs an
  (Schule: Ranzen packen). Schalter-`aktion: "klingeln"` lässt `element` (Standard `hs-zvonok`) wackeln.
- `fahrplan` (Stufe `fahrplan`, Baustein `fahrplan.js`): `titel` der Fallblatt-Tafel, `zuege[]`
  {`id`, `nr`, `ziel`, `zeit`, `weg`, `status`, `verspaetet`} und `fragen[]` {`zug`, `text`, `de`,
  `richtig` {text, de}, `falsch` [{text, hinweis}]}. Eine Runde = 8 Fragen, möglichst je ein Zug.

- Stufe `einkaufen` (Baustein `einkaufen.js`): nutzt `reise.reisende[].liste` [{`ware` (Wort-id mit
  Klickfläche), `menge`, `text` (z. B. „три я́блока“), `de`, `bild` (Emoji)}] und `liste_satz` (wird
  vorgelesen). Jedes Antippen im Bild legt eins in den Korb; „Prüfen“ vergleicht die Mengen.
  Wörter mit `an_der_theke: true` bekommen den Hinweis „gibt es gleich an der Theke“.
  Bausteine mit `klickbar: true` machen das Bild antippbar (Mauszeiger).

- `rechnen` (Baustein `rechnen.js`): `nomen[]` {`id`, `ru` [1, 2–4, 5+], `g`, `de` [Sg, Pl], `bild`} und
  `aufgaben[]` {`op` (+/−), `nomen` [ids], `text`, `de` (Platzhalter {a} {b} {pl} {a_de} {b_de} {pl_de}),
  `a`/`b` [von, bis]}. Hör- und Leseaufgaben erzeugt der Baustein selbst (Zahlwort.js).
  Grammatik zum Antippen: Im `text` markiert `[Wörter|schlüssel]` eine Stelle, die Erklärung steht in
  `grammatik` {schlüssel: {`titel`, `text`}} (`\n` = Absatz). Enthält die Stelle {a}/{b}, wird die
  Zahlregel `zahl_1` / `zahl_2_4` / `zahl_5` / `zahl_11_14` ({menge}, {zahlwort}, {klingt}, {falle}) plus die
  Übersicht `zahl_alle` ({eins} {f1} {f2} {f5} = Formen des Nomens) angehängt. `person` {de, nom, gen, regel}
  einer Aufgabe füllt {p_de} {p_nom} {p_gen} {p_regel}. Der Server meldet fehlende Schlüssel.
  Anzeige über `Gorod.grammatikSatz(ziel, teile, box, sage)` in kern.js – auch für andere Bausteine nutzbar.
- `literatur` (Baustein `literatur.js`): `texte[]` {`id`, `titel`, `autor`, `jahr`, `bild`
  (repka/lukomorye/vorona/parus), `hinweis`, `zeilen` [{ru, de}], `fragen` [{text, de, zeile, richtig, falsch}]}.
  Nur gemeinfreie Texte verwenden.
- `wege` (Baustein `wege.js`, Stufe „Gehen & Fahren“ – Verben der Bewegung): `fragen[]` {`muster`
  (`jetzt`, `regel`, `umher`, `hin_zurueck`, `unterwegs`, `los`, `zukunft`, `zukunft_regel`), `bild` {`art` geh/fahr,
  `mittel` fuss/bus/auto/metro/zug, `ziel` {`icon` haus/stadt/meer/datscha/park, `schild`, `farbe`}, `zeit` (Schild oben),
  `tage` (0 = пн … 6 = вс), `ereignis` telefon/regen, `leer`, `geist`}, `vor` {text, de}, `text` (Lücke = …), `de`,
  `richtig` {`text`, `satz`, `erklaerung`}, `falsch` [{`text`, `hinweis`}]}. Die Szene über dem Bild zeigt das Muster
  als Bewegung (einmal hin, hin und zurück, Wochentage, umher, Haus bleibt leer, blass = geplant).
  Erzeugt von `werkzeuge/wege.py` (`from wege import fragen`) – jedes Modul kann die Stufe so bekommen; Bahnhof nutzt sie.
  Lernschritte 1–7 stecken im Baustein (`STUFEN`): Zu Fuß/fahren → jetzt/regelmäßig → Gegenwart komplett →
  Vergangenheit (war dort / unterwegs) → + losgegangen → Zukunft (einmal / regelmäßig) → alles gemischt. Jeder Schritt
  zeigt nur die Antworten, die sich im geübten Punkt unterscheiden (`richtig.m` / `falsch[].m` = [art, typ, zeit]).
  Ab Schritt 2 kommt vor der Verbwahl ein Zwischenschritt „Was zeigt das Bild?“ (`schritt` {frage, texte, bildhinweis, merke}).
  Sterne je Schritt: `stand.wege_stufen`, zuletzt gewählter Schritt: `stand.wege_stufe`.

## Grammatik zum Antippen (alle Gebäude)

Jeder russische Satz, den ein Baustein anzeigt (Fragen, Lösungssätze, Gesprächszeilen,
Einkaufszettel, Kassensatz), läuft durch `Gorod.satz(el, text)`. Gefundene Stellen
(Präposition + Fall, Zahl + Nomen, Datum, Verben, feste Wendungen …) sind gepunktet
unterstrichen; Antippen zeigt die Erklärung. Antwort-Knöpfe bleiben ohne Stellen.

- Regeln: `werkzeuge/grammatik_regeln.py` → `static/grammatik.json` (nie von Hand ändern).
  Reihenfolge = Vorrang. Grundformen („Москва́ → в Москве́“) im `LEXIKON` dort.
- Suche: `static/grammatik.js` (ohne Betonung, е statt ё; Regeln mit `betont` sehen die Betonung).
- Prüfen: `node werkzeuge/grammatik_pruefen.js` zeigt je Regel Treffer über alle Module,
  `… pruefen.js <regel-id>` alle Treffer einer Regel mit Erklärung. Nach neuen Inhalten laufen lassen.
- Ein Modul muss nichts dafür tun. Mathe (`rechnen`) hat zusätzlich eigene, handgeschriebene Stellen.

## Grafik

- `innen.svg`, viewBox frei (Café: 0 0 1000 620). Jede Klickfläche ist eine
  `<g id="hs-…" class="hotspot">`; ein unsichtbares `<rect class="treffer"
  fill="transparent">` vergrößert die Fläche für kleine Dinge.
- Was erst beim Servieren erscheint: `<g id="tisch-…" class="aufgetischt">`.
- Eine Kreidetafel `<g id="tafel-text">` füllt der Kern mit dem Menü.
- ids in Mustern/Verläufen mit Modul-Präfix (`cafe-…`), damit sich Module nicht stören.
- Text im Bild: Schriften des Kerns (`Caveat`, `PT Serif`, `Playfair Display`).
