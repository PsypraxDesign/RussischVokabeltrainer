"""Город — lokaler Server der Stadt-Lern-App.

Liefert den Kern (static/), die Gebaeude-Module (module/<name>/) und
speichert den Spielstand sofort in daten/spielstand.json.

Jedes Modul ist ein Ordner mit modul.json, inhalt.json und grafik/.
Beim Start prueft der Server jedes Modul gegen die Modul-Beschreibung
(siehe MODULE.md) und meldet Fehler an die Oberflaeche, statt still
zu scheitern.
"""

import json
import os
import re
import shutil
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

BASIS = Path(__file__).resolve().parent
STATIC = BASIS / "static"
MODULE = BASIS / "module"
# Für Tests: GOROD_DATEN und GOROD_PORT setzen, damit der Spielstand des
# Nutzers und sein laufender Server unberührt bleiben.
DATEN = Path(os.environ.get("GOROD_DATEN", BASIS / "daten"))
SPIELSTAND = DATEN / "spielstand.json"

# Stimmen und Schluessel kommen aus dem Vokabeltrainer — nur diese Dateien,
# damit es Azure-Modul und Schluessel weiterhin nur einmal gibt.
VOKABELTRAINER = BASIS.parent / "Vokabeltrainer"
GETEILT = {
    "api-key.js": VOKABELTRAINER / "api-key.js",
    "tts.js": VOKABELTRAINER / "js" / "tts.js",
    "azure-tts.js": VOKABELTRAINER / "js" / "azure-tts.js",
}

PORT = int(os.environ.get("GOROD_PORT", 5083))

app = Flask(__name__, static_folder=None)


# ---------------------------------------------------------------------------
# Modul-Pruefung
# ---------------------------------------------------------------------------
SCHALTER = {"pass", "gepaeck", "zoll", "fahrkarte", "zug", "theke", "kasse", "unterricht"}   # schalter.js
TAFELN = {"fahrplan", "stundenplan"}   # fahrplan.js: Abfahrtstafel / Stundenplan
STUFEN = {"entdecken", "hoeren", "dialog", "bezahlen", "wo", "etagen", "aufzug", "einkaufen", "rechnen", "literatur", "wege"} | SCHALTER | TAFELN


def _pflicht(obj, schluessel, typ, ort, fehler):
    if not isinstance(obj, dict) or schluessel not in obj:
        fehler.append(f"{ort}: '{schluessel}' fehlt")
        return None
    wert = obj[schluessel]
    if not isinstance(wert, typ):
        fehler.append(f"{ort}: '{schluessel}' hat den falschen Typ")
        return None
    return wert


