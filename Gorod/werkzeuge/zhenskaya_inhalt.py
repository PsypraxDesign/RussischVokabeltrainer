"""Erzeugt module/zhenskaya/modul.json und inhalt.json (Damenmode im GUM).

Aussuchen (Farbe passt sich ans Nomen an), Anprobe (Akkusativ, Größe als Ordnungszahl,
мал/велик, Dativ вам/мне, Akkusativ-Pronomen) und Kasse (для + Genitiv) entstehen hier aus
wenigen Tabellen, damit alle Formen einheitlich sind. Aufruf aus dem Gorod-Ordner:
    python werkzeuge/zhenskaya_inhalt.py
"""
import json, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "module", "zhenskaya")
os.makedirs(os.path.join(B, "grafik"), exist_ok=True)

modul = {
  "titel": {"ru": "же́нская оде́жда", "de": "Damenmode"},
  "praeposition": "в",
  "satz_hin": "Я иду́ в отде́л же́нской оде́жды.",
  "satz_hin_de": "Ich gehe in die Damenabteilung.",
  "stufen": ["entdecken", "hoeren", "einkaufen", "theke", "kasse"],
  "stufen_titel": {"einkaufen": "Aussuchen", "theke": "Anprobe"},
  "grafik": {"aussen": "grafik/aussen.svg", "innen": "grafik/innen.svg"},
  "farbe": "#9b3d6b",
  "breite": 250
}

W = [  # id, ru, de, genus, Satz, Hinweis
 # Kleidung in zwei Farben – die Farbe richtet sich nach dem Nomen
 ("plate_krasnoe", "кра́сное пла́тье", "das rote Kleid", "n", "Кра́сное пла́тье дли́нное.", "пла́тье ist sächlich: кра́сн-ое. Plural: пла́тья"),
 ("plate_sinee", "си́нее пла́тье", "das blaue Kleid", "n", "Си́нее пла́тье коро́ткое.", "си́ний hat ein weiches н: си́ний, си́няя, си́нее, си́ние"),
 ("yubka_chernaya", "чёрная ю́бка", "der schwarze Rock", "f", "Чёрная ю́бка дли́нная.", "der Rock – aber ю́бка ist weiblich: чёрн-ая"),
 ("yubka_krasnaya", "кра́сная ю́бка", "der rote Rock", "f", "Кра́сная ю́бка коро́ткая.", "кра́сный – кра́сная – кра́сное – кра́сные: die Endung folgt dem Nomen"),
 ("bryuki_sinie", "си́ние брю́ки", "die blaue Hose", "pl", "Си́ние брю́ки дли́нные.", "брю́ки gibt es nur im Plural – die Farbe auch: си́ни-е"),
 ("bryuki_chernye", "чёрные брю́ки", "die schwarze Hose", "pl", "Чёрные брю́ки у́зкие.", "nur im Plural: чёрные брю́ки – eine Hose"),
 ("sviter_belyy", "бе́лый сви́тер", "der weiße Pullover", "m", "Бе́лый сви́тер лежи́т на по́лке.", "сви́тер ist männlich: бе́л-ый (aus dem Englischen: sweater)"),
 ("sviter_krasnyy", "кра́сный сви́тер", "der rote Pullover", "m", "Кра́сный сви́тер тёплый.", "кра́сный сви́тер (m), кра́сная ю́бка (f), кра́сное пла́тье (n)"),
 # Kleidung in einer Farbe
 ("bluzka", "блу́зка", "die Bluse", "f", "Блу́зка бе́лая.", "Plural: блу́зки"),
 ("kurtka", "ку́ртка", "die Jacke", "f", "Ку́ртка зелёная.", "Plural: ку́ртки"),
 ("palto", "пальто́", "der Mantel", "n", "Пальто́ тёплое.", "unveränderlich: в пальто́, без пальто́. Sächlich: тёплое пальто́"),
 ("sharf", "шарф", "der Schal", "m", "Шарф дли́нный.", "шарф ist männlich: дли́нный шарф"),
 ("perchatki", "перча́тки", "die Handschuhe", "pl", "Перча́тки лежа́т на по́лке.", "Singular: перча́тка; ein Paar Handschuhe: па́ра перча́ток"),
 ("tufli", "ту́фли", "die Pumps", "pl", "Ту́фли на высо́ком каблуке́.", "Singular: ту́фля – ein Damenschuh"),
 ("sapogi", "сапоги́", "die Stiefel", "pl", "Сапоги́ стоя́т на полу́.", "Singular: сапо́г; ein Paar Stiefel: па́ра сапо́г"),
 ("sumka", "су́мка", "die Handtasche", "f", "Су́мка ко́жаная.", "у меня́ есть су́мка – ich habe eine Tasche"),
 # Die Abteilung
 ("razmer", "разме́р", "die Größe", "m", "Како́й у вас разме́р?", "Größen sind Ordnungszahlen: 46-й (со́рок шесто́й) разме́р = Größe 46"),
 ("primerochnaya", "приме́рочная", "die Umkleidekabine", "f", "Приме́рочная свобо́дна.", "eigentlich ein Adjektiv: в приме́рочной – in der Kabine. Von приме́рить – anprobieren"),
 ("zerkalo", "зе́ркало", "der Spiegel", "n", "Зе́ркало большо́е.", "смотре́ть в зе́ркало – in den Spiegel schauen (в + Akkusativ)"),
 ("veshalka", "ве́шалка", "der Kleiderbügel", "f", "Ве́шалка пуста́я.", "ве́шалка heißt auch Garderobe oder Kleiderständer"),
 ("maneken", "манеке́н", "die Schaufensterpuppe", "m", "Манеке́н в жёлтом пла́тье.", "манеке́н ist männlich – auch im Kleid. в + Präpositiv: в жёлтом пла́тье"),
 ("polka", "по́лка", "das Regal", "f", "На по́лке лежа́т сви́теры.", "на по́лке – im Regal (wörtlich: auf dem Brett)"),
 ("prodavshchitsa", "продавщи́ца", "die Verkäuferin", "f", "Продавщи́ца улыба́ется.", "männlich: продаве́ц"),
 ("kassa", "ка́сса", "die Kasse", "f", "Ка́сса у вы́хода.", "у + Genitiv: вы́ход → у вы́хода (am Ausgang)"),
 ("kassir", "касси́р", "die Kassiererin", "m", "Касси́р сиди́т за ка́ссой.", "касси́р ist männlich, gilt aber auch für Frauen; umgangssprachlich: касси́рша"),
]
WORT = {i: (ru, de, g) for i, ru, de, g, _, _ in W}

