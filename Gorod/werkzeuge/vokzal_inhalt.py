"""Erzeugt module/vokzal/modul.json und inhalt.json (Bahnhof).

Fahrplan, Fahraufträge und Antworten (mit typischen Fehlern) entstehen hier aus
wenigen Tabellen, damit alle Formen einheitlich sind. Alle Reisenden sind erfunden.
Aufruf aus dem Gorod-Ordner:
    python werkzeuge/vokzal_inhalt.py
"""
import json, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "module", "vokzal")
os.makedirs(os.path.join(B, "grafik"), exist_ok=True)

modul = {
  "titel": {"ru": "вокза́л", "de": "Bahnhof"},
  "praeposition": "на",
  "satz_hin": "Я иду́ на вокза́л.",
  "satz_hin_de": "Ich gehe zum Bahnhof.",
  "stufen": ["entdecken", "hoeren", "fahrplan", "fahrkarte", "zug"],
  "grafik": {"aussen": "grafik/aussen.svg", "innen": "grafik/innen.svg"},
  "farbe": "#b8392b",
  "breite": 270
}

W = [
 ("vokzal", "вокза́л", "der Bahnhof", "m", "Вокза́л большо́й и краси́вый.", "на вокза́ле – am Bahnhof (mit на!)"),
 ("kassa", "ка́сса", "der Fahrkartenschalter", "f", "Ка́сса откры́та.", "биле́тная ка́сса; Plural: ка́ссы"),
 ("kassirsha", "касси́рша", "die Kassiererin", "f", "Касси́рша продаёт биле́ты.", "männlich: касси́р"),
 ("bilet", "биле́т", "die Fahrkarte", "m", "Биле́т лежи́т в око́шке.", "биле́т на по́езд – die Zugfahrkarte"),
 ("raspisanie", "расписа́ние", "der Fahrplan", "n", "Расписа́ние виси́т на стене́.", "по расписа́нию – planmäßig, pünktlich"),
 ("chasy", "часы́", "die Bahnhofsuhr", "pl", "Часы́ вися́т под потолко́м.", "nur im Plural: часы́"),
 ("poezd", "по́езд", "der Zug", "m", "По́езд стои́т у платфо́рмы.", "Plural: поезда́ – Betonung auf der Endung"),
 ("vagon", "ваго́н", "der Waggon", "m", "Ваго́н зелёный.", "купе́ – Abteilwagen, плацка́рт – offener Schlafwagen"),
 ("provodnitsa", "проводни́ца", "die Schaffnerin", "f", "Проводни́ца стои́т у ваго́на.", "Sie betreut einen Wagen und bringt Tee. Männlich: проводни́к"),
 ("platforma", "платфо́рма", "der Bahnsteig", "f", "Пассажи́ры ждут на платфо́рме.", "на платфо́рме – auf dem Bahnsteig"),
 ("put", "путь", "das Gleis", "m", "По́езд стои́т на пе́рвом пути́.", "unregelmäßig: на пути́, с пути́ – Endung wie bei weiblichen Wörtern"),
 ("skameyka", "скаме́йка", "die Bank", "f", "Скаме́йка стои́т в за́ле ожида́ния.", "зал ожида́ния – der Wartesaal"),
 ("passazhir", "пассажи́р", "der Fahrgast", "m", "Пассажи́р идёт с чемода́ном.", "weiblich: пассажи́рка"),
 ("svetofor", "светофо́р", "das Signal", "m", "Светофо́р зелёный – мо́жно е́хать.", "auch: die Ampel"),
 ("podstakannik", "подстака́нник", "der Glashalter", "m", "В по́езде пьют чай из стака́на в подстака́ннике.", "стака́н – das Glas; typisch für russische Züge"),
]

