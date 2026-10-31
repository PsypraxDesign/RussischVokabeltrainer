"""Erzeugt module/muzhskaya/modul.json und inhalt.json (Herrenmode im GUM).

Geübt wird die Angleichung nach dem Genus: э́тот/э́та/э́то/э́ти + Adjektiv,
ну́жен/нужна́/ну́жно/нужны́, нра́вится/нра́вятся, сто́ит/сто́ят und die Kurzformen
вели́к/мал. Alle Formen entstehen hier aus wenigen Tabellen, damit sie einheitlich
sind. Aufruf aus dem Gorod-Ordner:
    python werkzeuge/muzhskaya_inhalt.py
"""
import json, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "module", "muzhskaya")
os.makedirs(os.path.join(B, "grafik"), exist_ok=True)

modul = {
  "titel": {"ru": "мужска́я оде́жда", "de": "Herrenmode"},
  "praeposition": "в",
  "satz_hin": "Я иду́ в отде́л мужско́й оде́жды.",
  "satz_hin_de": "Ich gehe in die Herrenabteilung.",
  "stufen": ["entdecken", "hoeren", "theke", "anprobe", "kasse"],
  # Schalter-Stufen tragen feste Namen; hier bekommen sie eigene Titel
  "stufen_titel": {"theke": "Auswählen", "anprobe": "Anprobe", "kasse": "Kasse"},
  "grafik": {"aussen": "grafik/aussen.svg", "innen": "grafik/innen.svg"},
  "farbe": "#2b4a6b",
  "breite": 250
}

W = [  # id, ru, de, genus, Satz, Hinweis
 ("kostyum", "костю́м", "der Anzug", "m", "Костю́мы вися́т на ве́шалке.", "Plural: костю́мы. Zum Anzug gehören пиджа́к и брю́ки."),
 ("pidzhak", "пиджа́к", "das Sakko", "m", "Э́тот пиджа́к кори́чневый.", "Plural: пиджаки́ – die Betonung wandert ans Ende"),
 ("bryuki", "брю́ки", "die Hose", "pl", "Э́ти брю́ки чёрные.", "nur im Plural: э́ти брю́ки, они́ мне велики́"),
 ("rubashka", "руба́шка", "das Hemd", "f", "Руба́шки лежа́т на по́лке.", "э́та бе́лая руба́шка; fünf Hemden: пять руба́шек"),
 ("sviter", "сви́тер", "der Pullover", "m", "Э́тот зелёный сви́тер о́чень тёплый.", "Plural: сви́теры"),
 ("dzhinsy", "джи́нсы", "die Jeans", "pl", "Джи́нсы лежа́т на ни́жней по́лке.", "nur im Plural: э́ти си́ние джи́нсы"),
 ("palto", "пальто́", "der Mantel", "n", "Э́то пальто́ бе́жевое.", "unveränderlich und sächlich: э́то пальто́, в пальто́, без пальто́"),
 ("kurtka", "ку́ртка", "die Jacke", "f", "Э́та ку́ртка зелёная и о́чень тёплая.", "в ку́ртке – in der Jacke"),
 ("botinki", "боти́нки", "die Schuhe", "pl", "Боти́нки стоя́т на по́лке.", "Singular: боти́нок; ein Paar Schuhe: па́ра боти́нок"),
 ("galstuk", "га́лстук", "die Krawatte", "m", "Га́лстуки вися́т на сто́йке.", "Achtung: га́лстук ist männlich – э́тот кра́сный га́лстук"),
 ("remen", "реме́нь", "der Gürtel", "m", "Ремни́ лежа́т на столе́.", "Das е fällt weg: ремни́, без ремня́"),
 ("noski", "носки́", "die Socken", "pl", "Носки́ лежа́т в коро́бке.", "Singular: носо́к; zwei Paar Socken: две па́ры носко́в"),
 ("shapka", "ша́пка", "die Mütze", "f", "Э́та ша́пка се́рая и тёплая.", "Akkusativ: Я беру́ ша́пку."),
 ("sharf", "шарф", "der Schal", "m", "Э́тот шарф кра́сный.", "Plural: шарфы́ – die Betonung wandert ans Ende"),
 ("razmer", "разме́р", "die Größe", "m", "Како́й у вас разме́р?", "Größen sagt man mit der Ordnungszahl: пятидеся́тый разме́р = Größe 50"),
 ("zerkalo", "зе́ркало", "der Spiegel", "n", "Зе́ркало стои́т у приме́рочной.", "в зе́ркале – im Spiegel"),
 ("primerochnaya", "приме́рочная", "die Umkleidekabine", "f", "Приме́рочная – сле́ва.", "eigentlich ein Adjektiv: в приме́рочной – in der Kabine"),
 ("kassa", "ка́сса", "die Kasse", "f", "Ка́сса – спра́ва.", "Plural: ка́ссы"),
 ("prodavets", "продаве́ц", "der Verkäufer", "m", "Продаве́ц о́чень ве́жливый.", "Das е fällt weg: продавца́. Weiblich: продавщи́ца"),
 ("kassirsha", "касси́рша", "die Kassiererin", "f", "Касси́рша сиди́т за ка́ссой.", "auch: касси́р – für Männer und Frauen"),
]

