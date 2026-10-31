"""Erzeugt static/grammatik.json – die Regeln für „Grammatik zum Antippen“.

Jede Regel: muster (JS-Regex, ohne Betonung, е statt ё), titel, text.
In titel/text: {0} ganzer Treffer, {name} benannte Gruppe, {L} Grundform
(„Москва́ → в Москве́“, aus LEXIKON). Zeilen mit leerem Platzhalter fallen weg,
„?name:“ am Zeilenanfang = Zeile nur, wenn die Gruppe getroffen wurde.
Reihenfolge = Vorrang: Was eine frühere Regel belegt, nimmt keine spätere mehr.

Aufruf:  python werkzeuge/grammatik_regeln.py
Prüfen:  node werkzeuge/grammatik_pruefen.js   (Abdeckung über alle Module)
"""
import json
from pathlib import Path

ZIEL = Path(__file__).resolve().parent.parent / "static" / "grammatik.json"


def flach(s):
    return s.replace("́", "").replace("ё", "е").replace("Ё", "Е")


def wahl(*woerter):
    return "(?:" + "|".join(flach(w) for w in woerter) + ")"


W = r"[\p{L}-]+"
ADJ = (r"(?:[\p{L}]+(?:ый|ий|ой|ая|яя|ое|ее|ые|ие|ого|его|ому|ему|ым|им|ом|ем|ую|юю|ей|ых|их|ыми|ими)"
       r"|одну|одном|одной|одного|ту|тот|ту|эту|этот|этой|этом|том|той)")
ADJP = rf"(?:{ADJ}\s+)?"


def np(endung=""):
    """Nominalgruppe: optional Adjektiv + Nomen (mit Endung) – benannte Gruppe np."""
    return rf"(?<np>{ADJP}[\p{{L}}-]*{endung})" if endung else rf"(?<np>{ADJP}{W})"


ZAHL1 = wahl("один", "одна", "одно", "одну")
ZAHL24 = wahl("два", "две", "три", "четыре")
ZAHL5 = wahl("пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать",
             "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать", "двадцать",
             "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто", "сто",
             "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот")
TAUSEND = wahl("тысяча", "тысячи", "тысяч")
ZAHL = rf"(?:{ZAHL1}|{ZAHL24}|{ZAHL5}|{TAUSEND}|ноль|\d+)"
ZAHLEN = rf"(?:{ZAHL}\s+)*"
# Wörter, die nach einer Zahl kein gezähltes Nomen sind
KEIN_NOMEN = rf"(?!(?:{ZAHL}|и|в|во|на|с|со|по|из|до|у|к|за|о|а|но|или|не|уже|ещё|еще)(?![\p{{L}}-]))"
NOMEN = rf"{KEIN_NOMEN}[\p{{L}}-]{{2,}}"

ORD_N = wahl("первое", "второе", "третье", "четвёртое", "пятое", "шестое", "седьмое", "восьмое", "девятое", "десятое",
             "одиннадцатое", "двенадцатое", "тринадцатое", "четырнадцатое", "пятнадцатое", "шестнадцатое",
             "семнадцатое", "восемнадцатое", "девятнадцатое", "двадцатое", "тридцатое")
ORD_G = wahl("первого", "второго", "третьего", "четвёртого", "пятого", "шестого", "седьмого", "восьмого", "девятого",
             "десятого", "одиннадцатого", "двенадцатого", "тринадцатого", "четырнадцатого", "пятнадцатого",
             "шестнадцатого", "семнадцатого", "восемнадцатого", "девятнадцатого", "двадцатого", "тридцатого",
             "сорокового", "пятидесятого", "шестидесятого", "семидесятого", "восьмидесятого", "девяностого",
             "сотого", "двухтысячного")
ORD_NOM = wahl("первый", "второй", "третий", "четвёртый", "пятый", "шестой", "седьмой", "восьмой", "девятый", "десятый",
               "двадцатый", "тридцатый", "сороковой", "пятидесятый", "шестидесятый", "семидесятый", "восьмидесятый",
               "девяностый", "двухтысячный")
ORD_P = wahl("первом", "втором", "третьем", "четвёртом", "пятом", "шестом", "седьмом", "восьмом", "девятом", "десятом",
             "двадцатом", "тридцатом", "сороковом", "пятидесятом", "шестидесятом", "семидесятом", "восьмидесятом",
             "девяностом", "двухтысячном")
MONAT_G = wahl("января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября",
               "ноября", "декабря")

LOC2 = wahl("саду", "лесу", "шкафу", "аэропорту", "полу", "краю", "углу", "мосту", "году", "снегу", "берегу",
            "носу", "рту", "порту")
SUBST_ADJ = wahl("ванной", "столовой", "гостиной", "прихожей", "детской", "мастерской", "учительской", "кладовой")
UNVERAENDERLICH = wahl("сочи", "кафе", "кино", "метро", "табло", "купе", "меню", "такси", "евро", "салями", "пальто",
                       "кофе", "радио", "фойе")
WOCHENTAG = wahl("понедельник", "вторник", "среду", "четверг", "пятницу", "субботу", "воскресенье")

regeln = []


def regel(id, muster, titel, text, betont=False, gross=False):
    """betont: sucht im Text mit Betonungszeichen; gross: Groß-/Kleinschreibung zählt."""
    r = {"id": id, "muster": muster if betont else flach(muster), "titel": titel, "text": text}
    if betont:
        r["betont"] = True
    if gross:
        r["gross"] = True
    regeln.append(r)


# ------------------------------------------------------------------ feste Wendungen
regel("skazhite", r"скажите,?\s+пожалуйста", "Sagen Sie bitte …",
      "Скажи́те ist die höfliche Befehlsform von сказа́ть (sagen). Mit пожа́луйста die übliche Einleitung einer Frage an Fremde.")
regel("pozhaluysta", r"пожалуйста", "bitte / bitte schön",
      "пожа́луйста heißt „bitte“ (beim Bitten) und „bitte schön“ (als Antwort auf спаси́бо).\nGesprochen meist verkürzt: „paschálsta“.")
regel("ne_za_chto", r"не\s+за\s+что", "Keine Ursache",
      "Antwort auf спаси́бо, wörtlich „nicht wofür“. Betont wird das не: не́ за что.")
regel("spasibo_za", r"спасибо\s+за\s+(?<np>" + W + ")", "спаси́бо за + Akkusativ",
      "Danke für …: за steht hier mit dem Akkusativ.\nHier: {L}")
regel("zdravstvuyte", r"здравствуйте", "Guten Tag (höflich)",
      "Höfliche Begrüßung – zu Fremden, Erwachsenen oder mehreren. Das erste в spricht man nicht: „sdrástwujtje“.\nZu Freunden und Kindern: Приве́т!")
regel("do_svidaniya", r"до\s+свидания", "Auf Wiedersehen",
      "до + Genitiv: wörtlich „bis zum Wiedersehen“ (свида́ние → до свида́ния).")
regel("wunsch_gen", wahl("всего доброго", "всего хорошего", "спокойной ночи", "приятного аппетита", "счастливого пути", "удачи"),
      "Wunsch im Genitiv",
      "Gemeint ist „(Ich wünsche) …“. Nach жела́ть (wünschen) steht der Genitiv – das Verb fällt weg, der Genitiv bleibt.")
regel("dobryj", r"(?:доброе\s+утро|добрый\s+(?:день|вечер))", "Gruß – Adjektiv passt sich an",
      "до́брый richtet sich nach dem Nomen: до́брое у́тро (у́тро ist sächlich), до́брый день / до́брый ве́чер (männlich).")
regel("izvinite", r"извините", "Entschuldigen Sie",
      "Höfliche Befehlsform von извини́ть (entschuldigen). Zu Freunden: Извини́!")