# ------------------------------------------------------------------ Städte
STADT = {  # Tafel, Nominativ, до + Gen, в(о) + Akk, в(о) + Präp, deutsch
 "moskva": ("МОСКВА", "Москва́", "Москвы́", "в Москву́", "в Москве́", "Moskau"),
 "spb": ("С.-ПЕТЕРБУРГ", "Санкт-Петербу́рг", "Санкт-Петербу́рга", "в Санкт-Петербу́рг", "в Санкт-Петербу́рге", "St. Petersburg"),
 "kazan": ("КАЗАНЬ", "Каза́нь", "Каза́ни", "в Каза́нь", "в Каза́ни", "Kasan"),
 "sochi": ("СОЧИ", "Со́чи", "Со́чи", "в Со́чи", "в Со́чи", "Sotschi"),
 "nn": ("Н. НОВГОРОД", "Ни́жний Но́вгород", "Ни́жнего Но́вгорода", "в Ни́жний Но́вгород", "в Ни́жнем Но́вгороде", "Nischni Nowgorod"),
 "yar": ("ЯРОСЛАВЛЬ", "Яросла́вль", "Яросла́вля", "в Яросла́вль", "в Яросла́вле", "Jaroslawl"),
 "vlad": ("ВЛАДИВОСТОК", "Владивосто́к", "Владивосто́ка", "во Владивосто́к", "во Владивосто́ке", "Wladiwostok"),
 "ekb": ("ЕКАТЕРИНБУРГ", "Екатеринбу́рг", "Екатеринбу́рга", "в Екатеринбу́рг", "в Екатеринбу́рге", "Jekaterinburg"),
}
GLEIS_GEN = {1: "пе́рвого", 2: "второ́го", 3: "тре́тьего", 4: "четвёртого", 5: "пя́того", 6: "шесто́го", 7: "седьмо́го", 8: "восьмо́го"}
GLEIS_NOM = {1: "пе́рвый", 2: "второ́й", 3: "тре́тий", 4: "четвёртый", 5: "пя́тый", 6: "шесто́й", 7: "седьмо́й", 8: "восьмо́й"}

# Zug: id, Nr., Stadt, Zeit, Zeit in Worten, Gleis, Verspätung in Min. (Worte, Fehlform)
ZUEGE = [
 ("z1", "002", "moskva", "08:15", "во́семь пятна́дцать", 1, None),
 ("z2", "018", "spb", "09:40", "де́вять со́рок", 3, None),
 ("z3", "102", "kazan", "10:25", "де́сять два́дцать пять", 5, None),
 ("z4", "058", "sochi", "12:50", "двена́дцать пятьдеся́т", 2, (20, "два́дцать мину́т", "два́дцать мину́ты")),
 ("z5", "064", "nn", "14:05", "четы́рнадцать ноль пять", 4, None),
 ("z6", "076", "yar", "16:30", "шестна́дцать три́дцать", 6, (15, "пятна́дцать мину́т", "пятна́дцать мину́ты")),
 ("z7", "001", "vlad", "18:45", "восемна́дцать со́рок пять", 7, None),
 ("z8", "090", "ekb", "21:10", "два́дцать оди́н де́сять", 8, None),
]
def gross(t): return t[0].upper() + t[1:]
def vom_gleis(n): return ("со " if n == 2 else "с ") + GLEIS_GEN[n]   # со второ́го: vor вт- wird с zu со
ZUG = {z[0]: z for z in ZUEGE}

