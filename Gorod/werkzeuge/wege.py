"""Fragen für die Stufe „Gehen & Fahren“ (Baustein static/bausteine/wege.js).

Verben der Bewegung:
  идти́ / е́хать      – eine Richtung, gerade unterwegs
  ходи́ть / е́здить   – regelmäßig, hin und her, hin und zurück
  пойти́ / пое́хать   – einmal los (ist losgegangen / wird hingehen)

Jede Frage hat ein Bild (Muster der Bewegung, zu Fuß oder mit Fahrzeug) und einen
Satz mit Lücke. Die falschen Antworten unterscheiden sich in dem Punkt, den man
typischerweise verwechselt; der Hinweis sagt, was die gewählte Form bedeutet und
warum sie hier nicht passt. Personen sind erfunden.

Wird von den Modul-Skripten importiert:  from wege import fragen
"""

import random

# ---------------------------------------------------------------- Formen
# art: geh (zu Fuß) | fahr ; typ: eine (eine Richtung) | mehr (hin und her) | los (пo-)
PRAES = {
    ("geh", "eine"): ["иду́", "идёшь", "идёт", "идём", "идёте", "иду́т"],
    ("geh", "mehr"): ["хожу́", "хо́дишь", "хо́дит", "хо́дим", "хо́дите", "хо́дят"],
    ("fahr", "eine"): ["е́ду", "е́дешь", "е́дет", "е́дем", "е́дете", "е́дут"],
    ("fahr", "mehr"): ["е́зжу", "е́здишь", "е́здит", "е́здим", "е́здите", "е́здят"],
}
PRAET = {   # m, f, Plural
    ("geh", "eine"): ["шёл", "шла", "шли"],
    ("geh", "mehr"): ["ходи́л", "ходи́ла", "ходи́ли"],
    ("geh", "los"): ["пошёл", "пошла́", "пошли́"],
    ("fahr", "eine"): ["е́хал", "е́хала", "е́хали"],
    ("fahr", "mehr"): ["е́здил", "е́здила", "е́здили"],
    ("fahr", "los"): ["пое́хал", "пое́хала", "пое́хали"],
}
FUT_LOS = {"geh": ["пойду́", "пойдёшь", "пойдёт", "пойдём", "пойдёте", "пойду́т"],
           "fahr": ["пое́ду", "пое́дешь", "пое́дет", "пое́дем", "пое́дете", "пое́дут"]}
BUDU = ["бу́ду", "бу́дешь", "бу́дет", "бу́дем", "бу́дете", "бу́дут"]
INF = {("geh", "eine"): "идти́", ("geh", "mehr"): "ходи́ть", ("fahr", "eine"): "е́хать", ("fahr", "mehr"): "е́здить"}
LYUBIT = ["люблю́", "лю́бишь", "лю́бит", "лю́бим", "лю́бите", "лю́бят"]


def form(art, typ, zeit, p, g):
    if zeit == "praes":
        return PRAES[(art, typ)][p]
    if zeit == "praet":
        return PRAET[(art, typ)]["mfp".index(g)]
    if zeit == "fut":
        return FUT_LOS[art][p] if typ == "los" else f"{BUDU[p]} {INF[(art, typ)]}"
    return INF[(art, typ)]


# Deutsch
DE = {
    "geh": ["gehe", "gehst", "geht", "gehen", "geht", "gehen"],
    "fahr": ["fahre", "fährst", "fährt", "fahren", "fahrt", "fahren"],
    "lauf": ["laufe", "läufst", "läuft", "laufen", "lauft", "laufen"],
    "ging": ["ging", "gingst", "ging", "gingen", "gingt", "gingen"],
    "fuhr": ["fuhr", "fuhrst", "fuhr", "fuhren", "fuhrt", "fuhren"],
    "sein": ["bin", "bist", "ist", "sind", "seid", "sind"],
    "war": ["war", "warst", "war", "waren", "wart", "waren"],
    "bekam": ["bekam", "bekamst", "bekam", "bekamen", "bekamt", "bekamen"],
    "werden": ["werde", "wirst", "wird", "werden", "werdet", "werden"],
}

