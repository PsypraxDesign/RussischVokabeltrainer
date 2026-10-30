"""Erzeugt module/shkola/modul.json und inhalt.json (Schule).

Ranzen packen (Zahl + Akkusativ), Stundenplan (Wochentage, Ordnungszahlen, уро́ка/уро́ков)
und Unterricht (Name, Alter, Klasse, Lieblingsfach) entstehen hier aus wenigen Tabellen.
Alle Schülerinnen und Schüler sind erfunden. Aufruf aus dem Gorod-Ordner:
    python werkzeuge/shkola_inhalt.py
"""
import json, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "module", "shkola")
os.makedirs(os.path.join(B, "grafik"), exist_ok=True)

modul = {
  "titel": {"ru": "шко́ла", "de": "Schule"},
  "praeposition": "в",
  "satz_hin": "Я иду́ в шко́лу.",
  "satz_hin_de": "Ich gehe in die Schule.",
  "stufen": ["entdecken", "hoeren", "einkaufen", "stundenplan", "unterricht"],
  "stufen_titel": {"einkaufen": "Ranzen packen"},
  "grafik": {"aussen": "grafik/aussen.svg", "innen": "grafik/innen.svg"},
  "farbe": "#c8862f",
  "breite": 260
}

W = [  # id, ru, de, genus, Satz, Hinweis
 ("doska", "доска́", "die Tafel", "f", "Доска́ виси́т на стене́.", "у доски́ – an der Tafel"),
 ("mel", "мел", "die Kreide", "m", "Мел лежи́т у доски́.", "nur Singular: мел"),
 ("uchitelnitsa", "учи́тельница", "die Lehrerin", "f", "Учи́тельница стои́т у доски́.", "männlich: учи́тель. Man spricht sie mit Vor- und Vatersnamen an: Мари́я Ива́новна"),
 ("uchenik", "учени́к", "der Schüler", "m", "Учени́к сиди́т за па́ртой.", "Plural: ученики́"),
 ("uchenitsa", "учени́ца", "die Schülerin", "f", "Учени́ца пи́шет в тетра́ди.", None),
 ("parta", "па́рта", "die Schulbank", "f", "За па́ртой сидя́т ученики́.", "за па́ртой – an der Schulbank"),
 ("okno", "окно́", "das Fenster", "n", "За окно́м о́сень.", None),
 ("zvonok", "звоно́к", "die Schulklingel", "m", "Звоно́к звени́т в конце́ уро́ка.", "звоно́к heißt auch „der Anruf“"),
 ("karta", "ка́рта", "die Landkarte", "f", "На ка́рте – вся Росси́я.", "auch: die Karte (Bankkarte, Kundenkarte)"),
 ("globus", "гло́бус", "der Globus", "m", "Гло́бус стои́т на столе́.", None),
 ("zhurnal", "журна́л", "das Klassenbuch", "m", "Учи́тельница пи́шет в журна́ле.", "Hier stehen die Noten: пятёрка (5) ist die beste, дво́йка (2) eine schlechte"),
 ("tetradi", "тетра́ди", "die Hefte", "pl", "Тетра́ди лежа́т на па́рте.", "Singular: тетра́дь – weiblich!"),
 ("ruchki", "ру́чки", "die Kulis", "pl", "Ру́чки стоя́т в стака́не.", "Singular: ру́чка"),
 ("karandashi", "карандаши́", "die Bleistifte", "pl", "Карандаши́ стоя́т в стака́не.", "Singular: каранда́ш"),
 ("uchebniki", "уче́бники", "die Schulbücher", "pl", "Уче́бники лежа́т на па́рте.", "Singular: уче́бник"),
 ("lineyka", "лине́йка", "das Lineal", "f", "Лине́йка лежи́т на па́рте.", None),
 ("lastik", "ла́стик", "der Radiergummi", "m", "Ла́стик лежи́т на па́рте.", None),
 ("ryukzak", "рюкза́к", "der Schulranzen", "m", "Рюкза́к стои́т на полу́.", "auch: портфе́ль – die Schultasche"),
]