def zug_fragen():
    fragen = []
    for n, (zid, nr, st, zeit, zeit_ru, weg, spaet) in enumerate(ZUEGE):
        tafel, nom, gen, akk, praep, de = STADT[st]
        nachbarn = [ZUEGE[(n + 1) % len(ZUEGE)], ZUEGE[(n + 3) % len(ZUEGE)]]
        # Abfahrtszeit
        fragen.append({"zug": zid, "text": f"Во ско́лько отправля́ется по́езд {akk}?",
          "de": f"Um wie viel Uhr fährt der Zug nach {de} ab?",
          "richtig": {"text": f"В {zeit_ru}.", "de": f"Um {zeit} Uhr."},
          "falsch": [{"text": f"В {x[4]}.", "hinweis": f"Um {x[3]} fährt der Zug nach {STADT[x[2]][5]}. Schau in die Zeile {tafel}: {zeit}."} for x in nachbarn]})
        # Gleis
        anderes = nachbarn[0][5]
        fragen.append({"zug": zid, "text": f"С како́го пути́ отправля́ется по́езд {akk}?",
          "de": f"Von welchem Gleis fährt der Zug nach {de} ab?",
          "richtig": {"text": f"{gross(vom_gleis(weg))} пути́.", "de": f"Von Gleis {weg}."},
          "falsch": [
            {"text": f"{gross(vom_gleis(anderes))} пути́.", "hinweis": f"{GLEIS_NOM[anderes]} = Gleis {anderes}. Laut Tafel fährt der Zug nach {de} von Gleis {weg}."},
            {"text": f"{gross(vom_gleis(weg).split()[0])} {GLEIS_NOM[weg]} путь.", "hinweis": f"Nach с („von“) steht der Genitiv: {vom_gleis(weg)} пути́."},
            {"text": f"{gross(vom_gleis(weg))} путя́.", "hinweis": "путь ist unregelmäßig: Genitiv пути́, nicht путя́."}]})
        # Wohin? (bei Со́чи sind alle Formen gleich – dort nicht fragen)
        if st != "sochi":
            falsch = [{"text": f"{gross(praep)}.", "hinweis": f"{praep} heißt „in {de}“ (wo?). Wohin? в + Akkusativ: {akk}."}]
            if nom.endswith("а́"):
                falsch.append({"text": f"В {nom}.", "hinweis": f"в + Akkusativ: {nom} → {akk}."})
            x = nachbarn[1]
            falsch.append({"text": f"{gross(STADT[x[2]][3])}.", "hinweis": f"Der Zug nach {STADT[x[2]][5]} fährt um {x[3]}. Gefragt war der Zug um {zeit}."})
            fragen.append({"zug": zid, "text": f"Куда́ идёт по́езд, кото́рый отправля́ется в {zeit_ru}?",
              "de": f"Wohin fährt der Zug, der um {zeit} Uhr abfährt?",
              "richtig": {"text": f"{gross(akk)}.", "de": f"Nach {de}."}, "falsch": falsch})
        # Pünktlich?
        if spaet:
            minuten, wort, fehl = spaet
            fragen.append({"zug": zid, "text": f"По́езд {akk} идёт по расписа́нию?",
              "de": f"Fährt der Zug nach {de} pünktlich?",
              "richtig": {"text": f"Нет, он опа́здывает на {wort}.", "de": f"Nein, er hat {minuten} Minuten Verspätung."},
              "falsch": [
                {"text": "Да, по расписа́нию.", "hinweis": "Schau in die Spalte Примеча́ние: опа́здывает heißt „hat Verspätung“."},
                {"text": f"Нет, он опа́здывает на {fehl}.", "hinweis": f"Nach {minuten} steht der Genitiv Plural: {wort}."}]})
        elif zid in ("z1", "z3", "z5"):
            fragen.append({"zug": zid, "text": f"По́езд {akk} опа́здывает?",
              "de": f"Hat der Zug nach {de} Verspätung?",
              "richtig": {"text": "Нет, он идёт по расписа́нию.", "de": "Nein, er fährt pünktlich."},
              "falsch": [{"text": "Да, на два́дцать мину́т.", "hinweis": f"20 Minuten Verspätung hat der Zug nach Sotschi. Der Zug nach {de} fährt по расписа́нию."},
                         {"text": "Нет, он идёт по расписа́ние.", "hinweis": "по + Dativ: по расписа́нию."}]})
    return fragen

fahrplan = {
  "titel": "ОТПРАВЛЕ́НИЕ",
  "zuege": [{"id": zid, "nr": nr, "ziel": STADT[st][0], "zeit": zeit, "weg": weg,
             "status": f"ОПАЗДЫВАЕТ НА {spaet[0]} МИН" if spaet else ("ПОСАДКА" if zid == "z2" else "ПО РАСПИСАНИЮ"),
             **({"verspaetet": True} if spaet else {})}
            for zid, nr, st, zeit, zeit_ru, weg, spaet in ZUEGE],
  "fragen": zug_fragen(),
}

# ------------------------------------------------------------------ Fahraufträge
MONAT = {5: ("ма́я", "май", "Mai"), 6: ("ию́ня", "ию́нь", "Juni"), 7: ("ию́ля", "ию́ль", "Juli"),
         8: ("а́вгуста", "а́вгуст", "August"), 9: ("сентября́", "сентя́брь", "September"), 10: ("октября́", "октя́брь", "Oktober")}
TEE = {
 "zitrone": ("с лимо́ном", "mit Zitrone", [("с лимо́н", "с + Instrumental: лимо́н → с лимо́ном."),
                                           ("без лимо́ном", "без heißt „ohne“ und verlangt den Genitiv. „Mit“: с лимо́ном.")]),
 "zucker": ("с са́харом", "mit Zucker", [("с са́хар", "с + Instrumental: са́хар → с са́харом."),
                                          ("без са́хара", "без са́хара heißt „ohne Zucker“. Laut Zettel: mit Zucker – с са́харом.")]),
 "ohne": ("без са́хара", "ohne Zucker", [("без са́харом", "без + Genitiv: без са́хара."),
                                          ("без са́хар", "без + Genitiv: са́хар → без са́хара.")]),
 "milch": ("с молоко́м", "mit Milch", [("с молоко́", "с + Instrumental: молоко́ → с молоко́м."),
                                         ("без молока́", "без молока́ heißt „ohne Milch“. Laut Zettel: mit Milch – с молоко́м.")]),
}