regel("menya_zovut", r"(?<wen>меня|его|её|ее|тебя|вас|нас)\s+зовут", "Ich heiße …",
      "Wörtlich „mich nennt man …“: меня́ ist der Akkusativ von я (его́ = ihn, её = sie), зову́т heißt „(sie) rufen“.\nDer Name danach steht im Nominativ: Меня́ зову́т А́ня – nicht А́ню.")
regel("kak_zovut", r"как\s+(?<wen>вас|тебя|его|её|ее)\s+зовут", "Wie heißen Sie?",
      "Wörtlich „Wie nennt man {wen}?“ – {wen} steht im Akkusativ.\nвас = Sie (höflich), тебя́ = dich, его́ = ihn, её = sie.")
regel("s_vas", r"с\s+вас", "Sie bekommen … / Das macht …",
      "So nennt die Kasse den Betrag: „Von Ihnen (bekomme ich) …“. с + Genitiv: вас ist der Genitiv von вы.")
regel("skolko_let", r"сколько\s+(?<wem>вам|тебе|ему|ей)\s+лет", "Wie alt …?",
      "Wörtlich „Wie viele Jahre (sind) {wem}?“: Das Alter steht im Russischen mit dem Dativ der Person.\nAntwort: Мне два́дцать лет.")
regel("skolko_stoit", r"сколько\s+(?:стоит|стоят)", "Wie viel kostet …?",
      "сто́ить = kosten: сто́ит (eins), сто́ят (mehrere).\nVorsicht Betonung: стои́т (auf der zweiten Silbe) heißt „steht“.")
regel("vo_skolko", r"во\s+сколько", "Um wie viel Uhr?",
      "Frage nach der Uhrzeit. Die Antwort steht mit в: в во́семь пятна́дцать (um 8:15).\nVor ско́лько sagt man во statt в.")
regel("po_schetu", r"какой\s+по\s+счёту", "Der Wievielte?",
      "Wörtlich „welcher nach der Zählung“. Darauf antwortet man mit einer Ordnungszahl: тре́тий (der dritte).")
regel("u_pron", r"у\s+(?<wen>меня|тебя|него|неё|нее|нас|вас|них)(?:\s+(?<est>есть|нет))?", "у + Genitiv = haben",
      "Russisch sagt „bei mir (ist) …“ statt „ich habe …“: у + Genitiv. {wen} ist der Genitiv des Personalpronomens (у меня́, у тебя́, у вас, у нас …).\n"
      "?est: есть = es gibt, also „haben“. Mit нет („es gibt nicht“) steht das Fehlende im Genitiv: У меня́ нет ка́рты.")
regel("vsyo_v_poryadke", r"всё\s+в\s+порядке", "Alles in Ordnung",
      "в + Präpositiv: поря́док → в поря́дке (das о fällt in der Endung weg).")

# ------------------------------------------------------------------ Zeitangaben
regel("datum", rf"(?:(?<na>на)\s+)?(?:(?:двадцать|тридцать)\s+)?(?:(?<tagn>{ORD_N})|(?<tagg>{ORD_G}))\s+(?<monat>{MONAT_G})",
      "Datum",
      "Das Datum ist eine Ordnungszahl im Neutrum – gemeint ist (число́, das Datum) – und der Monat steht im Genitiv: пя́тое ма́я = der 5. Mai, wörtlich „das fünfte des Mai“.\n"
      "?na: на + Akkusativ: für welches Datum? на пя́тое ма́я = für den 5. Mai.\n"
      "?tagg: Hier steht die Ordnungszahl im Genitiv – so sagt man „am …“: пя́того ма́я = am 5. Mai; so auch im Geburtsdatum.")
regel("jahr", rf"(?:{ZAHL}\s+)*{ORD_G}\s+года", "Jahr im Genitiv",
      "„des Jahres …“: Nur die letzte Zahl ist eine Ordnungszahl im Genitiv, davor stehen Grundzahlen.\n"
      "две ты́сячи пе́рвого го́да = (des Jahres) 2001, ты́сяча девятьсо́т девяно́стого го́да = 1990.")
regel("jahr_nom", rf"(?:{ZAHL}\s+)*{ORD_NOM}\s+год", "Jahreszahl",
      "Bei Jahreszahlen ist nur die letzte Zahl eine Ordnungszahl: две ты́сячи пе́рвый год = das Jahr 2001.")
regel("jahr_p", rf"(?:в|во)\s+(?:{ZAHL}\s+)*{ORD_P}\s+году", "в + Jahr (Präpositiv)",
      "Im Jahr …: в + Präpositiv, nur die letzte Zahl wird gebeugt, го́д wird zu году́: в две ты́сячи пе́рвом году́ = im Jahr 2001.")
regel("uhrzeit", rf"(?:в|во)\s+{ZAHL}(?:\s+{ZAHL})*(?:\s+(?<h>час|часа|часов))?(?!\s+(?:конец|сторону|раз|день|год|класс|вагон|билет|чемодан|место))", "в + Uhrzeit",
      "в + Uhrzeit = um … Uhr: в во́семь пятна́дцать = um 8:15.\n"
      "?h: Nach der Zahl: 1 час, 2–4 часа́, 5–20 часо́в: в пять часо́в.")
regel("dauer", rf"(?<prae>на|через)\s+(?<zahl>{ZAHLEN}{ZAHL})\s+(?<e>минуту|минуты|минут|час|часа|часов|день|дня|дней|неделю|недели|недель|месяц|месяца|месяцев)",
      "{prae} + Akkusativ: Zeitspanne",
      "на + Zahl: um/für diese Zeit – опа́здывает на два́дцать мину́т = hat 20 Minuten Verspätung.\n"
      "че́рез + Zahl: in dieser Zeit – че́рез шесть дней = in sechs Tagen.\n"
      "Nach der Zahl gilt die Zahlregel: 1 мину́ту, 2–4 мину́ты, 5–20 мину́т.")
regel("alter", rf"(?<wem>мне|тебе|ему|ей|нам|вам|им)\s+(?<zahl>{ZAHLEN}{ZAHL})\s+(?<j>год|года|лет)", "Alter: Dativ + Zahl",
      "Das Alter steht mit dem Dativ der Person: {wem} = mir/dir/ihm/ihr …\n"
      "Nach der Zahl: 1 год, 2–4 го́да, 5–20 лет (21 год, 22 го́да, 25 лет).")

# ------------------------------------------------------------------ Präpositionen – Sonderfälle
regel("put", rf"(?<prae>с|со|на|по)\s+(?<np>(?:{ADJ}\s+)?пути)", "путь – unregelmäßig",
      "путь (Gleis, Weg) ist männlich, wird aber wie ein weibliches Wort auf -ь gebeugt: Genitiv, Dativ, Präpositiv = пути́ – nicht путя́.\n"
      "с + Genitiv = von … ab: с четвёртого пути́ = von Gleis 4. на + Präpositiv = auf: на пе́рвом пути́ = auf Gleis 1.\n"
      "Die Ordnungszahl davor ist ein Adjektiv: Genitiv -ого (gesprochen -ово), Präpositiv -ом.\n"
      "Hier: {L}")
regel("unveraenderlich", rf"(?<prae>в|во|на|из|до|с|со|у|к|по|без|для|о)\s+(?<np>{UNVERAENDERLICH})", "Wort ändert sich nie",
      "{np} ist ein Lehnwort und wird nicht gebeugt: Die Form bleibt in allen Fällen gleich (в Со́чи = in Sotschi und nach Sotschi, в кафе́, без меню́).\n"
      "Welcher Fall gemeint ist, zeigt nur die Präposition oder das Verb.")