# ------------------------------------------------------------------ Sachen für den Zettel
# Preis (₽), Bild, deutsches Pronomen (Nominativ, Akkusativ) für die Anprobe
SACHEN = {
 "plate_krasnoe": (2400, "👗", "es", "es"), "plate_sinee": (2200, "👗", "es", "es"),
 "yubka_chernaya": (1600, "👗", "er", "ihn"), "yubka_krasnaya": (1500, "👗", "er", "ihn"),
 "bryuki_sinie": (1900, "👖", "sie", "sie"), "bryuki_chernye": (2000, "👖", "sie", "sie"),
 "sviter_belyy": (2100, "🧶", "er", "ihn"), "sviter_krasnyy": (1800, "🧶", "er", "ihn"),
 "bluzka": (1300, "👚", "sie", "sie"), "tufli": (2300, "👠", "sie", "sie"),
 "sharf": (600, "🧣", "er", "ihn"), "perchatki": (500, "🧤", "sie", "sie"), "sumka": (1200, "👜", "sie", "sie"),
}
# Die andere Farbe desselben Stücks (falsche Antwort beim Suchen)
PARTNER = {"plate_krasnoe": "plate_sinee", "plate_sinee": "plate_krasnoe", "yubka_chernaya": "yubka_krasnaya",
           "yubka_krasnaya": "yubka_chernaya", "bryuki_sinie": "bryuki_chernye", "bryuki_chernye": "bryuki_sinie",
           "sviter_belyy": "sviter_krasnyy", "sviter_krasnyy": "sviter_belyy"}