def auftrag(id, g, zug, tag, tag_gen, monat, hin_zurueck, kupe, unten, preis_einfach, zahlart, wagen, platz, ankunft, tee):
    zid, nr, st, zeit, zeit_ru, weg, _ = ZUG[zug]
    tafel, nom, gen, akk, praep, de = STADT[st]
    tag_ord, _, tag_de = tag
    mon_gen, mon_nom, mon_de = MONAT[monat]
    preis = preis_einfach * (2 if hin_zurueck else 1)
    platz_ru, platz_m, platz_falsch, platz_falsch_nr, _ = platz
    tee_ru, tee_de, tee_falsch = TEE[tee]
    polka, polka_m, polka_de = ("ни́жнее", "ни́жний", "unten") if unten else ("ве́рхнее", "ве́рхний", "oben")
    polka_ander, polka_ander_de = ("ве́рхнее", "oben") if unten else ("ни́жнее", "unten")
    klasse = ("Купе́", "Abteil") if kupe else ("Плацка́рт", "offener Schlafwagen")
    felder = {
      "ziel": {"richtig": {"text": f"Оди́н биле́т до {gen}, пожа́луйста.", "de": f"Eine Fahrkarte nach {de}, bitte."},
        "falsch": [{"text": f"Оди́н биле́т до {nom}, пожа́луйста.", "de": "", "hinweis": f"до + Genitiv: {nom} → до {gen}."},
                   {"text": f"Оди́н биле́т из {gen}, пожа́луйста.", "de": "", "hinweis": f"из {gen} heißt „aus {de}“. Du willst nach {de}: до {gen}."}]},
      "datum": {"richtig": {"text": f"На {tag_ord} {mon_gen}.", "de": f"Für den {tag_de} {mon_de}."},
        "falsch": [{"text": f"На {tag_gen} {mon_gen}.", "de": "", "hinweis": f"Mit на steht das Datum im Akkusativ: на {tag_ord} {mon_gen}. Ohne на hieße es {tag_gen} {mon_gen} („am {tag_de} {mon_de}“)."},
                   {"text": f"На {tag_ord} {mon_nom}.", "de": "", "hinweis": f"Der Monat steht im Genitiv: {mon_gen}, nicht {mon_nom}."}]},
      "richtung": ({"richtig": {"text": "Туда́ и обра́тно.", "de": "Hin und zurück."},
        "falsch": [{"text": "В одну́ сто́рону.", "de": "Nur hin.", "hinweis": "в одну́ сто́рону heißt „nur hin“. Laut Zettel: hin und zurück – туда́ и обра́тно."},
                   {"text": "Туда́ и сюда́.", "de": "Hin und her.", "hinweis": "туда́ и сюда́ heißt „hin und her“. Die Rückfahrkarte: туда́ и обра́тно."}]}
        if hin_zurueck else
        {"richtig": {"text": "В одну́ сто́рону.", "de": "Nur hin."},
        "falsch": [{"text": "Туда́ и обра́тно.", "de": "Hin und zurück.", "hinweis": "Das heißt „hin und zurück“. Laut Zettel: nur hin – в одну́ сто́рону."},
                   {"text": "В оди́н сто́рону.", "de": "", "hinweis": "сторона́ ist weiblich: в одну́ сто́рону."}]}),
      "klasse": {"richtig": {"text": f"{klasse[0]}, пожа́луйста.", "de": f"{klasse[1]}, bitte."},
        "falsch": [({"text": "Плацка́рт, пожа́луйста.", "de": "Offener Schlafwagen, bitte.", "hinweis": "плацка́рт ist der offene Schlafwagen. Laut Zettel: Abteil – купе́."} if kupe else
                    {"text": "Купе́, пожа́луйста.", "de": "Abteil, bitte.", "hinweis": "купе́ ist das Abteil mit Tür. Laut Zettel: offener Schlafwagen – плацка́рт."}),
                   {"text": "Би́знес-класс, пожа́луйста.", "de": "Businessklasse, bitte.", "hinweis": "Die gibt es im Flugzeug. Im Zug wählt man купе́ (Abteil) oder плацка́рт (offener Schlafwagen)."}]},
      "polka": {"richtig": {"text": f"{gross(polka)}, пожа́луйста.", "de": f"{gross(polka_de)}, bitte."},
        "falsch": [{"text": f"{gross(polka_ander)}, пожа́луйста.", "de": "", "hinweis": f"{polka_ander} heißt {polka_ander_de}. Laut Zettel: {polka_de} – {polka}."},
                   {"text": f"{gross(polka_m)}, пожа́луйста.", "de": "", "hinweis": f"Gemeint ist ме́сто (sächlich): {polka} ме́сто."}]},
      "bestaetigen": {"richtig": {"text": f"Да, до {gen}.", "de": f"Ja, bis {de}."},
        "falsch": [{"text": f"Да, до {nom}.", "de": "", "hinweis": f"до + Genitiv: до {gen}."},
                   {"text": f"Да, {praep}.", "de": "", "hinweis": f"{praep} heißt „in {de}“ (wo?). Gefragt ist: bis wohin – до {gen}."}]},
      "mesto_nr": {"richtig": {"text": f"{gross(platz_ru)}.", "de": f"Platz {wagen_platz(platz)}."},
        "falsch": [{"text": f"{gross(platz_m)}.", "de": "", "hinweis": f"ме́сто ist sächlich: {platz_ru}."},
                   {"text": f"{gross(platz_falsch)}.", "de": "", "hinweis": f"{platz_falsch} = Platz {platz_falsch_nr}. Auf deiner Fahrkarte steht Platz {wagen_platz(platz)}."}]},
      "tee": {"richtig": {"text": f"Да, {tee_ru}, пожа́луйста.", "de": f"Ja, {tee_de}, bitte."},
        "falsch": [{"text": f"Да, {t}, пожа́луйста.", "de": "", "hinweis": h} for t, h in tee_falsch]},
    }
    return {
      "id": id, "geschlecht": g, "preis": preis, "zahlart": zahlart,
      "posten": f"биле́т до {gen}" + (" и обра́тно" if hin_zurueck else ""),
      "bilet": {"poezd": nr, "abfahrt": zeit, "datum": f"{int(tag_de[:-1]):02d}.{monat:02d}.", "ziel": nom,
                "wagen": f"{wagen:02d}", "mesto": f"{wagen_platz(platz):03d}", "klasse": "КУПЕ" if kupe else "ПЛАЦКАРТ", "preis": preis},
      "p": {"gen": gen, "akk": akk, "praep": praep, "zeit_ru": zeit_ru, "weg_gen": GLEIS_GEN[weg], "vom_gleis": vom_gleis(weg),
            "zeit": zeit, "weg": str(weg), "stadt_de": de,
            "ankunft": ankunft[0], "ankunft_de": ankunft[1]},
      "zettel": {
        "fahrkarte": [f"Fahrkarte nach {de}", f"für den {tag_de} {mon_de}", "hin und zurück" if hin_zurueck else "nur hin",
                      f"{klasse[1]}, {polka_de}", f"Bezahlen: {'bar' if zahlart == 'bar' else 'mit Karte'}"],
        "zug": [f"Du fährst nach {de}", f"Du möchtest Tee {tee_de}"],
      },
      "felder": felder,
    }

