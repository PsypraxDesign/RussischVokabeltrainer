"""Erzeugt module/aeroport/modul.json und inhalt.json (Flughafen).

Alle Reisenden sind erfunden. Aufruf aus dem Gorod-Ordner:
    python werkzeuge/aeroport_inhalt.py
"""
import json, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "module", "aeroport")
os.makedirs(os.path.join(B, "grafik"), exist_ok=True)

modul = {
  "titel": {"ru": "аэропо́рт", "de": "Flughafen"},
  "praeposition": "в",
  "satz_hin": "Я е́ду в аэропо́рт.",
  "satz_hin_de": "Ich fahre zum Flughafen.",
  "stufen": ["entdecken", "hoeren", "pass", "gepaeck", "zoll"],
  "grafik": {"aussen": "grafik/aussen.svg", "innen": "grafik/innen.svg"},
  "farbe": "#2b6f9e",
  "breite": 250
}

W = [
 ("kontrol", "па́спортный контро́ль", "die Passkontrolle", "m", "hs-kontrol", "Снача́ла – па́спортный контро́ль.", None),
 ("pogranichnik", "пограни́чник", "der Grenzbeamte", "m", "hs-pogranichnik", "Пограни́чник проверя́ет па́спорт.", "грани́ца – die Grenze"),
 ("pasport", "па́спорт", "der Pass", "m", "hs-pasport", "Па́спорт лежи́т на сто́йке.", "Für Auslandsreisen: загранпа́спорт"),
 ("samolyot", "самолёт", "das Flugzeug", "m", "hs-samolyot", "Самолёт стои́т за окно́м.", "прилете́ть – (mit dem Flugzeug) ankommen"),
 ("tablo", "табло́", "die Anzeigetafel", "n", "hs-tablo", "На табло́ – все ре́йсы.", "unveränderlich wie меню́; рейс – der Flug"),
 ("lenta", "бага́жная ле́нта", "das Gepäckband", "f", "hs-lenta", "Чемода́ны е́дут по ле́нте.", None),
 ("bagazh", "бага́ж", "das Gepäck", "m", "hs-bagazh", "Бага́ж е́дет по ле́нте.", "nur Singular: бага́ж = alles Gepäck zusammen"),
 ("chemodan", "чемода́н", "der Koffer", "m", "hs-chemodan", "Чемода́н стои́т на теле́жке.", None),
 ("telezhka", "теле́жка", "der Gepäckwagen", "f", "hs-telezhka", "Теле́жка стои́т у ле́нты.", None),
 ("ryukzak", "рюкза́к", "der Rucksack", "m", "hs-ryukzak", "Рюкза́к лежи́т на полу́.", "на полу́ – auf dem Boden (Sonderendung wie в саду́)"),
 ("sumka", "су́мка", "die Tasche", "f", "hs-sumka", "Су́мка стои́т ря́дом с рюкзако́м.", "ручна́я кладь – das Handgepäck"),
 ("passazhirka", "пассажи́рка", "die Passagierin", "f", "hs-passazhirka", "Пассажи́рка ждёт бага́ж.", "männlich: пассажи́р"),
 ("talon", "поса́дочный тало́н", "die Bordkarte", "m", "hs-talon", "У пассажи́рки в руке́ поса́дочный тало́н.", "бага́жный тало́н – der Gepäckschein"),
 ("rozysk", "ро́зыск багажа́", "die Gepäckermittlung", "m", "hs-rozysk", "Ро́зыск багажа́ – спра́ва.", "Hier meldet man verlorenes Gepäck."),
 ("sotrudnitsa", "сотру́дница", "die Mitarbeiterin", "f", "hs-sotrudnitsa", "Сотру́дница помога́ет пассажи́рам.", "männlich: сотру́дник"),
 ("tamozhnya", "тамо́жня", "der Zoll", "f", "hs-tamozhnya", "Тамо́жня – в конце́ за́ла.", "Grüner Ausgang: „Не́чего деклари́ровать“ – nichts zu verzollen"),
 ("tamozhennik", "тамо́женник", "der Zollbeamte", "m", "hs-tamozhennik", "Тамо́женник проверя́ет су́мки.", None),
 ("vykhod", "вы́ход", "der Ausgang", "m", "hs-vykhod", "Вы́ход – там, за тамо́жней.", "вход – der Eingang"),
]