# ------------------------------------------------------------------ Ranzen packen (Akkusativ)
SACHEN = {  # Akkusativ-Formen (1 / 2–4 / 5+), Genus, deutsch Sg/Pl, Bild
 "tetradi": (("тетра́дь", "тетра́ди", "тетра́дей"), "f", "Heft", "Hefte", "📓"),
 "ruchki": (("ру́чку", "ру́чки", "ру́чек"), "f", "Kuli", "Kulis", "🖊️"),
 "karandashi": (("каранда́ш", "карандаша́", "карандаше́й"), "m", "Bleistift", "Bleistifte", "✏️"),
 "uchebniki": (("уче́бник", "уче́бника", "уче́бников"), "m", "Schulbuch", "Schulbücher", "📘"),
 "lineyka": (("лине́йку", "лине́йки", "лине́ек"), "f", "Lineal", "Lineale", "📏"),
 "lastik": (("ла́стик", "ла́стика", "ла́стиков"), "m", "Radiergummi", "Radiergummis", "🧽"),
}
ZAHL_AKK = {1: {"m": "оди́н", "f": "одну́"}, 2: {"m": "два", "f": "две"}, 3: "три", 4: "четы́ре", 5: "пять", 6: "шесть"}

def sache(ware, n):
    formen, genus, sg, pl, bild = SACHEN[ware]
    zahl = ZAHL_AKK[n][genus] if isinstance(ZAHL_AKK[n], dict) else ZAHL_AKK[n]
    form = formen[0] if n == 1 else formen[1] if n <= 4 else formen[2]
    return {"ware": ware, "menge": n, "text": f"{zahl} {form}", "de": f"{n} {sg if n == 1 else pl}", "bild": bild}

def gross(t): return t[0].upper() + t[1:]

# ------------------------------------------------------------------ Stundenplan
FACH = {  # Tafel (kurz, ohne Betonung), Antwort, deutsch
 "mat": ("Математика", "матема́тика", "Mathe"), "rus": ("Русский", "ру́сский язы́к", "Russisch"),
 "cht": ("Чтение", "чте́ние", "Lesen"), "muz": ("Музыка", "му́зыка", "Musik"),
 "ang": ("Английский", "англи́йский язы́к", "Englisch"), "okr": ("Окр. мир", "окружа́ющий мир", "Sachkunde"),
 "ris": ("Рисование", "рисова́ние", "Kunst"), "fiz": ("Физкультура", "физкульту́ра", "Sport"),
}
TAGE = [  # id, Tafel, в + Akkusativ, deutsch, typische Fehlform (Text, Hinweis)
 ("pn", "Понедельник", "в понеде́льник", "Montag", ("В понеде́льнике.", "Wann? в + Akkusativ: в понеде́льник.")),
 ("vt", "Вторник", "во вто́рник", "Dienstag", ("В вто́рник.", "Vor вт- wird в zu во: во вто́рник.")),
 ("sr", "Среда", "в сре́ду", "Mittwoch", ("В среда́.", "в + Akkusativ: среда́ → в сре́ду (die Betonung wandert).")),
 ("cht", "Четверг", "в четве́рг", "Donnerstag", ("В четверге́.", "Wann? в + Akkusativ: в четве́рг.")),
 ("pt", "Пятница", "в пя́тницу", "Freitag", ("В пя́тница.", "в + Akkusativ: пя́тница → в пя́тницу.")),
]
PLAN = {"pn": ["mat", "rus", "cht", "muz"], "vt": ["rus", "mat", "ang", "okr", "cht"], "sr": ["mat", "ris", "cht"],
        "cht": ["ang", "rus", "fiz", "mat"], "pt": ["mat", "cht", "rus", "okr", "ang"]}
