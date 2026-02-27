# Russisch Vokabeltrainer -- Gebrauchsanweisung

## Willkommen

Der **Russisch Vokabeltrainer** ist eine vielseitige Lern-App direkt im Browser. Sie brauchen nichts zu installieren -- einfach die Datei `index.html` im Browser öffnen und loslegen.

Die App bietet zwei Hauptfunktionen:

- **Karteikarten** -- Vokabeln lernen mit virtuellen Lernkarten, die man umdrehen kann
- **Texte vorlesen** -- Russische Texte werden Satz für Satz laut vorgelesen

Beide Funktionen nutzen die Sprachausgabe Ihres Browsers, um Ihnen die korrekte russische Aussprache vorzusprechen. So trainieren Sie gleichzeitig Lesen, Verstehen und Hören.

---

## 1. So starten Sie die App

1. Öffnen Sie die Datei `index.html` in einem modernen Browser (Chrome, Edge oder Firefox).
2. Auf dem Startbildschirm sehen Sie zwei große Schaltflächen:
   - **Karteikarten** (das Kartensymbol)
   - **Texte vorlesen** (das Buchsymbol)
3. Oben rechts können Sie die **Sprache der Benutzeroberfläche** umschalten: **DE** (Deutsch), **EN** (Englisch) oder **RU** (Russisch).

---

## 2. Karteikarten -- Vokabeln lernen

### 2.1 Datei laden

Klicken Sie auf **Karteikarten** und laden Sie eine Textdatei mit Ihren Vokabeln. Sie können die Datei entweder per **Drag & Drop** in den Bereich ziehen oder durch **Klick** die Datei auswählen. Die App merkt sich den zuletzt verwendeten Ordner, sodass der Dateidialog beim nächsten Mal dort wieder öffnet (Chrome/Edge).

Die App erkennt automatisch, welches Format Ihre Datei hat (siehe Abschnitt 3).

### 2.2 Einstellungen vor dem Start

Nach dem Laden erscheint ein Einstellungsbildschirm:

- **Lernmodus** -- Wählen Sie zwischen drei Modi (siehe Abschnitt 4):
  - *Frei* -- Blättern Sie selbst durch die Karten
  - *SM-2* -- Klassisches Wiederholungssystem (wie SuperMemo)
  - *FSRS* -- Modernes, optimiertes Wiederholungssystem
- **Stimme** -- Wählen Sie eine männliche oder weibliche Stimme
- **Tempo** -- Passen Sie die Sprechgeschwindigkeit an (langsamer = einfacher zum Mithören)
- **Auto-Vorlesen** -- Die Vorderseite wird automatisch vorgelesen
- **Rückseite vorlesen** -- Auch die deutsche Übersetzung wird vorgelesen

Klicken Sie auf **Karteikarten starten**, um zu beginnen.

### 2.3 Während des Lernens

- **Karte umdrehen**: Klicken Sie auf die Karte oder drücken Sie die **Leertaste**
- **Nächste/Vorherige Karte**: Benutzen Sie die Pfeil-Buttons oder die Pfeiltasten
- **Vorlesen**: Klicken Sie auf den Lautsprecher-Button, um die aktuelle Karte vorlesen zu lassen
- **Bild hinzufügen**: Klicken Sie auf den 📷-Button, um ein Bild von Ihrem Gerät zur aktuellen Karte hinzuzufügen. Das Bild erscheint auf der Vorderseite.
- **Bild löschen**: Fahren Sie mit der Maus über ein Bild auf der Karte — es erscheint ein kleiner ✕-Button, mit dem Sie das Bild wieder entfernen können.
- Im **Spaced-Repetition-Modus** (SM-2 oder FSRS): Bewerten Sie nach dem Umdrehen, wie gut Sie die Karte wussten:
  - **Nochmal** (Taste 1) -- Wusste ich nicht
  - **Schwer** (Taste 2) -- Gerade so gewusst
  - **Gut** (Taste 3) -- Gewusst, aber musste nachdenken
  - **Leicht** (Taste 4) -- Sofort gewusst