def wagen_platz(platz): return platz[4]

# Platz: (Ordnungszahl Neutrum, Fehlform maskulin, andere Zahl, deren Wert, eigener Wert)
R = [
 auftrag("moskva", "f", "z1", ("пя́тое", "пя́тый", "5."), "пя́того", 5, True, True, True, 2400, "karte", 7,
         ("два́дцать тре́тье", "два́дцать тре́тий", "трина́дцатое", 13, 23),
         ("Сего́дня в семь часо́в ве́чера.", "Heute um sieben Uhr abends."), "zitrone"),
 auftrag("piter", "m", "z2", ("двена́дцатое", "двена́дцатый", "12."), "двена́дцатого", 6, False, False, False, 1650, "bar", 3,
         ("шестна́дцатое", "шестна́дцатый", "шесто́е", 6, 16),
         ("Сего́дня в шесть часо́в ве́чера.", "Heute um sechs Uhr abends."), "zucker"),
 auftrag("kazan", "f", "z3", ("пе́рвое", "пе́рвый", "1."), "пе́рвого", 7, True, False, True, 1450, "bar", 9,
         ("тре́тье", "тре́тий", "трина́дцатое", 13, 3),
         ("За́втра в пять часо́в утра́.", "Morgen um fünf Uhr früh."), "ohne"),
 auftrag("nn", "m", "z5", ("деся́тое", "деся́тый", "10."), "деся́того", 8, False, True, True, 1900, "karte", 5,
         ("оди́ннадцатое", "оди́ннадцатый", "пе́рвое", 1, 11),
         ("Сего́дня в оди́ннадцать часо́в ве́чера.", "Heute um elf Uhr abends."), "milch"),
 auftrag("yar", "f", "z6", ("тре́тье", "тре́тий", "3."), "тре́тьего", 9, True, True, False, 1200, "bar", 2,
         ("восемна́дцатое", "восемна́дцатый", "восьмо́е", 8, 18),
         ("Сего́дня в де́вять часо́в ве́чера.", "Heute um neun Uhr abends."), "zitrone"),
 auftrag("vlad", "m", "z7", ("двадца́тое", "двадца́тый", "20."), "двадца́того", 10, False, True, True, 4900, "karte", 10,
         ("пе́рвое", "пе́рвый", "оди́ннадцатое", 11, 1),
         ("Че́рез шесть дней! Э́то Транссиби́рская магистра́ль.", "In sechs Tagen! Das ist die Transsibirische Eisenbahn."), "zucker"),
]