ORD_M = ["пе́рвый", "второ́й", "тре́тий", "четвёртый", "пя́тый"]
ORD_F = ["пе́рвая", "втора́я", "тре́тья", "четвёртая", "пя́тая"]
ANZAHL = {3: ("Три уро́ка.", "Три уро́ков.", "Nach 2, 3, 4 steht der Genitiv Singular: три уро́ка."),
          4: ("Четы́ре уро́ка.", "Четы́ре уро́ков.", "Nach 2, 3, 4 steht der Genitiv Singular: четы́ре уро́ка."),
          5: ("Пять уро́ков.", "Пять уро́ка.", "Ab 5 steht der Genitiv Plural: пять уро́ков.")}
TAG = {t[0]: t for t in TAGE}

def plan_fragen():
    fragen = []
    def ohne_doppelte(richtig, falsch):
        gesehen, aus = {richtig}, []
        for f in falsch:
            if f["text"] not in gesehen:
                gesehen.add(f["text"]); aus.append(f)
        return aus
    # A: Welches Fach in der n-ten Stunde?
    for tid, pos in [("pn", 0), ("vt", 2), ("sr", 1), ("cht", 3), ("pt", 4)]:
        _, tafel, akk, de, _ = TAG[tid]
        fach = PLAN[tid][pos]
        richtig = f"{gross(FACH[fach][1])}."
        falsch = []
        for p2 in (pos - 1, pos + 1):
            if 0 <= p2 < len(PLAN[tid]) and PLAN[tid][p2] != fach:
                falsch.append({"text": f"{gross(FACH[PLAN[tid][p2]][1])}.", "hinweis": f"Das ist die {p2 + 1}. Stunde am {de}. Gefragt ist die {pos + 1}."})
        for t2 in TAGE:
            if t2[0] != tid and pos < len(PLAN[t2[0]]) and PLAN[t2[0]][pos] != fach:
                falsch.append({"text": f"{gross(FACH[PLAN[t2[0]][pos]][1])}.", "hinweis": f"Das ist die {pos + 1}. Stunde am {t2[3]}. Schau in die Zeile {tafel}."})
        fragen.append({"zeile": tid, "text": f"Како́й {ORD_M[pos]} уро́к {akk}?", "de": f"Was ist die {pos + 1}. Stunde am {de}?",
                       "richtig": {"text": richtig, "de": FACH[fach][2] + "."}, "falsch": ohne_doppelte(richtig, falsch)[:2]})
    # B: Wann haben wir …? (nur Fächer, die an genau einem Tag stehen)
    for fach, tid in [("muz", "pn"), ("ris", "sr"), ("fiz", "cht")]:
        _, tafel, akk, de, (fehl, fehl_hinweis) = TAG[tid]
        anderer = TAG["vt"] if tid != "vt" else TAG["pt"]
        fragen.append({"zeile": tid, "text": f"Когда́ у нас {FACH[fach][1]}?", "de": f"Wann haben wir {FACH[fach][2]}?",
          "richtig": {"text": f"{gross(akk)}.", "de": f"Am {de}."},
          "falsch": [{"text": fehl, "hinweis": fehl_hinweis},
                     {"text": f"{gross(anderer[2])}.", "hinweis": f"{FACH[fach][2]} steht am {de} im Plan, nicht am {anderer[3]}."}]})
    # C: Wie viele Stunden?
    for tid, _, akk, de, _ in TAGE:
        n = len(PLAN[tid])
        richtig, fehlform, hinweis = ANZAHL[n]
        andere = 4 if n != 4 else 5
        fragen.append({"zeile": tid, "text": f"Ско́лько уро́ков {akk}?", "de": f"Wie viele Stunden sind am {de}?",
          "richtig": {"text": richtig, "de": f"{n} Stunden."},
          "falsch": [{"text": fehlform, "hinweis": hinweis},
                     {"text": ANZAHL[andere][0], "hinweis": f"Zähl nach: am {de} sind es {n} Stunden."}]})
    # D: Die wievielte Stunde?
    for fach, tid in [("muz", "pn"), ("ris", "sr"), ("fiz", "cht")]:
        _, tafel, akk, de, _ = TAG[tid]
        pos = PLAN[tid].index(fach)
        nachbar = pos - 1 if pos > 0 else pos + 1
        fragen.append({"zeile": tid, "text": f"Како́й по счёту уро́к {akk} – {FACH[fach][1]}?", "de": f"Die wievielte Stunde ist am {de} {FACH[fach][2]}?",
          "richtig": {"text": f"{gross(ORD_M[pos])}.", "de": f"Die {pos + 1}."},
          "falsch": [{"text": f"{gross(ORD_F[pos])}.", "hinweis": f"уро́к ist männlich: {ORD_M[pos]}."},
                     {"text": f"{gross(ORD_M[nachbar])}.", "hinweis": f"{ORD_M[nachbar]} = die {nachbar + 1}. Stunde. Zähl in der Zeile {tafel}."}]})
    # E: An welchem Tag nur drei Stunden?
    fragen.append({"zeile": "sr", "text": "В како́й день у нас то́лько три уро́ка?", "de": "An welchem Tag haben wir nur drei Stunden?",
      "richtig": {"text": "В сре́ду.", "de": "Am Mittwoch."},
      "falsch": [{"text": "В среда́.", "hinweis": "в + Akkusativ: среда́ → в сре́ду."},
                 {"text": "В понеде́льник.", "hinweis": "Am Montag sind es vier Stunden."}]})
    return fragen