# ------------------------------------------------------------------ Formen nach Genus
GI = {"m": 0, "f": 1, "n": 2, "pl": 3}
GENUS_DE = {"m": "männlich", "f": "weiblich", "n": "sächlich", "pl": "Plural"}
DEM = ("э́тот", "э́та", "э́то", "э́ти")
KAKOY = ("Како́й", "Кака́я", "Како́е", "Каки́е")
NUZHEN = ("ну́жен", "нужна́", "ну́жно", "нужны́")
PRON = ("он", "она́", "оно́", "они́")
VELIK = ("вели́к", "велика́", "велико́", "велики́")
MAL = ("мал", "мала́", "мало́", "малы́")
BOLSHOY = ("большо́й", "больша́я", "большо́е", "больши́е")
MALENKIY = ("ма́ленький", "ма́ленькая", "ма́ленькое", "ма́ленькие")
REIHE = "ну́жен – m, нужна́ – f, ну́жно – n, нужны́ – Pl."

FARBEN = {  # m, f, n, pl – deutsch
 "seryy": (("се́рый", "се́рая", "се́рое", "се́рые"), "grau"),
 "siniy": (("си́ний", "си́няя", "си́нее", "си́ние"), "blau"),
 "chernyy": (("чёрный", "чёрная", "чёрное", "чёрные"), "schwarz"),
 "belyy": (("бе́лый", "бе́лая", "бе́лое", "бе́лые"), "weiß"),
 "korichnevyy": (("кори́чневый", "кори́чневая", "кори́чневое", "кори́чневые"), "braun"),
 "zelenyy": (("зелёный", "зелёная", "зелёное", "зелёные"), "grün"),
 "bezhevyy": (("бе́жевый", "бе́жевая", "бе́жевое", "бе́жевые"), "beige"),
 "goluboy": (("голубо́й", "голуба́я", "голубо́е", "голубы́е"), "hellblau"),
 "krasnyy": (("кра́сный", "кра́сная", "кра́сное", "кра́сные"), "rot"),
}

WAREN = {  # Nominativ, Plural (für „Вот …:“), Akkusativ, Genus, deutsch, Akk. deutsch, Pronomen deutsch, Preis
 "kostyum": ("костю́м", "костю́мы", "костю́м", "m", "Anzug", "einen Anzug", ("er", "ist"), 5900),
 "kurtka": ("ку́ртка", "ку́ртки", "ку́ртку", "f", "Jacke", "eine Jacke", ("sie", "ist"), 3900),
 "bryuki": ("брю́ки", "брю́ки", "брю́ки", "pl", "Hose", "eine Hose", ("sie", "ist"), 2900),
 "palto": ("пальто́", "пальто́", "пальто́", "n", "Mantel", "einen Mantel", ("er", "ist"), 5900),
 "dzhinsy": ("джи́нсы", "джи́нсы", "джи́нсы", "pl", "Jeans", "eine Jeans", ("sie", "ist"), 2700),
 "sviter": ("сви́тер", "сви́теры", "сви́тер", "m", "Pullover", "einen Pullover", ("er", "ist"), 2400),
 "botinki": ("боти́нки", "боти́нки", "боти́нки", "pl", "Schuhe", "Schuhe", ("sie", "sind"), 3900),
 "galstuk": ("га́лстук", "га́лстуки", "га́лстук", "m", "Krawatte", "eine Krawatte", ("sie", "ist"), 900),
 "shapka": ("ша́пка", "ша́пки", "ша́пку", "f", "Mütze", "eine Mütze", ("sie", "ist"), 800),
 "remen": ("реме́нь", "ремни́", "реме́нь", "m", "Gürtel", "einen Gürtel", ("er", "ist"), 1200),
 "sharf": ("шарф", "шарфы́", "шарф", "m", "Schal", "einen Schal", ("er", "ist"), 1100),
 "rubashka": ("руба́шка", "руба́шки", "руба́шку", "f", "Hemd", "ein Hemd", ("es", "ist"), 1500),
 "noski": ("носки́", "носки́", "носки́", "pl", "Socken", "Socken", ("sie", "sind"), 300),
}