# ---------------------------------------------------------------- Personen (erfunden)
def person(ru, de, p, g=None, pron=None, akk=None, dat=None, de_pron=None, de_akk=None):
    return dict(ru=ru, de=de, p=p, g=g, pron=pron, akk=akk, dat=dat, de_pron=de_pron or de, de_akk=de_akk)


YA = person("я", "ich", 0)
TY = person("ты", "du", 1)
DIMA = person("Ди́ма", "Dima", 2, "m", "он", "его́", "ему́", "er", "ihn")
MASHA = person("Ма́ша", "Mascha", 2, "f", "она́", "её", "ей", "sie", "sie")
IVAN = person("Ива́н Петро́вич", "Iwan Petrowitsch", 2, "m", "он", "его́", "ему́", "er", "ihn")
ANNA = person("А́нна", "Anna", 2, "f", "она́", "её", "ей", "sie", "sie")
MY = person("мы", "wir", 3, "p", "мы", None, "нам", "wir", "uns")
VY = person("вы", "ihr", 4)
DETI = person("де́ти", "die Kinder", 5, "p", "они́", "их", "им", "sie", "sie")

ALLE = [YA, TY, DIMA, MASHA, IVAN, ANNA, MY, VY, DETI]
MIT_GESCHLECHT = [DIMA, MASHA, IVAN, ANNA, MY, DETI]
DRITTE = [DIMA, MASHA, IVAN, ANNA, DETI]

# ---------------------------------------------------------------- Ziele
# ru (wohin), de wohin, de wo, Bild, Schild, Farbe
# Häufigkeit (für „regelmäßig“): ru, de, Wochentage 0=пн … 6=вс (None = drei Mal hintereinander)
HAEUFIG = {
    "täglich": ("ка́ждый день", "jeden Tag", [0, 1, 2, 3, 4, 5, 6]),
    "morgens": ("ка́ждое у́тро", "jeden Morgen", [0, 1, 2, 3, 4]),
    "samstags": ("по суббо́там", "samstags", [5]),
    "zweimal": ("два ра́за в неде́лю", "zweimal pro Woche", [1, 3]),
    "oft": ("ча́сто", "oft", [0, 2, 4]),
    "sommer": ("ка́ждое ле́то", "jeden Sommer", None),
}
# ru (wohin), de wohin, de wo, Bild, Schild, Farbe, passende Häufigkeiten
NAH = [
    ("в шко́лу", "in die Schule", "in der Schule", "haus", "шко́ла", "#c8553d", ["täglich", "morgens"]),
    ("в магази́н", "in den Laden", "im Laden", "haus", "магази́н", "#2b5fa8", ["oft", "samstags"]),
    ("в кино́", "ins Kino", "im Kino", "haus", "кино́", "#7a3b8f", ["samstags", "oft"]),
    ("в бассе́йн", "ins Schwimmbad", "im Schwimmbad", "haus", "бассе́йн", "#2a8fb8", ["zweimal", "samstags"]),
    ("на рабо́ту", "zur Arbeit", "bei der Arbeit", "haus", "рабо́та", "#5d6d7e", ["täglich", "morgens"]),
    ("в библиоте́ку", "in die Bibliothek", "in der Bibliothek", "haus", "библиоте́ка", "#8a5a3a", ["zweimal", "oft"]),
    ("на по́чту", "zur Post", "auf der Post", "haus", "по́чта", "#2f7d50", ["oft"]),
    ("в апте́ку", "in die Apotheke", "in der Apotheke", "haus", "апте́ка", "#3f9a6a", ["oft"]),
]
FERN = [
    ("в Москву́", "nach Moskau", "in Moskau", "stadt", "Москва́", "#b8392b", ["oft", "sommer"]),
    ("в Петербу́рг", "nach Sankt Petersburg", "in Sankt Petersburg", "stadt", "Петербу́рг", "#2b5fa8", ["oft", "sommer"]),
    ("на мо́ре", "ans Meer", "am Meer", "meer", "мо́ре", "#2a8fb8", ["sommer"]),
    ("на да́чу", "auf die Datscha", "auf der Datscha", "datscha", "да́ча", "#8a5a3a", ["samstags", "sommer"]),
]
MITTEL = {
    "bus": ("на авто́бусе", "mit dem Bus"),
    "auto": ("на маши́не", "mit dem Auto"),
    "metro": ("на метро́", "mit der Metro"),
    "zug": ("на по́езде", "mit dem Zug"),
}