# Akkusativ (nur weiblich ändert sich) und typischer Fehler beim Anpassen der Farbe
AKK = {"yubka_chernaya": "чёрную ю́бку", "yubka_krasnaya": "кра́сную ю́бку"}
FEHLER_FARBE = {
 "plate_krasnoe": ("кра́сный пла́тье", "пла́тье ist sächlich: кра́сное пла́тье."),
 "plate_sinee": ("си́ний пла́тье", "пла́тье ist sächlich: си́нее пла́тье."),
 "yubka_chernaya": ("чёрная ю́бка", "иска́ть + Akkusativ: чёрная ю́бка → чёрную ю́бку."),
 "yubka_krasnaya": ("кра́сная ю́бка", "иска́ть + Akkusativ: кра́сная ю́бка → кра́сную ю́бку."),
 "bryuki_sinie": ("си́нюю брю́ки", "брю́ки sind Plural: си́ние брю́ки."),
 "bryuki_chernye": ("чёрный брю́ки", "брю́ки sind Plural: чёрные брю́ки."),
 "sviter_belyy": ("бе́лое сви́тер", "сви́тер ist männlich: бе́лый сви́тер."),
 "sviter_krasnyy": ("кра́сная сви́тер", "сви́тер ist männlich: кра́сный сви́тер."),
}
NOMEN = {"plate_krasnoe": "пла́тье", "plate_sinee": "пла́тье", "yubka_chernaya": "ю́бка", "yubka_krasnaya": "ю́бка",
         "bryuki_sinie": "брю́ки", "bryuki_chernye": "брю́ки", "sviter_belyy": "сви́тер", "sviter_krasnyy": "сви́тер"}
# Deutscher Akkusativ für „Ich suche …“
DE_AKK = {"plate_krasnoe": "das rote Kleid", "plate_sinee": "das blaue Kleid", "yubka_chernaya": "den schwarzen Rock",
          "yubka_krasnaya": "den roten Rock", "bryuki_sinie": "die blaue Hose", "bryuki_chernye": "die schwarze Hose",
          "sviter_belyy": "den weißen Pullover", "sviter_krasnyy": "den roten Pullover"}
GENUS_DE = {"m": "männlich", "f": "weiblich", "n": "sächlich", "pl": "Plural"}
PRON = {"m": "он", "f": "она́", "n": "оно́", "pl": "они́"}
PRON_AKK = {"m": "его́", "f": "её", "n": "его́", "pl": "их"}
FALSCHES_GENUS = {"m": "f", "f": "m", "n": "f", "pl": "n"}
KURZ = {"klein": {"m": "мал", "f": "мала́", "n": "мало́", "pl": "малы́"},
        "gross": {"m": "вели́к", "f": "велика́", "n": "велико́", "pl": "велики́"}}
KURZ_DE = {"klein": "zu klein", "gross": "zu groß"}
# Größe in Ziffern mit Endung (46-й): ausgeschrieben („со́рок шесто́й“) hält die Grammatik-Suche
# das Ordinal für ein gezähltes Nomen und erklärt „Genitiv Plural“. Gesprochen klingt beides gleich.
ORD = {42: ("42-й", "42-я", "со́рок второ́й"), 44: ("44-й", "44-я", "со́рок четвёртый"),
       46: ("46-й", "46-я", "со́рок шесто́й"), 48: ("48-й", "48-я", "со́рок восьмо́й")}
FUER = {  # für wen: Nominativ, Genitiv, deutsch
 "mama": ("ма́ма", "ма́мы", "Mama"), "sestra": ("сестра́", "сестры́", "deine Schwester"),
 "babushka": ("ба́бушка", "ба́бушки", "Oma"), "podruga": ("подру́га", "подру́ги", "deine Freundin"),
}

HUNDERTER = ["", "сто", "две́сти", "три́ста", "четы́реста", "пятьсо́т", "шестьсо́т", "семьсо́т", "восемьсо́т", "девятьсо́т"]
# nach сто́ит steht der Akkusativ: ты́сяча → ты́сячу
TAUSEND = {1: "ты́сячу", 2: "две ты́сячи", 3: "три ты́сячи", 4: "четы́ре ты́сячи", 5: "пять ты́сяч"}