# ------------------------------------------------------------------ Bausteine für die Reisenden
GEPAECK = {   # Wort, Genus, Gen, Akk, Präp, dt. Nom/Akk, dt. Pronomen
  "chemodan": dict(ru="чемода́н", g="m", gen="чемода́на", akk="чемода́н", de="Ihr Koffer", de_akk="Ihren Koffer", de_kurz="Koffer", ihn="ihn"),
  "sumka":    dict(ru="су́мка",   g="f", gen="су́мки",   akk="су́мку",   de="Ihre Tasche", de_akk="Ihre Tasche", de_kurz="Tasche", ihn="sie"),
  "ryukzak":  dict(ru="рюкза́к",  g="m", gen="рюкзака́", akk="рюкза́к",  de="Ihr Rucksack", de_akk="Ihren Rucksack", de_kurz="Rucksack", ihn="ihn"),
}
FARBEN = {  # m, f, deutsch (Grundform), Hex
  "rot":  ("кра́сный", "кра́сная", "rot", "#c8553d"),
  "schwarz": ("чёрный", "чёрная", "schwarz", "#2c2c2e"),
  "blau": ("си́ний", "си́няя", "blau", "#2b5fa8"),
  "gruen": ("зелёный", "зелёная", "grün", "#3f8f5f"),
  "gelb": ("жёлтый", "жёлтая", "gelb", "#e2b43c"),
  "grau": ("се́рый", "се́рая", "grau", "#8b9095"),
}
GROESSE = {True: ("большо́й", "больша́я", "groß"), False: ("ма́ленький", "ма́ленькая", "klein")}
ZWECKE = {
  "tourismus": ("Тури́зм.", "Tourismus.", "Urlaub"),
  "dienst": ("Командиро́вка.", "Dienstreise.", "Dienstreise"),
  "eltern": ("В го́сти к роди́телям.", "Besuch bei den Eltern.", "Besuch bei den Eltern"),
  "studium": ("Учёба.", "Studium.", "Studium"),
}

def gross(t): return t[0].upper() + t[1:]