# ---------------------------------------------------------------- Muster
# richtig = (typ, zeit); falsch = (gleiche/andere art, typ, zeit)
MUSTER = {
    "jetzt": dict(typ="eine", zeit="praes", leute=ALLE,
                  falsch=[("A", "mehr", "praes"), ("B", "eine", "praes"), ("B", "mehr", "praes")]),
    "regel": dict(typ="mehr", zeit="praes", leute=ALLE,
                  falsch=[("A", "eine", "praes"), ("B", "mehr", "praes"), ("B", "eine", "praes")]),
    "umher": dict(typ="mehr", zeit="inf", leute=ALLE,
                  falsch=[("A", "eine", "inf"), ("B", "mehr", "inf"), ("B", "eine", "inf")]),
    "hin_zurueck": dict(typ="mehr", zeit="praet", leute=MIT_GESCHLECHT,
                        falsch=[("A", "eine", "praet"), ("A", "los", "praet"), ("B", "mehr", "praet")]),
    "unterwegs": dict(typ="eine", zeit="praet", leute=MIT_GESCHLECHT,
                      falsch=[("A", "mehr", "praet"), ("A", "eine", "praes"), ("B", "eine", "praet")]),
    "los": dict(typ="los", zeit="praet", leute=DRITTE,
                falsch=[("A", "mehr", "praet"), ("A", "eine", "praet"), ("B", "los", "praet")]),
    "zukunft": dict(typ="los", zeit="fut", leute=MIT_GESCHLECHT,
                    falsch=[("A", "mehr", "fut"), ("A", "mehr", "praet"), ("B", "los", "fut")]),
    "zukunft_regel": dict(typ="mehr", zeit="fut", leute=MIT_GESCHLECHT,
                          falsch=[("A", "los", "fut"), ("A", "mehr", "praet"), ("B", "mehr", "fut")]),
}

ZUKUNFT = [("За́втра", "Morgen"), ("В суббо́ту", "Am Samstag"), ("Ве́чером", "Heute Abend")]
EREIGNIS = [
    ("telefon", lambda p: f"{p['dat']} позвони́ла ма́ма", lambda p: f"{DE['bekam'][p['p']]} {p['de_pron']} einen Anruf von Mama", "Mama anrief"),
    ("regen", lambda p: "начался́ дождь", lambda p: "fing es an zu regnen", "es anfing zu regnen"),
]


def gross(t):
    return t[:1].upper() + t[1:]


def bedeutung(art, typ, zeit):
    gehen = "gehen" if art == "geh" else "fahren"
    los = "losgegangen" if art == "geh" else "losgefahren"
    hin = "hingehen" if art == "geh" else "hinfahren"
    return {
        ("eine", "praes"): "gerade jetzt unterwegs, in eine Richtung",
        ("mehr", "praes"): "regelmäßig, immer wieder oder hin und her",
        ("eine", "inf"): f"{gehen} in eine Richtung, zu einem Ziel",
        ("mehr", "inf"): f"{gehen} ohne festes Ziel, hin und her (oder regelmäßig)",
        ("eine", "praet"): "Vergangenheit: war gerade unterwegs, mitten auf dem Weg",
        ("mehr", "praet"): "Vergangenheit: hin und zurück – war dort und ist wieder da",
        ("los", "praet"): f"Vergangenheit, vollendet: ist {los} und noch nicht zurück",
        ("los", "fut"): f"Zukunft, vollendet: wird einmal {hin}",
        ("mehr", "fut"): f"Zukunft: wird regelmäßig {gehen}",
    }[(typ, zeit)] + (" (zu Fuß)" if art == "geh" else " (mit einem Fahrzeug)")