regel("v_gosti", r"(?:в|на)\s+гости", "в го́сти – zu Besuch",
      "идти́ / прийти́ в го́сти = zu Besuch gehen/kommen (wohin?): Akkusativ Plural von гость.\nWo? → в гостя́х (zu Besuch sein).")
regel("v_den", r"(?:в|во)\s+(?<np>(?:какой|этот|тот|один|следующий|первый|последний)\s+день)", "в + Akkusativ: wann?",
      "в mit dem Akkusativ gibt auch die Zeit an: в како́й день? = an welchem Tag?, в э́тот день = an diesem Tag.")

VO = "\n?vo: во statt в: Das nächste Wort beginnt mit в/ф + Konsonant (во Владивосто́к, во Фра́нкфурте, во второ́м, во дворе́)."
regel("kakom", r"(?<prae>в|во|на)\s+каком(?:\s+(?:мы|вы|он|она|оно|они|ты|я))?\s+(?<np>[\p{L}]+(?:е|и))", "{prae} како́м …? – wo?",
      "Frage nach dem Ort mit Präpositiv: како́й → (на) како́м, das Nomen ebenfalls im Präpositiv: эта́ж → на этаже́, класс → в кла́ссе.\n"
      "Hier: {L}")
regel("v_wochentag", rf"(?:в|(?<vo>во))\s+(?<np>{WOCHENTAG})", "в + Wochentag (Akkusativ)",
      "в + Akkusativ = am …: в понеде́льник = am Montag, в сре́ду = am Mittwoch.\n"
      "Weibliche Tage auf -а bekommen -у: среда́ → в сре́ду, пя́тница → в пя́тницу, суббо́та → в суббо́ту." + VO)
regel("praep_u", rf"(?<prae>в|во|на)\s+(?<np>{ADJP}{LOC2})", "Präpositiv auf betontes -у́",
      "{prae} + Präpositiv (wo?). Einige männliche Wörter enden hier auf ein betontes -у́ statt -е: сад → в саду́, лес → в лесу́, шкаф → в шкафу́, аэропо́рт → в аэропорту́, пол → на полу́.\n"
      "Aber mit о (über): о са́де, о ле́се.\nHier: {L}")
regel("subst_adj", rf"(?<prae>в|во|на)\s+(?<np>{SUBST_ADJ})", "Zimmer-Name = Adjektiv",
      "ва́нная, гости́ная, столо́вая, прихо́жая, де́тская sind eigentlich Adjektive (ко́мната, Zimmer, ist mitgedacht). Darum Präpositiv wie bei Adjektiven: в ва́нной, в гости́ной (wo?).\nHier: {L}")

PRAEP = {
    "в": ("в", "in"), "на": ("на", "auf / an"),
}
for p, (wort, de) in PRAEP.items():
    alt = "(?:в|(?<vo>во))" if p == "в" else "на"
    zusatz = VO if p == "в" else ""
    regel(f"{p}_praep", rf"{alt}\s+{np('(?:е|и|ах|ях)')}", f"{wort} + Präpositiv (wo?)",
          f"{wort} = {de}. Auf die Frage „wo?“ (где?) steht {wort} mit dem Präpositiv.\n"
          "Endung meist -е (в Москве́, на столе́), bei weiblichen Wörtern auf -ь und bei -ия/-ие: -и (в тетра́ди, в Каза́ни), im Plural -ах/-ях (в роди́телях).\n"
          + ("на statt в bei Flächen, Plätzen und Veranstaltungen: на вокза́ле, на платфо́рме, на ка́ссе, на уро́ке.\n" if p == "на" else "")
          + "?np: Adjektive davor enden auf -ом/-ем (m, n) bzw. -ой/-ей (f): в пе́рвом кла́ссе.\nHier: {L}" + zusatz)
    regel(f"{p}_akk_f", rf"{alt}\s+{np('(?:у|ю)')}", f"{wort} + Akkusativ (wohin?)",
          f"Auf die Frage „wohin?“ (куда́?) steht {wort} mit dem Akkusativ.\n"
          "Weibliche Wörter auf -а/-я bekommen -у/-ю: Москва́ → в Москву́, гости́ница → в гости́ницу. Adjektive davor: -ую (в каку́ю, в одну́).\nHier: {L}" + zusatz)
    regel(f"{p}_akk_m", rf"{alt}\s+{np('(?:[бвгджзклмнпрстфхцчшщ]|ь|й|о)(?<!каком|котором|этом|том|одном)')}", f"{wort} + Akkusativ (wohin?)",
          f"Auf die Frage „wohin?“ (куда́?) steht {wort} mit dem Akkusativ.\n"
          "Bei männlichen Sachen (und Wörtern auf -о oder weiblich auf -ь) sieht der Akkusativ aus wie der Nominativ: в Яросла́вль, в Ни́жний Но́вгород, в Каза́нь, в рюкза́к."
          + "\nZum Vergleich „wo?“: в Яросла́вле, в Каза́ни." + zusatz)

regel("s_instr", rf"(?:с|(?<so>со))\s+{np('(?:ом|ем|ой|ей|ью|ами|ями|ыми|ими)')}", "с + Instrumental = mit",
      "с mit dem Instrumental heißt „mit, zusammen mit“: чай с лимо́ном, с бра́том.\n"
      "Endungen: männlich/sächlich -ом/-ем, weiblich -ой/-ей (auf -ь: -ью), Plural -ами/-ями.\nHier: {L}"
      "\n?so: со statt с vor schwer sprechbaren Anfängen (со второ́го, со мной).")
regel("s_gen", rf"(?:с|(?<so>со))\s+{np('(?:а|я|ы|и|ого|его)')}", "с + Genitiv = von … (weg)",
      "с mit dem Genitiv heißt „von … (herab/weg), ab“: с рабо́ты (von der Arbeit), с ка́ссы.\n"
      "Gegenstück zu на: на рабо́ту (hin) → с рабо́ты (zurück).\nHier: {L}"
      "\n?so: со statt с vor schwer sprechbaren Anfängen (со второ́го, со стола́).")

GEN_PRAEP = {
    "из": "из + Genitiv = aus (woher?): из Москвы́, из Берли́на. Gegenstück zu в: в Москву́ (hin) → из Москвы́ (zurück).",
    "от": "от + Genitiv = von (jemandem / von einem Ort weg): пода́рок от ма́мы.",
    "до": "до + Genitiv = bis (zu): биле́т до Москвы́ = Fahrkarte nach (bis) Moskau.",
    "у": "у + Genitiv = bei: у дру́га (beim Freund). Mit есть heißt es „haben“: у ба́бушки есть … = Oma hat …",
    "для": "для + Genitiv = für (jemanden): пода́рок для ма́мы.",
    "без": "без + Genitiv = ohne: ко́фе без са́хара, вода́ без га́за.",
    "после": "по́сле + Genitiv = nach (zeitlich): по́сле уро́ка.",
    "около": "о́коло + Genitiv = neben, bei; ungefähr.",
    "из-за": "из-за + Genitiv = wegen; hinter … hervor.",
}
for p, satz in GEN_PRAEP.items():
    regel(f"{p}_gen", rf"{p}\s+{np()}", f"{p} + Genitiv",
          satz + "\nGenitiv-Endungen: männlich/sächlich -а/-я, weiblich -ы/-и, Adjektive -ого/-его (gesprochen -ово) bzw. -ой/-ей.\nHier: {L}")

regel("po_dat", rf"по\s+{np()}", "по + Dativ",
      "по mit dem Dativ: entlang, über, auf … herum, gemäß: по расписа́нию (laut Fahrplan), по ле́стнице (die Treppe hinauf/hinunter), по ле́нте (auf dem Band entlang).\n"
      "Dativ-Endungen: männlich/sächlich -у/-ю, weiblich -е/-и.\nHier: {L}")