def rubel(n):
    """Nur volle Hunderter bis 5900 – dann heißt es immer рубле́й."""
    t, h = divmod(n, 1000)
    return " ".join(x for x in (TAUSEND.get(t, ""), HUNDERTER[h // 100], "рубле́й") if x)

def gross(t): return t[0].upper() + t[1:]
de_gross = gross

def kundin(id, haupt, dazu, zub, groesse, problem, fuer, tasche, zahlart):
    teile = [haupt, dazu, zub]
    ru_h, de_h, g = WORT[haupt]
    noun = NOMEN[haupt]
    preis_h, _, de_pron, de_akk = SACHEN[haupt]
    groesse2 = groesse + 2 if problem == "klein" else groesse - 2
    liste = [{"ware": w, "menge": 1, "text": WORT[w][0], "de": WORT[w][1], "bild": SACHEN[w][1]} for w in teile]
    andere = "gross" if problem == "klein" else "klein"
    fg = FALSCHES_GENUS[g]
    zub_ru, zub_de, zub_g = WORT[zub]
    ist = "sind" if zub_g == "pl" else "ist"
    pron_falsch = PRON_AKK["f"] if g in ("m", "n") else PRON_AKK["m"]

    felder = {
      "suche": {"richtig": {"text": f"Да, пожа́луйста. Я ищу́ {AKK.get(haupt, ru_h)}.", "de": f"Ja, bitte. Ich suche {DE_AKK[haupt]}."},
        "falsch": [{"text": f"Да, пожа́луйста. Я ищу́ {FEHLER_FARBE[haupt][0]}.", "de": "", "hinweis": FEHLER_FARBE[haupt][1]},
                   {"text": f"Да, пожа́луйста. Я ищу́ {AKK.get(PARTNER[haupt], WORT[PARTNER[haupt]][0])}.", "de": f"Ja, bitte. Ich suche {DE_AKK[PARTNER[haupt]]}.",
                    "hinweis": f"Laut Zettel suchst du {DE_AKK[haupt]} – {ru_h}."}]},
      "razmer": {"richtig": {"text": f"У меня́ {ORD[groesse][0]} разме́р.", "de": f"Ich habe Größe {groesse}."},
        "falsch": [{"text": f"У меня́ {ORD[groesse][1]} разме́р.", "de": "",
                    "hinweis": f"разме́р ist männlich: {ORD[groesse][0]} разме́р – gesprochen {ORD[groesse][2]} разме́р."},
                   {"text": f"У меня́ {ORD[groesse2][0]} разме́р.", "de": f"Ich habe Größe {groesse2}.", "hinweis": f"Laut Zettel hast du Größe {groesse}."}]},
      "passt": {"richtig": {"text": f"Нет, {PRON[g]} мне {KURZ[problem][g]}.", "de": f"Nein, {de_pron} ist mir {KURZ_DE[problem]}."},
        "falsch": [{"text": f"Нет, {PRON[fg]} мне {KURZ[problem][fg]}.", "de": "",
                    "hinweis": (f"брю́ки sind Plural: {PRON[g]} мне {KURZ[problem][g]}." if g == "pl"
                                else f"{noun} ist {GENUS_DE[g]}: {PRON[g]} мне {KURZ[problem][g]}.")},
                   {"text": f"Нет, {PRON[g]} мне {KURZ[andere][g]}.", "de": f"Nein, {de_pron} ist mir {KURZ_DE[andere]}.",
                    "hinweis": f"Laut Zettel: {KURZ_DE[problem]} – {KURZ[problem][g]}. {KURZ[andere][g]} heißt „{KURZ_DE[andere]}“."}]},
      "nehmen": {"richtig": {"text": f"Да, я {PRON_AKK[g]} возьму́.", "de": f"Ja, ich nehme {de_akk}."},
        "falsch": [{"text": f"Да, я {PRON[g]} возьму́.", "de": "", "hinweis": f"Nach возьму́ steht der Akkusativ: {PRON[g]} → {PRON_AKK[g]}."},
                   {"text": f"Да, я {pron_falsch} возьму́.", "de": "",
                    "hinweis": (f"брю́ки sind Plural – Akkusativ их." if g == "pl"
                                else f"{noun} ist {GENUS_DE[g]} – Akkusativ {PRON_AKK[g]}" + (" (wie männlich)." if g == "n" else "."))}]},
      "paket": ({"richtig": {"text": "Нет, спаси́бо, у меня́ есть су́мка.", "de": "Nein danke, ich habe eine Tasche."},
        "falsch": [{"text": "Нет, спаси́бо, у меня́ есть су́мку.", "de": "", "hinweis": "у меня́ есть … + Nominativ: су́мка."},
                   {"text": "Да, оди́н паке́т, пожа́луйста.", "de": "Ja, eine Tüte, bitte.", "hinweis": "Laut Zettel hast du eine eigene Tasche dabei."}]}
        if tasche else
        {"richtig": {"text": "Да, оди́н паке́т, пожа́луйста.", "de": "Ja, eine Tüte, bitte."},
        "falsch": [{"text": "Да, одна́ паке́т, пожа́луйста.", "de": "", "hinweis": "паке́т ist männlich: оди́н паке́т."},
                   {"text": "Нет, спаси́бо, у меня́ есть су́мка.", "de": "Nein danke, ich habe eine Tasche.", "hinweis": "Laut Zettel hast du keine Tasche dabei."}]}),
    }
    if fuer:
        nom, gen, de_wer = FUER[fuer]
        felder["podarok"] = {"richtig": {"text": f"Да, для {gen}.", "de": f"Ja, für {de_wer}."},
          "falsch": [{"text": f"Да, для {nom}.", "de": "", "hinweis": f"для + Genitiv: {nom} → {gen}."},
                     {"text": "Нет, э́то для меня́.", "de": "Nein, das ist für mich.", "hinweis": f"Laut Zettel {ist} {zub_de} ein Geschenk für {de_wer}."}]}
        zettel_geschenk = f"{de_gross(zub_de)} {ist} ein Geschenk für {de_wer}."
    else:
        felder["podarok"] = {"richtig": {"text": "Нет, э́то для меня́.", "de": "Nein, das ist für mich."},
          "falsch": [{"text": "Нет, э́то для я.", "de": "", "hinweis": "для + Genitiv: я → меня́."},
                     {"text": "Да, для ма́мы.", "de": "Ja, für Mama.", "hinweis": f"Laut Zettel {ist} {zub_de} für dich selbst."}]}
        zettel_geschenk = "Alles ist für dich selbst."

    posten = [{"ru": WORT[w][0], "preis": SACHEN[w][0]} for w in teile]
    verb = "сто́ят" if g == "pl" else "сто́ит"
    return {
      "id": id, "geschlecht": "f", "zahlart": zahlart,
      "liste": liste,
      "liste_satz": "Мой спи́сок: " + ", ".join(p["text"] for p in liste[:-1]) + " и " + liste[-1]["text"] + ".",
      "posten": posten, "preis": sum(p["preis"] for p in posten),
      "p": {
        "r2": ORD[groesse2][0], "r2_de": str(groesse2),
        "akk": AKK.get(haupt, ru_h), "akk_de": DE_AKK[haupt],
        "preis_ru": f"{gross(PRON[g])} {verb} {rubel(preis_h)}.",
        "preis_de": f"{de_gross(de_h)} kostet {preis_h} Rubel.",
        "nehmen_de": de_akk,
        "zub": gross(zub_ru), "zub_de": zub_de, "zub_ist": de_gross(ist),
      },
      "zettel": {
        "theke": [f"Du suchst {DE_AKK[haupt]}.", f"Deine Größe: {groesse}", f"Beim Anprobieren: {KURZ_DE[problem]}"],
        "kasse": [zettel_geschenk,
                  "Eigene Tasche dabei" if tasche else "Keine Tasche dabei",
                  f"Bezahlen: {'bar' if zahlart == 'bar' else 'mit Karte'}"],
      },
      "felder": felder,
    }

R = [
 kundin("k1", "plate_krasnoe", "bluzka", "sharf", 44, "klein", "mama", True, "karte"),
 kundin("k2", "yubka_chernaya", "tufli", "perchatki", 46, "gross", None, False, "bar"),
 kundin("k3", "bryuki_sinie", "bluzka", "perchatki", 42, "klein", "sestra", True, "karte"),
 kundin("k4", "sviter_belyy", "yubka_chernaya", "sharf", 48, "gross", "babushka", False, "bar"),
 kundin("k5", "plate_sinee", "sharf", "sumka", 46, "gross", "podruga", False, "karte"),
 kundin("k6", "sviter_krasnyy", "bryuki_chernye", "perchatki", 44, "klein", None, True, "bar"),
 kundin("k7", "yubka_krasnaya", "bluzka", "sharf", 42, "klein", "mama", False, "karte"),
]

szenen = {
 "theke": {
  "titel": "Anprobe", "zettel_titel": "Dein Zettel",
  "geschafft": "Anprobiert – jetzt passt es!",
  "start": "hallo",
  "knoten": {
   "hallo": {"sprecher": "prodavshchitsa", "text": "Здра́вствуйте! Вам помо́чь?", "de": "Guten Tag! Kann ich Ihnen helfen?", "feld": "suche", "weiter": "razmer"},
   "razmer": {"sprecher": "prodavshchitsa", "text": "Како́й у вас разме́р?", "de": "Welche Größe haben Sie?", "feld": "razmer", "weiter": "vot"},
   "vot": {"sprecher": "prodavshchitsa", "text": "Вот, пожа́луйста.", "de": "Bitte schön.",
     "optionen": [
       {"text": "Спаси́бо. Мо́жно приме́рить?", "de": "Danke. Darf ich es anprobieren?", "weiter": "kabine"},
       {"text": "Спаси́бо, до свида́ния!", "de": "Danke, auf Wiedersehen!", "hinweis": "Du willst es doch erst anprobieren: Мо́жно приме́рить?"}]},
   "kabine": {"sprecher": "prodavshchitsa", "text": "Коне́чно. Приме́рочная – там.", "de": "Natürlich. Die Umkleidekabine ist dort.",
     "optionen": [
       {"text": "Спаси́бо!", "de": "Danke!", "weiter": "spiegel"},
       {"text": "Не за что!", "de": "Keine Ursache!", "hinweis": "„Не за что“ sagt man, wenn sich jemand bei dir bedankt. Hier bedankst du dich: Спаси́бо!"}]},
   "spiegel": {"sprecher": "erzaehler", "text": "Вы примеря́ете {akk} и смо́трите в зе́ркало.", "de": "Sie probieren {akk_de} an und schauen in den Spiegel.",
     "pause": 500, "weiter": "kak"},
   "kak": {"sprecher": "prodavshchitsa", "text": "Ну как? Подхо́дит?", "de": "Na, wie ist es? Passt es?", "feld": "passt", "weiter": "idet"},
   "idet": {"sprecher": "prodavshchitsa", "text": "Вот {r2} разме́р. Вам о́чень идёт!", "de": "Hier ist Größe {r2_de}. Das steht Ihnen sehr gut!",
     "optionen": [
       {"text": "Спаси́бо! Мне то́же нра́вится.", "de": "Danke! Mir gefällt es auch.", "weiter": "preis"},
       {"text": "Спаси́бо! Я то́же нра́вится.", "de": "", "hinweis": "нра́виться: Wem gefällt es? Russisch sagt „mir gefällt“ – мне нра́вится (Dativ)."},
       {"text": "Пожа́луйста!", "de": "Bitte!", "hinweis": "Auf ein Kompliment antwortet man mit спаси́бо."}]},
   "preis": {"sprecher": "prodavshchitsa", "text": "{preis_ru} Берёте?", "de": "{preis_de} Nehmen Sie {nehmen_de}?", "feld": "nehmen", "weiter": "kasse"},
   "kasse": {"sprecher": "prodavshchitsa", "text": "Отли́чно! Ка́сса – там, у вы́хода.", "de": "Prima! Die Kasse ist dort, am Ausgang.",
     "optionen": [
       {"text": "Спаси́бо большо́е!", "de": "Vielen Dank!", "ende": True},
       {"text": "Пожа́луйста!", "de": "Bitte!", "hinweis": "Пожа́луйста antwortet man auf спаси́бо. Hier bedankst du dich: Спаси́бо!"}]},
  }},
 "kasse": {
  "titel": "Kasse", "zettel_titel": "Dein Zettel",
  "geschafft": "Bezahlt – viel Freude mit den neuen Sachen!",
  "start": "band",
  "knoten": {
   "band": {"sprecher": "erzaehler", "text": "Вы на ка́ссе. Касси́р пробива́ет поку́пки.", "de": "Sie sind an der Kasse. Die Kassiererin scannt die Einkäufe.",
     "aktion": "scannen", "weiter": "paket"},
   "paket": {"sprecher": "kassir", "text": "Паке́т ну́жен?", "de": "Brauchen Sie eine Tüte?", "feld": "paket", "weiter": "podarok"},
   "podarok": {"sprecher": "kassir", "text": "{zub} – э́то пода́рок?", "de": "{zub_ist} {zub_de} ein Geschenk?", "feld": "podarok", "weiter": "zahlart"},
   "zahlart": {"sprecher": "kassir", "text": "Нали́чными и́ли ка́ртой?", "de": "Bar oder mit Karte?",
     "optionen": [
       {"text": "Нали́чными.", "de": "Bar.", "zahlart": "bar", "weiter": "summe"},
       {"text": "Ка́ртой.", "de": "Mit Karte.", "zahlart": "karte", "weiter": "summe"}]},
   "summe": {"sprecher": "kassir", "text": "С вас {summe}.", "de": "Das macht {summe_de}.", "aktion": "bezahlen", "weiter": "abschied"},
   "abschied": {"sprecher": "kassir", "text": "Спаси́бо за поку́пку! Носи́те с удово́льствием!", "de": "Danke für Ihren Einkauf! Viel Freude beim Tragen!",
     "optionen": [
       {"text": "Спаси́бо, до свида́ния!", "de": "Danke, auf Wiedersehen!", "ende": True},
       {"text": "Прия́тного аппети́та!", "de": "Guten Appetit!", "hinweis": "Das wünscht man beim Essen. Zum Abschied: До свида́ния!"}]},
  }},
}

inhalt = {
  "entdecken_hinweis": "Was gibt es in der Damenabteilung? Tippe auf die Kleider, den Spiegel, die Verkäuferin …",
  "woerter": [dict(id=i, ru=ru, de=de, genus=g, hotspot="hs-" + i.replace("_", "-"), satz=satz, hinweis=h,
                   **({"de_zahl": "sg"} if i.startswith("bryuki") else {}))
              for i, ru, de, g, satz, h in W],
  "einkaufen_text": {
    "titel": "Aussuchen",
    "anleitung": "Hör dir deinen Zettel an und tippe die Sachen im Bild an. Achte auf die Farbe!",
    "zettel": "Мой спи́сок", "korb": "Мой вы́бор",
    "leer": "Noch nichts ausgesucht. Tippe im Bild auf die Sachen.",
    "fertig": "Alles ausgesucht!", "weiter": "Weiter zur Anprobe", "lob": "Молоде́ц! Всё есть.",
    "tipp": "Tipp: Die Farbe passt sich an – кра́сный шарф, кра́сная ю́бка, кра́сное пла́тье, кра́сные брю́ки.",
  },
  "reise": {
    "neu_knopf": "Neuer Zettel →",
    "start_stufe": "einkaufen",
    "figuren": {
      "prodavshchitsa": {"name": "Продавщи́ца", "stimme": "weiblich", "blase": {"x": 0.79, "y": 0.4, "seite": "links"}},
      "kassir": {"name": "Касси́р", "stimme": "weiblich", "blase": {"x": 0.93, "y": 0.52, "seite": "links"}},
      "erzaehler": {"name": "", "stimme": "erzaehler", "blase": {"x": 0.08, "y": 0.3}},
    },
    "reisende": R,
    "szenen": szenen,
  },
}
json.dump(modul, open(os.path.join(B, "modul.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(inhalt, open(os.path.join(B, "inhalt.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(R), "Kundinnen,", len(W), "Wörter; Summen:", [r["preis"] for r in R])