def frage(muster, art, wer, ziel, mittel, mit_mittel, rnd):
    m = MUSTER[muster]
    p, g = wer["p"], wer["g"]
    if wer is DETI and ziel[0] == "на рабо́ту":     # Kinder gehen in die Schule
        ziel = NAH[0]
    ru_ziel, de_wohin, de_wo, icon, schild, farbe, haeufig = ziel
    fern = ziel in FERN
    mittel_ru = f" {MITTEL[mittel][0]}" if art == "fahr" and mit_mittel else ""
    mittel_de = f" {MITTEL[mittel][1]}" if art == "fahr" and mit_mittel else ""
    B = "fahr" if art == "geh" else "geh"
    richtig = form(art, m["typ"], m["zeit"], p, g)
    W, Wde = wer["ru"], wer["de"]
    bild = {"art": art, "mittel": mittel if art == "fahr" else "fuss",
            "ziel": {"icon": icon, "schild": schild, "farbe": farbe}}
    vor = None
    sein, war = DE["sein"][p], DE["war"][p]
    geht = DE[art][p]

    if muster == "jetzt":
        text = f"Сейча́с {W} … {ru_ziel}{mittel_ru}."
        de = f"{gross(Wde)} {geht} gerade{mittel_de} {de_wohin}."
        bild["zeit"] = "сейча́с"
        lage = f"{Wde} {sein} jetzt gerade auf dem Weg {de_wohin}"
    elif muster == "regel":
        zeit_ru, zeit_de, tage = HAEUFIG[rnd.choice(haeufig)]
        if zeit_ru == "ча́сто":     # kurzes Adverb steht vor dem Verb
            text = f"{gross(W)} ча́сто … {ru_ziel}{mittel_ru}."
        else:
            text = f"{gross(W)} … {ru_ziel}{mittel_ru} {zeit_ru}."
        de = f"{gross(Wde)} {geht} {zeit_de}{mittel_de} {de_wohin}."
        bild.update(zeit=zeit_ru, tage=tage)
        lage = f"{Wde} {geht} {zeit_de} {de_wohin} – also regelmäßig, immer wieder hin und zurück"
    elif muster == "umher":
        if art == "geh":
            text = f"{gross(W)} {LYUBIT[p]} … по па́рку."
            de = f"{gross(Wde)} {DE['lauf'][p]} gern im Park herum."
            bild.update(zeit="по па́рку", ziel={"icon": "park", "schild": "парк", "farbe": "#2f7d50"})
        else:
            text = f"{gross(W)} {LYUBIT[p]} … по го́роду{mittel_ru}."
            de = f"{gross(Wde)} {geht} gern{mittel_de} durch die Stadt."
            bild.update(zeit="по го́роду", ziel={"icon": "stadt", "schild": "го́род", "farbe": "#5d6d7e"})
        lage = f"{Wde} {geht if art == 'fahr' else DE['lauf'][p]} ohne festes Ziel hin und her"
    elif muster == "hin_zurueck":
        if wer is MY:
            vor = ("Где вы бы́ли вчера́?", "Wo wart ihr gestern?")
        else:
            vor = (f"Где {['был', 'была́', 'бы́ли']['mfp'.index(g)]} {W} вчера́?", f"Wo {war} {Wde} gestern?")
        text = f"Вчера́ {W} … {ru_ziel}{mittel_ru}."
        de = f"Gestern {war} {Wde} {de_wo} (hin und wieder zurück)."
        bild["zeit"] = "вчера́"
        lage = f"gefragt ist, wo {Wde} gestern {war}: {wer['de_pron']} {war} {de_wo} und {sein} wieder zurück"
    elif muster == "unterwegs":
        ereignis, ru_e, de_e, de_als = rnd.choice(EREIGNIS)
        text = f"Когда́ {W} … {ru_ziel}{mittel_ru}, {ru_e(wer)}."
        ging = DE["ging" if art == "geh" else "fuhr"][p]
        de = f"Als {Wde} gerade{mittel_de} {de_wohin} {ging}, {de_e(wer)}."
        bild.update(zeit="вчера́", ereignis=ereignis)
        lage = f"{Wde} {war} gerade mitten auf dem Weg, als {de_als} – das ist vorbei, also Vergangenheit"
    elif muster == "los":
        vor = (f"Где {W}?", f"Wo {sein} {Wde}?")
        text = f"{gross(wer['akk'])} нет до́ма. {gross(wer['pron'])} … {ru_ziel}{mittel_ru}."
        weg = "gegangen" if art == "geh" else "gefahren"
        de = f"{gross(wer['de_pron'])} {sein} nicht zu Hause. {gross(wer['de_pron'])} {sein}{mittel_de} {de_wohin} {weg}."
        bild["zeit"] = "сейча́с"
        bild["leer"] = True
        lage = f"{Wde} {sein} nicht zu Hause – {wer['de_pron']} {sein} {'losgegangen' if art == 'geh' else 'losgefahren'} und noch nicht zurück"
    elif muster == "zukunft":
        zeit_ru, zeit_de = rnd.choice(ZUKUNFT if ziel[4] not in ("шко́ла", "рабо́та") else ZUKUNFT[:2])
        text = f"{zeit_ru} {W} … {ru_ziel}{mittel_ru}."
        de = f"{zeit_de} {geht} {Wde}{mittel_de} {de_wohin}."
        bild.update(zeit=zeit_ru.lower(), geist=True)
        lage = f"es geht um ein einziges Mal in der Zukunft ({zeit_de.lower()})"
    else:   # zukunft_regel
        zeit_ru, zeit_de, tage = HAEUFIG[rnd.choice([h for h in haeufig if h != "oft"])]
        text = f"В сле́дующем году́ {W} … {ru_ziel}{mittel_ru} {zeit_ru}."
        de = f"Nächstes Jahr {DE['werden'][p]} {Wde} {zeit_de}{mittel_de} {de_wohin} {'gehen' if art == 'geh' else 'fahren'}."
        bild.update(zeit=f"в сле́дующем году́ · {zeit_ru}", tage=tage, geist=True)
        lage = f"„{zeit_de}“ in der Zukunft – also regelmäßig"

    falsch = []
    for wahl_art, typ, zeit in m["falsch"]:
        a = art if wahl_art == "A" else B
        f = form(a, typ, zeit, p, g)
        if a != art and (typ, zeit) == (m["typ"], m["zeit"]):
            if a == "fahr":
                h = f"{f} heißt fahren – mit Bus, Zug oder Auto. {gross(Wde)} {sein} im Bild zu Fuß unterwegs: {richtig}."
            elif mittel_ru:
                h = f"{f} heißt nur „zu Fuß gehen“. Wer{mittel_de} unterwegs ist, fährt – е́хать / е́здить: {richtig}."
            else:
                h = (f"{f} heißt nur „zu Fuß gehen“. {gross(de_wohin)} geht man nicht zu Fuß, man fährt – е́хать / е́здить: {richtig}. "
                     "Deutsch sagt oft „gehen“, Russisch nur, wenn man wirklich läuft.")
        else:
            h = f"{f} = {bedeutung(a, typ, zeit)}. Hier: {lage} → {richtig}."
            if a != art:
                h += " Und: " + ("zu Fuß heißt идти́ / ходи́ть." if art == "geh" else "mit einem Fahrzeug heißt es е́хать / е́здить.")
        falsch.append({"text": f, "hinweis": h, "m": [a, typ, zeit]})

    texte = [richtig] + [x["text"] for x in falsch]
    assert len(set(texte)) == 4, texte
    satz = text.replace("…", richtig)
    return {
        "muster": muster,
        "bild": bild,
        **({"vor": {"text": vor[0], "de": vor[1]}} if vor else {}),
        "text": text,
        "de": de,
        "richtig": {"text": richtig, "satz": satz, "erklaerung": f"{richtig} = {bedeutung(art, m['typ'], m['zeit'])}.",
                    "m": [art, m["typ"], m["zeit"]]},
        "falsch": falsch,
        "schritt": schritt(muster, art, wer),
    }


