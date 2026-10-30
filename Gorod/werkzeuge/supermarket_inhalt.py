"""Erzeugt module/supermarket/modul.json und inhalt.json (Supermarkt).

Einkaufszettel (Zahl + Kasus), Theke (Gramm + Genitiv) und Kasse entstehen hier aus
wenigen Tabellen, damit alle Formen einheitlich sind. Aufruf aus dem Gorod-Ordner:
    python werkzeuge/supermarket_inhalt.py
"""
import json, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "module", "supermarket")
os.makedirs(os.path.join(B, "grafik"), exist_ok=True)

modul = {
  "titel": {"ru": "суперма́ркет", "de": "Supermarkt"},
  "praeposition": "в",
  "satz_hin": "Я иду́ в суперма́ркет.",
  "satz_hin_de": "Ich gehe in den Supermarkt.",
  "stufen": ["entdecken", "hoeren", "einkaufen", "theke", "kasse"],
  "grafik": {"aussen": "grafik/aussen.svg", "innen": "grafik/innen.svg"},
  "farbe": "#3f8f5f",
  "breite": 250
}

W = [  # id, ru, de, genus, Satz, Hinweis
 ("yabloki", "я́блоки", "die Äpfel", "pl", "Я́блоки лежа́т в я́щике.", "Singular: я́блоко; fünf Äpfel: пять я́блок"),
 ("banany", "бана́ны", "die Bananen", "pl", "Бана́ны жёлтые.", "Singular: бана́н"),
 ("limony", "лимо́ны", "die Zitronen", "pl", "Лимо́ны ки́слые.", "Singular: лимо́н"),
 ("pomidory", "помидо́ры", "die Tomaten", "pl", "Помидо́ры кра́сные.", "Singular: помидо́р"),
 ("ogurtsy", "огурцы́", "die Gurken", "pl", "Огурцы́ зелёные.", "Singular: огуре́ц – das е fällt weg: огурцы́"),
 ("chay", "чай", "der Tee", "m", "Чай стои́т на по́лке.", "па́чка ча́я – eine Packung Tee"),
 ("sok", "сок", "der Saft", "m", "Сок апельси́новый.", "паке́т со́ка – eine Packung Saft"),
 ("voda", "вода́", "das Wasser", "f", "Вода́ стои́т на по́лке.", "буты́лка воды́ – eine Flasche Wasser"),
 ("khleb", "хлеб", "das Brot", "m", "Хлеб све́жий.", "буха́нка хле́ба – ein Laib Brot"),
 ("yaytsa", "я́йца", "die Eier", "pl", "Я́йца лежа́т в коро́бке.", "Singular: яйцо́; sechs Eier: шесть яи́ц"),
 ("moloko", "молоко́", "die Milch", "n", "Молоко́ стои́т в холоди́льнике.", "паке́т молока́ – eine Packung Milch"),
 ("kholodilnik", "холоди́льник", "das Kühlregal", "m", "В холоди́льнике хо́лодно.", "eigentlich: der Kühlschrank"),
 ("polka", "по́лка", "das Regal", "f", "На по́лке мно́го проду́ктов.", "на по́лке – im Regal (wörtlich: auf dem Brett)"),
 ("syr", "сыр", "der Käse", "m", "Сыр лежи́т на прила́вке.", "две́сти гра́ммов сы́ра – 200 g Käse"),
 ("kolbasa", "колбаса́", "die Wurst", "f", "Колбаса́ лежи́т на прила́вке.", "полкило́ колбасы́ – ein halbes Kilo Wurst"),
 ("vetchina", "ветчина́", "der Schinken", "f", "Ветчина́ ро́зовая.", "бутербро́д с ветчино́й – ein Schinkenbrot"),
 ("vesy", "весы́", "die Waage", "pl", "Весы́ стоя́т на прила́вке.", "nur im Plural: весы́"),
 ("prodavshchitsa", "продавщи́ца", "die Verkäuferin", "f", "Продавщи́ца стои́т за прила́вком.", "männlich: продаве́ц"),
 ("kassa", "ка́сса", "die Kasse", "f", "Ка́сса откры́та.", "Plural: ка́ссы"),
 ("kassir", "касси́р", "der Kassierer", "m", "Касси́р сиди́т за ка́ссой.", "weiblich: касси́рша"),
 ("paket", "паке́т", "die Tüte", "m", "Паке́т сто́ит пять рубле́й.", "auch: die Packung – паке́т молока́"),
 ("telezhka", "теле́жка", "der Einkaufswagen", "f", "Теле́жка пуста́я.", "Am Flughafen: der Gepäckwagen"),
 ("korzina", "корзи́на", "der Einkaufskorb", "f", "Корзи́на кра́сная.", "в корзи́не – im Korb"),
]