# Größen als Ordnungszahl (разме́р ist männlich) und als Grundzahl (typischer Fehler)
GROESSE = {
 40: ("сороково́й", "со́рок"), 41: ("со́рок пе́рвый", "со́рок оди́н"), 42: ("со́рок второ́й", "со́рок два"), 43: ("со́рок тре́тий", "со́рок три"), 44: ("со́рок четвёртый", "со́рок четы́ре"),
 46: ("со́рок шесто́й", "со́рок шесть"), 48: ("со́рок восьмо́й", "со́рок во́семь"), 50: ("пятидеся́тый", "пятьдеся́т"),
 52: ("пятьдеся́т второ́й", "пятьдеся́т два"), 54: ("пятьдеся́т четвёртый", "пятьдеся́т четы́ре"),
 56: ("пятьдеся́т шесто́й", "пятьдеся́т шесть"),
}

HUNDERTER = ["", "сто", "две́сти", "три́ста", "четы́реста", "пятьсо́т", "шестьсо́т", "семьсо́т", "восемьсо́т", "девятьсо́т"]
TAUSEND_AKK = {1: "ты́сячу", 2: "две ты́сячи", 3: "три ты́сячи", 4: "четы́ре ты́сячи", 5: "пять ты́сяч",
               6: "шесть ты́сяч", 7: "семь ты́сяч", 8: "во́семь ты́сяч", 9: "де́вять ты́сяч"}