szenen = {
 "fahrkarte": {
  "titel": "Fahrkarte", "zettel_titel": "Dein Auftrag", "bilet_drucken": True,
  "geschafft": "Fahrkarte gekauft – gute Reise!",
  "start": "ziel",
  "knoten": {
   "ziel": {"sprecher": "kassirsha", "text": "Здра́вствуйте! Слу́шаю вас.", "de": "Guten Tag! Was kann ich für Sie tun?", "feld": "ziel", "weiter": "datum"},
   "datum": {"sprecher": "kassirsha", "text": "На како́е число́?", "de": "Für welches Datum?", "feld": "datum", "weiter": "richtung"},
   "richtung": {"sprecher": "kassirsha", "text": "В одну́ сто́рону и́ли туда́ и обра́тно?", "de": "Einfach oder hin und zurück?", "feld": "richtung", "weiter": "klasse"},
   "klasse": {"sprecher": "kassirsha", "text": "Купе́ и́ли плацка́рт?", "de": "Abteil oder offener Schlafwagen?", "feld": "klasse", "weiter": "polka"},
   "polka": {"sprecher": "kassirsha", "text": "Ве́рхнее и́ли ни́жнее ме́сто?", "de": "Oberes oder unteres Bett?", "feld": "polka", "weiter": "zahlart"},
   "zahlart": {"sprecher": "kassirsha", "text": "Как бу́дете плати́ть: нали́чными и́ли ка́ртой?", "de": "Wie zahlen Sie: bar oder mit Karte?",
     "optionen": [
       {"text": "Нали́чными.", "de": "Bar.", "zahlart": "bar", "weiter": "summe"},
       {"text": "Ка́ртой.", "de": "Mit Karte.", "zahlart": "karte", "weiter": "summe"}]},
   "summe": {"sprecher": "kassirsha", "text": "С вас {summe}.", "de": "Das macht {summe_de}.", "aktion": "bezahlen", "weiter": "drucken"},
   "drucken": {"sprecher": "kassirsha", "text": "Вот ваш биле́т. По́езд отправля́ется в {zeit_ru} {vom_gleis} пути́.",
     "de": "Hier ist Ihre Fahrkarte. Der Zug fährt um {zeit} Uhr von Gleis {weg} ab.", "aktion": "drucken",
     "optionen": [
       {"text": "Спаси́бо! До свида́ния!", "de": "Danke! Auf Wiedersehen!", "ende": True},
       {"text": "Пожа́луйста!", "de": "Bitte!", "hinweis": "Du bekommst etwas – also bedankst du dich: Спаси́бо!"}]},
  }},
 "zug": {
  "titel": "Im Zug", "zettel_titel": "Deine Fahrt",
  "geschafft": "Du sitzt im Zug – счастли́вого пути́!",
  "start": "bahnsteig",
  "knoten": {
   "bahnsteig": {"sprecher": "erzaehler", "text": "Вы на платфо́рме. Ваш по́езд уже́ стои́т.", "de": "Sie sind auf dem Bahnsteig. Ihr Zug steht schon da.", "pause": 400, "weiter": "kontrolle"},
   "kontrolle": {"sprecher": "provodnitsa", "text": "Здра́вствуйте! Ваш биле́т и па́спорт, пожа́луйста.", "de": "Guten Tag! Ihre Fahrkarte und Ihren Pass, bitte.",
     "optionen": [
       {"text": "Вот, пожа́луйста.", "de": "Hier, bitte.", "weiter": "bestaetigen"},
       {"text": "Вот мой биле́т в теа́тр.", "de": "Hier ist meine Theaterkarte.", "hinweis": "Das ist eine Theaterkarte – gefragt sind Fahrkarte und Pass."},
       {"text": "Спаси́бо, не на́до.", "de": "Danke, nicht nötig.", "hinweis": "Damit lehnst du ab – die Schaffnerin will Fahrkarte und Pass sehen."}]},
   "bestaetigen": {"sprecher": "provodnitsa", "text": "Вы е́дете до {gen}?", "de": "Sie fahren bis {stadt_de}?", "feld": "bestaetigen", "weiter": "mesto"},
   "mesto": {"sprecher": "provodnitsa", "text": "Како́е у вас ме́сто?", "de": "Welchen Platz haben Sie?", "feld": "mesto_nr", "weiter": "tee"},
   "tee": {"sprecher": "provodnitsa", "text": "Проходи́те. Чай бу́дете?", "de": "Bitte einsteigen. Möchten Sie Tee?", "feld": "tee", "weiter": "frage"},
   "frage": {"sprecher": "erzaehler", "text": "Вы хоти́те знать, когда́ по́езд прие́дет.", "de": "Sie möchten wissen, wann der Zug ankommt.",
     "optionen": [
       {"text": "Скажи́те, пожа́луйста, когда́ мы прие́дем {akk}?", "de": "Sagen Sie bitte, wann kommen wir an?", "weiter": "ankunft"},
       {"text": "Скажи́те, пожа́луйста, где мы прие́дем {akk}?", "de": "", "hinweis": "где heißt „wo“. „Wann“ heißt когда́."},
       {"text": "Скажи́те, пожа́луйста, когда́ мы прие́дем {praep}?", "de": "", "hinweis": "Wohin? Nach прие́хать steht в + Akkusativ: {akk}."}]},
   "ankunft": {"sprecher": "provodnitsa", "text": "{ankunft}", "de": "{ankunft_de}", "weiter": "gute_reise"},
   "gute_reise": {"sprecher": "provodnitsa", "text": "Счастли́вого пути́!", "de": "Gute Reise!",
     "optionen": [
       {"text": "Спаси́бо!", "de": "Danke!", "ende": True},
       {"text": "Счастли́вого пути́!", "de": "Gute Reise!", "hinweis": "Das wünscht dir die Schaffnerin – du bedankst dich einfach: Спаси́бо!"},
       {"text": "До́брое у́тро!", "de": "Guten Morgen!", "hinweis": "Das ist eine Begrüßung. Hier bedankst du dich: Спаси́бо!"}]},
  }},
}

inhalt = {
  "entdecken_hinweis": "Was gibt es am Bahnhof? Tippe auf den Zug, die Kasse, die Uhr …",
  "woerter": [dict(id=i, ru=ru, de=de, genus=g, hotspot="hs-" + i, satz=satz, hinweis=h, **({"de_zahl": "sg"} if i == "chasy" else {}))
              for i, ru, de, g, satz, h in W],
  "fahrplan": fahrplan,
  "reise": {
    "neu_knopf": "Neue Reise →",
    "figuren": {
      "kassirsha": {"name": "Касси́рша", "stimme": "weiblich", "blase": {"x": 0.11, "y": 0.5}},
      "provodnitsa": {"name": "Проводни́ца", "stimme": "weiblich", "blase": {"x": 0.7, "y": 0.66, "seite": "links"}},
      "erzaehler": {"name": "", "stimme": "erzaehler", "blase": {"x": 0.47, "y": 0.2}},
    },
    "reisende": R,
    "szenen": szenen,
  },
}
json.dump(modul, open(os.path.join(B, "modul.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(inhalt, open(os.path.join(B, "inhalt.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(R), "Fahraufträge,", len(fahrplan["fragen"]), "Tafel-Fragen,", len(W), "Wörter")