def reisender(id, g, fam, fam_ander, imya, otch, otch_ander, vater, geburt, datum, stadt, zweck, dauer,
              gep, wohnen, ding, geld, zettel_de):
    f = g == "f"
    gp = GEPAECK[gep["art"]]
    farbe = FARBEN[gep["farbe"]]
    gr = GROESSE[gep["gross"]]
    fem = gp["g"] == "f"
    adj = lambda paar: paar[1] if fem else paar[0]
    adj_falsch = lambda paar: paar[0] if fem else paar[1]
    andere_farbe = FARBEN["blau" if gep["farbe"] != "blau" else "rot"]
    gross_de = {"rot": "roter", "schwarz": "schwarzer", "blau": "blauer", "gruen": "grüner", "gelb": "gelber", "grau": "grauer"}
    gross_de_f = {"rot": "rote", "schwarz": "schwarze", "blau": "blaue", "gruen": "grüne", "gelb": "gelbe", "grau": "graue"}
    beschr_de = (("große " if gep["gross"] else "kleine ") + gross_de_f[gep["farbe"]] + " " + gp["de_kurz"]) if fem else \
                (("großer " if gep["gross"] else "kleiner ") + gross_de[gep["farbe"]] + " " + gp["de_kurz"])
    mein = "Моя́" if fem else "Мой"
    prishel = "пришла́" if fem else "пришёл"
    potreryal = "потеря́ла" if f else "потеря́л"
    zweck_ru, zweck_de, zweck_zettel = ZWECKE[zweck]

    felder = {
      "familie": {
        "richtig": {"text": f"Моя́ фами́лия – {fam}.", "de": f"Mein Familienname ist {fam}."},
        "falsch": [
          {"text": f"Моя́ фами́лия – {fam_ander}.", "de": "",
           "hinweis": (f"{fam_ander} ist die männliche Form – als Frau heißt du {fam}." if f
                       else f"{fam_ander} ist die weibliche Form – als Mann heißt du {fam}.")},
          {"text": f"Мой фами́лия – {fam}.", "de": "", "hinweis": "фами́лия ist weiblich: моя́ фами́лия."},
        ]},
      "imya": {
        "richtig": {"text": f"Меня́ зову́т {imya}.", "de": f"Ich heiße {imya}."},
        "falsch": [
          {"text": f"Я зову́т {imya}.", "de": "", "hinweis": "Wörtlich „mich nennt man“: меня́ зову́т …"},
          {"text": f"Меня́ зову́т {fam}.", "de": "", "hinweis": f"{fam} ist dein Familienname – gefragt ist der Vorname."},
        ]},
      "otchestvo": {
        "richtig": {"text": f"{otch}.", "de": f"Mein Vatersname: {otch}."},
        "falsch": [
          {"text": f"{otch_ander}.", "de": "",
           "hinweis": (f"-ович/-евич ist die Form für Männer. Frauen: -овна/-евна – also {otch}." if f
                       else f"-овна/-евна ist die Form für Frauen. Männer: -ович/-евич – also {otch}.")},
          {"text": f"{vater}.", "de": "", "hinweis": f"{vater} ist der Vorname deines Vaters – dein Vatersname lautet {otch}."},
        ]},
      "geburt": {
        "richtig": {"text": datum["ru"], "de": datum["de"]},
        "falsch": datum["falsch"]},
      "herkunft": {
        "richtig": {"text": f"Из {stadt['gen']}.", "de": f"Aus {stadt['de']}."},
        "falsch": [
          {"text": f"Из {stadt['nom']}.", "de": "", "hinweis": f"Nach из steht der Genitiv: {stadt['nom']} → из {stadt['gen']}."},
          {"text": f"В {stadt['praep']}.", "de": "", "hinweis": f"в {stadt['praep']} heißt „in {stadt['de']}“ (wo?). Gefragt ist woher: из {stadt['gen']}."},
        ]},
      "zweck": {
        "richtig": {"text": zweck_ru, "de": zweck_de},
        "falsch": [{"text": z[0], "de": z[1], "hinweis": f"Das heißt „{z[1][:-1]}“ – laut deinem Zettel: {zweck_zettel}."}
                   for k, z in ZWECKE.items() if k != zweck][:2]},
      "dauer": {"richtig": {"text": dauer[0], "de": dauer[1]}, "falsch": dauer[2]},
      "verlust": {
        "richtig": {"text": f"{mein} {gp['ru']} не {prishel}.", "de": f"{gp['de'].replace('Ihr', 'Mein').replace('Ihre', 'Meine')} ist nicht angekommen."},
        "falsch": [
          {"text": f"{mein} {gp['ru']} {prishel}.", "de": "", "hinweis": f"{prishel} heißt „ist angekommen“ – es fehlt das не: не {prishel}."},
          ({"text": f"{mein} {gp['ru']} не пришёл.", "de": "", "hinweis": "су́мка ist weiblich: не пришла́."} if fem else
           {"text": f"{'Моя́' if gep['art'] == 'ryukzak' else mein} {gp['ru']} не пришла́.", "de": "",
            "hinweis": f"{gp['ru']} ist männlich: мой {gp['ru']} не пришёл."}),
          {"text": f"Я {potreryal} па́спорт.", "de": "", "hinweis": "Das heißt „Ich habe den Pass verloren“ – dein Pass ist doch da."},
        ]},
      "aussehen": {
        "richtig": {"text": f"{gross(adj(gr))} {adj(farbe)} {gp['ru']}.", "de": gross(beschr_de) + "."},
        "falsch": [
          {"text": f"{gross(adj_falsch(gr))} {adj_falsch(farbe)} {gp['ru']}.", "de": "",
           "hinweis": f"{gp['ru']} ist {'weiblich' if fem else 'männlich'}: {adj(gr)} {adj(farbe)} {gp['ru']}."},
          {"text": f"{gross(adj(gr))} {adj(andere_farbe)} {gp['ru']}.", "de": "",
           "hinweis": f"{adj(andere_farbe)} heißt {andere_farbe[2]}. Dein Gepäck ist {farbe[2]}: {adj(farbe)}."},
          {"text": f"{gross(adj(GROESSE[not gep['gross']]))} {adj(farbe)} {gp['ru']}.", "de": "",
           "hinweis": f"{adj(GROESSE[not gep['gross']])} heißt {GROESSE[not gep['gross']][2]} – schau aufs Bild auf deinem Zettel."},
        ]},
      "wohnen": {"richtig": {"text": wohnen[0], "de": wohnen[1]}, "falsch": wohnen[2]},
      "ding": {"richtig": {"text": ding[0], "de": ding[1]}, "falsch": ding[2]},
      "geld": {"richtig": {"text": geld[0], "de": geld[1]}, "falsch": geld[2]},
    }
    return {
      "id": id, "geschlecht": g,
      "pass": {"familie": fam, "imya": imya, "otchestvo": otch, "geburt": geburt},
      "gepaeck": {"art": gep["art"], "farbe": farbe[3], "gross": gep["gross"]},
      "p": {
        "vash": "ва́ша" if fem else "ваш", "gepaeck": gp["ru"], "gepaeck_akk": gp["akk"],
        "gepaeck_de": gp["de"], "gepaeck_de_akk": gp["de_akk"], "ihn_de": gp["ihn"],
        "nichtda": f"{'Ва́шей' if fem else 'Ва́шего'} {gp['gen']} нет.",
        "nichtda_de": f"{gp['de']} ist nicht da.",
      },
      "zettel": {
        "pass": [f"Flug aus {stadt['de']}", f"Zweck: {zweck_zettel}", f"Aufenthalt: {zettel_de['dauer']}"],
        "gepaeck": [f"Aufgegeben: {beschr_de}", f"Unterkunft: {zettel_de['wohnen']}"],
        "zoll": ["Nichts zu verzollen", f"In der Handtasche: {zettel_de['ding']}", f"Bargeld: {zettel_de['geld']}"],
      },
      "felder": felder,
    }