### 2.4 Die Kartenliste

Unterhalb der Karteikarte sehen Sie eine scrollbare Liste aller geladenen Karten. Klicken Sie auf eine Karte, um direkt dorthin zu springen. Der Lautsprecher-Button neben jeder Karte liest diese einzeln vor. Karten mit Bildern werden durch ein 🖼-Symbol in der Liste gekennzeichnet.

---

## 3. Das flexible Eingabeformat -- So erstellen Sie Vokabellisten

### Überblick

Die App versteht **drei Eingabeformate** und erkennt automatisch, welches Sie verwenden. Sie können die Vokabellisten mit jedem einfachen Texteditor (Notepad, TextEdit usw.) erstellen und als `.txt`-Datei speichern.

### Format 1: Komma-getrennt (einfachstes Format)

Das einfachste Format: Russisch und Deutsch durch ein **Komma** getrennt, eine Karte pro Zeile.

```
дом, Haus
школа, Schule
книга, Buch
кошка, Katze
собака, Hund
```

**Vorderseite** = Russisch (links vom Komma)
**Rückseite** = Deutsch (rechts vom Komma)

### Format 2: Tab-getrennt (Quizlet-kompatibel)

Wenn Sie Vokabellisten von **Quizlet** exportieren, werden Vorder- und Rückseite durch einen Tabulator getrennt. Die App erkennt das automatisch.

```
дом	Haus
школа	Schule
книга	Buch
```

(Zwischen dem russischen und deutschen Wort steht ein Tabulator-Zeichen, also die Tab-Taste.)

### Format 3: Erweitertes Format mit Zusatzinformationen

Dieses Format erlaubt es, Ihren Karten **viel mehr Informationen** mitzugeben:

#### Grammatikhinweise

Setzen Sie Grammatikregeln in **runde Klammern** am Anfang der Zeile:

```
(в + Akkusativ - Richtung: wohin?)Я иду в школу., Ich gehe in die Schule.
```

Der Grammatikhinweis `в + Akkusativ - Richtung: wohin?` wird als goldene Überschrift auf der Karte angezeigt.

#### Mehrzeilige Karten mit Beispielsätzen

Verwenden Sie `\n` im Text, um **Zeilenumbrüche** auf der Karte zu erzeugen:

```
(в + Akkusativ - Richtung: wohin?)\n"Я иду в школу.", Ich gehe in die Schule.
```

So erscheint der Grammatikhinweis oben und darunter der Beispielsatz -- perfekt für Grammatikkarten, die einen Beispielsatz zur Erläuterung der Regel zeigen.

#### Sprachausgabe steuern

Setzen Sie Text in **Anführungszeichen**, um festzulegen, was genau vorgelesen werden soll:

```
1:00, "один час"
```

Hier wird die Uhrzeit `1:00` auf der Vorderseite angezeigt, aber die Sprachausgabe liest `один час` vor (nicht "eins null null").

#### Bilder auf Karten

Fügen Sie **Bilder** hinzu mit dem Tag `(img:Pfad)`:

```
(img:bilder/dom.svg)дом, Haus
```

Das Bild wird auf der Vorderseite der Karte über dem russischen Wort angezeigt. Das ist besonders hilfreich, um Vokabeln visuell zu verankern und das Lernen anschaulicher zu machen.

Die App unterstützt alle gängigen Bildformate: SVG, PNG, JPG usw.

### Texte zum Vorlesen

Für den Modus **Texte vorlesen** verwenden Sie einfache Fließtexte. Absätze werden durch **Leerzeilen** getrennt:

```
Здравствуйте. Вот, пожалуйста, ваше меню.

Я буду минеральную воду без газа.

Мне, пожалуйста, чёрный чай с лимоном.
```

---

## 4. Lernmodi -- So funktioniert Spaced Repetition

### Was ist Spaced Repetition?

Spaced Repetition ist eine wissenschaftlich erprobte Lernmethode: Karten, die Sie gut kennen, werden seltener wiederholt. Karten, die Ihnen schwerfallen, werden häufiger gezeigt. So nutzen Sie Ihre Lernzeit optimal.

