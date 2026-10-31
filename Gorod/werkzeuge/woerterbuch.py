"""Wörterbuch zum Antippen: jede russische Wortform der Inhalte → Grundform, Deutsch, Form.

Sammelt alle russischen Texte (module/*/*.json und russische Zeilen in static/*.js, static/bausteine/*.js),
liest die Einträge aus werkzeuge/woerterbuch/teil_*.py
    EINTRAEGE = {"форма": ("гру́ндформа", "deutsch", "Form")}
(Schlüssel ohne Betonung, е statt ё, klein) und schreibt static/woerterbuch.json.
Fehlende Formen stehen danach mit Beispielsatz in werkzeuge/woerterbuch/offen.txt.

Aufruf: python werkzeuge/woerterbuch.py           – bauen und Lücken melden
        python werkzeuge/woerterbuch.py --teile 3 – offene Formen zusätzlich auf offen_1..3.txt verteilen
"""
import glob
import importlib.util
import json
import os
import re
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDNER = os.path.join(WURZEL, "werkzeuge", "woerterbuch")
WORT = re.compile(r"[А-Яа-яЁё́]+(?:-[А-Яа-яЁё́]+)*")


def schluessel(w):
    return w.replace("́", "").replace("ё", "е").replace("Ё", "Е").lower()


def texte():
    """Alle Texte mit kyrillischen Buchstaben, in fester Reihenfolge."""
    def lauf(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for v in x.values():
                yield from lauf(v)
        elif isinstance(x, list):
            for v in x:
                yield from lauf(v)
    for p in sorted(glob.glob(os.path.join(WURZEL, "module", "*", "*.json"))):
        yield from lauf(json.load(open(p, encoding="utf-8")))
    js = sorted(glob.glob(os.path.join(WURZEL, "static", "*.js")) + glob.glob(os.path.join(WURZEL, "static", "bausteine", "*.js")))
    for p in js:
        for zeile in open(p, encoding="utf-8"):
            if re.search("[А-Яа-яЁё]", zeile) and "А-Я" not in zeile:      # Regex-Zeichenklassen sind keine Wörter
                yield zeile.strip()


def formen():
    """Wortform (Schlüssel) → erster Beispielsatz."""
    beispiel = {}
    for t in texte():
        for w in WORT.findall(t):
            k = schluessel(w).strip("-")
            if k and k not in beispiel:
                beispiel[k] = " ".join(t.split())[:110]
    return beispiel


def eintraege():
    alle = {}
    for p in sorted(glob.glob(os.path.join(ORDNER, "teil_*.py"))):
        spec = importlib.util.spec_from_file_location(os.path.basename(p)[:-3], p)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        for k, v in mod.EINTRAEGE.items():
            alle[schluessel(k)] = list(v) if v else None      # None = kein Wort (Code, Buchstabenfolge)
    return alle


def main():
    os.makedirs(ORDNER, exist_ok=True)
    beispiel = formen()
    daten = eintraege()
    offen = sorted(k for k in beispiel if k not in daten)
    json.dump({k: v for k, v in daten.items() if v}, open(os.path.join(WURZEL, "static", "woerterbuch.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    with open(os.path.join(ORDNER, "offen.txt"), "w", encoding="utf-8") as f:
        for k in offen:
            f.write(f"{k}\t{beispiel[k]}\n")
    if "--teile" in sys.argv:
        n = int(sys.argv[sys.argv.index("--teile") + 1])
        stueck = -(-len(offen) // n)
        for i in range(n):
            with open(os.path.join(ORDNER, f"offen_{i + 1}.txt"), "w", encoding="utf-8") as f:
                for k in offen[i * stueck:(i + 1) * stueck]:
                    f.write(f"{k}\t{beispiel[k]}\n")
    print(f"ok {len(daten)} Einträge, {len(beispiel)} Formen in den Inhalten, {len(offen)} offen -> woerterbuch/offen.txt")


if __name__ == "__main__":
    main()