def datum(tag_ord, tag_kard, monat_gen, monat_nom, jahr_gen, jahr_nom, de, tausch=None):
    falsch = [
      {"text": f"{gross(tag_kard)} {monat_gen} {jahr_gen}.", "de": "",
       "hinweis": f"Beim Datum steht die Ordnungszahl im Neutrum (wie число́): {tag_ord}, nicht {tag_kard}."},
      {"text": f"{gross(tag_ord)} {monat_nom} {jahr_gen}.", "de": "",
       "hinweis": f"Der Monat steht im Genitiv („des …“): {monat_gen}, nicht {monat_nom}."},
    ]
    falsch.append(tausch or {"text": f"{gross(tag_ord)} {monat_gen} {jahr_nom}.", "de": "",
                             "hinweis": f"Auch das Jahr steht im Genitiv: {jahr_gen}."})
    return {"ru": f"{gross(tag_ord)} {monat_gen} {jahr_gen}.", "de": de, "falsch": falsch}

def tausch(text, de, pass_datum, richtig_de):
    return {"text": text, "de": "", "hinweis": f"Das wäre {de} – im Pass steht {pass_datum}, also {richtig_de}. Erst der Tag, dann der Monat."}

def fuer(ru_wem_gen, ru_nom, ru_instr, was_ru, was_de, wem_de, mit_de):
    return (f"Э́то {was_ru} для {ru_wem_gen}.", f"Das ist {was_de} für {wem_de}.", [
      {"text": f"Э́то {was_ru} для {ru_nom}.", "de": "", "hinweis": f"для + Genitiv: {ru_nom} → для {ru_wem_gen}."},
      {"text": f"Э́то {was_ru} с {ru_instr}.", "de": "", "hinweis": f"с {ru_instr} heißt „mit {mit_de}“. „Für“ heißt для + Genitiv: для {ru_wem_gen}."},
    ])

def wohnen_hotel(name, name_de):
    return (f"В гости́нице «{name}».", f"Im Hotel „{name_de}“.", [
      {"text": f"В гости́ница «{name}».", "de": "", "hinweis": "Wo? в + Präpositiv: гости́ница → в гости́нице."},
      {"text": f"В гости́ницу «{name}».", "de": "", "hinweis": "в гости́ницу (Akkusativ) heißt „ins Hotel“ (wohin?). Gefragt ist wo: в гости́нице."},
    ])

def wohnen_bei(gen, nom, falsch2, de):
    return (f"У {gen}.", f"Bei {de}.", [
      {"text": f"У {nom}.", "de": "", "hinweis": f"у + Genitiv: {nom} → у {gen}."},
      {"text": falsch2, "de": "", "hinweis": f"„bei jemandem“ heißt у + Genitiv: у {gen}."},
    ])

def euro(richtig, falsch_zahl, zahl, falsch_zahl_de):
    return (f"{richtig} е́вро.", f"{zahl} Euro.", [
      {"text": f"{richtig} е́вров.", "de": "", "hinweis": "е́вро ist unveränderlich: … е́вро."},
      {"text": f"{falsch_zahl} е́вро.", "de": "", "hinweis": f"{falsch_zahl.lower()} = {falsch_zahl_de}. Du hast {zahl} Euro: {richtig.lower()}."},
    ])

def dollar(richtig, zahl):
    return (f"{richtig} до́лларов.", f"{zahl} Dollar.", [
      {"text": f"{richtig} до́ллара.", "de": "", "hinweis": "Nach 5 und mehr (auch 300, 700) steht der Genitiv Plural: до́лларов."},
      {"text": f"{richtig} до́ллар.", "de": "", "hinweis": "Nach 5 und mehr steht der Genitiv Plural: до́лларов."},
    ])