stundenplan = {
  "titel": "Расписа́ние уро́ков", "titel_de": "Stundenplan", "stufe_titel": "Stundenplan", "stil": "kreide",
  "spalten": ["День", "1", "2", "3", "4", "5"],
  "raster": "minmax(0, 1.15fr) repeat(5, minmax(0, 1fr))",
  "zeilen": [{"id": tid, "zellen": [tafel] + [FACH[f][0] for f in PLAN[tid]] + [""] * (5 - len(PLAN[tid]))}
             for tid, tafel, *_ in TAGE],
  "fragen": plan_fragen(),
}

# ------------------------------------------------------------------ Unterricht
JAHRE = {7: "семь", 8: "во́семь", 9: "де́вять", 10: "де́сять", 11: "оди́ннадцать"}
KLEIN = {1: ("оди́н год", "оди́н го́да", "Nach 1 steht год: оди́н год."),
         2: ("два го́да", "два лет", "Nach 2, 3, 4 steht го́да: два го́да."),
         3: ("три го́да", "три лет", "Nach 2, 3, 4 steht го́да: три го́да."),
         4: ("четы́ре го́да", "четы́ре лет", "Nach 2, 3, 4 steht го́да: четы́ре го́да.")}
KLASSE = {1: ("пе́рвом", "пе́рвый"), 2: ("второ́м", "второ́й"), 3: ("тре́тьем", "тре́тий"), 4: ("четвёртом", "четвёртый"), 5: ("пя́том", "пя́тый")}
LIEBLING = {"mat": ("матема́тика", "Mathe"), "ris": ("рисова́ние", "Kunst"), "fiz": ("физкульту́ра", "Sport"),
            "muz": ("му́зыка", "Musik"), "ist": ("исто́рия", "Geschichte"), "rus": ("ру́сский язы́к", "Russisch")}

def vo(klasse): return "Во" if klasse == 2 else "В"   # во второ́м: vor вт- wird в zu во

def akkusativ_name(name):
    # Ми́ша → Ми́шу, Ка́тя → Ка́тю (Betonungszeichen stehen nie am Wortende)
    return name[:-1] + ("ю" if name.endswith("я") else "у")