regel("k_dat", rf"(?:к|ко)\s+{np()}", "к + Dativ = zu",
      "к mit dem Dativ = zu (jemandem), hin zu: к ма́ме, к вра́чу, к две́ри.\nHier: {L}")
regel("za_instr", rf"за\s+{np('(?:ом|ем|ой|ей|ью|ами|ями)')}", "за + Instrumental (wo?)",
      "за mit dem Instrumental = hinter / an (wo?): за па́ртой (am Pult), за окно́м (draußen vor dem Fenster), за ка́ссой (an der Kasse).\n"
      "Wohin? → за + Akkusativ: сесть за па́рту.\nHier: {L}")
regel("za_akk", rf"за\s+{np()}", "за + Akkusativ",
      "за mit dem Akkusativ: „für“ (спаси́бо за поку́пку) oder „an … (fassen)“: де́дка за ре́пку = der Großvater (packt) die Rübe.\n"
      "Weibliche Wörter auf -а/-я bekommen -у/-ю: ре́пка → за ре́пку, ба́бка → за ба́бку.\nHier: {L}")
for p, de in (("под", "unter"), ("над", "über"), ("перед", "vor"), ("между", "zwischen")):
    regel(f"{p}_instr", rf"{p}\s+{np()}", f"{flach(p)} + Instrumental (wo?)",
          f"{p} = {de}. Auf die Frage „wo?“ steht der Instrumental: -ом/-ем (m, n), -ой/-ей (f).\n"
          + ("Wohin? → под + Akkusativ: положи́ть под стол.\n" if p == "под" else "") + "Hier: {L}")
regel("o_praep", rf"(?:о|об)\s+{np('(?:е|и)')}", "о + Präpositiv = über",
      "о (vor Vokal об) mit dem Präpositiv = über (worüber?): о ле́се, о Москве́.\nHier: {L}")

# ------------------------------------------------------------------ Mengen und Zahlen
MENGE = wahl("бутылка", "бутылки", "бутылок", "бутылку", "пакет", "пакета", "пакетов", "пачка", "пачки", "пачку", "пачек",
             "буханка", "буханки", "буханку", "кусок", "куска", "кусочек", "кусочка", "банка", "банки", "банку",
             "стакан", "стакана", "чашка", "чашку", "чашки", "килограмм", "килограмма", "грамм", "граммов", "грамма",
             "полкило", "литр", "литра", "литров")
regel("menge", rf"(?:(?<zahl>{ZAHLEN}{ZAHL})\s+)?(?<menge>{MENGE})\s+(?<np>[\p{{L}}-]+(?:а|я|ы|и|у|ю|ов|ев|ей|иц))", "Menge + Genitiv",
      "Nach einer Mengenangabe steht das Gemessene im Genitiv: буты́лка воды́ (eine Flasche Wasser), паке́т молока́, полкило́ сы́ра.\n"
      "?zahl: Die Zahl davor bestimmt die Form der Mengenangabe: две буты́лки (2–4: Genitiv Singular), пять буты́лок, три́ста гра́ммов.\n"
      "Hier: {L}")
regel("euro", rf"(?:{ZAHLEN}{ZAHL})\s+евро", "е́вро – unveränderlich",
      "е́вро wird nie gebeugt: оди́н е́вро, два е́вро, пять е́вро. Bei рубль und до́ллар gilt die Zahlregel: пять рубле́й, пять до́лларов.")
regel("zahl_1", rf"(?:{ZAHLEN})?(?<zahl>{ZAHL1})\s+(?<np>{ADJP}{NOMEN})", "Zahl + Nomen",
      "Nach 1 steht das Nomen im Singular, im selben Fall wie die Zahl. Ebenso bei 21, 31, 101 … – nur nicht bei 11 (оди́ннадцать → Genitiv Plural).\n"
      "Die Eins richtet sich nach dem Geschlecht: оди́н биле́т (m), одна́ су́мка (f), одно́ ме́сто (n); als Objekt weiblich: одну́ ру́чку.\n"
      "Es entscheidet immer das letzte Zahlwort – hier {zahl}.")
regel("zahl_2_4", rf"(?:{ZAHLEN})?(?<zahl>{ZAHL24})\s+(?<np>{ADJP}{NOMEN})", "Zahl + Nomen: Genitiv Singular",
      "Nach 2, 3, 4 steht der Genitiv Singular: два биле́та, три огурца́, четы́ре бана́на. Ebenso bei 22, 33, 54 … – nur nicht bei 12, 13, 14 (Genitiv Plural).\n"
      "Bei weiblichen Wörtern heißt die Zwei две: две буты́лки, две ты́сячи.\n"
      "Es entscheidet immer das letzte Zahlwort – hier {zahl}.")
regel("zahl_tausend", rf"(?:{ZAHLEN})?(?<zahl>{TAUSEND})\s+(?<np>{NOMEN})", "ты́сяча + Genitiv Plural",
      "ты́сяча ist selbst ein weibliches Nomen: одна́ ты́сяча, две ты́сячи, пять ты́сяч.\nDanach steht der Genitiv Plural: ты́сяча рубле́й.")
regel("zahl_5", rf"(?:{ZAHLEN})?(?<zahl>{ZAHL5})\s+(?<np>{ADJP}{NOMEN})", "Zahl + Nomen: Genitiv Plural",
      "Nach 5 bis 20 (also auch nach 11, 12, 13, 14) und nach runden Zehnern und Hundertern steht der Genitiv Plural: пять уро́ков, двена́дцать мину́т, три́ста гра́ммов.\n"
      "Bei größeren Zahlen entscheidet das letzte Zahlwort: два́дцать оди́н биле́т, два́дцать два биле́та, два́дцать пять биле́тов.\n"
      "Hier ist das letzte Zahlwort {zahl} – darum Genitiv Plural.")

regel("net_gen", rf"(?<np>{ADJP}{W})\s+нет(?=\s*[.!?,]|$)", "Verneinung: Genitiv",
      "„… ist nicht da“: Das Fehlende steht nach нет im Genitiv: Ва́шего рюкзака́ нет = Ihr Rucksack ist nicht da.\nHier: {L}")
regel("net_gen2", rf"нет\s+(?<np>{ADJP}{W})", "нет + Genitiv",
      "„Es gibt kein … / ich habe kein …“: Nach нет steht das Fehlende im Genitiv: нет ка́рты, нет вре́мени.\nHier: {L}")

# ------------------------------------------------------------------ Possessiv und Fragewörter
for ids, formen, de in (
        ("m", ("мой", "твой", "наш", "ваш"), "männlich: мой чемода́н"),
        ("f", ("моя", "твоя", "наша", "ваша"), "weiblich: моя́ су́мка"),
        ("n", ("моё", "твоё", "наше", "ваше"), "sächlich: моё ме́сто"),
        ("pl", ("мои", "твои", "наши", "ваши"), "Plural: мои́ ве́щи"),
        ("gen", ("моего", "твоего", "нашего", "вашего"), "Genitiv männlich/sächlich: ва́шего рюкзака́"),
        ("akk_f", ("мою", "твою", "нашу", "вашу"), "Akkusativ weiblich: мою́ су́мку")):
    regel(f"poss_{ids}", rf"{wahl(*formen)}(?:\s+(?<np>{ADJP}{W}))?", "Possessivpronomen",
          f"Das Possessivpronomen richtet sich nach dem Besitz, nicht nach dem Besitzer – hier {de}.\n"
          "Formen: мой (m), моя́ (f), моё (n), мои́ (Pl); genauso твой, наш, ваш.")