# ------------------------------------------------------------------ Waren für den Einkaufszettel
WAREN = {  # Formen (1 / 2–4 / 5+), Genus der Zählform, deutsch Sg/Pl, Preis je Stück, Bild
 "yabloki": (("я́блоко", "я́блока", "я́блок"), "n", "Apfel", "Äpfel", 30, "🍎"),
 "banany": (("бана́н", "бана́на", "бана́нов"), "m", "Banane", "Bananen", 25, "🍌"),
 "limony": (("лимо́н", "лимо́на", "лимо́нов"), "m", "Zitrone", "Zitronen", 45, "🍋"),
 "pomidory": (("помидо́р", "помидо́ра", "помидо́ров"), "m", "Tomate", "Tomaten", 40, "🍅"),
 "ogurtsy": (("огуре́ц", "огурца́", "огурцо́в"), "m", "Gurke", "Gurken", 35, "🥒"),
 "chay": (("па́чка ча́я", "па́чки ча́я", "па́чек ча́я"), "f", "Packung Tee", "Packungen Tee", 150, "🍵"),
 "sok": (("паке́т со́ка", "паке́та со́ка", "паке́тов со́ка"), "m", "Packung Saft", "Packungen Saft", 120, "🧃"),
 "voda": (("буты́лка воды́", "буты́лки воды́", "буты́лок воды́"), "f", "Flasche Wasser", "Flaschen Wasser", 60, "💧"),
 "khleb": (("буха́нка хле́ба", "буха́нки хле́ба", "буха́нок хле́ба"), "f", "Brot", "Brote", 55, "🍞"),
 "yaytsa": (("яйцо́", "яйца́", "яи́ц"), "n", "Ei", "Eier", 12, "🥚"),
 "moloko": (("паке́т молока́", "паке́та молока́", "паке́тов молока́"), "m", "Packung Milch", "Packungen Milch", 90, "🥛"),
}
ZAHL = {1: {"m": "оди́н", "f": "одна́", "n": "одно́"}, 2: {"m": "два", "f": "две", "n": "два"},
        3: "три", 4: "четы́ре", 5: "пять", 6: "шесть"}

def zaehlform(ware, n):
    formen, genus, sg, pl, preis, bild = WAREN[ware]
    zahl = ZAHL[n][genus] if isinstance(ZAHL[n], dict) else ZAHL[n]
    form = formen[0] if n == 1 else formen[1] if n <= 4 else formen[2]
    return {"ware": ware, "menge": n, "text": f"{zahl} {form}", "de": f"{n} {sg if n == 1 else pl}",
            "bild": bild, "preis": n * preis}

# ------------------------------------------------------------------ Theke
THEKE = {"syr": ("сыр", "сы́ра", 1200, "Käse"), "kolbasa": ("колбаса́", "колбасы́", 800, "Wurst"),
         "vetchina": ("ветчина́", "ветчины́", 1000, "Schinken")}
GRAMM = {150: ("сто пятьдеся́т", "150"), 200: ("две́сти", "200"), 250: ("две́сти пятьдеся́т", "250"), 300: ("три́ста", "300")}

def gross(t): return t[0].upper() + t[1:]