R = [
 reisender("anna", "f", "Петро́ва", "Петро́в", "А́нна", "Серге́евна", "Серге́евич", "Серге́й", "12.03.1985",
   datum("двена́дцатое", "двена́дцать", "ма́рта", "март", "ты́сяча девятьсо́т во́семьдесят пя́того го́да",
         "ты́сяча девятьсо́т во́семьдесят пя́тый год", "Der 12. März 1985.",
         tausch("Тре́тье декабря́ ты́сяча девятьсо́т во́семьдесят пя́того го́да.", "der 3. Dezember", "12.03.", "der 12. März")),
   dict(nom="Берли́н", gen="Берли́на", praep="Берли́не", de="Berlin"), "tourismus",
   ("Две неде́ли.", "Zwei Wochen.", [
     {"text": "Два неде́ли.", "de": "", "hinweis": "неде́ля ist weiblich: две неде́ли."},
     {"text": "Две неде́ль.", "de": "", "hinweis": "Nach 2, 3, 4 steht der Genitiv Singular: две неде́ли."}]),
   dict(art="chemodan", farbe="rot", gross=True), wohnen_hotel("Ко́смос", "Kosmos"),
   fuer("ма́мы", "ма́ма", "ма́мой", "пода́рок", "ein Geschenk", "Mama", "Mama"),
   euro("Две́сти", "Два́дцать", 200, "20"),
   {"dauer": "zwei Wochen", "wohnen": "Hotel „Kosmos“", "ding": "ein Geschenk für Mama", "geld": "200 Euro"}),

 reisender("dmitri", "m", "Смирно́в", "Смирно́ва", "Дми́трий", "Алекса́ндрович", "Алекса́ндровна", "Алекса́ндр", "03.11.1979",
   datum("тре́тье", "три", "ноября́", "ноя́брь", "ты́сяча девятьсо́т се́мьдесят девя́того го́да",
         "ты́сяча девятьсо́т се́мьдесят девя́тый год", "Der 3. November 1979.",
         tausch("Оди́ннадцатое ма́рта ты́сяча девятьсо́т се́мьдесят девя́того го́да.", "der 11. März", "03.11.", "der 3. November")),
   dict(nom="Фра́нкфурт", gen="Фра́нкфурта", praep="Фра́нкфурте", de="Frankfurt"), "dienst",
   ("Пять дней.", "Fünf Tage.", [
     {"text": "Пять дня.", "de": "", "hinweis": "Ab 5 steht der Genitiv Plural: пять дней."},
     {"text": "Пять день.", "de": "", "hinweis": "Ab 5 steht der Genitiv Plural: пять дней."}]),
   dict(art="sumka", farbe="schwarz", gross=False), wohnen_hotel("Метропо́ль", "Metropol"),
   fuer("бра́та", "брат", "бра́том", "кни́ги", "Bücher", "meinen Bruder", "meinem Bruder"),
   euro("Пятьсо́т", "Пятьдеся́т", 500, "50"),
   {"dauer": "fünf Tage", "wohnen": "Hotel „Metropol“", "ding": "Bücher für deinen Bruder", "geld": "500 Euro"}),

 reisender("elena", "f", "Кузнецо́ва", "Кузнецо́в", "Еле́на", "Ива́новна", "Ива́нович", "Ива́н", "25.07.1992",
   datum("два́дцать пя́тое", "два́дцать пять", "ию́ля", "ию́ль", "ты́сяча девятьсо́т девяно́сто второ́го го́да",
         "ты́сяча девятьсо́т девяно́сто второ́й год", "Der 25. Juli 1992."),
   dict(nom="Ве́на", gen="Ве́ны", praep="Ве́не", de="Wien"), "eltern",
   ("Оди́н ме́сяц.", "Einen Monat.", [
     {"text": "Одна́ ме́сяц.", "de": "", "hinweis": "ме́сяц ist männlich: оди́н ме́сяц."},
     {"text": "Оди́н ме́сяца.", "de": "", "hinweis": "Nach оди́н steht der Nominativ Singular: оди́н ме́сяц."}]),
   dict(art="ryukzak", farbe="blau", gross=True),
   wohnen_bei("роди́телей", "роди́тели", "В роди́телях.", "meinen Eltern"),
   fuer("сестры́", "сестра́", "сестро́й", "шокола́д", "Schokolade", "meine Schwester", "meiner Schwester"),
   dollar("Три́ста", 300),
   {"dauer": "einen Monat", "wohnen": "bei deinen Eltern", "ding": "Schokolade für deine Schwester", "geld": "300 Dollar"}),

 reisender("sergei", "m", "Попо́в", "Попо́ва", "Серге́й", "Никола́евич", "Никола́евна", "Никола́й", "08.01.1968",
   datum("восьмо́е", "во́семь", "января́", "янва́рь", "ты́сяча девятьсо́т шестьдеся́т восьмо́го го́да",
         "ты́сяча девятьсо́т шестьдеся́т восьмо́й год", "Der 8. Januar 1968.",
         tausch("Пе́рвое а́вгуста ты́сяча девятьсо́т шестьдеся́т восьмо́го го́да.", "der 1. August", "08.01.", "der 8. Januar")),
   dict(nom="Мю́нхен", gen="Мю́нхена", praep="Мю́нхене", de="München"), "tourismus",
   ("Три дня.", "Drei Tage.", [
     {"text": "Три дней.", "de": "", "hinweis": "Nach 2, 3, 4 steht der Genitiv Singular: три дня."},
     {"text": "Три день.", "de": "", "hinweis": "Nach 2, 3, 4 steht der Genitiv Singular: три дня."}]),
   dict(art="chemodan", farbe="gruen", gross=True),
   wohnen_bei("дру́га", "друг", "У дру́гу.", "einem Freund"),
   fuer("дру́га", "друг", "дру́гом", "вино́", "Wein", "einen Freund", "einem Freund"),
   euro("Ты́сяча", "Сто", 1000, "100"),
   {"dauer": "drei Tage", "wohnen": "bei einem Freund", "ding": "Wein für deinen Freund", "geld": "1000 Euro"}),

 reisender("olga", "f", "Во́лкова", "Во́лков", "О́льга", "Дми́триевна", "Дми́триевич", "Дми́трий", "19.09.2001",
   datum("девятна́дцатое", "девятна́дцать", "сентября́", "сентя́брь", "две ты́сячи пе́рвого го́да",
         "две ты́сячи пе́рвый год", "Der 19. September 2001."),
   dict(nom="Цю́рих", gen="Цю́риха", praep="Цю́рихе", de="Zürich"), "studium",
   ("Два ме́сяца.", "Zwei Monate.", [
     {"text": "Две ме́сяца.", "de": "", "hinweis": "ме́сяц ist männlich: два ме́сяца."},
     {"text": "Два ме́сяцев.", "de": "", "hinweis": "Nach 2, 3, 4 steht der Genitiv Singular: два ме́сяца."}]),
   dict(art="sumka", farbe="gelb", gross=True),
   wohnen_bei("сестры́", "сестра́", "У сестре́.", "meiner Schwester"),
   fuer("ба́бушки", "ба́бушка", "ба́бушкой", "конфе́ты", "Pralinen", "Oma", "Oma"),
   euro("Четы́реста", "Со́рок", 400, "40"),
   {"dauer": "zwei Monate", "wohnen": "bei deiner Schwester", "ding": "Pralinen für Oma", "geld": "400 Euro"}),

 reisender("aleksei", "m", "Моро́зов", "Моро́зова", "Алексе́й", "Петро́вич", "Петро́вна", "Пётр", "30.05.1990",
   datum("тридца́тое", "три́дцать", "ма́я", "май", "ты́сяча девятьсо́т девяно́стого го́да",
         "ты́сяча девятьсо́т девяно́стый год", "Der 30. Mai 1990."),
   dict(nom="Га́мбург", gen="Га́мбурга", praep="Га́мбурге", de="Hamburg"), "dienst",
   ("Де́сять дней.", "Zehn Tage.", [
     {"text": "Де́сять дня.", "de": "", "hinweis": "Ab 5 steht der Genitiv Plural: де́сять дней."},
     {"text": "Де́сять день.", "de": "", "hinweis": "Ab 5 steht der Genitiv Plural: де́сять дней."}]),
   dict(art="chemodan", farbe="grau", gross=False), wohnen_hotel("Украи́на", "Ukraina"),
   fuer("сы́на", "сын", "сы́ном", "игру́шка", "ein Spielzeug", "meinen Sohn", "meinem Sohn"),
   dollar("Семьсо́т", 700),
   {"dauer": "zehn Tage", "wohnen": "Hotel „Ukraina“", "ding": "ein Spielzeug für deinen Sohn", "geld": "700 Dollar"}),
]