# ---------------------------------------------------------------- Zwischenschritt
# Vor der Verbwahl: „Was zeigt das Bild?“ – auf Deutsch, mit der Person der Aufgabe.
FAMILIE = {"jetzt": "praes", "regel": "praes", "umher": "praes",
           "hin_zurueck": "praet", "unterwegs": "praet", "los": "praet",
           "zukunft": "fut", "zukunft_regel": "fut"}
SCHRITT_FRAGE = {"praes": "Was zeigt das Bild?",
                 "praet": "Was ist passiert? Schau die Szene bis zum Ende an.",
                 "fut": "Wie oft wird es passieren?"}
MERKE = {   # (muster, art) → was man nimmt
    ("jetzt", "geh"): "gerade unterwegs, eine Richtung → идти́: иду́, идёшь, идёт, идём, идёте, иду́т",
    ("jetzt", "fahr"): "gerade unterwegs, eine Richtung → е́хать: е́ду, е́дешь, е́дет, е́дем, е́дете, е́дут",
    ("regel", "geh"): "regelmäßig → ходи́ть: хожу́, хо́дишь, хо́дит, хо́дим, хо́дите, хо́дят",
    ("regel", "fahr"): "regelmäßig → е́здить: е́зжу, е́здишь, е́здит, е́здим, е́здите, е́здят",
    ("umher", "geh"): "ohne Ziel hin und her → ходи́ть (Grundform nach люби́ть)",
    ("umher", "fahr"): "ohne Ziel hin und her → е́здить (Grundform nach люби́ть)",
    ("hin_zurueck", "geh"): "hin und zurück, war dort → ходи́л · ходи́ла · ходи́ли",
    ("hin_zurueck", "fahr"): "hin und zurück, war dort → е́здил · е́здила · е́здили",
    ("unterwegs", "geh"): "mitten auf dem Weg → шёл · шла · шли",
    ("unterwegs", "fahr"): "mitten auf dem Weg → е́хал · е́хала · е́хали",
    ("los", "geh"): "losgegangen, noch weg → пошёл · пошла́ · пошли́",
    ("los", "fahr"): "losgefahren, noch weg → пое́хал · пое́хала · пое́хали",
    ("zukunft", "geh"): "einmal in der Zukunft → пойду́, пойдёшь, пойдёт, пойдём, пойдёте, пойду́т",
    ("zukunft", "fahr"): "einmal in der Zukunft → пое́ду, пое́дешь, пое́дет, пое́дем, пое́дете, пое́дут",
    ("zukunft_regel", "geh"): "regelmäßig in der Zukunft → бу́ду, бу́дешь, бу́дет, бу́дем, бу́дете, бу́дут + ходи́ть",
    ("zukunft_regel", "fahr"): "regelmäßig in der Zukunft → бу́ду, бу́дешь, бу́дет, бу́дем, бу́дете, бу́дут + е́здить",
}
ENDUNG = {"m": "-л (er)", "f": "-ла (sie)", "p": "-ли (mehrere)"}