def theke_feld(ware, menge, und):
    nom, gen, kilo, de = THEKE[ware]
    vor = "И " if und else ""
    klein = (lambda t: t) if und else gross
    if menge == 500:
        richtig = f"{vor}{klein('полкило́')} {gen}, пожа́луйста."
        falsch = [{"text": f"{vor}{klein('полкило́')} {nom}, пожа́луйста.", "de": "", "hinweis": f"Nach Mengenangaben steht der Genitiv: {nom} → {gen}."},
                  {"text": f"{vor}{klein('килогра́мм')} {gen}, пожа́луйста.", "de": "", "hinweis": "килогра́мм ist ein ganzes Kilo. Laut Zettel: ein halbes – полкило́."}]
        de_text, zettel = f"ein halbes Kilo {de}", f"ein halbes Kilo {de}"
    else:
        zahl, ziffer = GRAMM[menge]
        richtig = f"{vor}{klein(zahl)} гра́ммов {gen}, пожа́луйста."
        falsch = [{"text": f"{vor}{klein(zahl)} гра́ммов {nom}, пожа́луйста.", "de": "", "hinweis": f"Nach Mengenangaben steht der Genitiv: {nom} → {gen}."},
                  {"text": f"{vor}{klein(zahl)} гра́мма {gen}, пожа́луйста.", "de": "", "hinweis": f"Nach {ziffer} steht der Genitiv Plural: гра́ммов."}]
        de_text, zettel = f"{ziffer} Gramm {de}", f"{ziffer} g {de}"
    preis = round(menge / 1000 * kilo)
    feld = {"richtig": {"text": richtig, "de": ("Und " if und else "") + de_text + ", bitte."}, "falsch": falsch}
    posten = {"ru": f"{nom}, {'0,5 кг' if menge == 500 else f'{menge} г'}", "preis": preis}
    return feld, posten, zettel

def einkauf(id, g, liste, theke, schneiden, tasche, kundenkarte, zahlart):
    liste = [zaehlform(w, n) for w, n in liste]
    (t1, m1), (t2, m2) = theke
    f1, p1, z1 = theke_feld(t1, m1, False)
    f2, p2, z2 = theke_feld(t2, m2, True)
    posten = [{"ru": p["text"], "preis": p["preis"]} for p in liste] + [p1, p2]
    felder = {
      "theke1": f1, "theke2": f2,
      "schneiden": ({"richtig": {"text": "Да, наре́жьте, пожа́луйста.", "de": "Ja, schneiden Sie es bitte."},
        "falsch": [{"text": "Нет, куско́м, пожа́луйста.", "de": "Nein, am Stück, bitte.", "hinweis": "Laut Zettel: geschnitten – наре́жьте."},
                   {"text": "Да, свари́те, пожа́луйста.", "de": "Ja, kochen Sie es bitte.", "hinweis": "свари́те heißt „kochen Sie“. Schneiden: наре́жьте."}]}
        if schneiden else
        {"richtig": {"text": "Нет, куско́м, пожа́луйста.", "de": "Nein, am Stück, bitte."},
        "falsch": [{"text": "Да, наре́жьте, пожа́луйста.", "de": "Ja, schneiden Sie es bitte.", "hinweis": "Laut Zettel: am Stück – куско́м."},
                   {"text": "Нет, куски́, пожа́луйста.", "de": "", "hinweis": "„Am Stück“ heißt куско́м – Instrumental von кусо́к."}]}),
      "paket": ({"richtig": {"text": "Нет, спаси́бо, у меня́ есть су́мка.", "de": "Nein danke, ich habe eine Tasche."},
        "falsch": [{"text": "Нет, спаси́бо, у меня́ есть су́мку.", "de": "", "hinweis": "у меня́ есть … + Nominativ: су́мка."},
                   {"text": "Да, оди́н паке́т, пожа́луйста.", "de": "Ja, eine Tüte, bitte.", "hinweis": "Laut Zettel hast du eine eigene Tasche dabei."}]}
        if tasche else
        {"richtig": {"text": "Да, оди́н паке́т, пожа́луйста.", "de": "Ja, eine Tüte, bitte."},
        "falsch": [{"text": "Да, одна́ паке́т, пожа́луйста.", "de": "", "hinweis": "паке́т ist männlich: оди́н паке́т."},
                   {"text": "Нет, спаси́бо, у меня́ есть су́мка.", "de": "Nein danke, ich habe eine Tasche.", "hinweis": "Laut Zettel hast du keine Tasche dabei."}]}),
      "karta": ({"richtig": {"text": "Да, вот она́.", "de": "Ja, hier ist sie."},
        "falsch": [{"text": "Да, вот он.", "de": "", "hinweis": "ка́рта ist weiblich: вот она́."},
                   {"text": "Нет, у меня́ нет ка́рты.", "de": "Nein, ich habe keine Karte.", "hinweis": "Laut Zettel hast du eine Kundenkarte dabei."}]}
        if kundenkarte else
        {"richtig": {"text": "Нет, у меня́ нет ка́рты.", "de": "Nein, ich habe keine Karte."},
        "falsch": [{"text": "Нет, у меня́ нет ка́рта.", "de": "", "hinweis": "Nach нет steht der Genitiv: у меня́ нет ка́рты."},
                   {"text": "Да, вот она́.", "de": "Ja, hier ist sie.", "hinweis": "Laut Zettel hast du keine Kundenkarte."}]}),
    }
    return {
      "id": id, "geschlecht": g, "zahlart": zahlart,
      "liste": liste,
      "liste_satz": "Купи́, пожа́луйста: " + ", ".join(p["text"] for p in liste) + ".",
      "posten": posten, "preis": sum(p["preis"] for p in posten),
      "zettel": {
        "theke": ["An der Theke:", z1, z2, "geschnitten" if schneiden else "am Stück"],
        "kasse": ["Eigene Tasche dabei" if tasche else "Keine Tasche dabei",
                  "Kundenkarte dabei" if kundenkarte else "Keine Kundenkarte",
                  f"Bezahlen: {'bar' if zahlart == 'bar' else 'mit Karte'}"],
      },
      "felder": felder,
    }