szenen = {
 "pass": {
  "titel": "Passkontrolle", "zettel_titel": "Deine Reise",
  "geschafft": "Eingereist! Der Stempel ist im Pass.",
  "start": "dokumente",
  "knoten": {
   "dokumente": {"sprecher": "pogranichnik", "text": "Здра́вствуйте! Ва́ши докуме́нты, пожа́луйста.", "de": "Guten Tag! Ihre Dokumente, bitte.",
     "optionen": [
       {"text": "Здра́вствуйте! Вот мой па́спорт.", "de": "Guten Tag! Hier ist mein Pass.", "weiter": "familie"},
       {"text": "Здра́вствуйте! Вот моя́ па́спорт.", "de": "", "hinweis": "па́спорт ist männlich: мой па́спорт."},
       {"text": "Здра́вствуйте! Вот мой биле́т в кино́.", "de": "Guten Tag! Hier ist meine Kinokarte.", "hinweis": "биле́т в кино́ ist eine Kinokarte – gefragt sind die Reisedokumente."}]},
   "familie": {"sprecher": "pogranichnik", "text": "Ва́ша фами́лия?", "de": "Ihr Familienname?", "feld": "familie", "weiter": "imya"},
   "imya": {"sprecher": "pogranichnik", "text": "Как вас зову́т?", "de": "Wie heißen Sie (mit Vornamen)?", "feld": "imya", "weiter": "otchestvo"},
   "otchestvo": {"sprecher": "pogranichnik", "text": "Ва́ше о́тчество?", "de": "Ihr Vatersname?", "feld": "otchestvo", "weiter": "geburt"},
   "geburt": {"sprecher": "pogranichnik", "text": "Да́та рожде́ния?", "de": "Geburtsdatum?", "feld": "geburt", "weiter": "herkunft"},
   "herkunft": {"sprecher": "pogranichnik", "text": "Отку́да вы прилете́ли?", "de": "Woher kommen Sie (mit dem Flugzeug)?", "feld": "herkunft", "weiter": "zweck"},
   "zweck": {"sprecher": "pogranichnik", "text": "Цель пое́здки?", "de": "Zweck der Reise?", "feld": "zweck", "weiter": "dauer"},
   "dauer": {"sprecher": "pogranichnik", "text": "Ско́лько вре́мени вы здесь бу́дете?", "de": "Wie lange bleiben Sie hier?", "feld": "dauer", "weiter": "stempel"},
   "stempel": {"sprecher": "pogranichnik", "text": "Всё в поря́дке. Добро́ пожа́ловать!", "de": "Alles in Ordnung. Willkommen!", "aktion": "stempel",
     "optionen": [
       {"text": "Спаси́бо!", "de": "Danke!", "ende": True},
       {"text": "Добро́ пожа́ловать!", "de": "Willkommen!", "hinweis": "Das sagt der Beamte – du antwortest einfach: Спаси́бо!"}]},
  }},
 "gepaeck": {
  "titel": "Gepäck", "zettel_titel": "Dein Gepäck",
  "geschafft": "Verlustmeldung aufgegeben – das Gepäck wird gebracht.",
  "start": "band",
  "knoten": {
   "band": {"sprecher": "erzaehler", "text": "Вы стои́те у бага́жной ле́нты. Чемода́ны е́дут и е́дут…", "de": "Sie stehen am Gepäckband. Die Koffer fahren und fahren …",
     "pause": 2200, "weiter": "nichtda"},
   "nichtda": {"sprecher": "erzaehler", "text": "Прошёл час. {nichtda}", "de": "Eine Stunde ist vergangen. {nichtda_de}", "pause": 600, "weiter": "schalter"},
   "schalter": {"sprecher": "sotrudnitsa", "text": "Здра́вствуйте! Чем могу́ помо́чь?", "de": "Guten Tag! Wie kann ich helfen?", "feld": "verlust", "weiter": "talon"},
   "talon": {"sprecher": "sotrudnitsa", "text": "Ваш бага́жный тало́н, пожа́луйста.", "de": "Ihren Gepäckschein, bitte.",
     "optionen": [
       {"text": "Вот он.", "de": "Hier ist er.", "weiter": "aussehen"},
       {"text": "Вот она́.", "de": "", "hinweis": "тало́н ist männlich – also вот он."},
       {"text": "Вот оно́.", "de": "", "hinweis": "тало́н ist männlich – also вот он."}]},
   "aussehen": {"sprecher": "sotrudnitsa", "text": "Как вы́глядит {vash} {gepaeck}?", "de": "Wie sieht {gepaeck_de} aus?", "feld": "aussehen", "weiter": "adresse"},
   "adresse": {"sprecher": "sotrudnitsa", "text": "Мы найдём {gepaeck_akk} и привезём. Где вы бу́дете жить?",
     "de": "Wir finden {gepaeck_de_akk} und bringen {ihn_de} vorbei. Wo werden Sie wohnen?", "feld": "wohnen", "weiter": "dank"},
   "dank": {"sprecher": "sotrudnitsa", "text": "Хорошо́. Мы вам позвони́м. Не волну́йтесь!", "de": "Gut. Wir rufen Sie an. Keine Sorge!",
     "optionen": [
       {"text": "Спаси́бо большо́е!", "de": "Vielen Dank!", "ende": True},
       {"text": "Не за что.", "de": "Keine Ursache.", "hinweis": "„Не за что“ antwortet man auf einen Dank – hier bedankst du dich selbst: Спаси́бо большо́е!"},
       {"text": "Пожа́луйста!", "de": "Bitte!", "hinweis": "Hier bedankst du dich: Спаси́бо большо́е!"}]},
  }},
 "zoll": {
  "titel": "Zoll", "zettel_titel": "Im Gepäck",
  "geschafft": "Durch den Zoll – willkommen in der Stadt!",
  "start": "deklarieren",
  "knoten": {
   "deklarieren": {"sprecher": "tamozhennik", "text": "До́брый день. Вам есть что деклари́ровать?", "de": "Guten Tag. Haben Sie etwas zu verzollen?",
     "optionen": [
       {"text": "Нет, мне не́чего деклари́ровать.", "de": "Nein, ich habe nichts zu verzollen.", "weiter": "oeffnen"},
       {"text": "Да, коне́чно.", "de": "Ja, natürlich.", "hinweis": "Auf deinem Zettel steht: nichts zu verzollen."},
       {"text": "Я не курю́.", "de": "Ich rauche nicht.", "hinweis": "„Я не курю́“ heißt „Ich rauche nicht“ – gefragt war, ob du etwas zu verzollen hast."}]},
   "oeffnen": {"sprecher": "tamozhennik", "text": "Откро́йте, пожа́луйста, су́мку.", "de": "Öffnen Sie bitte die Tasche.",
     "optionen": [
       {"text": "Хорошо́, вот.", "de": "Gut, bitte.", "weiter": "ding"},
       {"text": "Нет, спаси́бо.", "de": "Nein, danke.", "hinweis": "Beim Zoll lehnt man nicht ab: Хорошо́, вот."}]},
   "ding": {"sprecher": "tamozhennik", "text": "А что э́то?", "de": "Und was ist das?", "feld": "ding", "weiter": "geld"},
   "geld": {"sprecher": "tamozhennik", "text": "Ско́лько у вас нали́чных?", "de": "Wie viel Bargeld haben Sie?", "feld": "geld", "weiter": "fertig"},
   "fertig": {"sprecher": "tamozhennik", "text": "Всё в поря́дке. Проходи́те.", "de": "Alles in Ordnung. Gehen Sie durch.",
     "optionen": [
       {"text": "Спаси́бо! До свида́ния!", "de": "Danke! Auf Wiedersehen!", "ende": True},
       {"text": "Приве́т!", "de": "Hallo!", "hinweis": "Приве́т ist eine Begrüßung unter Freunden. Zum Abschied: До свида́ния!"}]},
  }},
}