def schueler(id, g, name, name_de, alter, geschw, klasse, fach, sachen):
    gesch, gesch_alter = geschw          # ("bruder"|"schwester", 1–4)
    pron, pron_falsch = ("ему́", "ей") if gesch == "bruder" else ("ей", "ему́")
    wer_ru = "брат" if gesch == "bruder" else "сестра́"
    alter_ru, alter_falsch, alter_hinweis = KLEIN[gesch_alter]
    andere_kl = klasse + 1 if klasse < 5 else klasse - 1
    anderes_fach = "mat" if fach != "mat" else "muz"
    liste = [sache(w, n) for w, n in sachen]
    felder = {
      "imya": {"richtig": {"text": f"Меня́ зову́т {name}.", "de": f"Ich heiße {name_de}."},
        "falsch": [{"text": f"Мне зову́т {name}.", "de": "", "hinweis": "Wörtlich „mich nennt man“: меня́ зову́т (Akkusativ), nicht мне."},
                   {"text": f"Меня́ зову́т {akkusativ_name(name)}.", "de": "", "hinweis": f"Der Name selbst steht im Nominativ: {name}."}]},
      "alter": {"richtig": {"text": f"Мне {JAHRE[alter]} лет.", "de": f"Ich bin {alter} Jahre alt."},
        "falsch": [{"text": f"Мне {JAHRE[alter]} го́да.", "de": "", "hinweis": f"Ab 5 heißt es лет: {JAHRE[alter]} лет."},
                   {"text": f"Я {JAHRE[alter]} лет.", "de": "", "hinweis": "Das Alter steht mit dem Dativ: мне … лет (wörtlich „mir sind … Jahre“)."}]},
      "geschwister": {"richtig": {"text": f"Да, есть {wer_ru}. {gross(pron)} {alter_ru}.",
                                  "de": f"Ja, ich habe {'einen Bruder' if gesch == 'bruder' else 'eine Schwester'}. {'Er' if gesch == 'bruder' else 'Sie'} ist {gesch_alter}."},
        "falsch": [{"text": f"Да, есть {wer_ru}. {gross(pron_falsch)} {alter_ru}.", "de": "",
                    "hinweis": (f"Für den Bruder: ему́ (Dativ von он). ей ist weiblich." if gesch == "bruder"
                                else f"Für die Schwester: ей (Dativ von она́). ему́ ist männlich.")},
                   {"text": f"Да, есть {wer_ru}. {gross(pron)} {alter_falsch}.", "de": "", "hinweis": alter_hinweis}]},
      "klasse": {"richtig": {"text": f"{vo(klasse)} {KLASSE[klasse][0]} кла́ссе.", "de": f"In der {klasse}. Klasse."},
        "falsch": [{"text": f"{vo(klasse)} {KLASSE[klasse][1]} класс.", "de": "", "hinweis": f"Wo? в + Präpositiv: {vo(klasse).lower()} {KLASSE[klasse][0]} кла́ссе."},
                   {"text": f"{vo(andere_kl)} {KLASSE[andere_kl][0]} кла́ссе.", "de": "", "hinweis": f"{KLASSE[andere_kl][1]} = Klasse {andere_kl}. Laut Zettel gehst du in die {klasse}."}]},
      "fach": {"richtig": {"text": f"Мой люби́мый предме́т – {LIEBLING[fach][0]}.", "de": f"Mein Lieblingsfach ist {LIEBLING[fach][1]}."},
        "falsch": [{"text": f"Моя́ люби́мая предме́т – {LIEBLING[fach][0]}.", "de": "", "hinweis": "предме́т ist männlich: мой люби́мый предме́т."},
                   {"text": f"Мой люби́мый предме́т – {LIEBLING[anderes_fach][0]}.", "de": "",
                    "hinweis": f"{LIEBLING[anderes_fach][0]} heißt {LIEBLING[anderes_fach][1]}. Laut Zettel: {LIEBLING[fach][1]}."}]},
    }
    return {
      "id": id, "geschlecht": g,
      "liste": liste,
      "liste_satz": "Положи́, пожа́луйста, в рюкза́к: " + ", ".join(p["text"] for p in liste) + ".",
      "p": {"neu": "но́вый учени́к" if g == "m" else "но́вая учени́ца",
            "neu_de": "einen neuen Schüler" if g == "m" else "eine neue Schülerin"},
      "zettel": {"unterricht": [f"Du heißt {name}", f"Du bist {alter} Jahre alt",
                                f"{'Dein Bruder' if gesch == 'bruder' else 'Deine Schwester'} ist {gesch_alter}",
                                f"Du gehst in die {klasse}. Klasse", f"Lieblingsfach: {LIEBLING[fach][1]}"]},
      "felder": felder,
    }