### Die drei Modi im Überblick

| Modus | Beschreibung | Empfohlen für |
|-------|-------------|---------------|
| **Frei** | Sie blättern selbst durch alle Karten, vorwärts und rückwärts | Erstes Kennenlernen neuer Vokabeln |
| **SM-2** | Klassisches System, bewährt seit den 1980er-Jahren | Systematisches Langzeitlernen |
| **FSRS** | Moderner Algorithmus, lernt aus Ihrem Verhalten | Optimales Langzeitlernen |

### So funktioniert SM-2 / FSRS im Detail

1. Die App zeigt Ihnen zuerst **fällige Karten** (Wiederholungen) und dann **neue Karten** (max. 20 pro Sitzung, einstellbar).
2. Schauen Sie sich die Vorderseite an und versuchen Sie, die Antwort zu erinnern.
3. Drehen Sie die Karte um (Klick oder Leertaste).
4. Bewerten Sie sich ehrlich:
   - **Nochmal** -- Zeigt die Karte bald wieder
   - **Schwer** -- Kurzes Wiederholungsintervall
   - **Gut** -- Normales Intervall (empfohlen bei richtiger Antwort)
   - **Leicht** -- Langes Intervall (nur bei müheloser Antwort)
5. Die App berechnet automatisch, wann Sie jede Karte wieder sehen sollten.

### Statistik und Fortschritt

Klicken Sie auf **Statistik**, um Ihren Lernfortschritt zu sehen:
- Wie viele Karten Sie insgesamt gelernt haben
- Wie viele Wiederholungen Sie durchgeführt haben
- Ihren täglichen Lernverlauf

Der Fortschritt wird automatisch im Browser gespeichert. Wenn Sie dieselbe Datei erneut laden, setzt die App genau dort fort, wo Sie aufgehört haben.

---

## 5. Texte vorlesen -- Hörverstehen trainieren

### So funktioniert es

1. Klicken Sie auf **Texte vorlesen** auf dem Startbildschirm.
2. Laden Sie eine Textdatei (Fließtext auf Russisch).
3. Der Text wird in einem hübschen Lesefenster angezeigt.
4. Wählen Sie den Lesemodus:
   - **Alles** -- Der gesamte Text wird Satz für Satz vorgelesen. Der aktuelle Satz wird goldfarben hervorgehoben, und das gerade gesprochene **Wort wird einzeln markiert** (goldener Hintergrund), sodass Sie Wort für Wort mitlesen können. Bereits gelesene Sätze und Wörter werden leicht ausgegraut.
   - **Satzweise** -- Jeder Satz wird einzeln vorgelesen; klicken Sie auf einen Satz, um ihn zu hören. Auch hier wird das aktuelle Wort markiert. Über die Navigationsleiste (**⏮ Voriger Satz** / **⏭ Nächster Satz**) können Sie zwischen Sätzen wechseln.
5. Der Text **scrollt automatisch** mit, damit das aktuelle Wort immer im sichtbaren Bereich bleibt.

### Mehrere Texte in einer Datei

Wenn Ihre Datei mehrere Absätze oder Dialogteile enthält, werden diese als separate Texte angezeigt. Sie können in der Liste unterhalb des Lesefensters zwischen den Texten wechseln.

---

## 6. Die Vokabel-Datenbank -- Ihr wachsender Wortschatz

### Automatisches Sammeln

Jedes Mal, wenn Sie eine Vokabeldatei laden, werden die Karten automatisch in einer **Datenbank** im Browser gespeichert. Die Datenbank wächst mit jeder neuen Datei, die Sie laden -- ohne Duplikate.

### Export für Excel

Klicken Sie im Einstellungsbildschirm auf **Export (Excel)**, um Ihre gesamte Vokabelsammlung als TSV-Datei herunterzuladen (Tab-getrennte Werte). Diese Datei können Sie direkt in Excel oder Google Sheets öffnen.