regel("gde", r"где", "Где? – wo?",
      "Frage nach dem Ort. Die Antwort steht mit в/на + Präpositiv: в Москве́, на столе́.\nWohin? heißt куда́, woher? отку́да.")
regel("kuda", r"куда", "Куда́? – wohin?",
      "Frage nach dem Ziel. Die Antwort steht mit в/на + Akkusativ: в Москву́, на по́лку.\nWo? heißt где, woher? отку́да.")
regel("otkuda", r"откуда", "Отку́да? – woher?",
      "Frage nach der Herkunft. Die Antwort steht mit из/с + Genitiv: из Берли́на, с рабо́ты.")
regel("kogda", r"когда", "Когда́? – wann?",
      "Antworten: в + Uhrzeit (в пять часо́в), в + Wochentag (в сре́ду), за́втра, сего́дня.")
regel("skolko", r"сколько", "Ско́лько? – wie viel(e)?",
      "Das Gezählte steht im Genitiv: Plural bei Zählbarem (ско́лько уро́ков?), Singular bei Stoffen (ско́лько воды́?).\nDas Verb steht dabei im Neutrum: ско́лько оста́лось?")
regel("kakoy", wahl("какой", "какая", "какое", "какие", "какого", "каком", "какую", "какой"), "Како́й? – welcher?",
      "како́й wird wie ein Adjektiv gebeugt und richtet sich nach dem Nomen: како́й по́езд, кака́я су́мка, како́е число́, каки́е ве́щи.\n"
      "Mit Präposition im passenden Fall: с како́го пути́ (Genitiv), в како́м кла́ссе (Präpositiv), в каку́ю сто́рону (Akkusativ).")
regel("kotoryj", wahl("который", "которая", "которое", "которые", "которого", "котором", "которую"), "кото́рый – der/die/das",
      "Relativpronomen (der, welcher): Geschlecht und Zahl wie das Wort, auf das es sich bezieht – по́езд, кото́рый …; су́мка, кото́рая …")

# ------------------------------------------------------------------ Verben
regel("stoit_kosten", r"сто́ит|сто́ят", "сто́ить = kosten",
      "сто́ит (eins kostet), сто́ят (mehrere kosten). Betonung auf der ersten Silbe!\nстои́т (zweite Silbe) heißt dagegen „steht“.", betont=True)
regel("lage", r"стои́т|стоя́т|лежи́т|лежа́т|виси́т|вися́т|сиди́т|сидя́т", "Wie befindet es sich?",
      "Russisch sagt genau, wie etwas da ist: стоя́ть (stehen, aufrecht), лежа́ть (liegen), висе́ть (hängen), сиде́ть (sitzen).\n"
      "Danach der Ort mit в/на + Präpositiv: Ча́шка стои́т на столе́. Карти́на виси́т на стене́.\n"
      "Formen: стои́т / стоя́т, лежи́т / лежа́т, виси́т / вися́т (eins / mehrere).\nVorsicht: сто́ит (erste Silbe) heißt „kostet“.", betont=True)
regel("otpravlyaetsya", wahl("отправляется", "отправляются", "отправится"), "отправля́ться = abfahren",
      "Reflexives Verb: -ся (nach Konsonant) bzw. -сь (nach Vokal) entspricht oft einem deutschen Verb ohne „sich“.\n"
      "по́езд отправля́ется = der Zug fährt ab; Gegenstück: прибыва́ет (kommt an).")
regel("pribyvaet", wahl("прибывает", "прибывают", "прибывает"), "прибыва́ть = ankommen",
      "Bahnsprache für „ankommen“: по́езд прибыва́ет на второ́й путь. Im Alltag: приходи́ть / приезжа́ть.")
regel("opazdyvaet", wahl("опаздывает", "опаздывают", "опаздываю"), "опа́здывать = sich verspäten",
      "Die Verspätung steht mit на + Akkusativ: опа́здывает на два́дцать мину́т = hat 20 Minuten Verspätung.")
regel("budu_inf", rf"{wahl('буду', 'будешь', 'будет', 'будем', 'будете', 'будут')}\s+{wahl('ходить', 'ездить')}",
      "бу́ду ходи́ть / е́здить – regelmäßig (Zukunft)",
      "Unvollendete Zukunft = бу́ду, бу́дешь, бу́дет … + Infinitiv. Mit ходи́ть (zu Fuß) / е́здить (fahren) heißt das: "
      "regelmäßig, immer wieder gehen/fahren – ка́ждый день, по суббо́там.\nFür ein einziges Mal steht пойду́ / пое́ду.")
regel("po_fut", wahl("пойду", "пойдёшь", "пойдёт", "пойдём", "пойдёте", "пойдут", "поеду", "поедешь", "поедет", "поедем", "поедете", "поедут"),
      "пойти́ / пое́хать – einmal hin (Zukunft)",
      "по- macht идти́ / е́хать vollendet: Es geht um ein Mal, um den Aufbruch. Deshalb bedeuten die Gegenwartsformen Zukunft: "
      "я пойду́ = ich werde (hin)gehen, мы пое́дем = wir werden fahren.\n"
      "Formen: пойду́, пойдёшь, пойдёт, пойдём, пойдёте, пойду́т / пое́ду, пое́дешь, пое́дет …\nRegelmäßig in der Zukunft: бу́ду ходи́ть / е́здить.")
regel("po_praet", wahl("пошёл", "пошла", "пошли", "поехал", "поехала", "поехали"),
      "пошёл / пое́хал – ist losgegangen / losgefahren",
      "Vollendet: Der Aufbruch ist passiert, die Person ist (noch) dort und nicht zurück. Её нет до́ма, она́ пошла́ в шко́лу = sie ist in die Schule gegangen.\n"
      "Vergleiche ходи́л / е́здил = war dort und ist wieder zurück.\nFormen: пошёл, пошла́, пошли́ / пое́хал, пое́хала, пое́хали.")
regel("shel", wahl("шёл", "шла", "шли", "ехал", "ехала", "ехали"),
      "шёл / е́хал – war gerade unterwegs",
      "Vergangenheit von идти́ / е́хать: eine Richtung, mitten auf dem Weg. Typisch mit когда́: Когда́ я шёл домо́й, … = als ich gerade nach Hause ging, …\n"
      "Formen: шёл, шла, шли (unregelmäßig!) / е́хал, е́хала, е́хали.")
regel("hodil", wahl("ходил", "ходила", "ходили", "ездил", "ездила", "ездили"),
      "ходи́л / е́здил – war dort (hin und zurück)",
      "Vergangenheit von ходи́ть / е́здить: einmal hin und wieder zurück – die Person ist jetzt wieder da. "
      "Вчера́ я ходи́л в кино́ = gestern war ich im Kino. Darum die Antwort auf „Где ты был?“.\n"
      "Auch: früher regelmäßig – Ра́ньше она́ е́здила на рабо́ту на авто́бусе.")
regel("idti", wahl("иду", "идёшь", "идёт", "идём", "идёте", "идут", "идти"), "идти́ – gehen (in eine Richtung)",
      "идти́ = gehen, zu Fuß und gerade unterwegs in eine Richtung: я иду́, ты идёшь, он идёт, они́ иду́т.\n"
      "Bei Zügen, Bussen und dem Unterricht sagt man auch идёт: по́езд идёт в Москву́, уро́к идёт.")
regel("ekhat", wahl("еду", "едешь", "едет", "едем", "едете", "едут", "ехать"), "е́хать – fahren (in eine Richtung)",
      "е́хать = fahren, gerade unterwegs in eine Richtung: я е́ду, ты е́дешь, он е́дет, они́ е́дут. Wohin? → в/на + Akkusativ.\n"
      "Regelmäßig oder hin und zurück: е́здить.")