R = [
 schueler("misha", "m", "Ми́ша", "Mischa", 9, ("schwester", 3), 3, "mat", [("tetradi", 2), ("ruchki", 1), ("karandashi", 5), ("uchebniki", 1)]),
 schueler("masha", "f", "Ма́ша", "Mascha", 8, ("bruder", 1), 2, "ris", [("tetradi", 1), ("ruchki", 3), ("lineyka", 1), ("uchebniki", 2)]),
 schueler("sasha", "m", "Са́ша", "Sascha", 10, ("schwester", 4), 4, "fiz", [("tetradi", 3), ("lastik", 1), ("ruchki", 2), ("karandashi", 6)]),
 schueler("katya", "f", "Ка́тя", "Katja", 7, ("bruder", 2), 1, "muz", [("ruchki", 1), ("karandashi", 4), ("tetradi", 1), ("lastik", 1)]),
 schueler("dima", "m", "Ди́ма", "Dima", 11, ("schwester", 1), 5, "ist", [("tetradi", 5), ("uchebniki", 2), ("lineyka", 1), ("ruchki", 2)]),
 schueler("anya", "f", "А́ня", "Anja", 9, ("bruder", 3), 3, "rus", [("tetradi", 4), ("lastik", 1), ("uchebniki", 3), ("karandashi", 1)]),
]