Die Exportdatei enthält folgende Spalten:
- Russisch
- Deutsch
- Thema
- Kategorie
- Grammatik
- Quelle (der Dateiname, aus dem die Vokabel stammt)

So haben Sie immer eine vollständige Übersicht über alles, was Sie je gelernt haben.

---

## 7. Tastenkürzel

| Taste | Funktion |
|-------|----------|
| **Leertaste** | Karte umdrehen |
| **Pfeiltaste rechts** | Nächste Karte |
| **Pfeiltaste links** | Vorherige Karte |
| **1** | Bewertung: Nochmal |
| **2** | Bewertung: Schwer |
| **3** | Bewertung: Gut |
| **4** | Bewertung: Leicht |

---

## 8. KI und LLMs zur Erstellung von Vokabellisten nutzen

Eine der größten Stärken dieser App ist ihr einfaches Textformat. Sie können **ChatGPT, Claude, Gemini** oder andere KI-Assistenten bitten, Ihnen maßgeschneiderte Vokabellisten zu erstellen -- in Sekunden, genau auf Ihr Niveau und Thema zugeschnitten.

### 8.1 Einfache Vokabellisten erstellen

**Prompt:**
```
Erstelle mir eine Vokabelliste Russisch-Deutsch zum Thema "Essen und
Trinken" für Anfänger (Niveau A1). Format: ein Eintrag pro Zeile,
russisches Wort (mit Betonungszeichen), Komma, deutsches Wort.
```

**Ergebnis (direkt nutzbar):**
```
хлеб, Brot
молоко́, Milch
мя́со, Fleisch
ры́ба, Fisch
о́вощи, Gemüse
фру́кты, Obst
вода́, Wasser
чай, Tee
ко́фе, Kaffee
сок, Saft
сыр, Käse
ма́сло, Butter
я́йца, Eier
рис, Reis
суп, Suppe
сала́т, Salat
```

### 8.2 Vokabellisten mit Grammatikhinweisen

**Prompt:**
```
Erstelle mir 10 Karteikarten zum Thema "Russische Verben der Bewegung"
mit Grammatikhinweisen. Format:

(Grammatikhinweis)\n"Russischer Beispielsatz", Deutsche Übersetzung

Jede Karte soll einen Grammatikhinweis in Klammern am Anfang haben,
dann einen Zeilenumbruch (\n), dann den russischen Satz in Anführungs-
zeichen und nach dem Komma die deutsche Übersetzung. Verwende
Betonungszeichen.
```

**Ergebnis:**
```
(идти́ - gehen, zu Fuß, einmalig)\n"Я иду́ в магази́н.", Ich gehe in den Laden.
(идти́ - gehen, zu Fuß, einmalig)\n"Она́ идёт на рабо́ту.", Sie geht zur Arbeit.
(ходи́ть - gehen, zu Fuß, regelmäßig)\n"Я хожу́ в шко́лу ка́ждый день.", Ich gehe jeden Tag in die Schule.
(е́хать - fahren, einmalig)\n"Мы е́дем в Москву́.", Wir fahren nach Moskau.
(е́здить - fahren, regelmäßig)\n"Он е́здит на рабо́ту на метро́.", Er fährt mit der Metro zur Arbeit.
(лете́ть - fliegen, einmalig)\n"Самолёт лети́т в Берли́н.", Das Flugzeug fliegt nach Berlin.
(лета́ть - fliegen, regelmäßig)\n"Она́ ча́сто лета́ет в Ита́лию.", Sie fliegt oft nach Italien.
(бежа́ть - rennen, einmalig)\n"Ребёнок бежи́т в парк.", Das Kind rennt in den Park.
(плыть - schwimmen, einmalig)\n"Ры́ба плывёт в мо́ре.", Der Fisch schwimmt im Meer.
(нести́ - tragen, zu Fuß, einmalig)\n"Он несёт су́мку.", Er trägt die Tasche.
```

### 8.3 Vokabeln zu einem bestimmten Text erstellen