R = [
 einkauf("e1", "f", [("yabloki", 3), ("moloko", 2), ("yaytsa", 6), ("khleb", 1)], [("syr", 200), ("kolbasa", 500)], True, False, False, "bar"),
 einkauf("e2", "m", [("banany", 4), ("voda", 2), ("chay", 1), ("pomidory", 5)], [("vetchina", 300), ("syr", 150)], False, True, True, "karte"),
 einkauf("e3", "f", [("ogurtsy", 2), ("limony", 3), ("sok", 2), ("khleb", 1)], [("kolbasa", 250), ("syr", 500)], True, False, True, "karte"),
 einkauf("e4", "m", [("yabloki", 5), ("moloko", 1), ("yaytsa", 4), ("voda", 1)], [("syr", 300), ("vetchina", 500)], False, True, False, "bar"),
 einkauf("e5", "f", [("pomidory", 2), ("ogurtsy", 3), ("khleb", 2), ("chay", 1)], [("vetchina", 200), ("kolbasa", 300)], True, False, False, "karte"),
 einkauf("e6", "m", [("banany", 6), ("limony", 1), ("sok", 1), ("yaytsa", 5)], [("syr", 150), ("kolbasa", 500)], True, True, True, "bar"),
]

szenen = {
 "theke": {
  "titel": "Theke", "zettel_titel": "Dein Zettel",
  "geschafft": "Käse und Wurst sind eingepackt!",
  "start": "was",
  "knoten": {
   "was": {"sprecher": "prodavshchitsa", "text": "Здра́вствуйте! Что вам?", "de": "Guten Tag! Was darf es sein?", "feld": "theke1", "weiter": "noch"},
   "noch": {"sprecher": "prodavshchitsa", "text": "Так. Что ещё?", "de": "So. Was noch?", "feld": "theke2", "weiter": "schneiden"},
   "schneiden": {"sprecher": "prodavshchitsa", "text": "Вам наре́зать?", "de": "Soll ich es Ihnen schneiden?", "feld": "schneiden", "weiter": "alles"},
   "alles": {"sprecher": "prodavshchitsa", "text": "Что́-нибудь ещё?", "de": "Sonst noch etwas?",
     "optionen": [
       {"text": "Нет, спаси́бо, э́то всё.", "de": "Nein danke, das ist alles.", "weiter": "fertig"},
       {"text": "Да, э́то всё.", "de": "Ja, das ist alles.", "hinweis": "Auf „Sonst noch etwas?“ antwortet man: Нет, спаси́бо, э́то всё."}]},
   "fertig": {"sprecher": "prodavshchitsa", "text": "Вот, пожа́луйста. Ка́сса – там.", "de": "Bitte schön. Die Kasse ist dort.",
     "optionen": [
       {"text": "Спаси́бо!", "de": "Danke!", "ende": True},
       {"text": "Не за что!", "de": "Keine Ursache!", "hinweis": "„Не за что“ sagt man, wenn sich jemand bei dir bedankt. Hier bedankst du dich: Спаси́бо!"}]},
  }},
 "kasse": {
  "titel": "Kasse", "zettel_titel": "Dein Zettel",
  "geschafft": "Bezahlt – der Einkauf ist geschafft!",
  "start": "band",
  "knoten": {
   "band": {"sprecher": "erzaehler", "text": "Вы на ка́ссе. Касси́р пробива́ет това́ры.", "de": "Sie sind an der Kasse. Der Kassierer scannt die Waren.",
     "aktion": "scannen", "weiter": "paket"},
   "paket": {"sprecher": "kassir", "text": "Паке́т ну́жен?", "de": "Brauchen Sie eine Tüte?", "feld": "paket", "weiter": "karta"},
   "karta": {"sprecher": "kassir", "text": "Ка́рта магази́на есть?", "de": "Haben Sie eine Kundenkarte?", "feld": "karta", "weiter": "zahlart"},
   "zahlart": {"sprecher": "kassir", "text": "Нали́чными и́ли ка́ртой?", "de": "Bar oder mit Karte?",
     "optionen": [
       {"text": "Нали́чными.", "de": "Bar.", "zahlart": "bar", "weiter": "summe"},
       {"text": "Ка́ртой.", "de": "Mit Karte.", "zahlart": "karte", "weiter": "summe"}]},
   "summe": {"sprecher": "kassir", "text": "С вас {summe}.", "de": "Das macht {summe_de}.", "aktion": "bezahlen", "weiter": "chek"},
   "chek": {"sprecher": "kassir", "text": "Чек ну́жен?", "de": "Brauchen Sie den Kassenbon?",
     "optionen": [
       {"text": "Да, пожа́луйста.", "de": "Ja, bitte.", "weiter": "abschied"},
       {"text": "Нет, спаси́бо.", "de": "Nein, danke.", "weiter": "abschied"}]},
   "abschied": {"sprecher": "kassir", "text": "Спаси́бо за поку́пку! Всего́ до́брого!", "de": "Danke für Ihren Einkauf! Alles Gute!",
     "optionen": [
       {"text": "Спаси́бо, до свида́ния!", "de": "Danke, auf Wiedersehen!", "ende": True},
       {"text": "Прия́тного аппети́та!", "de": "Guten Appetit!", "hinweis": "Das wünscht man beim Essen. Zum Abschied: До свида́ния!"}]},
  }},
}