szenen = {
 "unterricht": {
  "titel": "Im Unterricht", "zettel_titel": "Das bist du",
  "geschafft": "Der erste Schultag ist geschafft!",
  "start": "gruss",
  "knoten": {
   "gruss": {"sprecher": "uchitelnitsa", "text": "До́брое у́тро, де́ти! Сади́тесь.", "de": "Guten Morgen, Kinder! Setzt euch.",
     "optionen": [
       {"text": "До́брое у́тро, Мари́я Ива́новна!", "de": "Guten Morgen, Maria Iwanowna!", "weiter": "imya"},
       {"text": "Приве́т, Мари́я!", "de": "Hallo, Maria!", "hinweis": "Lehrerinnen spricht man mit Vor- und Vatersnamen an und siezt sie: До́брое у́тро, Мари́я Ива́новна!"},
       {"text": "Споко́йной но́чи!", "de": "Gute Nacht!", "hinweis": "Das sagt man vor dem Schlafen. Am Morgen: До́брое у́тро!"}]},
   "imya": {"sprecher": "uchitelnitsa", "text": "У нас {neu}. Как тебя́ зову́т?", "de": "Wir haben {neu_de}. Wie heißt du?", "feld": "imya", "weiter": "alter"},
   "alter": {"sprecher": "uchitelnitsa", "text": "Ско́лько тебе́ лет?", "de": "Wie alt bist du?", "feld": "alter", "weiter": "geschwister"},
   "geschwister": {"sprecher": "uchitelnitsa", "text": "У тебя́ есть брат и́ли сестра́?", "de": "Hast du einen Bruder oder eine Schwester?", "feld": "geschwister", "weiter": "klasse"},
   "klasse": {"sprecher": "uchitelnitsa", "text": "Ты в како́м кла́ссе?", "de": "In welcher Klasse bist du?", "feld": "klasse", "weiter": "fach"},
   "fach": {"sprecher": "uchitelnitsa", "text": "Како́й твой люби́мый предме́т?", "de": "Was ist dein Lieblingsfach?", "feld": "fach", "weiter": "seite"},
   "seite": {"sprecher": "uchitelnitsa", "text": "Хорошо́. Откро́йте уче́бники на страни́це два́дцать пять.", "de": "Gut. Schlagt die Bücher auf Seite 25 auf.",
     "optionen": [
       {"text": "Извини́те, на како́й страни́це?", "de": "Entschuldigung, auf welcher Seite?", "weiter": "seite2"},
       {"text": "Что?!", "de": "Was?!", "hinweis": "Das klingt unhöflich. Höflich nachfragen: Извини́те, на како́й страни́це?"},
       {"text": "Извини́те, на како́м страни́це?", "de": "", "hinweis": "страни́ца ist weiblich: на како́й страни́це."}]},
   "seite2": {"sprecher": "uchitelnitsa", "text": "На два́дцать пя́той. Ну, начина́ем!", "de": "Auf der fünfundzwanzigsten. Also, wir fangen an!", "weiter": "glocke"},
   "glocke": {"sprecher": "erzaehler", "text": "Прошло́ со́рок пять мину́т… Звени́т звоно́к!", "de": "45 Minuten sind vergangen … Es klingelt!",
     "aktion": "klingeln", "weiter": "ende"},
   "ende": {"sprecher": "uchitelnitsa", "text": "Уро́к око́нчен. До свида́ния, де́ти!", "de": "Die Stunde ist zu Ende. Auf Wiedersehen, Kinder!",
     "optionen": [
       {"text": "До свида́ния, Мари́я Ива́новна!", "de": "Auf Wiedersehen, Maria Iwanowna!", "ende": True},
       {"text": "Пока́, Мари́я!", "de": "Tschüss, Maria!", "hinweis": "Zur Lehrerin sagt man nicht пока́: До свида́ния, Мари́я Ива́новна!"}]},
  }},
}

inhalt = {
  "entdecken_hinweis": "Was gibt es im Klassenzimmer? Tippe auf die Tafel, die Lehrerin, die Hefte …",
  "woerter": [dict(id=i, ru=ru, de=de, genus=g, hotspot="hs-" + i, satz=satz, **({"hinweis": h} if h else {}))
              for i, ru, de, g, satz, h in W],
  "einkaufen_text": {
    "titel": "Ranzen packen",
    "anleitung": "Hör dir an, was in den Rucksack soll, und tippe die Sachen im Bild an – so oft, wie es dasteht.",
    "zettel": "Что положи́ть в рюкза́к?", "korb": "Рюкза́к", "leer": "Noch leer. Tippe im Bild auf die Schulsachen.",
    "fertig": "Der Ranzen ist gepackt!", "weiter": "Weiter zum Stundenplan", "lob": "Молоде́ц! Рюкза́к гото́в.",
    "tipp": "Tipp: Nach положи́ steht der Akkusativ: одну́ ру́чку (1), две ру́чки (2–4), пять ру́чек (ab 5).",
  },
  "stundenplan": stundenplan,
  "reise": {
    "neu_knopf": "Neuer Schultag →",
    "start_stufe": "einkaufen",
    "figuren": {
      "uchitelnitsa": {"name": "Мари́я Ива́новна", "stimme": "weiblich", "blase": {"x": 0.7, "y": 0.43, "seite": "links"}},
      "erzaehler": {"name": "", "stimme": "erzaehler", "blase": {"x": 0.3, "y": 0.45}},
    },
    "reisende": R,
    "szenen": szenen,
  },
}
json.dump(modul, open(os.path.join(B, "modul.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(inhalt, open(os.path.join(B, "inhalt.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(R), "Schüler,", len(stundenplan["fragen"]), "Plan-Fragen,", len(W), "Wörter")