**Prompt:**
```
Hier ist ein russischer Text aus meinem Lehrbuch. Erstelle daraus eine
Vokabelliste mit allen wichtigen Wörtern, die ein A1/A2-Lerner
wahrscheinlich noch nicht kennt. Format: russisches Wort mit
Betonungszeichen, Komma, deutsches Wort.

Text: "Здравствуйте. Вот, пожалуйста, ваше меню. Какие напитки
желаете? Я буду минеральную воду без газа. Мне, пожалуйста, чёрный
чай с лимоном."
```

**Ergebnis:**
```
меню́, Speisekarte
напи́тки, Getränke
жела́ть, wünschen
минера́льная вода́, Mineralwasser
без газа́, ohne Kohlensäure
чёрный чай, schwarzer Tee
лимо́н, Zitrone
```

### 8.4 Quizlet-Format (Tab-getrennt) für große Listen

**Prompt:**
```
Erstelle eine Quizlet-kompatible Vokabelliste (Tab-getrennt) mit
20 russischen Adjektiven und ihren deutschen Übersetzungen. Niveau A2.
Format: Russisch [TAB] Deutsch. Verwende Betonungszeichen.
```

**Ergebnis (Tab-getrennt):**
```
большо́й	groß
ма́ленький	klein
но́вый	neu
ста́рый	alt
молодо́й	jung
краси́вый	schön
до́брый	gut / freundlich
плохо́й	schlecht
бы́стрый	schnell
ме́дленный	langsam
горя́чий	heiß
холо́дный	kalt
до́рогой	teuer
дешёвый	billig / günstig
лёгкий	leicht
тяжёлый	schwer
высо́кий	hoch / groß
ни́зкий	niedrig / klein
дли́нный	lang
коро́ткий	kurz
```

### 8.5 Dialogkarten mit ganzen Sätzen

**Prompt:**
```
Erstelle 8 Karteikarten mit typischen Sätzen für eine Situation im
Restaurant auf Russisch (Niveau A2). Jede Karte soll einen russischen
Satz auf der Vorderseite haben und die deutsche Übersetzung auf der
Rückseite. Format: russisch, deutsch -- ein Eintrag pro Zeile.
Verwende Betonungszeichen.
```

**Ergebnis:**
```
Мо́жно меню́, пожа́луйста?, Kann ich die Speisekarte haben, bitte?
Что вы рекоменду́ете?, Was empfehlen Sie?
Я бу́ду стейк с карто́фелем., Ich nehme das Steak mit Kartoffeln.
Мне, пожа́луйста, бока́л кра́сного вина́., Ein Glas Rotwein für mich, bitte.
Мо́жно ещё хле́ба?, Kann ich noch etwas Brot haben?
Было́ о́чень вку́сно!, Es war sehr lecker!
Счёт, пожа́луйста., Die Rechnung, bitte.
Мо́жно плати́ть ка́ртой?, Kann ich mit Karte bezahlen?
```

### 8.6 Thematische Karten mit Bildbeschreibungen

**Prompt:**
```
Erstelle eine Vokabelliste zum Thema "Familie" mit Bildern.
Ich habe SVG-Bilder im Ordner bilder_familie/ mit folgenden Dateien:
mama.svg, papa.svg, syn.svg, doch.svg, babushka.svg, dedushka.svg.

Format für jede Zeile:
(img:bilder_familie/dateiname.svg)russisches Wort, deutsches Wort
```

**Ergebnis:**
```
(img:bilder_familie/mama.svg)ма́ма, die Mama
(img:bilder_familie/papa.svg)па́па, der Papa
(img:bilder_familie/syn.svg)сын, der Sohn
(img:bilder_familie/doch.svg)дочь, die Tochter
(img:bilder_familie/babushka.svg)ба́бушка, die Großmutter
(img:bilder_familie/dedushka.svg)де́душка, der Großvater
```

### 8.7 Einen Vorlesetext erstellen lassen