inhalt = {
  "entdecken_hinweis": "Was gibt es im Supermarkt? Tippe auf die Äpfel, die Milch, die Kasse …",
  "woerter": [dict(id=i, ru=ru, de=de, genus=g, hotspot="hs-" + i, satz=satz, hinweis=h,
                   **({"de_zahl": "sg"} if i == "vesy" else {}), **({"an_der_theke": True} if i in THEKE else {}))
               for i, ru, de, g, satz, h in W],
  "reise": {
    "neu_knopf": "Neuer Zettel →",
    "start_stufe": "einkaufen",
    "figuren": {
      "prodavshchitsa": {"name": "Продавщи́ца", "stimme": "weiblich", "blase": {"x": 0.71, "y": 0.5, "seite": "links"}},
      "kassir": {"name": "Касси́р", "stimme": "maennlich", "blase": {"x": 0.93, "y": 0.55, "seite": "links"}},
      "erzaehler": {"name": "", "stimme": "erzaehler", "blase": {"x": 0.3, "y": 0.45}},
    },
    "reisende": R,
    "szenen": szenen,
  },
}
json.dump(modul, open(os.path.join(B, "modul.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump(inhalt, open(os.path.join(B, "inhalt.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(R), "Einkäufe,", len(W), "Wörter; Summen:", [r["preis"] for r in R])