def preis_akk(n):
    """Preis im Akkusativ (nach сто́ит): 1500 → „ты́сячу пятьсо́т рубле́й“. Nur volle Hunderter."""
    assert n % 100 == 0 and 100 <= n < 10000
    t, h = divmod(n, 1000)
    teile = ([TAUSEND_AKK[t]] if t else []) + ([HUNDERTER[h // 100]] if h else [])
    return " ".join(teile) + " рубле́й"

def gross(t): return t[0].upper() + t[1:]

def form(tabelle, g): return tabelle[GI[g]]

def anderes_genus(g):
    """Für Fehler-Antworten: das Genus, mit dem man das Wort am ehesten verwechselt."""
    return {"m": "f", "f": "m", "n": "m", "pl": "f"}[g]

def nrav(g): return "нра́вятся" if g == "pl" else "нра́вится"
def stoit(g): return "сто́ят" if g == "pl" else "сто́ит"   # kosten – nicht стои́т/стоя́т (stehen)

# ------------------------------------------------------------------ Felder für die Schalter-Stufen
def feld_brauche(ware, farbe, andere_ware, zweite):
    nom, _, _, g, de, de_akk, _, _ = WAREN[ware]
    vor = "Да, мне ещё" if zweite else "Мне"
    de_vor = "Ja, ich brauche noch" if zweite else "Ich brauche"
    richtig = {"text": f"{vor} {form(NUZHEN, g)} {nom}.", "de": f"{de_vor} {de_akk}."}
    falsche_form = "нужна́" if g == "m" else "ну́жен"
    falsch = [{"text": f"{vor} {falsche_form} {nom}.", "de": "",
               "hinweis": f"{nom} ist {GENUS_DE[g]}: {form(NUZHEN, g)} {nom}. ({REIHE})"}]
    a_nom, _, _, a_g, _, a_de_akk, _, _ = WAREN[andere_ware]
    if zweite:
        falsch.append({"text": f"{vor} {form(NUZHEN, a_g)} {a_nom}.", "de": f"{de_vor} {a_de_akk}.",
                       "hinweis": f"Das hast du schon gefunden. Laut Zettel brauchst du noch {de_akk}."})
        falsch.append({"text": "Нет, спаси́бо, э́то всё.", "de": "Nein danke, das ist alles.",
                       "hinweis": f"Laut Zettel brauchst du noch {de_akk}."})
    else:
        falsch.append({"text": f"{vor} {form(NUZHEN, a_g)} {a_nom}.", "de": f"{de_vor} {a_de_akk}.",
                       "hinweis": f"Laut Zettel suchst du zuerst {de_akk}."})
        if g == "m":
            falsch.append({"text": f"Я ну́жен {nom}.", "de": "",
                           "hinweis": f"„Ich brauche“ heißt мне ну́жен … (wörtlich: mir ist nötig). Я ну́жен hieße „ich werde gebraucht“."})
        elif g == "pl":
            falsch.append({"text": f"{vor} нужна́ {nom}.", "de": "",
                           "hinweis": f"{nom} ist Plural: нужны́ {nom}. ({REIHE})"})
        else:
            falsch.append({"text": f"{vor} нужны́ {nom}.", "de": "",
                           "hinweis": f"Ein Stück → Singular: {form(NUZHEN, g)} {nom}. нужны́ steht beim Plural."})
    return {"richtig": richtig, "falsch": falsch}

def de_gefallen(ware, farbe_de):
    # „beige“ bleibt ohne Endung: dieser beige Mantel
    return DE_GEFALLEN[ware].format(f=farbe_de).replace("beigee", "beige")

def feld_gefallen(ware, farbe, andere_farbe):
    nom, _, _, g, de, _, _, _ = WAREN[ware]
    adj, farbe_de = FARBEN[farbe]
    adj2, farbe2_de = FARBEN[andere_farbe]
    dem, a = form(DEM, g), form(adj, g)
    richtig = {"text": f"Мне {nrav(g)} {dem} {a} {nom}.", "de": de_gefallen(ware, farbe_de)}
    if g == "pl":
        falsch = [
          {"text": f"Мне нра́вится {dem} {a} {nom}.", "de": "",
           "hinweis": f"{nom} ist Plural – also auch das Verb: нра́вятся."},
          {"text": f"Мне нра́вятся {dem} {adj[0]} {nom}.", "de": "",
           "hinweis": f"Das Adjektiv richtet sich nach {nom} (Plural): {a}."},
        ]
    else:
        g2 = anderes_genus(g)
        falsch = [
          {"text": f"Мне нра́вится {form(DEM, g2)} {form(adj, g2)} {nom}.", "de": "",
           "hinweis": f"{nom} ist {GENUS_DE[g]}: {dem} {a} {nom}. (э́тот – m, э́та – f, э́то – n, э́ти – Pl.)"},
          {"text": f"Мне нра́вятся {dem} {a} {nom}.", "de": "",
           "hinweis": f"Ein Stück → Singular: нра́вится. нра́вятся steht nur beim Plural."},
        ]
    falsch.append({"text": f"Мне {nrav(g)} {dem} {form(adj2, g)} {nom}.", "de": de_gefallen(ware, farbe2_de),
                   "hinweis": f"Laut Zettel: {farbe_de} – {a}."})
    return {"richtig": richtig, "falsch": falsch}

# „Mir gefällt dieser graue Anzug.“ – deutsche Adjektiv-Endungen von Hand
DE_GEFALLEN = {
 "kostyum": "Mir gefällt dieser {f}e Anzug.", "kurtka": "Mir gefällt diese {f}e Jacke.",
 "bryuki": "Mir gefällt diese {f}e Hose.", "palto": "Mir gefällt dieser {f}e Mantel.",
 "dzhinsy": "Mir gefällt diese {f}e Jeans.", "sviter": "Mir gefällt dieser {f}e Pullover.",
 "botinki": "Mir gefallen diese {f}en Schuhe.", "galstuk": "Mir gefällt diese {f}e Krawatte.",
 "shapka": "Mir gefällt diese {f}e Mütze.", "remen": "Mir gefällt dieser {f}e Gürtel.",
 "sharf": "Mir gefällt dieser {f}e Schal.", "rubashka": "Mir gefällt dieses {f}e Hemd.",
 "noski": "Mir gefallen diese {f}en Socken.",
}

def feld_preis(ware):
    nom, _, _, g, de, _, _, _ = WAREN[ware]
    dem = form(DEM, g)
    richtig = {"text": f"Ско́лько {stoit(g)} {dem} {nom}?", "de": DE_PREIS[ware]}
    if g == "pl":
        falsch = [{"text": f"Ско́лько сто́ит {dem} {nom}?", "de": "", "hinweis": f"{nom} ist Plural: Ско́лько сто́ят …?"},
                  {"text": f"Ско́лько сто́ят э́то {nom}?", "de": "", "hinweis": f"Vor einem Plural steht э́ти: э́ти {nom}."},
                  {"text": f"Ско́лько стоя́т {dem} {nom}?", "de": "",
                   "hinweis": "Achtung Betonung: стоя́т (hinten betont) heißt „sie stehen“. Kosten: сто́ят."}]
    else:
        g2 = anderes_genus(g)
        falsch = [{"text": f"Ско́лько сто́ят {dem} {nom}?", "de": "", "hinweis": "Ein Stück → сто́ит. сто́ят steht nur beim Plural."},
                  {"text": f"Ско́лько сто́ит {form(DEM, g2)} {nom}?", "de": "", "hinweis": f"{nom} ist {GENUS_DE[g]}: {dem} {nom}."},
                  {"text": f"Ско́лько стои́т {dem} {nom}?", "de": "",
                   "hinweis": "Achtung Betonung: стои́т (hinten betont) heißt „steht“. Kosten: сто́ит."}]
    return {"richtig": richtig, "falsch": falsch}

DE_PREIS = {
 "kostyum": "Was kostet dieser Anzug?", "kurtka": "Was kostet diese Jacke?", "bryuki": "Was kostet diese Hose?",
 "palto": "Was kostet dieser Mantel?", "dzhinsy": "Was kostet diese Jeans?", "sviter": "Was kostet dieser Pullover?",
 "botinki": "Was kosten diese Schuhe?",
}

# Akkusativ mit bestimmtem Artikel: „Sie probieren den Anzug an.“
DE_DEN = {"kostyum": "den Anzug", "kurtka": "die Jacke", "bryuki": "die Hose", "palto": "den Mantel",
          "dzhinsy": "die Jeans", "sviter": "den Pullover", "botinki": "die Schuhe"}

def feld_groesse(groesse, daneben):
    ordnung, grund = GROESSE[groesse]
    return {"richtig": {"text": f"У меня́ {ordnung} разме́р.", "de": f"Ich habe Größe {groesse}."},
            "falsch": [
              {"text": f"У меня́ {grund} разме́р.", "de": "",
               "hinweis": f"Größen sagt man mit der Ordnungszahl: {ordnung} разме́р (wörtlich: die {groesse}. Größe)."},
              {"text": f"У меня́ {GROESSE[daneben][0]} разме́р.", "de": f"Ich habe Größe {daneben}.",
               "hinweis": f"Laut Zettel hast du Größe {groesse}."},
              {"text": f"Я {ordnung} разме́р.", "de": "",
               "hinweis": f"„Ich habe Größe …“ heißt: У меня́ {ordnung} разме́р."}]}

def feld_passt(ware, zu_gross):
    nom, _, _, g, de, _, (er, ist), _ = WAREN[ware]
    p, kurz, gegen = form(PRON, g), form(VELIK if zu_gross else MAL, g), form(MAL if zu_gross else VELIK, g)
    lang = form(BOLSHOY if zu_gross else MALENKIY, g)
    gross_de, klein_de = ("zu groß", "zu klein") if zu_gross else ("zu klein", "zu groß")
    reihe = "вели́к – m, велика́ – f, велико́ – n, велики́ – Pl." if zu_gross else "мал – m, мала́ – f, мало́ – n, малы́ – Pl."
    if g == "pl":
        genus_falsch = {"text": f"Нет, он мне {(VELIK if zu_gross else MAL)[0]}.", "de": "",
                        "hinweis": f"{nom} ist Plural: {p} мне {kurz}. ({reihe})"}
    else:
        g2 = anderes_genus(g)
        genus_falsch = {"text": f"Нет, {form(PRON, g2)} мне {form(VELIK if zu_gross else MAL, g2)}.", "de": "",
                        "hinweis": f"{nom} ist {GENUS_DE[g]}: {p} мне {kurz}. ({reihe})"}
    return {"richtig": {"text": f"Нет, {p} мне {kurz}.", "de": f"Nein, {er} {ist} mir {gross_de}."},
            "falsch": [
              genus_falsch,
              {"text": f"Нет, {p} мне {gegen}.", "de": f"Nein, {er} {ist} mir {klein_de}.",
               "hinweis": f"Laut Zettel: {gross_de} – {kurz}."},
              {"text": f"Нет, {p} мне {lang}.", "de": "",
               "hinweis": f"„{gross_de.capitalize()}“ ist die Kurzform {kurz}. {lang} heißt einfach „{'groß' if zu_gross else 'klein'}“."}]}

def feld_passt2(ware, zu_gross):
    nom, _, _, g, de, _, (er, ist), _ = WAREN[ware]
    p = form(PRON, g)
    falsch_p = "он" if g == "pl" else form(PRON, anderes_genus(g))
    passt_de = "passen" if ist == "sind" else "passt"
    return {"richtig": {"text": f"Тепе́рь {p} мне как раз!", "de": f"Jetzt {passt_de} {er} genau!"},
            "falsch": [
              {"text": f"Тепе́рь {falsch_p} мне как раз!", "de": "",
               "hinweis": f"{nom} ist {GENUS_DE[g]}: {p}."},
              {"text": f"Тепе́рь {p} мне {form(MAL if zu_gross else VELIK, g)}.", "de": "",
               "hinweis": "Laut Zettel passt die zweite Größe genau: как раз."}]}

# ------------------------------------------------------------------ Kunden
def kunde(id, ware1, farbe1, falschfarbe1, groesse, zu_gross, ware2, farbe2, falschfarbe2, zahlart, farben_zeigen1, farben_zeigen2):
    nom1, _, akk1, g1, de1, _, _, preis1 = WAREN[ware1]
    nom2, _, _, g2, de2, _, _, preis2 = WAREN[ware2]
    # Schuhe gibt es in ganzen Nummern, Kleidung in geraden
    schritt = 1 if ware1 == "botinki" else 2
    zweite = groesse - schritt if zu_gross else groesse + schritt
    daneben = groesse + 2 if zu_gross else groesse - 2   # falsche Größe in der Auswahl

    def zeigen(ware, farben):
        nom, pl, _, g, *_ = WAREN[ware]
        fs = [form(FARBEN[f][0], g) for f in farben]
        return f"Вот {pl}: {fs[0]}, {fs[1]} и {fs[2]}. {form(KAKOY, g)} вам {nrav(g)}?"

    def zeigen_de(ware, farben):
        de_pl = {"kostyum": "die Anzüge", "kurtka": "die Jacken", "bryuki": "die Hosen", "palto": "die Mäntel",
                 "dzhinsy": "die Jeans", "sviter": "die Pullover", "botinki": "die Schuhe", "galstuk": "die Krawatten",
                 "shapka": "die Mützen", "remen": "die Gürtel", "sharf": "die Schals", "rubashka": "die Hemden",
                 "noski": "die Socken"}[ware]
        fs = [FARBEN[f][1] for f in farben]
        return f"Hier sind {de_pl}: {fs[0]}, {fs[1]} und {fs[2]}. Welche gefallen Ihnen?" if ware in ("botinki", "noski") \
            else f"Hier sind {de_pl}: {fs[0]}, {fs[1]} und {fs[2]}. Was gefällt Ihnen?"

    adj1 = form(FARBEN[farbe1][0], g1)
    adj2 = form(FARBEN[farbe2][0], g2)
    groesse_wort = "Schuhgröße" if ware1 == "botinki" else "Größe"
    return {
      "id": id, "geschlecht": "m", "zahlart": zahlart,
      "p": {
        "zeigen1": zeigen(ware1, farben_zeigen1), "zeigen1_de": zeigen_de(ware1, farben_zeigen1),
        "zeigen2": zeigen(ware2, farben_zeigen2), "zeigen2_de": zeigen_de(ware2, farben_zeigen2),
        "preis1": f"{gross(form(PRON, g1))} {stoit(g1)} {preis_akk(preis1)}.",
        "preis1_de": f"{'Sie kosten' if ware1 == 'botinki' else 'Das kostet'} {preis1} Rubel.",
        "anprobe": f"{gross(nom1)} мо́жно приме́рить. Приме́рочная – сле́ва.",
        "anprobe_de": f"{gross(DE_DEN[ware1])} können Sie anprobieren. Die Umkleidekabine ist links.",
        "akk1": akk1, "akk1_de": DE_DEN[ware1],
        "bringe": f"Поня́тно. Сейча́с принесу́ разме́р {'поме́ньше' if zu_gross else 'побо́льше'}.",
        "bringe_de": f"Verstehe. Ich bringe Ihnen gleich eine Nummer {'kleiner' if zu_gross else 'größer'}.",
      },
      "zettel": {
        "theke": [f"Du suchst: {de1} – {FARBEN[farbe1][1]}", f"Dazu: {de2} – {FARBEN[farbe2][1]}"],
        "anprobe": [f"Deine {groesse_wort}: {groesse}",
                       f"{groesse_wort} {groesse} ist {'zu groß' if zu_gross else 'zu klein'}",
                       f"{groesse_wort} {zweite} passt genau"],
        "kasse": [f"{de1} und {de2}", f"Bezahlen: {'bar' if zahlart == 'bar' else 'mit Karte'}"],
      },
      "felder": {
        "brauche1": feld_brauche(ware1, farbe1, ware2, False),
        "gefallen1": feld_gefallen(ware1, farbe1, falschfarbe1),
        "preis1": feld_preis(ware1),
        "brauche2": feld_brauche(ware2, farbe2, ware1, True),
        "gefallen2": feld_gefallen(ware2, farbe2, falschfarbe2),
        "groesse": feld_groesse(groesse, daneben),
        "passt1": feld_passt(ware1, zu_gross),
        "passt2": feld_passt2(ware1, zu_gross),
      },
      "posten": [{"ru": f"{nom1} {adj1}, разм. {zweite}", "preis": preis1}, {"ru": f"{nom2} {adj2}", "preis": preis2}],
      "preis": preis1 + preis2,
    }

R = [
 kunde("k1", "kostyum", "seryy", "chernyy", 50, True, "galstuk", "siniy", "krasnyy", "bar",
       ["seryy", "siniy", "chernyy"], ["krasnyy", "siniy", "zelenyy"]),
 kunde("k2", "kurtka", "korichnevyy", "zelenyy", 52, False, "shapka", "seryy", "chernyy", "karte",
       ["zelenyy", "chernyy", "korichnevyy"], ["chernyy", "seryy", "siniy"]),
 kunde("k3", "bryuki", "chernyy", "seryy", 48, True, "rubashka", "belyy", "goluboy", "bar",
       ["chernyy", "seryy", "bezhevyy"], ["belyy", "goluboy", "krasnyy"]),
 kunde("k4", "palto", "bezhevyy", "chernyy", 52, False, "sharf", "krasnyy", "seryy", "bar",
       ["chernyy", "seryy", "bezhevyy"], ["seryy", "krasnyy", "siniy"]),
 kunde("k5", "dzhinsy", "siniy", "chernyy", 50, False, "remen", "korichnevyy", "chernyy", "karte",
       ["siniy", "chernyy", "belyy"], ["chernyy", "korichnevyy", "seryy"]),
 kunde("k6", "sviter", "zelenyy", "seryy", 52, True, "rubashka", "goluboy", "belyy", "bar",
       ["seryy", "zelenyy", "krasnyy"], ["belyy", "goluboy", "seryy"]),
 kunde("k7", "botinki", "chernyy", "korichnevyy", 42, False, "noski", "chernyy", "siniy", "karte",
       ["chernyy", "korichnevyy", "seryy"], ["siniy", "chernyy", "seryy"]),
]

szenen = {
 "theke": {
  "titel": "Auswählen", "zettel_titel": "Dein Zettel",
  "geschafft": "Ausgesucht! Jetzt geht es zur Anprobe.",
  "start": "hallo",
  "knoten": {
   "hallo": {"sprecher": "prodavets", "text": "Здра́вствуйте! Чем могу́ помо́чь?", "de": "Guten Tag! Wie kann ich Ihnen helfen?",
             "feld": "brauche1", "weiter": "zeigen1"},
   "zeigen1": {"sprecher": "prodavets", "text": "{zeigen1}", "de": "{zeigen1_de}", "feld": "gefallen1", "weiter": "gut"},
   "gut": {"sprecher": "prodavets", "text": "Хоро́ший вы́бор!", "de": "Gute Wahl!", "feld": "preis1", "weiter": "preis"},
   "preis": {"sprecher": "prodavets", "text": "{preis1} Что́-нибудь ещё?", "de": "{preis1_de} Sonst noch etwas?",
             "feld": "brauche2", "weiter": "zeigen2"},
   "zeigen2": {"sprecher": "prodavets", "text": "{zeigen2}", "de": "{zeigen2_de}", "feld": "gefallen2", "weiter": "anprobe"},
   "anprobe": {"sprecher": "prodavets", "text": "{anprobe}", "de": "{anprobe_de}",
     "optionen": [
       {"text": "Спаси́бо, с удово́льствием!", "de": "Danke, gern!", "ende": True},
       {"text": "Не за что!", "de": "Keine Ursache!",
        "hinweis": "„Не за что“ sagt man, wenn sich jemand bei dir bedankt. Hier bedankst du dich: Спаси́бо!"}]},
  }},
 "anprobe": {
  "titel": "Anprobe", "zettel_titel": "Dein Zettel",
  "geschafft": "Passt wie angegossen!",
  "start": "groesse",
  "knoten": {
   "groesse": {"sprecher": "prodavets", "text": "Како́й у вас разме́р?", "de": "Welche Größe haben Sie?",
               "feld": "groesse", "weiter": "bitte"},
   "bitte": {"sprecher": "prodavets", "text": "Вот, пожа́луйста.", "de": "Bitte schön.",
     "optionen": [
       {"text": "Спаси́бо. Мо́жно приме́рить?", "de": "Danke. Darf ich es anprobieren?", "weiter": "kabine"},
       {"text": "Спаси́бо. Мо́жно заплати́ть?", "de": "Danke. Kann ich bezahlen?",
        "hinweis": "Erst anprobieren! Frag: Мо́жно приме́рить?"},
       {"text": "Спаси́бо. Мо́жно посмотре́ть?", "de": "Danke. Darf ich mal sehen?",
        "hinweis": "Ansehen kannst du es schon – jetzt möchtest du es anprobieren: приме́рить."}]},
   "kabine": {"sprecher": "prodavets", "text": "Коне́чно! Приме́рочная – сле́ва.", "de": "Natürlich! Die Umkleidekabine ist links.",
              "weiter": "drin"},
   "drin": {"sprecher": "erzaehler", "text": "Вы в приме́рочной и примеря́ете {akk1}.", "de": "Sie sind in der Kabine und probieren {akk1_de} an.",
            "pause": 600, "weiter": "wie"},
   "wie": {"sprecher": "prodavets", "text": "Ну как?", "de": "Na, wie ist es?", "feld": "passt1", "weiter": "bringe"},
   "bringe": {"sprecher": "prodavets", "text": "{bringe}", "de": "{bringe_de}", "weiter": "nochmal"},
   "nochmal": {"sprecher": "erzaehler", "text": "Вы примеря́ете друго́й разме́р.", "de": "Sie probieren eine andere Größe an.",
               "pause": 600, "weiter": "jetzt"},
   "jetzt": {"sprecher": "prodavets", "text": "А тепе́рь?", "de": "Und jetzt?", "feld": "passt2", "weiter": "nehmen"},
   "nehmen": {"sprecher": "prodavets", "text": "Отли́чно! Берёте?", "de": "Prima! Nehmen Sie es?",
     "optionen": [
       {"text": "Да, беру́!", "de": "Ja, ich nehme es!", "weiter": "fertig"},
       {"text": "Да, берёте!", "de": "",
        "hinweis": "берёте heißt „Sie nehmen“. Ich nehme: беру́."},
       {"text": "Нет, спаси́бо.", "de": "Nein, danke.",
        "hinweis": "Es passt doch genau – laut Zettel nimmst du es."}]},
   "fertig": {"sprecher": "prodavets", "text": "Прекра́сно! Ка́сса – спра́ва.", "de": "Wunderbar! Die Kasse ist rechts.",
     "optionen": [
       {"text": "Спаси́бо большо́е!", "de": "Vielen Dank!", "ende": True},
       {"text": "Пожа́луйста!", "de": "Bitte!",
        "hinweis": "Der Verkäufer hat dir geholfen – du bedankst dich: Спаси́бо!"}]},
  }},
 "kasse": {
  "titel": "Kasse", "zettel_titel": "Dein Zettel",
  "geschafft": "Bezahlt – viel Freude mit den neuen Sachen!",
  "start": "band",
  "knoten": {
   "band": {"sprecher": "erzaehler", "text": "Вы на ка́ссе. Касси́рша пробива́ет поку́пки.",
            "de": "Sie sind an der Kasse. Die Kassiererin tippt die Einkäufe ein.", "aktion": "scannen", "weiter": "alles"},
   "alles": {"sprecher": "kassirsha", "text": "Э́то всё?", "de": "Ist das alles?",
     "optionen": [
       {"text": "Да, э́то всё.", "de": "Ja, das ist alles.", "weiter": "zahlart"},
       {"text": "Да, э́то все.", "de": "",
        "hinweis": "все heißt „alle“ (Leute). „Alles“ ist всё – mit ё."},
       {"text": "Нет, спаси́бо.", "de": "Nein, danke.",
        "hinweis": "Du hast alles vom Zettel. Antworte: Да, э́то всё."}]},
   "zahlart": {"sprecher": "kassirsha", "text": "Нали́чными и́ли ка́ртой?", "de": "Bar oder mit Karte?",
     "optionen": [
       {"text": "Нали́чными.", "de": "Bar.", "zahlart": "bar", "weiter": "summe"},
       {"text": "Ка́ртой.", "de": "Mit Karte.", "zahlart": "karte", "weiter": "summe"}]},
   "summe": {"sprecher": "kassirsha", "text": "С вас {summe}.", "de": "Das macht {summe_de}.", "aktion": "bezahlen", "weiter": "chek"},
   "chek": {"sprecher": "kassirsha", "text": "Вот ваш чек. Носи́те на здоро́вье!", "de": "Hier ist Ihr Kassenbon. Tragen Sie es mit Freude!",
     "optionen": [
       {"text": "Спаси́бо! До свида́ния!", "de": "Danke! Auf Wiedersehen!", "ende": True},
       {"text": "На здоро́вье!", "de": "Wohl bekomm’s!",
        "hinweis": "„Носи́те на здоро́вье“ ist ein guter Wunsch – darauf sagt man Спаси́бо."}]},
  }},
}

inhalt = {
  "entdecken_hinweis": "Was gibt es in der Herrenabteilung? Tippe auf den Anzug, die Krawatte, den Spiegel …",
  "woerter": [dict(id=i, ru=ru, de=de, genus=g, hotspot="hs-" + i, satz=satz, hinweis=h,
                   **({"de_zahl": "sg"} if i in ("bryuki", "dzhinsy") else {}))
              for i, ru, de, g, satz, h in W],
  "reise": {
    "neu_knopf": "Nächster Einkauf →",
    "start_stufe": "theke",
    "figuren": {
      "prodavets": {"name": "Продаве́ц", "stimme": "maennlich", "blase": {"x": 0.835, "y": 0.44, "seite": "links"}},
      "kassirsha": {"name": "Касси́рша", "stimme": "weiblich", "blase": {"x": 0.955, "y": 0.5, "seite": "links"}},
      "erzaehler": {"name": "", "stimme": "erzaehler", "blase": {"x": 0.3, "y": 0.45}},
    },
    "reisende": R,
    "szenen": szenen,
  },
}
json.dump(modul, open(os.path.join(B, "modul.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(inhalt, open(os.path.join(B, "inhalt.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(R), "Kunden,", len(W), "Wörter; Summen:", [r["preis"] for r in R])