regel("hodit", wahl("хожу", "ходишь", "ходит", "ходим", "ходите", "ходят", "ходить", "езжу", "ездишь", "ездит", "ездим", "ездите", "ездят", "ездить"),
      "ходи́ть / е́здить – regelmäßig, hin und her",
      "ходи́ть (zu Fuß) und е́здить (fahren) beschreiben Bewegung, die sich wiederholt oder keine feste Richtung hat:\n"
      "regelmäßig – Я хожу́ в шко́лу ка́ждый день; hin und her – Кот хо́дит по цепи́ = der Kater geht auf der Kette (hin und her); ходи́ть по па́рку.\n"
      "Formen: хожу́, хо́дишь, хо́дит … / е́зжу, е́здишь, е́здит … Gerade jetzt in eine Richtung: идти́ / е́хать.")
regel("priletet", wahl("прилетел", "прилетела", "прилетели", "прилетели", "приехал", "приехала", "приехали", "приедем", "прилетим"),
      "Ankommen (vollendet)",
      "при- bedeutet „an-, herbei-“: прилете́ть = (mit dem Flugzeug) ankommen, прие́хать = (mit dem Zug/Auto) ankommen.\n"
      "Vergangenheit nach dem Subjekt: он прилете́л, она́ прилете́ла, вы/они́ прилете́ли.\nHier: {L}")
regel("perfekt_vergangen", rf"(?<np>{wahl('пришёл', 'пришла', 'пришло', 'пришли', 'потерял', 'потеряла', 'потеряли', 'нашёл', 'нашла', 'нашли', 'забыл', 'забыла', 'купил', 'купила', 'посадил', 'выросла', 'вырос', 'позвал', 'позвала', 'позвали', 'съели', 'съел', 'съела', 'дала', 'дал', 'отдал', 'отдала', 'взял', 'взяла', 'заказал', 'заказала', 'положил', 'положила', 'сказал', 'сказала', 'увидел', 'увидела', 'поймал', 'поймала', 'тянет-потянет', 'вытянули', 'вытащили', 'прошла', 'прошёл', 'прошло', 'прошли')})",
      "Vergangenheit",
      "Die Vergangenheit richtet sich nach dem Subjekt: männlich -л, weiblich -ла, sächlich -ло, Plural -ли (он пришёл, она́ пришла́, оно́ пришло́, они́ пришли́).\n"
      "Bei „ich“ und „du“ zählt das eigene Geschlecht: я потеря́л (Mann), я потеря́ла (Frau).\nHier: {L}")
regel("bylo", wahl("было", "был", "была", "были"), "Vergangenheit von быть",
      "быть (sein): был (m), была́ (f), бы́ло (n), бы́ли (Pl). Im Präsens fällt „sein“ meist weg.\n"
      "Mit у: у меня́ бы́ло … = ich hatte … Bei Mengenangaben steht meist бы́ло.")
regel("budete", wahl("будете", "будешь", "буду", "будет", "будем", "будут"), "Zukunft von быть",
      "бу́ду, бу́дешь, бу́дет … = werde, wirst, wird. Beim Anbieten höflich: Чай бу́дете? = Möchten Sie Tee? (wörtlich „Werden Sie Tee (haben)?“)")
regel("hotet", wahl("хочу", "хочешь", "хочет", "хотим", "хотите", "хотят", "хотел бы", "хотела бы", "хотел", "хотела"),
      "хоте́ть = wollen (unregelmäßig)",
      "я хочу́, ты хо́чешь, он хо́чет, мы хоти́м, вы хоти́те, они́ хотя́т.\nHöflicher mit бы: я хоте́л бы (Mann) / хоте́ла бы (Frau) = ich hätte gern.")
regel("ostalos", wahl("осталось", "остался", "осталась", "остались"), "оста́ться = übrig bleiben",
      "Bei ско́лько und Mengenangaben steht das Verb im Neutrum Singular: ско́лько оста́лось? – оста́лось пять.")
regel("imperativ", wahl("дайте", "дай", "покажите", "покажи", "положите", "положи", "купите", "купи", "нарежьте", "нарежь",
                        "откройте", "открой", "проходите", "проходи", "повторите", "повтори", "возьмите", "возьми",
                        "подождите", "подожди", "садитесь", "садись", "пишите", "пиши", "читайте", "читай", "прочитай",
                        "прочитайте", "слушайте", "слушай", "посмотрите", "посмотри", "идите", "иди", "входите",
                        "предъявите", "поставьте", "поставь", "налейте", "налей", "принесите", "принеси", "взвесьте",
                        "приходите", "заходите", "проверьте", "откройте", "покажите", "встаньте", "встань", "сядьте", "сядь"),
      "Befehlsform (Imperativ)",
      "Mit -те: höflich (Sie) oder an mehrere – Да́йте, Покажи́те, Откро́йте.\nOhne -те: an eine Person, die man duzt – Дай, Покажи́, Откро́й.\nMit пожа́луйста wird daraus eine freundliche Bitte.")
regel("refl", r"[\p{L}]{3,}(?:ся|сь)(?<!(?:вся|ось|гусь|лось|рысь|высь|подпись|здесь|весь|смесь|взвесь))", "Reflexives Verb (-ся/-сь)",
      "-ся (nach Konsonant) bzw. -сь (nach Vokal) ist das russische „sich“. Oft hat das deutsche Verb kein „sich“: учи́ться (lernen), начина́ться (anfangen), находи́ться (sich befinden).")

# ------------------------------------------------------------------ Namen, Adjektive, Kleinwörter
regel("otchestvo", r"[\p{L}]+(?:ович|евич|овна|евна|ична|инична)", "Vatersname (о́тчество)",
      "Der Vatersname wird aus dem Vornamen des Vaters gebildet: -ович/-евич für Söhne, -овна/-евна für Töchter.\n"
      "Пётр → Петро́вич / Петро́вна, Никола́й → Никола́евич / Никола́евна. Höflich: Vorname + Vatersname (Мари́я Ива́новна).")
regel("familienname_f", r"[А-Я][\p{L}]{2,}(?:ова|ева)", "Familienname, weiblich",
      "Frauen tragen die weibliche Form des Familiennamens: Во́лков → Во́лкова, Петро́в → Петро́ва, Кузнецо́в → Кузнецо́ва.",
      gross=True)
KEINWORT = r"(?!(?:и|или|а|но|в|во|на|с|со|по|из|до|у|к|за|о|не|это|как|что)(?![\p{L}]))"
ADJ_M_TEXT = ("Das Adjektiv richtet sich nach dem Nomen: männlich -ый/-ий (betont -о́й) – кра́сный чемода́н, си́ний рюкза́к, большо́й паке́т.\n"
              "Weiblich: -ая/-яя, sächlich: -ое/-ее, Plural: -ые/-ие.")
regel("adj_m", r"(?:(?!(?:дмитрий|василий|геннадий|евгений|григорий|аркадий|анатолий|виталий|юрий)(?![\p{L}]))[\p{L}]+(?:ый|ий)\s+)+" + KEINWORT + r"[\p{L}-]{2,}",
      "Adjektiv + Nomen (männlich)", ADJ_M_TEXT)
regel("adj_m_oj", r"(?:[\p{L}\u0301]+о\u0301й\s+)+(?!(?:и|или|а|но|в|на|с|не)(?![\p{L}\u0301]))[\p{L}\u0301-]{2,}", "Adjektiv + Nomen (männlich)", ADJ_M_TEXT, betont=True)
regel("adj_f", r"(?:[\p{L}]+(?:ая|яя)\s+)+" + KEINWORT + r"[\p{L}-]{2,}", "Adjektiv + Nomen (weiblich)",
      "Das Adjektiv richtet sich nach dem Nomen: weiblich -ая/-яя – больша́я су́мка, си́няя ку́ртка.\n"
      "Männlich: -ый/-ий/-о́й, sächlich: -ое/-ее, Plural: -ые/-ие.")