def pruefe_modul(ordner: Path):
    """Gibt (modul_info, fehlerliste) zurueck."""
    fehler = []
    name = ordner.name
    try:
        modul = json.loads((ordner / "modul.json").read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None, [f"{name}: modul.json fehlt"]
    except json.JSONDecodeError as e:
        return None, [f"{name}/modul.json: kein gueltiges JSON ({e})"]
    try:
        inhalt = json.loads((ordner / "inhalt.json").read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None, [f"{name}: inhalt.json fehlt"]
    except json.JSONDecodeError as e:
        return None, [f"{name}/inhalt.json: kein gueltiges JSON ({e})"]

    ort = f"{name}/modul.json"
    _pflicht(modul, "titel", dict, ort, fehler)
    praep = _pflicht(modul, "praeposition", str, ort, fehler)
    if praep and praep not in ("в", "на"):
        fehler.append(f"{ort}: 'praeposition' muss в oder на sein")
    stufen = _pflicht(modul, "stufen", list, ort, fehler) or []
    for s in stufen:
        if s not in STUFEN:
            fehler.append(f"{ort}: unbekannte Stufe '{s}'")
    grafik = _pflicht(modul, "grafik", dict, ort, fehler) or {}
    svg_text = {}
    for art in ("aussen", "innen"):
        datei = grafik.get(art)
        if not datei:
            fehler.append(f"{ort}: grafik.{art} fehlt")
            continue
        pfad = ordner / datei
        if not pfad.exists():
            fehler.append(f"{ort}: Grafik {datei} fehlt")
        else:
            svg_text[art] = pfad.read_text(encoding="utf-8")

    # Klickflaechen muessen in der Innen-Grafik existieren
    innen = svg_text.get("innen", "")
    ids_im_bild = set(re.findall(r'\bid="([^"]+)"', innen))
    ort = f"{name}/inhalt.json"
    woerter = _pflicht(inhalt, "woerter", list, ort, fehler) or []
    wort_ids = set()
    for i, w in enumerate(woerter):
        wo = f"{ort} woerter[{i}]"
        for k in ("id", "ru", "de", "hotspot"):
            _pflicht(w, k, str, wo, fehler)
        if isinstance(w, dict):
            wort_ids.add(w.get("id"))
            if innen and w.get("hotspot") not in ids_im_bild:
                fehler.append(f"{wo}: Klickflaeche '{w.get('hotspot')}' nicht in der Grafik")

    raeume = inhalt.get("raeume")
    if raeume is not None:
        raum_ids = set()
        for i, r in enumerate(raeume):
            wo = f"{ort} raeume[{i}]"
            for k in ("id", "ru", "de", "wo"):
                _pflicht(r, k, str, wo, fehler)
            a = r.get("ansicht")
            if not (isinstance(a, list) and len(a) == 4):
                fehler.append(f"{wo}: 'ansicht' braucht [x, y, Breite, Hoehe]")
            raum_ids.add(r.get("id"))
            if innen and f"raum-{r.get('id')}" not in ids_im_bild:
                fehler.append(f"{wo}: Gruppe 'raum-{r.get('id')}' fehlt in der Grafik")
        for i, w in enumerate(woerter):
            if isinstance(w, dict) and w.get("raum") not in raum_ids:
                fehler.append(f"{ort} woerter[{i}]: Zimmer '{w.get('raum')}' unbekannt")
    elif "wo" in stufen:
        fehler.append(f"{ort}: Stufe 'wo' braucht 'raeume'")

    if "dialog" in stufen:
        dialog = _pflicht(inhalt, "dialog", dict, ort, fehler) or {}
        knoten = dialog.get("knoten", {})
        start = dialog.get("start")
        if start not in knoten:
            fehler.append(f"{ort}: dialog.start '{start}' ist kein Knoten")
        for kid, k in knoten.items():
            ziele = [o.get("weiter") for o in k.get("optionen", []) if o.get("weiter")]
            if k.get("weiter"):
                ziele.append(k["weiter"])
            for z in ziele:
                if z not in knoten:
                    fehler.append(f"{ort}: Knoten '{kid}' verweist auf unbekannten Knoten '{z}'")
        menue = inhalt.get("menue", [])
        menue_ids = {m.get("id") for m in menue}
        menue_arten = {m.get("art") for m in menue}
        for kid, k in knoten.items():
            a = k.get("auswahl")
            if a and a.get("art") not in menue_arten:
                fehler.append(f"{ort}: Knoten '{kid}' waehlt aus Art '{a.get('art')}', die im Menue fehlt")
            for o in k.get("optionen", []):
                if o.get("zahlart") and o["zahlart"] not in ("bar", "karte"):
                    fehler.append(f"{ort}: Knoten '{kid}': zahlart muss bar oder karte sein")
        for a in dialog.get("auftraege", []):
            for teil in a.get("teile", []):
                if teil not in menue_ids:
                    fehler.append(f"{ort}: Auftrag nennt unbekanntes Gericht '{teil}'")
        for m in menue:
            sid = m.get("auf_dem_tisch")
            if sid and innen and sid not in ids_im_bild:
                fehler.append(f"{ort}: Tisch-Grafik '{sid}' fuer {m.get('id')} fehlt")

    if SCHALTER & set(stufen):
        reise = _pflicht(inhalt, "reise", dict, ort, fehler) or {}
        reisende = reise.get("reisende") or []
        if not reisende:
            fehler.append(f"{ort}: reise.reisende ist leer")
        figuren = reise.get("figuren", {})
        for s in [x for x in stufen if x in SCHALTER]:
            szene = (reise.get("szenen") or {}).get(s)
            if not isinstance(szene, dict):
                fehler.append(f"{ort}: reise.szenen.{s} fehlt")
                continue
            knoten = szene.get("knoten", {})
            if szene.get("start") not in knoten:
                fehler.append(f"{ort}: reise.szenen.{s}.start ist kein Knoten")
            for kid, k in knoten.items():
                wo = f"{ort} szenen.{s}.{kid}"
                if k.get("sprecher") not in figuren:
                    fehler.append(f"{wo}: Sprecher '{k.get('sprecher')}' fehlt in reise.figuren")
                if not (k.get("optionen") or k.get("feld") or k.get("weiter")):
                    fehler.append(f"{wo}: Sackgasse (weder optionen noch feld noch weiter)")
                ziele = [o.get("weiter") for o in k.get("optionen", []) if o.get("weiter")]
                if k.get("weiter"):
                    ziele.append(k["weiter"])
                for z in ziele:
                    if z not in knoten:
                        fehler.append(f"{wo}: verweist auf unbekannten Knoten '{z}'")
                if k.get("feld"):
                    for r in reisende:
                        f = (r.get("felder") or {}).get(k["feld"])
                        if not (isinstance(f, dict) and "richtig" in f and f.get("falsch")):
                            fehler.append(f"{wo}: Reisende(r) '{r.get('id')}' hat kein Feld '{k['feld']}'")
                if k.get("aktion") == "bezahlen":
                    for r in reisende:
                        if not isinstance(r.get("preis"), int) or r["preis"] <= 0:
                            fehler.append(f"{wo}: Reisende(r) '{r.get('id')}' braucht 'preis' zum Bezahlen")

    if "einkaufen" in stufen:
        reisende = (inhalt.get("reise") or {}).get("reisende") or []
        if not reisende:
            fehler.append(f"{ort}: Stufe 'einkaufen' braucht reise.reisende mit 'liste'")
        for r in reisende:
            for posten in r.get("liste") or []:
                if posten.get("ware") not in wort_ids:
                    fehler.append(f"{ort}: Einkauf '{r.get('id')}': Ware '{posten.get('ware')}' ist kein Wort mit Klickflaeche")
            if not r.get("liste"):
                fehler.append(f"{ort}: Einkauf '{r.get('id')}' hat keine 'liste'")

    if "rechnen" in stufen:
        r = _pflicht(inhalt, "rechnen", dict, ort, fehler) or {}
        nomen_ids = {n.get("id") for n in r.get("nomen", []) if len(n.get("ru", [])) == 3}
        if not nomen_ids:
            fehler.append(f"{ort}: rechnen.nomen braucht Woerter mit drei Formen")
        for i, a in enumerate(r.get("aufgaben", [])):
            if a.get("op") not in ("+", "−") or not set(a.get("nomen", [])) <= nomen_ids:
                fehler.append(f"{ort}: rechnen.aufgaben[{i}]: op muss + oder − sein, Nomen muessen existieren")
            for key in re.findall(r"\[[^\]|]+\|(\w+)\]", a.get("text", "")):
                if key not in r.get("grammatik", {}):
                    fehler.append(f"{ort}: rechnen.aufgaben[{i}]: Grammatik-Schluessel '{key}' fehlt in rechnen.grammatik")

    if "literatur" in stufen:
        lit = _pflicht(inhalt, "literatur", dict, ort, fehler) or {}
        if not lit.get("texte"):
            fehler.append(f"{ort}: literatur.texte ist leer")
        for t in lit.get("texte", []):
            if not t.get("zeilen") or not t.get("fragen"):
                fehler.append(f"{ort}: Text '{t.get('id')}' braucht zeilen und fragen")
            for i, f in enumerate(t.get("fragen", [])):
                if not (f.get("richtig") and f.get("falsch")):
                    fehler.append(f"{ort}: Text '{t.get('id')}' Frage {i}: richtig und falsch fehlen")
                if f.get("zeile") is not None and not 0 <= f["zeile"] < len(t.get("zeilen", [])):
                    fehler.append(f"{ort}: Text '{t.get('id')}' Frage {i}: Zeile {f['zeile']} gibt es nicht")

    if "wege" in stufen:
        wege = _pflicht(inhalt, "wege", dict, ort, fehler) or {}
        if not wege.get("fragen"):
            fehler.append(f"{ort}: wege.fragen ist leer")
        for i, f in enumerate(wege.get("fragen", [])):
            texte = [(f.get("richtig") or {}).get("text")] + [x.get("text") for x in f.get("falsch", [])]
            if "…" not in f.get("text", "") or not f.get("bild") or len(texte) < 2 or len(set(texte)) != len(texte):
                fehler.append(f"{ort}: wege.fragen[{i}]: braucht Lücke (…), bild, richtig und verschiedene falsche Antworten")

    for tafel in [x for x in stufen if x in TAFELN]:
        fp = _pflicht(inhalt, tafel, dict, ort, fehler) or {}
        zug_ids = {z.get("id") for z in (fp.get("zuege") or fp.get("zeilen") or [])}
        if not zug_ids:
            fehler.append(f"{ort}: {tafel} braucht zuege oder zeilen")
        for i, f in enumerate(fp.get("fragen", [])):
            wo = f"{ort} {tafel}.fragen[{i}]"
            if (f.get("zeile") or f.get("zug")) not in zug_ids:
                fehler.append(f"{wo}: unbekannte Zeile '{f.get('zeile') or f.get('zug')}'")
            if not (isinstance(f.get("richtig"), dict) and f.get("falsch")):
                fehler.append(f"{wo}: braucht richtig und falsch")
            texte = [f.get("richtig", {}).get("text")] + [x.get("text") for x in f.get("falsch", [])]
            if len(set(texte)) != len(texte):
                fehler.append(f"{wo}: zwei Antworten sind gleich")

    info = {
        "id": name,
        "titel": modul.get("titel"),
        "praeposition": modul.get("praeposition"),
        "satz_hin": modul.get("satz_hin"),
        "satz_hin_de": modul.get("satz_hin_de"),
        "stufen": stufen,
        "stufen_titel": modul.get("stufen_titel") or {},
        "lage": modul.get("lage", {}),
        "grafik": grafik,
        "farbe": modul.get("farbe"),
        "breite": modul.get("breite"),
    }
    return info, fehler


@app.get("/api/module")
def api_module():
    module, fehler = [], []
    if MODULE.exists():
        for ordner in sorted(p for p in MODULE.iterdir() if p.is_dir()):
            info, f = pruefe_modul(ordner)
            fehler.extend(f)
            if info and not f:
                module.append(info)
    return jsonify({"module": module, "fehler": fehler})


@app.get("/api/module/<name>/inhalt")
def api_inhalt(name):
    ordner = MODULE / name
    if not re.fullmatch(r"[a-z0-9_-]+", name) or not ordner.is_dir():
        abort(404)
    return send_from_directory(ordner, "inhalt.json")


@app.get("/module/<path:pfad>")
def modul_datei(pfad):
    return send_from_directory(MODULE, pfad)


# ---------------------------------------------------------------------------
# Spielstand — sofort auf die Platte, vorherige Fassung als .bak
# ---------------------------------------------------------------------------
@app.get("/api/spielstand")
def spielstand_laden():
    if SPIELSTAND.exists():
        try:
            return jsonify(json.loads(SPIELSTAND.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            # Kaputte Datei nie ueberschreiben — beiseitelegen und melden
            kaputt = SPIELSTAND.with_suffix(".kaputt.json")
            shutil.copy2(SPIELSTAND, kaputt)
            return jsonify({"_warnung": f"Spielstand war beschaedigt, gesichert als {kaputt.name}"})
    return jsonify({})


@app.post("/api/spielstand")
def spielstand_speichern():
    stand = request.get_json(silent=True)
    if not isinstance(stand, dict):
        abort(400)
    DATEN.mkdir(exist_ok=True)
    if SPIELSTAND.exists():
        shutil.copy2(SPIELSTAND, SPIELSTAND.with_suffix(".bak"))
    tmp = SPIELSTAND.with_suffix(".tmp")
    tmp.write_text(json.dumps(stand, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, SPIELSTAND)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Kern und geteilte Dateien
# ---------------------------------------------------------------------------
@app.get("/geteilt/<name>")
def geteilt(name):
    pfad = GETEILT.get(name)
    if not pfad or not pfad.exists():
        # Fehlt die Schluesseldatei, laeuft die App mit Browser-Stimmen weiter
        return ("/* nicht vorhanden */", 200, {"Content-Type": "application/javascript"})
    return send_from_directory(pfad.parent, pfad.name)


@app.get("/")
def startseite():
    return send_from_directory(STATIC, "index.html")


@app.get("/favicon.ico")
def symbol():
    return send_from_directory(STATIC, "symbol.svg", mimetype="image/svg+xml")


@app.get("/static/<path:pfad>")
def statisch(pfad):
    return send_from_directory(STATIC, pfad)


@app.after_request
def kein_cache(antwort):
    # Waehrend der Entwicklung immer frisch laden
    antwort.headers["Cache-Control"] = "no-store"
    return antwort


# ---------------------------------------------------------------------------
# Ein neuer Start löst einen noch laufenden alten Server ab.
# Windows lässt zwei Server auf demselben Port zu — dann antwortet weiter der
# alte, und neue Programmteile fehlen (29.10.2026: Stufe „Stockwerke“ unsichtbar).
# ---------------------------------------------------------------------------
@app.post("/api/beenden")
def beenden():
    # Nur von diesem Rechner und mit eigenem Kopf — ein fremder Browser-Tab
    # kann diesen Kopf nicht ohne Vorab-Anfrage setzen, die hier nie erlaubt wird.
    if request.remote_addr != "127.0.0.1" or request.headers.get("X-Gorod") != "neustart":
        abort(403)
    import threading
    threading.Timer(0.3, lambda: os._exit(0)).start()
    return jsonify({"ok": True})


def alten_server_abloesen():
    import socket
    import time
    import urllib.request

    def belegt():
        with socket.socket() as s:
            s.settimeout(0.3)
            return s.connect_ex(("127.0.0.1", PORT)) == 0

    if not belegt():
        return
    print("Ein alter Gorod-Server laeuft noch - er wird beendet ...")
    try:
        anfrage = urllib.request.Request(f"http://127.0.0.1:{PORT}/api/beenden", method="POST",
                                         headers={"X-Gorod": "neustart"})
        urllib.request.urlopen(anfrage, timeout=2).read()
    except Exception:
        pass   # alter Stand ohne diese Route: siehe Hinweis unten
    for _ in range(30):
        if not belegt():
            return
        time.sleep(0.1)
    print(f"ACHTUNG: Port {PORT} ist weiter belegt. Bitte das alte Server-Fenster schliessen.")


if __name__ == "__main__":
    # Beim Neuladen (Reloader) läuft dieser Teil im Kindprozess erneut — dort ist
    # der Port dann schon frei.
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        alten_server_abloesen()
        print(f"Gorod laeuft auf http://localhost:{PORT}")
    # use_reloader: Änderungen an server.py werden ohne Neustart übernommen
    app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=True)