**Prompt:**
```
Schreibe einen kurzen russischen Dialog (ca. 10 Sätze) zum Thema
"Einkaufen im Supermarkt" für das Niveau A2. Der Dialog soll zwischen
einer Verkäuferin und einem Kunden stattfinden. Schreibe nur den
russischen Text, ohne Übersetzung, mit Absätzen zwischen den
Sprecherwechseln.
```

**Ergebnis:**
```
Продавщица: Здравствуйте! Могу я вам помочь?

Покупатель: Да, пожалуйста. Где у вас молочные продукты?

Продавщица: Молоко и сыр в третьем ряду, справа.

Покупатель: Спасибо. А свежий хлеб у вас есть?

Продавщица: Да, конечно. Хлеб вот здесь, рядом с кассой.

Покупатель: Отлично. Сколько стоит этот батон?

Продавщица: Шестьдесят рублей.

Покупатель: Хорошо, я возьму два батона и литр молока.

Продавщица: Пакет нужен?

Покупатель: Нет, спасибо, у меня есть сумка.
```

Diesen Text speichern Sie als `.txt`-Datei und laden ihn im Modus **Texte vorlesen** -- die App liest Ihnen den Dialog Satz für Satz vor, mit goldener Hervorhebung des aktuellen Satzes.

### 8.8 Tipps für bessere KI-Ergebnisse

- **Niveau angeben**: Nennen Sie immer Ihr Sprachniveau (A1, A2, B1 usw.), damit die KI passende Wörter wählt.
- **Betonungszeichen verlangen**: Schreiben Sie explizit "mit Betonungszeichen" (ударе́ние) in den Prompt -- das hilft enorm bei der Aussprache.
- **Format genau beschreiben**: Geben Sie der KI ein Beispiel, wie eine Zeile aussehen soll. Dann generiert sie konsistent das richtige Format.
- **Thema eingrenzen**: Je konkreter das Thema, desto nützlicher die Liste. Statt "Alltag" lieber "Tagesablauf eines Studenten" oder "Einkaufen auf dem Markt".
- **Direkt aus dem Lehrbuch**: Kopieren Sie einen Text aus dem Lehrbuch in den Prompt und bitten die KI, die wichtigsten Vokabeln daraus zu extrahieren.
- **Fehler prüfen**: KI-generierte Inhalte gelegentlich von einem Muttersprachler oder mit einem Wörterbuch überprüfen.

---

## 9. Tipps und Hinweise

- **Betonungszeichen**: Viele der mitgelieferten Beispieldateien verwenden Betonungszeichen (z.B. молоко́ statt молоко). Das hilft bei der Aussprache und wird korrekt angezeigt.
- **Browser-Stimmen**: Die verfügbaren russischen Stimmen hängen von Ihrem Betriebssystem und Browser ab. Chrome bietet in der Regel die beste Auswahl.
- **Daten bleiben lokal**: Alle Ihre Lerndaten und die Vokabeldatenbank werden ausschließlich in Ihrem Browser gespeichert (localStorage und IndexedDB). Es werden keine Daten an Server gesendet.
- **Zwischen Karten und Texten wechseln**: Wenn eine Datei sowohl Vokabeln als auch Text enthält, können Sie über die Modus-Wechsel-Buttons direkt zwischen Karteikarten- und Textmodus wechseln.
- **Neues Vokabelset laden**: Klicken Sie auf **Zurück zur Auswahl**, um eine neue Datei zu laden.

---

## 10. Zusammenfassung der Dateiformate

| Format | Beispiel | Wann verwenden? |
|--------|---------|-----------------|
| Komma-getrennt | `дом, Haus` | Einfache Vokabellisten |
| Tab-getrennt | `дом` ⟶ `Haus` | Quizlet-Export, große Listen |
| Mit Grammatik | `(Akk.)\nSatz, Übersetzung` | Grammatik + Beispielsätze |
| Mit Bild | `(img:bild.svg)Wort, Übersetzung` | Visuelles Lernen |
| Fließtext | Absätze mit Leerzeilen | Texte vorlesen |

---

Viel Erfolg beim Russischlernen!