regel("adj_n", r"(?:[\p{L}]+(?:ое|ее)\s+)+" + KEINWORT + r"[\p{L}-]{2,}", "Adjektiv + Nomen (sächlich)",
      "Das Adjektiv richtet sich nach dem Nomen: sächlich -ое/-ее – большо́е окно́, голубо́е мо́ре.\n"
      "Männlich: -ый/-ий/-о́й, weiblich: -ая/-яя, Plural: -ые/-ие.")
regel("adj_pl", r"(?:[\p{L}]+(?:ые|[кгхжшчщ]ие)\s+)+" + KEINWORT + r"[\p{L}-]{2,}", "Adjektiv + Nomen (Plural)",
      "Im Plural enden Adjektive auf -ые/-ие – für alle Geschlechter gleich: почто́вые я́щики, но́вые уче́бники.")
regel("eto", r"это", "Э́то = das (ist)",
      "Э́то … = Das ist …: Im Präsens fällt „ist“ weg. э́то bleibt immer gleich, egal ob danach ein Mann, eine Frau oder ein Ding kommt.")
regel("vot", r"вот", "Вот = hier ist / da ist",
      "Zeigewort: Вот па́спорт. = Hier ist der Pass. Danach steht der Nominativ.")
regel("est", r"есть", "есть = es gibt / ist da",
      "есть ist die Präsensform von быть (sein) im Sinne von „es gibt, ist vorhanden“: Да, есть сестра́ = Ja, ich habe eine Schwester.\n"
      "Achtung: есть heißt auch „essen“ (я ем, ты ешь).")


# ------------------------------------------------------------------ weitere Muster (Aussagen, Kurzformen, Adverbien)
regel("kurzform", wahl("открыт", "открыта", "открыто", "открыты", "закрыт", "закрыта", "закрыто", "закрыты", "готов", "готова",
                       "готово", "готовы", "нужен", "нужна", "нужно", "нужны", "пуст", "пуста", "пусто", "пусты", "свободен",
                       "свободна", "свободно", "свободны", "занят", "занята", "занято", "заняты", "рад", "рада", "рады"),
      "Kurzform des Adjektivs",
      "Kurzformen stehen nur als Aussage („ist …“) und richten sich nach dem Subjekt: m ohne Endung, f -а, n -о, Pl -ы.\n"
      "ну́жен / нужна́ / ну́жно / нужны́: Чек ну́жен? Мне нужна́ ка́рта. откры́т / откры́та: Ка́сса откры́та.")
regel("instr_mittel", wahl("наличными", "картой"), "Instrumental: womit?",
      "Das Mittel steht im Instrumental, ohne Präposition: нали́чными (bar, wörtlich „mit Bargeld“), ка́ртой (mit Karte).")
regel("instr_zeit", wahl("днём", "ночью", "утром", "вечером", "летом", "зимой", "весной", "осенью"), "Instrumental: wann?",
      "Tageszeiten und Jahreszeiten stehen im Instrumental ohne Präposition: у́тром (morgens), днём (tagsüber), ве́чером, но́чью; ле́том, зимо́й, весно́й, о́сенью.")
regel("richtung", wahl("туда", "сюда", "обратно", "налево", "направо", "наверх", "вниз", "домой"), "Richtung: wohin?",
      "Richtungswörter beantworten „wohin?“: туда́ (dorthin), сюда́ (hierher), обра́тно (zurück), нале́во/напра́во (nach links/rechts), наве́рх/вниз (nach oben/unten), домо́й (nach Hause).\n"
      "Zum Vergleich „wo?“: там, здесь, сле́ва/спра́ва, наверху́/внизу́, до́ма.")
regel("dativ_inf", r"(?<wem>вам|тебе|мне)\s+[\p{L}]+(?:ть|ти|чь)(?![\p{L}])", "Dativ + Infinitiv",
      "„{wem} + Infinitiv“ fragt, ob etwas getan werden soll: Вам наре́зать? = Soll ich es Ihnen aufschneiden? – kurz und höflich, ohne „soll ich“.")
regel("nechego", r"(?:мне|тебе|вам|нам)\s+не\s+нечего|(?:мне|тебе|вам|нам)\s+нечего\s+[\p{L}]+", "не́чего + Infinitiv",
      "Мне не́чего деклари́ровать = Ich habe nichts zu verzollen (wörtlich „mir ist nichts zu deklarieren“). Die Person steht im Dativ.")
regel("nibud", r"[\p{L}]+-нибудь", "-нибудь = irgend-",
      "что́-нибудь (irgendetwas), кто́-нибудь (irgendjemand), где́-нибудь (irgendwo). Что́-нибудь ещё? = Sonst noch etwas?")
regel("pomogat", wahl("помогает", "помогают", "помогать", "помогите", "помоги"), "помога́ть + Dativ",
      "Wem hilft man? Im Russischen steht die Person im Dativ: помога́ет пассажи́рам (den Fahrgästen), помоги́те мне.")
regel("zhdat", wahl("ждёт", "ждут", "жду", "ждать", "ждём"), "ждать + Akkusativ",
      "ждать (warten auf) steht ohne Präposition: ждёт бага́ж = wartet auf das Gepäck. Bei Unbestimmtem auch Genitiv: ждать по́езда.")
regel("vollendet_futur", wahl("принесу", "принесём", "возьму", "куплю", "положу", "дам", "скажу", "позвоню", "покажу", "проверю"),
      "Vollendetes Verb = Zukunft",
      "Vollendete Verben haben kein Präsens: Ihre Präsens-Endungen bedeuten Zukunft. Сейча́с принесу́ = Ich bringe es gleich.")
regel("genitiv_attr", wahl("дата рождения", "место рождения", "цель поездки", "розыск багажа", "доска объявлений", "расписание уроков",
                           "зал ожидания", "песня вороны", "конец урока", "конце урока", "конце зала", "тумане моря",
                           "начальник поезда", "номер вагона", "номер места"),
      "Nomen + Genitiv = „… des …“",
      "Das zweite Nomen steht im Genitiv und bestimmt das erste näher: да́та рожде́ния = Datum der Geburt (Geburtsdatum), расписа́ние уро́ков = Plan der Stunden (Stundenplan).\n"
      "Im Deutschen wird daraus oft ein zusammengesetztes Wort.")
regel("dobro_pozh", r"добро\s+пожаловать", "Willkommen!",
      "Feste Begrüßungsformel. Wohin? → в/на + Akkusativ: Добро́ пожа́ловать в Москву́!")
regel("spasibo_bolshoe", r"спасибо\s+большое|большое\s+спасибо", "Vielen Dank!",
      "спаси́бо ist sächlich, darum большо́е (nicht большо́й): Спаси́бо большо́е! = Vielen Dank!")
regel("privet_poka", wahl("привет", "пока"), "Hallo / Tschüss (du)",
      "Приве́т (Hallo) und Пока́ (Tschüss) sagt man nur zu Freunden, Kindern, Familie. Höflich: Здра́вствуйте / До свида́ния.")
regel("ne_verb", r"не\s+(?:курю|курит|надо|знаю|понимаю|пришёл|пришла|пришли|работает|могу)", "не = nicht",
      "не steht direkt vor dem Wort, das verneint wird – meist vor dem Verb: Я не курю́ = Ich rauche nicht. Мой чемода́н не пришёл.")
