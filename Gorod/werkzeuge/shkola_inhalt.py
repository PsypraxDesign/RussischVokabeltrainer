"""Erzeugt module/shkola/modul.json und inhalt.json (Schule).

Ranzen packen (Zahl + Akkusativ), Stundenplan (Wochentage, Ordnungszahlen, уро́ка/уро́ков),
Unterricht (Name, Alter, Klasse, Lieblingsfach), Mathe (Zahlen, Textaufgaben mit Kasus) und
Literatur (gemeinfreie Klassiker: Ре́пка, Пу́шкин, Крыло́в, Ле́рмонтов) entstehen hier.
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
  "stufen": ["entdecken", "hoeren", "einkaufen", "stundenplan", "unterricht", "rechnen", "literatur"],
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

# ------------------------------------------------------------------ Mathe
RECHNEN = {
  "stimme": "weiblich",
  "nomen": [  # Formen nach 1 / 2–4 / 5+ (Nominativ = Akkusativ, nur m/n – „одну́“ entfällt)
    {"id": "yabloko", "ru": ["я́блоко", "я́блока", "я́блок"], "g": "n", "de": ["Apfel", "Äpfel"], "bild": "🍎"},
    {"id": "karandash", "ru": ["каранда́ш", "карандаша́", "карандаше́й"], "g": "m", "de": ["Bleistift", "Bleistifte"], "bild": "✏️"},
    {"id": "myach", "ru": ["мяч", "мяча́", "мяче́й"], "g": "m", "de": ["Ball", "Bälle"], "bild": "⚽"},
    {"id": "grib", "ru": ["гриб", "гриба́", "грибо́в"], "g": "m", "de": ["Pilz", "Pilze"], "bild": "🍄"},
    {"id": "pirozhok", "ru": ["пирожо́к", "пирожка́", "пирожко́в"], "g": "m", "de": ["Piroschok", "Piroschki"], "bild": "🥟"},
  ],
  # [Text|schlüssel] = antippbare Grammatik-Stelle, Erklärung unter "grammatik".
  # Enthält die Stelle {a} oder {b}, hängt rechnen.js die passende Zahlregel an.
  # "person" füllt {p_de} {p_nom} {p_gen} {p_regel} in den Erklärungen – so geht es um Dima, nicht um „Oma“.
  "aufgaben": [
    {"op": "+", "nomen": ["yabloko", "karandash", "myach"], "a": [2, 9], "b": [1, 8],
     "person": {"de": "Mascha", "nom": "Ма́ша", "gen": "Ма́ши", "regel": "Aus -а wird -и: Nach ш steht nie ы (Rechtschreibregel)."},
     "text": "[У Ма́ши|u_gen] [{a}|menge_nom]. [Ма́ма дала́|dala] [ей|ej] [ещё|eshchyo] [{b}|menge_akk]. [Ско́лько {pl}|skolko] [у Ма́ши|u_gen] [тепе́рь|teper]?",
     "de": "Mascha hat {a_de}. Mama gibt ihr noch {b_de}. Wie viele {pl_de} hat Mascha jetzt?"},
    {"op": "+", "nomen": ["grib"], "a": [3, 10], "b": [2, 9],
     "text": "[В корзи́не|v_prep] [{a}|menge_nom]. [Ми́ша нашёл|nashyol] [в лесу́|v_lesu] [ещё|eshchyo] [{b}|menge_akk]. [Ско́лько {pl}|skolko] в корзи́не?",
     "de": "Im Korb sind {a_de}. Mischa findet im Wald noch {b_de}. Wie viele {pl_de} sind im Korb?"},
    {"op": "−", "nomen": ["yabloko", "pirozhok"], "a": [6, 15], "b": [1, 5],
     "person": {"de": "Oma", "nom": "ба́бушка", "gen": "ба́бушки", "regel": "Aus -а wird -и: Nach к steht nie ы (Rechtschreibregel)."},
     "text": "[У ба́бушки|u_gen] [бы́ло|bylo] [{a}|menge_nom]. [Де́ти съе́ли|syeli] [{b}|menge_akk]. [Ско́лько {pl}|skolko] [оста́лось|ostalos]?",
     "de": "Oma hatte {a_de}. Die Kinder haben {b_de} gegessen. Wie viele {pl_de} sind übrig?"},
    {"op": "−", "nomen": ["karandash", "myach"], "a": [5, 12], "b": [1, 4],
     "person": {"de": "Dima", "nom": "Ди́ма", "gen": "Ди́мы", "regel": "Aus -а wird -ы – wie bei weiblichen Wörtern, obwohl Dima ein Junge ist: Es zählt die Endung."},
     "text": "[У Ди́мы|u_gen] [бы́ло|bylo] [{a}|menge_nom]. [Он отда́л|otdal] [дру́гу|drugu] [{b}|menge_akk]. [Ско́лько {pl}|skolko] [оста́лось|ostalos] [у Ди́мы|u_gen]?",
     "de": "Dima hatte {a_de}. Er hat einem Freund {b_de} gegeben. Wie viele {pl_de} hat Dima noch?"},
  ],
  # Erklärungen zu den Stellen; \n = neuer Absatz. {pl}/{pl_de}, {b}/{b_de} und {p_…} werden ersetzt,
  # {menge} in zahl_* durch die Mengenangabe (z. B. „пять я́блок“).
  "grammatik": {
    "u_gen": {"titel": "у + Genitiv = haben",
              "text": "Russisch sagt nicht „{p_de} hat …“, sondern „bei {p_de} (ist) …“: у + Genitiv. Das, was man hat, ist das Subjekt.\n{p_nom} → у {p_gen}. {p_regel}\nDas „есть“ (ist) fällt bei Mengenangaben meist weg."},
    "v_prep": {"titel": "в + Präpositiv (wo?)",
               "text": "Auf die Frage „wo?“ steht в mit dem Präpositiv: корзи́на → в корзи́не (im Korb).\nWeibliche Nomen auf -а bekommen im Präpositiv -е."},
    "v_lesu": {"titel": "в лесу́ – Präpositiv auf -у́",
               "text": "Einige männliche Nomen enden nach в/на auf ein betontes -у́ statt -е: лес → в лесу́, сад → в саду́, шкаф → в шкафу́.\nAber: о ле́се (über den Wald) – mit о bleibt es bei -е."},
    "menge_nom": {"titel": "Zahl + Nomen (Subjekt)",
                  "text": "Die ganze Mengenangabe ist hier das Subjekt. Die Zahl steht im Nominativ – das Nomen dahinter aber in der Form, die die Zahl verlangt:"},
    "menge_akk": {"titel": "Zahl + Nomen (Akkusativ)",
                  "text": "Die ganze Mengenangabe ist hier das Objekt (was?), also Akkusativ. Bei Sachen sieht der Akkusativ aus wie der Nominativ – die Zahl bleibt gleich, und das Nomen dahinter richtet sich wieder nach der Zahl:"},
    "dala": {"titel": "Vergangenheit, weiblich",
             "text": "дала́ – Vergangenheit von дать (geben). Im Präteritum richtet sich das Verb nach dem Geschlecht des Subjekts: ма́ма дала́, па́па дал, они́ да́ли."},
    "ej": {"titel": "Dativ von она́",
           "text": "ей = ihr (wem? → Dativ). дать кому́ – jemandem etwas geben: дать ей, дать ему́, дать мне."},
    "eshchyo": {"titel": "ещё = noch (dazu)",
                "text": "ещё bedeutet hier „noch, zusätzlich“: ещё {b} = noch {b_de}.\nNicht verwechseln mit ещё не = noch nicht."},
    "teper": {"titel": "тепе́рь = jetzt",
              "text": "тепе́рь heißt „jetzt, nun“ – im Gegensatz zu vorher. Für „gerade jetzt, in diesem Moment“ sagt man сейча́с."},
    "skolko": {"titel": "ско́лько + Genitiv Plural",
               "text": "Nach ско́лько (wie viele) steht bei zählbaren Dingen der Genitiv Plural: ско́лько {pl}? = wie viele {pl_de}?\nDas Verb steht dabei im Neutrum Singular: ско́лько оста́лось?"},
    "nashyol": {"titel": "Vergangenheit, männlich",
                "text": "нашёл – Vergangenheit von найти́ (finden), männlich. Ми́ша ist ein Jungenname, auch wenn er auf -а endet – darum нашёл, nicht нашла́.\nFormen: он нашёл, она́ нашла́, они́ нашли́."},
    "bylo": {"titel": "бы́ло = hatte",
             "text": "бы́ло ist die Vergangenheit von есть: у {p_gen} есть … ({p_de} hat) → у {p_gen} бы́ло … ({p_de} hatte).\nSteht eine Mengenangabe als Subjekt, nimmt man meist das Neutrum: бы́ло – nicht был oder была́."},
    "syeli": {"titel": "Plural, vollendeter Aspekt",
              "text": "съе́ли – Vergangenheit von съесть (aufessen), Plural, weil де́ти (die Kinder) Plural ist.\nVollendeter Aspekt: Es geht ums Ergebnis – die Stücke sind weg. Unvollendet wäre е́ли (aßen gerade)."},
    "ostalos": {"titel": "Vergangenheit, Neutrum",
                "text": "оста́лось – „ist übrig geblieben“, von оста́ться (übrig bleiben). Bei ско́лько und Mengenangaben steht das Verb im Neutrum Singular: ско́лько оста́лось? – оста́лось пять."},
    "otdal": {"titel": "Vergangenheit, männlich",
              "text": "отда́л – Vergangenheit von отда́ть (hergeben, weggeben), männlich: он отда́л. Weiblich: она́ отдала́."},
    "drugu": {"titel": "Dativ: wem?",
              "text": "дру́гу – Dativ von друг (dem Freund). Wem gibt er etwas? → дру́гу. Männliche Nomen bekommen im Dativ -у: брат → бра́ту, учи́тель → учи́телю."},
    "skolko_budet": {"titel": "Wie viel ergibt …?",
                     "text": "Ско́лько бу́дет …? – wörtlich „wie viel wird sein …?“. бу́дет ist die Zukunft von быть. Die feste Frage im Matheunterricht."},
    "plus_minus": {"titel": "plus, minus",
                   "text": "плюс und ми́нус funktionieren wie im Deutschen. Die Zahlen bleiben im Nominativ: семь плюс пять."},
    "umnozhit": {"titel": "умно́жить на = mal",
                 "text": "умно́жить на – „multipliziert mit“ (wörtlich „vervielfachen auf“). на steht hier mit dem Akkusativ; bei den Zahlen hört man keinen Unterschied: пять умно́жить на два."},
    "razdelit": {"titel": "раздели́ть на = geteilt durch",
                 "text": "раздели́ть на – „geteilt durch“ (wörtlich „aufteilen auf“). Wie bei умно́жить steht на mit dem Akkusativ: де́сять раздели́ть на два."},
    "tire": {"titel": "Strich statt „ist“",
             "text": "Im Präsens fällt „sein“ weg. Geschrieben steht dafür ein Gedankenstrich, gesprochen eine kleine Pause: семь плюс пять – двена́дцать.\nGanz förmlich sagt man auch равно́ + Dativ: … равно́ двена́дцати."},
    "prochitai": {"titel": "Befehlsform (du)",
                  "text": "Прочита́й – Imperativ von прочита́ть (vorlesen, durchlesen), du-Form. Zu mehreren oder höflich: Прочита́йте."},
    "primer": {"titel": "приме́р = Rechenaufgabe",
               "text": "приме́р heißt sonst „Beispiel“, in Mathe „Rechenaufgabe“. Männlich und unbelebt, darum ist der Akkusativ gleich dem Nominativ: прочита́й приме́р."},
    # Zahlregel: eine der vier Zeilen für die Zahl, danach immer zahl_alle.
    # {f1} {f2} {f5} = die drei Formen des Nomens, {eins} = оди́н/одно́ passend zum Genus.
    "zahl_1": {"text": "Nach 1 steht der Nominativ Singular: {menge}. Die Eins richtet sich nach dem Geschlecht: оди́н мяч (m), одно́ я́блоко (n), одна́ кни́га (f)."},
    "zahl_2_4": {"text": "Nach 2, 3 und 4 steht der Genitiv Singular: {menge}."},
    "zahl_5": {"text": "Nach 5 bis 20 steht der Genitiv Plural: {menge}."},
    "zahl_11_14": {"text": "Nach 5 bis 20 steht der Genitiv Plural: {menge}.\nVorsicht Falle: {zahlwort} klingt nach {klingt} – trotzdem nicht {falle}, denn 11 bis 14 gehören zu 5–20."},
    "zahl_alle": {"text": "Bis 20 also:  1 → {eins} {f1}  ·  2, 3, 4 → два {f2}  ·  5 bis 20 → пять {f5}.\nAb 21 zählt die letzte Ziffer: два́дцать {eins} {f1}, два́дцать два {f2}, два́дцать пять {f5}."},
  },
}

# ------------------------------------------------------------------ Literatur (gemeinfrei)
def frage(text, de, richtig, richtig_de, falsch, zeile=None):
    f = {"text": text, "de": de, "richtig": {"text": richtig, "de": richtig_de},
         "falsch": [{"text": t, "hinweis": h} for t, h in falsch]}
    if zeile is not None:
        f["zeile"] = zeile
    return f

LITERATUR = {
  "stimme": "weiblich",
  "texte": [
    {"id": "repka", "titel": "Ре́пка", "autor": "Ру́сская наро́дная ска́зка", "jahr": "", "bild": "repka",
     "hinweis": "Ein Kettenmärchen: jeder hält sich am nächsten fest – за + Akkusativ (за де́дку, за ре́пку).",
     "zeilen": [
       {"ru": "Посади́л дед ре́пку.", "de": "Der Großvater pflanzte eine Rübe."},
       {"ru": "Вы́росла ре́пка больша́я-пребольша́я.", "de": "Die Rübe wuchs riesengroß."},
       {"ru": "Стал дед ре́пку из земли́ тащи́ть: тя́нет-потя́нет, вы́тянуть не мо́жет.", "de": "Der Großvater zog an der Rübe: er zieht und zieht, bekommt sie nicht heraus."},
       {"ru": "Позва́л дед ба́бку.", "de": "Der Großvater rief die Großmutter."},
       {"ru": "Ба́бка за де́дку, де́дка за ре́пку – тя́нут-потя́нут, вы́тянуть не мо́гут.", "de": "Die Großmutter am Großvater, der Großvater an der Rübe – sie ziehen und ziehen, bekommen sie nicht heraus."},
       {"ru": "Позвала́ ба́бка вну́чку. Позвала́ вну́чка Жу́чку.", "de": "Die Großmutter rief die Enkelin. Die Enkelin rief Shutschka (den Hund)."},
       {"ru": "Позвала́ Жу́чка ко́шку. Позвала́ ко́шка мы́шку.", "de": "Shutschka rief die Katze. Die Katze rief die Maus."},
       {"ru": "Мы́шка за ко́шку, ко́шка за Жу́чку, Жу́чка за вну́чку, вну́чка за ба́бку, ба́бка за де́дку, де́дка за ре́пку – тя́нут-потя́нут – и вы́тянули ре́пку!",
        "de": "Die Maus an der Katze, die Katze an Shutschka, Shutschka an der Enkelin, die Enkelin an der Großmutter, die Großmutter am Großvater, der Großvater an der Rübe – sie ziehen und ziehen – und haben die Rübe herausgezogen!"},
     ],
     "fragen": [
       frage("Кто посади́л ре́пку?", "Wer hat die Rübe gepflanzt?", "Дед.", "Der Großvater.",
             [("Ба́бка.", "Die Großmutter kam erst später dazu – gepflanzt hat der дед."),
              ("Мы́шка.", "Die Maus kam ganz zum Schluss.")], 0),
       frage("Кого́ позва́л дед?", "Wen rief der Großvater?", "Ба́бку.", "Die Großmutter.",
             [("Ба́бка.", "Кого́? (wen?) – Akkusativ: ба́бка → ба́бку."),
              ("Вну́чку.", "Die Enkelin hat die Großmutter gerufen, nicht der Großvater.")], 3),
       frage("Ба́бка за … , де́дка за ре́пку.", "Die Großmutter (hält sich) am …, der Großvater an der Rübe.", "Де́дку.", "Am Großvater.",
             [("Де́дка.", "за + Akkusativ: де́дка → де́дку (wie ба́бка → ба́бку)."),
              ("Де́дкой.", "за mit Instrumental heißt „hinter“. Hier „sich festhalten an“: за + Akkusativ – де́дку.")], 4),
       frage("Кто помо́г в конце́?", "Wer half am Ende?", "Мы́шка.", "Die Maus.",
             [("Ко́шка.", "Die Katze hat noch jemanden gerufen – die Maus."),
              ("Никто́.", "Am Ende ziehen alle zusammen – mit der Maus.")], 7),
     ]},
    {"id": "lukomorye", "titel": "У лукомо́рья дуб зелёный…", "autor": "Алекса́ндр Пу́шкин", "jahr": 1828, "bild": "lukomorye",
     "hinweis": "Aus dem Vorspruch zu „Руслан и Людмила“ – fast jedes russische Kind kann ihn auswendig. злата́я = alte, poetische Form von золота́я (golden).",
     "zeilen": [
       {"ru": "У лукомо́рья дуб зелёный;", "de": "An der Meeresbucht steht eine grüne Eiche;"},
       {"ru": "Злата́я цепь на ду́бе том:", "de": "eine goldene Kette hängt an jener Eiche:"},
       {"ru": "И днём и но́чью кот учёный", "de": "Und Tag und Nacht geht ein gelehrter Kater"},
       {"ru": "Всё хо́дит по цепи́ круго́м;", "de": "an der Kette immerzu im Kreis;"},
       {"ru": "Идёт напра́во – песнь заво́дит,", "de": "geht er nach rechts, stimmt er ein Lied an,"},
       {"ru": "Нале́во – ска́зку говори́т.", "de": "nach links – erzählt er ein Märchen."},
     ],
     "fragen": [
       frage("Како́й дуб у лукомо́рья?", "Was für eine Eiche steht an der Bucht?", "Зелёный.", "Eine grüne.",
             [("Зелёная.", "дуб ist männlich: зелёный."),
              ("Злата́я.", "Golden (злата́я) ist die Kette. Die Eiche ist зелёный.")], 0),
       frage("Кто хо́дит по цепи́?", "Wer geht an der Kette entlang?", "Кот учёный.", "Ein gelehrter Kater.",
             [("Ко́шка учёная.", "Bei Puschkin ist es ein Kater: кот учёный."),
              ("Дуб зелёный.", "Die Eiche steht still – es geht der Kater: кот.")], 2),
       frage("Что де́лает кот, когда́ идёт нале́во?", "Was macht der Kater, wenn er nach links geht?", "Ска́зку говори́т.", "Er erzählt ein Märchen.",
             [("Песнь заво́дит.", "Das macht er, wenn er nach rechts (напра́во) geht."),
              ("Спит.", "Er geht Tag und Nacht – и днём и но́чью.")], 5),
       frage("Злата́я … на ду́бе том.", "Eine goldene … an jener Eiche.", "Цепь.", "Kette.",
             [("Цепи́.", "Hier ist die Kette Subjekt (Nominativ): цепь. по цепи́ heißt „an der Kette entlang“."),
              ("Кот.", "злата́я ist weiblich und passt nicht zu кот. Es ist die Kette: цепь.")], 1),
     ]},
    {"id": "vorona", "titel": "Воро́на и Лиси́ца", "autor": "Ива́н Крыло́в", "jahr": 1807, "bild": "vorona",
     "hinweis": "Krylows bekannteste Fabel. сы́ру ist eine alte Form – heute sagt man кусо́чек сы́ра.",
     "zeilen": [
       {"ru": "Воро́не где́-то Бог посла́л кусо́чек сы́ру;", "de": "Der Krähe hatte Gott irgendwo ein Stückchen Käse geschickt;"},
       {"ru": "На ель Воро́на взгромозди́лась,", "de": "auf eine Tanne hatte sich die Krähe gehockt,"},
       {"ru": "Поза́втракать бы́ло совсе́м уж собрала́сь,", "de": "wollte gerade frühstücken,"},
       {"ru": "Да позаду́малась, а сыр во рту держа́ла.", "de": "wurde aber nachdenklich und hielt den Käse im Schnabel."},
       {"ru": "На ту беду́ Лиса́ близёхонько бежа́ла;", "de": "Zum Unglück lief der Fuchs ganz in der Nähe vorbei;"},
       {"ru": "Вдруг сы́рный дух Лису́ останови́л:", "de": "plötzlich ließ der Käseduft den Fuchs anhalten:"},
     ],
     "fragen": [
       frage("Что Бог посла́л Воро́не?", "Was hatte Gott der Krähe geschickt?", "Кусо́чек сы́ру.", "Ein Stückchen Käse.",
             [("Кусо́чек хле́ба.", "Es war Käse – сыр."),
              ("Большо́й торт.", "Nur ein Stückchen – кусо́чек сы́ру.")], 0),
       frage("Куда́ взгромозди́лась Воро́на?", "Wohin hatte sich die Krähe gehockt?", "На ель.", "Auf eine Tanne.",
             [("В ель.", "„Auf“ (einen Baum hinauf) heißt на: на ель."),
              ("На стол.", "Die Krähe sitzt auf einem Baum: на ель – auf die Tanne.")], 1),
       frage("Кто бежа́л ми́мо?", "Wer lief vorbei?", "Лиса́.", "Der Fuchs.",
             [("Волк.", "Es war der Fuchs – лиса́ (im Russischen weiblich)."),
              ("Воро́на.", "Die Krähe sitzt oben auf der Tanne.")], 4),
       frage("Что останови́ло Лису́?", "Was ließ den Fuchs anhalten?", "Сы́рный дух.", "Der Käseduft.",
             [("Пе́сня Воро́ны.", "Gesungen hat die Krähe erst später. Den Fuchs hielt der Käseduft auf: сы́рный дух."),
              ("Хо́лод.", "Vom Wetter steht hier nichts – es war der Duft: сы́рный дух.")], 5),
     ]},
    {"id": "parus", "titel": "Па́рус", "autor": "Михаи́л Ле́рмонтов", "jahr": 1832, "bild": "parus",
     "hinweis": "Lermontow schrieb das Gedicht mit 17 Jahren. беле́ет = schimmert weiß (von бе́лый).",
     "zeilen": [
       {"ru": "Беле́ет па́рус одино́кий", "de": "Es schimmert weiß ein einsames Segel"},
       {"ru": "В тума́не мо́ря голубо́м!..", "de": "im Nebel des blauen Meeres!.."},
       {"ru": "Что и́щет он в стране́ далёкой?", "de": "Was sucht es in dem fernen Land?"},
       {"ru": "Что ки́нул он в краю́ родно́м?..", "de": "Was ließ es zurück in der Heimat?.."},
     ],
     "fragen": [
       frage("Како́й па́рус?", "Was für ein Segel?", "Одино́кий.", "Ein einsames.",
             [("Одино́кая.", "па́рус ist männlich: одино́кий."),
              ("Голубо́й.", "Blau (голубо́е) ist das Meer. Das Segel ist одино́кий und schimmert weiß.")], 0),
       frage("Где беле́ет па́рус?", "Wo schimmert das Segel weiß?", "В тума́не мо́ря.", "Im Nebel des Meeres.",
             [("В лесу́.", "Ein Segel gehört aufs Meer – в тума́не мо́ря."),
              ("На ду́бе.", "An der Eiche hängt Puschkins Kette. Hier: в тума́не мо́ря.")], 1),
       frage("Како́е мо́ре в стихотворе́нии?", "Was für ein Meer ist im Gedicht?", "Голубо́е.", "Ein blaues.",
             [("Голубо́й.", "мо́ре ist sächlich: голубо́е."),
              ("Чёрное.", "Im Gedicht ist das Meer голубо́е (im Text: мо́ря голубо́м).")], 1),
       frage("Что … он в стране́ далёкой?", "Was … es in dem fernen Land?", "И́щет.", "Sucht.",
             [("Ки́нул.", "ки́нул (ließ zurück) steht in der nächsten Zeile – in der Heimat."),
              ("Спит.", "Das Segel schläft nicht – es sucht: и́щет.")], 2),
     ]},
  ],
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
  "rechnen": RECHNEN,
  "literatur": LITERATUR,
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