def schritt(muster, art, wer):
    p, Wde = wer["p"], gross(wer["de"])
    sein, war, wird = DE["sein"][p], DE["war"][p], DE["werden"][p]
    geht = DE[art][p]
    texte = {
        "jetzt": f"{Wde} {sein} gerade auf dem Weg – in eine Richtung.",
        "regel": f"{Wde} {geht} immer wieder hin und zurück – regelmäßig.",
        "umher": f"{Wde} {DE['lauf'][p] if art == 'geh' else geht} ohne Ziel hin und her.",
        "hin_zurueck": f"{Wde} {war} dort und {sein} wieder zurück.",
        "unterwegs": f"{Wde} {war} gerade mitten auf dem Weg, als etwas passierte.",
        "los": f"{Wde} {sein} {'losgegangen' if art == 'geh' else 'losgefahren'} und noch nicht zurück.",
        "zukunft": f"{Wde} {wird} einmal {'hingehen' if art == 'geh' else 'hinfahren'}.",
        "zukunft_regel": f"{Wde} {wird} regelmäßig {'hingehen' if art == 'geh' else 'hinfahren'} – immer wieder.",
    }
    bildhinweis = {
        "jetzt": "Schau aufs Bild: Die Figur ist unterwegs zum Ziel – nur in eine Richtung, und die Uhr sagt сейча́с (jetzt).",
        "regel": "Schau aufs Bild: Die Wochentage leuchten nacheinander auf – hin und zurück, immer wieder.",
        "umher": "Schau auf die Spur: ein Zickzack, ohne Ziel – hin und her.",
        "hin_zurueck": "Schau bis zum Ende: Die Figur kommt wieder nach Hause zurück.",
        "unterwegs": "Schau genau: Die Figur bleibt mitten auf dem Weg stehen – da passiert etwas.",
        "los": "Schau bis zum Ende: Die Figur verschwindet im Ziel, das Haus bleibt leer (?).",
        "zukunft": "Die Figur ist blass = das ist geplant. Und sie geht nur ein einziges Mal hin.",
        "zukunft_regel": "Die Figur ist blass = geplant. Und die Wochentage leuchten: immer wieder.",
    }[muster]
    merke = MERKE[(muster, art)]
    if FAMILIE[muster] == "praet":
        merke += f" – Endung für {wer['ru']}: {ENDUNG[wer['g']]}"
    familie = FAMILIE[muster]
    return {
        "frage": SCHRITT_FRAGE[familie],
        "texte": {k: v for k, v in texte.items() if FAMILIE[k] == familie},
        "bildhinweis": bildhinweis,
        "merke": merke,
    }