regel("imperativ2", wahl("нажми", "нажмите", "не волнуйтесь", "проходите"), "Befehlsform (Imperativ)",
      "Mit -те: höflich (Sie) oder an mehrere; ohne -те: an eine Person, die man duzt. Не волну́йтесь = Machen Sie sich keine Sorgen.")

regel("praedikativ", r"(?<np>" + KEINWORT + r"[\p{L}-]{2,})\s+(?!(?:дмитрий|василий|геннадий|евгений|григорий|аркадий|анатолий|виталий|юрий)(?![\p{L}]))(?<adj>[\p{L}]+(?:ый|ий|ой|ая|яя|ое|ее|ые|ие))(?=\s*[.!?]|$)", "Adjektiv als Aussage",
      "Nomen + Adjektiv ohne „ist“: Стол кру́глый = Der Tisch ist rund. Im Präsens fällt „sein“ weg.\n"
      "Das Adjektiv richtet sich trotzdem nach dem Nomen: стол кру́глый (m), ка́сса откры́та (f), окно́ большо́е (n), бана́ны жёлтые (Pl).\n"
      "In Gedichten steht das Adjektiv auch einfach hinter dem Nomen: кот учёный = der gelehrte Kater.")

# ------------------------------------------------------------------ Grundformen  (Grundform: Formen, durch | getrennt)
LEXIKON = """
Москва́: москве|москву|москвы
Каза́нь: казани
Яросла́вль: ярославле|ярославля
Ни́жний Но́вгород: нижнем новгороде|нижнего новгорода
Екатеринбу́рг: екатеринбурге|екатеринбурга
Владивосто́к: владивостоке|владивостока
Санкт-Петербу́рг: санкт-петербурге|санкт-петербурга
Берли́н: берлине|берлина
Мю́нхен: мюнхене|мюнхена
Фра́нкфурт: франкфурте|франкфурта
Цю́рих: цюрихе|цюриха
Ве́на: вене|вены
Га́мбург: гамбурге|гамбурга
гости́ница: гостинице|гостиницу
корзи́на: корзине
лес: лесу
сад: саду
зи́мний сад: зимнем саду
шкаф: шкафу
аэропо́рт: аэропорту
пол: полу
край: краю
рот: рту
класс: классе|класса
поря́док: порядке
страна́: стране
стака́н: стакане|стакана
гара́ж: гараже|гаража|гаражом
тетра́дь: тетради
коне́ц: конце
зал: зале
роди́тели: родителях|родителей
стихотворе́ние: стихотворении
подва́л: подвале
журна́л: журнале
по́езд: поезде
спортза́л: спортзале
четве́рг: четверге
ку́хня: кухне
са́уна: сауне
коро́бка: коробке
око́шко: окошке
ва́за: вазе
я́щик: ящике
кабине́т: кабинете
холоди́льник: холодильнике
тума́н: тумане
стена́: стене
стол: столе|стола|столом
па́рта: парте|партой|парту
сто́йка: стойке|стойкой
по́лка: полке|полку
страни́ца: странице
платфо́рма: платформе|платформы
прила́вок: прилавке|прилавком
дуб: дубе
черда́к: чердаке
ка́сса: кассе|кассой|кассы
ка́рта: карте|карты
путь: пути
эта́ж: этаже|этажа
теле́жка: тележке
вокза́л: вокзале
са́хар: сахаром|сахара
ветчина́: ветчиной
молоко́: молоком|молока
лимо́н: лимоном|лимона
газ: газом|газа
друг: другом|друга|другу
сестра́: сестрой|сестры|сестре
брат: братом|брата|брату
сын: сыном|сына
я́блоко: яблоками
ба́бушка: бабушкой|бабушки
рюкза́к: рюкзаком|рюкзака
ма́ма: мамой|мамы|маме
чемода́н: чемоданом|чемодана
варе́нье: вареньем
дом: домом
доска́: доски
Ди́ма: димы
Ма́ша: маши
лукомо́рье: лукоморья
дверь: двери
пассажи́рка: пассажирки
ле́нта: ленты|ленте
бага́жная ле́нта: багажной ленты
ваго́н: вагона
земля́: земли
ре́пка: репку
де́дка: дедку
окно́: окном
тамо́жня: таможней
поку́пка: покупку
ко́шка: кошку
Жу́чка: жучку
вну́чка: внучку
ба́бка: бабку
расписа́ние: расписанию
счёт: счету
цепь: цепи
ле́стница: лестнице
потоло́к: потолком
кры́ша: крышей
сторона́: сторону
одна́ сторона́: одну сторону
среда́: среду
пя́тница: пятницу
суббо́та: субботу
двор: дворе
ва́нная: ванной
спа́льня: спальне
гости́ная: гостиной
прихо́жая: прихожей
де́тская: детской
столо́вая: столовой
мастерска́я: мастерской
вы: вас|вам|вами
я: меня|мне|мной
ты: тебя|тебе|тобой
мы: нас|нам|нами
рабо́та: работы|работу
уро́к: урока
вода́: воды
сыр: сыра
хлеб: хлеба
сок: сока
чай: чая
колбаса́: колбасы
ветчина́: ветчины
ры́ба: рыбы
мя́со: мяса
ко́фе: кофе
вре́мя: времени
ваш рюкза́к: вашего рюкзака
прийти́: пришёл|пришла|пришло|пришли
потеря́ть: потерял|потеряла|потеряли
найти́: нашёл|нашла|нашли
забы́ть: забыл|забыла
купи́ть: купил|купила
посади́ть: посадил
вы́расти: выросла|вырос
позва́ть: позвал|позвала|позвали
съесть: съели|съел|съела
дать: дала|дал
отда́ть: отдал|отдала
взять: взял|взяла
заказа́ть: заказал|заказала
положи́ть: положил|положила
сказа́ть: сказал|сказала
уви́деть: увидел|увидела
пойма́ть: поймал|поймала
вы́тянуть: вытянули
вы́тащить: вытащили
прилете́ть: прилетел|прилетела|прилетели|прилетим
прие́хать: приехал|приехала|приехали|приедем
пройти́: прошла|прошёл|прошло|прошли
сда́ча: сдачи|сдачу
"""

ORDINALE = [  # (Nominativ m, Genitiv m, Präpositiv m)
    ("пе́рвый", "первого", "первом"), ("второ́й", "второго", "втором"), ("тре́тий", "третьего", "третьем"),
    ("четвёртый", "четвертого", "четвертом"), ("пя́тый", "пятого", "пятом"), ("шесто́й", "шестого", "шестом"),
    ("седьмо́й", "седьмого", "седьмом"), ("восьмо́й", "восьмого", "восьмом"), ("девя́тый", "девятого", "девятом"),
    ("деся́тый", "десятого", "десятом"), ("како́й", "какого", "каком"),
]
NOMEN_ORD = [("класс", "класса", "классе"), ("эта́ж", "этажа", "этаже"), ("путь", "пути", "пути")]


def lemmata():
    lex = {}
    for zeile in LEXIKON.strip().splitlines():
        grund, formen = zeile.split(":", 1)
        for f in formen.split("|"):
            lex[flach(f.strip()).lower()] = grund.strip()
    for nom, gen, prae in ORDINALE:
        for n_nom, n_gen, n_prae in NOMEN_ORD:
            lex[f"{gen} {flach(n_gen)}"] = f"{nom} {n_nom}"
            lex[f"{prae} {flach(n_prae)}"] = f"{nom} {n_nom}"
    return lex


if __name__ == "__main__":
    daten = {"hinweis": "Erzeugt von werkzeuge/grammatik_regeln.py – Änderungen dort.", "regeln": regeln, "lemmata": lemmata()}
    ZIEL.write_text(json.dumps(daten, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"ok {len(regeln)} Regeln, {len(daten['lemmata'])} Grundformen -> {ZIEL.name}")