inhalt = {
  "entdecken_hinweis": "Was gibt es am Flughafen? Tippe auf das Flugzeug, den Koffer, die Passkontrolle …",
  "woerter": [dict(id=i, ru=ru, de=de, genus=g, hotspot=hs, satz=satz, **({"hinweis": h} if h else {}))
              for i, ru, de, g, hs, satz, h in W],
  "reise": {
    "figuren": {
      "pogranichnik": {"name": "Пограни́чник", "stimme": "maennlich", "blase": {"x": 0.115, "y": 0.43}},
      "sotrudnitsa": {"name": "Сотру́дница", "stimme": "weiblich", "blase": {"x": 0.79, "y": 0.47, "seite": "links"}},
      "tamozhennik": {"name": "Тамо́женник", "stimme": "maennlich", "blase": {"x": 0.93, "y": 0.45, "seite": "links"}},
      "erzaehler": {"name": "", "stimme": "erzaehler", "blase": {"x": 0.36, "y": 0.62}},
    },
    "reisende": R,
    "szenen": szenen,
  },
}

# ------------------------------------------------------------------ Nacharbeit
NAMEN_DE = {"Петро́ва": "Petrowa", "Смирно́в": "Smirnow", "Кузнецо́ва": "Kusnezowa", "Попо́в": "Popow",
            "Во́лкова": "Wolkowa", "Моро́зов": "Morosow", "А́нна": "Anna", "Дми́трий": "Dmitri", "Еле́на": "Jelena",
            "Серге́й": "Sergei", "О́льга": "Olga", "Алексе́й": "Alexei", "Серге́евна": "Sergejewna",
            "Алекса́ндрович": "Alexandrowitsch", "Ива́новна": "Iwanowna", "Никола́евич": "Nikolajewitsch",
            "Дми́триевна": "Dmitrijewna", "Петро́вич": "Petrowitsch"}
ERSATZ = [("В Фра́нкфурте", "Во Фра́нкфурте"), ("в Фра́нкфурте", "во Фра́нкфурте"),
          ("Das ist Bücher", "Das sind Bücher"), ("Das ist Pralinen", "Das sind Pralinen")]
def nacharbeit(o, schluessel=None):
    if isinstance(o, dict):
        return {k: nacharbeit(v, k) for k, v in o.items()}
    if isinstance(o, list):
        return [nacharbeit(v, schluessel) for v in o]
    if isinstance(o, str):
        for a, n in ERSATZ:
            o = o.replace(a, n)
        if schluessel == "de":
            for ru, de in sorted(NAMEN_DE.items(), key=lambda x: -len(x[0])):
                o = o.replace(ru, de)
    return o
inhalt = nacharbeit(inhalt)
json.dump(modul, open(os.path.join(B, "modul.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(inhalt, open(os.path.join(B, "inhalt.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(R), "Reisende,", len(W), "Wörter")