def passend(ziele, muster):
    """Für „regelmäßig in der Zukunft“ nur Ziele mit fester Häufigkeit (nicht nur „oft“)."""
    if muster != "zukunft_regel":
        return ziele
    return [z for z in ziele if set(z[6]) - {"oft"}]


def fragen(seed=7, je_muster=20):
    rnd = random.Random(seed)
    alle = []
    for muster, m in MUSTER.items():
        for n in range(je_muster):
            art = "geh" if n % 2 == 0 else "fahr"
            wer = m["leute"][n % len(m["leute"])] if n < len(m["leute"]) else rnd.choice(m["leute"])
            if muster == "umher":
                ziel, mittel, mit_mittel = NAH[0], rnd.choice(["auto", "bus"]), True
            elif art == "geh":
                ziel, mittel, mit_mittel = rnd.choice(passend(NAH, muster)), "fuss", False
            elif n % 4 == 1:        # nahes Ziel, Verkehrsmittel steht im Satz
                ziel, mittel, mit_mittel = rnd.choice(passend(NAH, muster)), rnd.choice(["bus", "metro", "auto"]), True
            else:                   # fernes Ziel: Deutsch „nach Moskau gehen“ – Russisch е́хать
                ziel, mittel = rnd.choice(passend(FERN, muster)), rnd.choice(["zug", "auto", "bus"])
                mit_mittel = rnd.random() < 0.4
            alle.append(frage(muster, art, wer, ziel, mittel, mit_mittel, rnd))
    return {"fragen": alle}


if __name__ == "__main__":
    import json
    import io
    import sys
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    d = fragen()
    print(len(d["fragen"]), "Fragen")
    for f in d["fragen"][::9]:
        print(json.dumps(f, ensure_ascii=False)[:600])
