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
2. Auf dem Startbildschirm sehen Sie:
   - Zwei große Schaltflächen: **Karteikarten** (das Kartensymbol) und **Texte vorlesen** (das Buchsymbol)
   - Darunter die **Stimmeinstellungen**: Wählen Sie bereits hier Geschlecht, Stimme und Tempo für die Sprachausgabe -- diese Einstellungen gelten für beide Modi.
3. Oben rechts können Sie die **Sprache der Benutzeroberfläche** umschalten: **DE** (Deutsch), **EN** (Englisch) oder **RU** (Russisch).

---

## 2. Karteikarten -- Vokabeln lernen

### 2.1 Vokabeln laden

Klicken Sie auf **Karteikarten**. Sie haben nun zwei Möglichkeiten:

**Neue Datei laden:** Laden Sie eine Textdatei mit Ihren Vokabeln. Sie können die Datei entweder per **Drag & Drop** in den Bereich ziehen oder durch **Klick** die Datei auswählen. Die App merkt sich den zuletzt verwendeten Ordner, sodass der Dateidialog beim nächsten Mal dort wieder öffnet (Chrome/Edge). Die App erkennt automatisch, welches Format Ihre Datei hat (siehe Abschnitt 3).

**Gespeicherte Vokabeln laden:** Unterhalb des Datei-Upload-Bereichs sehen Sie die Liste Ihrer **gespeicherten Vokabeln** aus früheren Sitzungen (siehe Abschnitt 6). Sie können:
- **Alle Vokabeln** laden -- Ihre gesamte Vokabelsammlung als Karteikarten
- **Eine einzelne Lektion** laden -- klicken Sie auf den Titel (z.B. "Im Restaurant", "Antonyme"), um nur die Vokabeln dieser Lektion zu lernen

### 2.2 Einstellungen vor dem Start

Nach dem Laden erscheint ein Einstellungsbildschirm:

- **Lernmodus** -- Wählen Sie zwischen drei Modi (siehe Abschnitt 4):
  - *Frei* -- Blättern Sie selbst durch die Karten
  - *SM-2* -- Klassisches Wiederholungssystem (wie SuperMemo)
  - *FSRS* -- Modernes, optimiertes Wiederholungssystem
- **Auto-Vorlesen** -- Die Vorderseite wird automatisch vorgelesen
- **Rückseite vorlesen** -- Auch die deutsche Übersetzung wird vorgelesen

Klicken Sie auf **Karteikarten starten**, um zu beginnen.

### 2.3 Während des Lernens

- **Karte umdrehen**: Klicken Sie auf die Karte oder drücken Sie die **Leertaste**
- **Nächste/Vorherige Karte**: Benutzen Sie die Pfeil-Buttons oder die Pfeiltasten
- **Vorlesen**: Klicken Sie auf den Lautsprecher-Button, um die aktuelle Karte vorlesen zu lassen
- **Abfragerichtung umschalten**: Mit dem **⇄ Richtung**-Button wechseln Sie zwischen Russisch→Deutsch (Standard) und Deutsch→Russisch. In der umgekehrten Richtung wird die deutsche Übersetzung auf der Vorderseite gezeigt und das russische Wort erscheint erst nach dem Umdrehen. Die Spaced-Repetition-Daten werden für beide Richtungen getrennt gespeichert, sodass Sie jede Richtung unabhängig trainieren können.
- **Bild hinzufügen**: Klicken Sie auf den 📷-Button, um ein Bild von Ihrem Gerät zur aktuellen Karte hinzuzufügen. Das Bild erscheint auf der Vorderseite.
- **Bild löschen**: Fahren Sie mit der Maus über ein Bild auf der Karte — es erscheint ein kleiner ✕-Button, mit dem Sie das Bild wieder entfernen können.
- Im **Spaced-Repetition-Modus** (SM-2 oder FSRS): Bewerten Sie nach dem Umdrehen, wie gut Sie die Karte wussten:
  - **Nochmal** (Taste 1) -- Wusste ich nicht
  - **Schwer** (Taste 2) -- Gerade so gewusst
  - **Gut** (Taste 3) -- Gewusst, aber musste nachdenken
  - **Leicht** (Taste 4) -- Sofort gewusst

### 2.4 Konjugation und Deklination

Bei Verben und Nomen können auf der Karteikarte zusätzliche Grammatik-Buttons erscheinen:

- **Konjugation** (bei Verben): Klicken Sie auf den Button, um die vollständige Konjugationstabelle des Verbs zu sehen -- mit Präsens, Futur, Vergangenheit, Imperativ, Partizipien und Gerundium. Aspekt und Aspektpartner werden ebenfalls angezeigt.
- **Deklination** (bei Nomen): Klicken Sie auf den Button, um die Deklinationstabelle des Nomens zu sehen -- mit allen sechs Kasus (Nominativ, Genitiv, Dativ, Akkusativ, Instrumental, Präpositiv) im Singular und Plural. Genus (männlich/weiblich/sächlich) und Belebtheit werden angezeigt.

Die Tabellen werden im **Vokabel-Editor** (`vokabel_editor.html`) per KI erzeugt und automatisch mit den Karteikarten synchronisiert. Wenn eine konjugierte oder deklinierte Form auf der Karte steht, wird sie automatisch durch die Grundform (Infinitiv bzw. Nominativ Singular) ersetzt.

Drücken Sie **Escape** oder klicken Sie auf das ✕, um die Tabelle zu schließen.

### 2.5 Die Kartenliste

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
   - **Nochmal** (Taste 1) -- Wusste ich nicht. Die Karte erscheint bald wieder.
   - **Schwer** (Taste 2) -- Gerade so gewusst, musste lange überlegen.
   - **Gut** (Taste 3) -- Gewusst, aber musste kurz nachdenken. **Das ist die empfohlene Standardbewertung bei richtiger Antwort.**
   - **Leicht** (Taste 4) -- Sofort und mühelos gewusst, ohne jedes Zögern.
5. Die App berechnet automatisch, wann Sie jede Karte wieder sehen sollten.

### Die Bewertungs-Buttons verstehen

Unter jedem Button wird angezeigt, **in wie vielen Tagen** die Karte bei dieser Bewertung wieder erscheint. Diese Intervalle sind nicht fest -- sie verändern sich je nach Ihrer Lernhistorie mit der jeweiligen Karte.

#### Neue Karten: Kurze, eng beieinanderliegende Intervalle

Wenn Sie eine Karte **zum ersten Mal** sehen, hat das System noch keine Informationen über Ihr Wissen. Deshalb sind die Intervalle anfangs kurz und liegen nah beieinander:

| Button | Intervall bei einer neuen Karte |
|--------|-------------------------------|
| **Nochmal** | 1 Tag |
| **Schwer** | 1 Tag |
| **Gut** | 2 Tage |
| **Leicht** | 6 Tage |

Das ist **ganz normal** und kein Fehler! Bei neuen Karten macht es noch keinen großen Unterschied, ob Sie "Schwer" oder "Nochmal" drücken -- die Karte kommt in jedem Fall sehr bald wieder.

#### Gelernte Karten: Wachsende, gut unterscheidbare Intervalle

Je öfter Sie eine Karte erfolgreich wiederholen, desto mehr vergrößern und spreizen sich die Intervalle. Nach einigen Wiederholungen mit "Gut" könnte es so aussehen:

| Button | Intervall nach mehreren Wiederholungen |
|--------|---------------------------------------|
| **Nochmal** | 1 Tag |
| **Schwer** | 3 Tage |
| **Gut** | 9 Tage |
| **Leicht** | 23 Tage |

Hier sehen Sie den großen Unterschied: Eine gut gelernte Karte wird bei "Gut" erst in 9 Tagen wieder gezeigt, bei "Leicht" sogar erst in 23 Tagen. Bei "Nochmal" wird sie dagegen fast zurückgesetzt und erscheint schon morgen wieder.

#### Wie wachsen die Intervalle?

Das FSRS-System merkt sich für jede Karte, wie oft und wie gut Sie sie bewertet haben. Daraus berechnet es einen individuellen **Stabilitätswert**:

- Jedes Mal, wenn Sie eine Karte mit **"Gut"** oder **"Leicht"** bewerten, steigt die Stabilität -- das Intervall wird länger.
- Bei **"Schwer"** wächst das Intervall langsamer.
- Bei **"Nochmal"** wird die Stabilität fast zurückgesetzt -- die Karte kommt wieder wie eine fast neue Karte.

**Praktischer Tipp:** Bewerten Sie die meisten Karten mit **"Gut"** (Taste 3). Verwenden Sie "Leicht" nur bei Wörtern, die Sie wirklich im Schlaf können. "Schwer" passt, wenn Sie unsicher waren, aber noch richtig lagen. "Nochmal" drücken Sie, wenn Ihnen die Antwort nicht eingefallen ist.

#### Was bedeuten "Fällig", "Neu" und "Erledigt"?

In der Statusleiste unten sehen Sie drei Zahlen:

- **Fällig** (rot) -- Karten, die Sie schon einmal gelernt haben und die heute zur Wiederholung anstehen. Diese Karten haben Priorität.
- **Neu** (blau) -- Karten, die Sie noch nie bewertet haben. Pro Sitzung werden maximal 20 neue Karten eingeführt.
- **Erledigt** (grün/grau) -- Karten, die Sie in dieser Sitzung bereits bearbeitet haben.

Wenn **alle Karten gelernt** sind und **keine fällig** sind, zeigt die App die Meldung "Keine Karten fällig und keine neuen Karten. Komm später wieder!" Das bedeutet: Sie haben heute alles geschafft! Kommen Sie morgen (oder wann die nächsten Karten fällig werden) wieder, um weiterzulernen.

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
   - **ganzer Text** -- Der gesamte Text wird Satz für Satz vorgelesen. Der aktuelle Satz wird goldfarben hervorgehoben, und das gerade gesprochene **Wort wird einzeln markiert** (goldener Hintergrund), sodass Sie Wort für Wort mitlesen können. Bereits gelesene Sätze und Wörter werden leicht ausgegraut.
   - **Satz für Satz** -- Jeder Satz wird einzeln vorgelesen; klicken Sie auf einen Satz, um ihn zu hören. Auch hier wird das aktuelle Wort markiert. Über die Navigationsleiste (**⏮ Voriger Satz** / **⏭ Nächster Satz**) können Sie zwischen Sätzen wechseln.
5. Der Text **scrollt automatisch** mit, damit das aktuelle Wort immer im sichtbaren Bereich bleibt.

### Mehrere Texte in einer Datei

Wenn Ihre Datei mehrere Absätze oder Dialogteile enthält, werden diese als separate Texte angezeigt. Sie können in der Liste unterhalb des Lesefensters zwischen den Texten wechseln.

---

## 6. Die Vokabel-Datenbank -- Ihr wachsender Wortschatz

### Automatisches Sammeln

Jedes Mal, wenn Sie eine Vokabeldatei laden oder Vokabeln per KI generieren lassen, werden die Karten automatisch in einer **Datenbank** im Browser gespeichert. Die Datenbank wächst mit jeder neuen Datei -- ohne Duplikate. Jede Vokabel merkt sich, aus welcher Quelldatei (Lektion) sie stammt.

### Gespeicherte Vokabeln laden und lernen

Wenn Sie im Hauptmenü auf **Karteikarten** klicken, sehen Sie unterhalb des Datei-Upload-Bereichs Ihre **gespeicherten Vokabeln**:

- **Alle Vokabeln (N Karten)** -- Lädt Ihre gesamte Vokabelsammlung als Karteikarten. Ideal für gemischtes Wiederholen.
- **Einzelne Lektionen** -- Jede Datei, die Sie jemals geladen haben, erscheint als eigener Eintrag mit Kartenzähler. Klicken Sie auf eine Lektion, um nur deren Vokabeln zu lernen.

So können Sie gezielt bestimmte Themen wiederholen, ohne die Originaldatei erneut laden zu müssen. Der Lernfortschritt (Spaced Repetition) bleibt dabei erhalten.

### Export für Excel

Klicken Sie im Einstellungsbildschirm auf **Export (Excel)**, um Ihre gesamte Vokabelsammlung als CSV-Datei herunterzuladen. Diese Datei können Sie direkt in Excel oder Google Sheets öffnen.

Die Exportdatei enthält folgende Spalten:
- Russisch
- Deutsch
- Thema
- Kategorie
- Grammatik
- Quelle (der Dateiname, aus dem die Vokabel stammt)

### Auto-Export als JSON

In den **Einstellungen** (Zahnrad-Symbol oben rechts) können Sie einen Speicherort für eine JSON-Datei wählen. Die App exportiert dann bei jeder Änderung automatisch Ihre gesamte Vokabelsammlung in diese Datei. So haben Sie immer ein aktuelles Backup.

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

## 9. Brauche ich einen API-Key?

**Für den Vokabeltrainer (`index.html`) selbst: nein.** Karteikarten lernen, Texte vorlesen, Spaced Repetition, Konjugations- und Deklinationstabellen anzeigen, Bilder, Export — alles funktioniert komplett offline ohne API-Key.

Ein **Anthropic Claude API-Key** wird ausschließlich im **Vokabel-Editor** (`vokabel_editor.html`) benötigt, und auch dort nur für die folgenden KI-Funktionen:

| Funktion | Wozu? |
|----------|-------|
| **Wortarten** | Bestimmt automatisch, ob ein Wort Verb, Nomen, Adjektiv … ist |
| **Konjugation** | Erzeugt vollständige Konjugationstabellen für Verben |
| **Deklination** | Erzeugt Deklinationstabellen für Nomen (alle 6 Kasus, Sg./Pl.) |
| **Betonung** | Markiert die betonte Silbe (wird vom Aussprachetrainer genutzt) |
| **Normalisieren** | Bringt Vokabeln in Wörterbuchform |
| **AI-Vokabelfilter** | Filtert beim Import von Texten Müll, Dubletten, Lateinschrift |

Alle KI-Funktionen erzeugen **nur fehlende Daten** — bereits vorhandene Konjugationen, Deklinationen usw. werden übersprungen, sodass der API-Verbrauch minimal bleibt.

Wenn Sie nur lernen und keine eigenen Vokabeln per KI anreichern möchten, brauchen Sie **gar nichts** einzurichten. Details zur API-Key-Konfiguration siehe `Gebrauchsanweisung_Editor.md`.

### Aussprachetrainer: Microsoft Azure

Der **Aussprachetrainer** (`aussprache_trainer.html`) nutzt zusätzlich den **Azure Speech Service** von Microsoft für die Bewertung Ihrer Aussprache (Pronunciation Assessment auf Phonem-Ebene). Dafür brauchen Sie einen eigenen Azure-Key — **nicht** den Anthropic-Key.

- Anbieter: Microsoft Azure (kostenloses **Free F0 Tier** ist ausreichend)
- Benötigt: **API-Key** + **Region** (z.B. `germanywestcentral`)
- Eingabe einmalig im Setup-Bildschirm des Aussprachetrainers, danach im Browser gespeichert
- Wird nur benötigt, wenn Sie Ihre Aussprache aufnehmen und bewerten lassen möchten. Das normale Vorlesen der Vokabeln (TTS im Vokabeltrainer) braucht keinen Azure-Key.

### Wo werden die API-Keys gespeichert?

**Anthropic Claude-Key** (Vokabeltrainer + Editor): Beide Apps suchen den Key in zwei Quellen, in dieser Reihenfolge:

1. **Datei `api-key.js`** im App-Ordner. Inhalt:
   ```javascript
   const CLAUDE_API_KEY = 'sk-ant-api03-IHR-ECHTER-KEY';
   ```
   Solange dort noch der Platzhalter `YOUR_API_KEY_HERE` steht, wird die Datei ignoriert. Sobald ein echter Key drinsteht, wird das Eingabefeld in den Einstellungen gesperrt und zeigt `********** (api-key.js)`. Vorteil: Der Key liegt nicht im Browser-Speicher und ist über `.gitignore` von Versionskontrolle ausgeschlossen.
2. **Browser-localStorage** unter dem Schlüssel `vokabeltrainer_apikey`. Wird automatisch befüllt, sobald Sie den Key in das Eingabefeld der Einstellungen (index.html) bzw. der Filterleiste (vokabel_editor.html) eintragen.

**Azure Speech-Key** (Aussprachetrainer): Komplett getrennt vom Anthropic-Key und **nicht** in `api-key.js`. Wird beim ersten Setup im Aussprachetrainer eingegeben und im Browser-localStorage abgelegt:

- `aussprache_azure_key` — der API-Schlüssel
- `aussprache_azure_region` — die Azure-Region (z.B. `germanywestcentral`)

**Keys einsehen oder löschen:** Edge DevTools (F12) → Reiter **Application** → **Storage** → **Local Storage** → die Origin der App auswählen. Dort sind alle drei Einträge sichtbar und können gelöscht werden, falls Sie den Key wechseln oder von einem anderen Rechner aus neu setzen möchten.

---

## 10. Tipps und Hinweise

- **Betonungszeichen**: Viele der mitgelieferten Beispieldateien verwenden Betonungszeichen (z.B. молоко́ statt молоко). Das hilft bei der Aussprache und wird korrekt angezeigt.
- **Browser-Stimmen**: Die verfügbaren russischen Stimmen hängen von Ihrem Betriebssystem und Browser ab. Chrome bietet in der Regel die beste Auswahl.
- **Daten bleiben lokal**: Alle Ihre Lerndaten und die Vokabeldatenbank werden ausschließlich in Ihrem Browser gespeichert (localStorage und IndexedDB). Es werden keine Daten an Server gesendet.
- **Zwischen Karten und Texten wechseln**: Wenn eine Datei sowohl Vokabeln als auch Text enthält, können Sie über die Modus-Wechsel-Buttons direkt zwischen Karteikarten- und Textmodus wechseln.
- **Neues Vokabelset laden**: Klicken Sie auf **Zurück zur Auswahl**, um eine neue Datei zu laden.

---

## 11. Zusammenfassung der Dateiformate

| Format | Beispiel | Wann verwenden? |
|--------|---------|-----------------|
| Komma-getrennt | `дом, Haus` | Einfache Vokabellisten |
| Tab-getrennt | `дом` ⟶ `Haus` | Quizlet-Export, große Listen |
| Mit Grammatik | `(Akk.)\nSatz, Übersetzung` | Grammatik + Beispielsätze |
| Mit Bild | `(img:bild.svg)Wort, Übersetzung` | Visuelles Lernen |
| Fließtext | Absätze mit Leerzeilen | Texte vorlesen |

---

## Anhang: Die Spaced-Repetition-Algorithmen im Detail

Der Vokabeltrainer bietet zwei verschiedene Spaced-Repetition-Algorithmen: **SM-2** (klassisch, seit den 1980er-Jahren in SuperMemo im Einsatz) und **FSRS-4.5** (modern, datengetrieben, ab 2023). Beide haben dasselbe Ziel: Ihnen jede Karte genau dann zu zeigen, wenn Sie kurz davor sind, sie zu vergessen. Das nutzt den sogenannten **Spacing-Effekt** aus — Wiederholungen mit wachsenden Abständen festigen Wissen viel effizienter als stures Pauken.

Dieser Anhang erklärt, wie beide Algorithmen intern funktionieren. Sie müssen diese Details nicht verstehen, um die App zu benutzen — aber wenn Sie wissen wollen, warum eine Karte in 27 Tagen statt in 12 Tagen wiederkommt, finden Sie hier die Antwort.

### A.1 Grundidee von Spaced Repetition

Nach jeder Antwort speichert die App zu jeder Karte einen Datensatz mit folgenden Feldern:

- **iterations / reps** — wie oft die Karte schon bewertet wurde
- **interval** — Anzahl Tage bis zur nächsten Fälligkeit
- **lastReview / nextReview** — Zeitstempel (letzte Antwort / nächste Fälligkeit)
- **easiness** (nur SM-2) — individueller Schwierigkeits-Multiplikator der Karte
- **difficulty / stability** (nur FSRS) — zwei unabhängige Parameter (s. u.)

Die App zeigt Ihnen nur Karten, deren `nextReview` in der Vergangenheit liegt (**fällig**) oder die noch nie bewertet wurden (**neu**). Nach Ihrer Bewertung (*Nochmal / Schwer / Gut / Leicht*) wird `interval` neu berechnet und `nextReview` entsprechend gesetzt.

Die Rating-Buttons zeigen Ihnen schon vor dem Klick an, in wie vielen Tagen die Karte bei dieser Bewertung wieder käme — so können Sie die Konsequenzen abschätzen.

---

### A.2 SM-2 — Der Klassiker

SM-2 wurde 1985 von Piotr Woźniak für SuperMemo entwickelt und ist auch die Basis von Anki. Die Idee ist einfach: Jede Karte hat einen **Easiness-Faktor** (EF), der beschreibt, wie schwer sie Ihnen fällt. Beim Antworten wächst das Intervall multiplikativ mit EF.

#### Die Intervall-Sequenz

Bei einer korrekt beantworteten Karte (Gut oder Leicht):

| Bewertung Nr. | Neues Intervall |
|---------------|-----------------|
| 1. (neu) | **1 Tag** |
| 2. | **6 Tage** |
| 3. | round(6 × EF) ≈ **16 Tage** (bei EF=2.6) |
| 4. | round(vorheriges × EF) |
| … | weiter multiplikativ |

Die ersten beiden Intervalle sind fest (1 und 6 Tage). Ab der dritten korrekten Antwort wird das Intervall mit dem aktuellen Easiness-Faktor der Karte multipliziert und gerundet.

#### Der Easiness-Faktor

- **Startwert**: EF = 2.5 für jede neue Karte
- **Untergrenze**: EF darf niemals unter 1.3 fallen (sonst würden schwere Karten stagnieren)
- **Aktualisierung nach korrekter Antwort**: EF' = EF + (0.1 − (5 − q) · (0.08 + (5 − q) · 0.02))

Dabei ist `q` die intern benutzte Qualitätsstufe:

| Button | Qualität q | EF-Änderung |
|--------|-----------|-------------|
| Nochmal | 1 | EF wird nicht verändert; Karte wird zurückgesetzt |
| Schwer | 3 | −0.14 |
| Gut | 4 | ±0 |
| Leicht | 5 | +0.10 |

**Beispiel**: Eine neue Karte startet mit EF = 2.5. Sie antworten dreimal hintereinander mit *Leicht* (q=5):
- Nach 1. Antwort: interval = 1, EF = 2.6
- Nach 2. Antwort: interval = 6, EF = 2.7
- Nach 3. Antwort: interval = round(6 × 2.7) = **16 Tage**, EF = 2.8
- Nach 4. Antwort (16 Tage später): interval = round(16 × 2.8) = **45 Tage**, EF = 2.9

#### Fehlschlag (Nochmal)

Bei *Nochmal* wird die Karte komplett zurückgesetzt: `iterations = 0`, `interval = 1`. Sie kommt also am nächsten Tag wieder. Der Easiness-Faktor bleibt unverändert.

#### Stärken und Schwächen

- **Stärke**: Sehr einfach, gut verstanden, seit Jahrzehnten bewährt
- **Schwäche**: Die Formel kennt nur einen Parameter pro Karte. Sie unterscheidet nicht zwischen "schwer zu merken" und "wackelige Erinnerung" — beides fließt in den EF. FSRS macht das differenzierter.

---

### A.3 FSRS-4.5 — Der moderne Ansatz

FSRS (*Free Spaced Repetition Scheduler*) wurde ab 2022 von Jarrett Ye auf Basis der **DSR-Theorie** (Difficulty, Stability, Retrievability) entwickelt und trainiert seine Parameter an echten Review-Logs. Die Version 4.5 (Mitte 2023) ist inzwischen auch in Anki integriert und gilt als deutlich treffsicherer als SM-2.

#### Die drei zentralen Größen

FSRS beschreibt den Zustand einer Karte durch drei Werte:

1. **Difficulty (D)** — wie schwer die Karte dauerhaft für Sie ist (Skala 1–10, unabhängig davon wann Sie zuletzt geübt haben)
2. **Stability (S)** — wie lange die Erinnerung "hält"; konkret die Anzahl Tage, nach denen die Retrievability auf 90% fällt
3. **Retrievability (R)** — wie wahrscheinlich Sie die Karte **jetzt gerade** noch wissen (eine Zahl zwischen 0 und 1)

Der Clou: **D und S sind unabhängig**. Eine Karte kann schwer sein (hohes D), aber nach vielen Wiederholungen trotzdem extrem stabil werden (hohes S). SM-2 kann das nicht unterscheiden.

#### Die Gewichte w[0..16]

FSRS-4.5 hat **17 globale Parameter** (`w[0]` bis `w[16]`), die das Verhalten aller Karten steuern. Der Vokabeltrainer verwendet die Default-Gewichte des offiziellen FSRS-Projekts:

```
w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49,
     0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
```

- `w[0..3]` — Start-Stabilität nach der **ersten** Bewertung (Again/Hard/Good/Easy: 0.4/0.6/2.4/5.8 Tage)
- `w[4], w[5]` — Start-Schwierigkeit
- `w[6]` — wie stark jede Bewertung die Schwierigkeit verändert
- `w[7]` — Gewicht der Mean-Reversion (dazu gleich mehr)
- `w[8..10]` — Wachstum der Stabilität bei korrekter Antwort
- `w[11..14]` — Kollaps der Stabilität nach einem Vergessen
- `w[15]` — Penalty für *Schwer* (0.29, d. h. Stabilitätswachstum wird auf 29% gestaucht)
- `w[16]` — Bonus für *Leicht* (2.61, d. h. 2.6-fach beschleunigtes Wachstum)

#### Initialisierung (erste Bewertung)

Bei der allerersten Bewertung einer neuen Karte:

- **Stabilität**: S₀(G) = w[G−1], mit Untergrenze 0.1
  - Again → 0.4 Tage, Hard → 0.6 Tage, Good → 2.4 Tage, Easy → 5.8 Tage
- **Schwierigkeit**: D₀(G) = clamp(w[4] − (G − 3) · w[5], 1, 10)
  - Again → 6.81, Hard → 5.87, Good → 4.93, Easy → 3.99

Das Intervall wird dann auf `max(1, round(S))` gerundet.

#### Retrievability — die Vergessenskurve

FSRS-4.5 modelliert das Vergessen nicht exponentiell (wie SM-2 implizit), sondern mit einer **Potenzfunktion**:

> R(t, S) = (1 + t / (9·S))⁻¹

Dabei ist `t` die seit der letzten Antwort vergangene Zeit in Tagen und `S` die aktuelle Stabilität. Diese Formel hat zwei wichtige Eigenschaften:

- **Bei t = 0**: R = 1 (100% — Sie haben die Karte gerade gesehen)
- **Bei t = S**: R = 1 / (1 + 1/9) = 9/10 = **0.9**

Der zweite Punkt ist die Definition der Stabilität: *Stability ist die Zeit, nach der Sie die Karte noch mit 90% Wahrscheinlichkeit wissen*. FSRS plant jede Wiederholung genau so, dass Sie kurz vor diesem 90%-Punkt stehen — das ist optimal für den Lerneffekt.

Die Potenzfunktion fällt langsamer ab als eine reine Exponentialfunktion. Das passt besser zu empirischen Gedächtnisdaten: Wenn Sie eine Karte einmal lange wissen, verfällt sie nicht abrupt, sondern gleitet flacher.

#### Schwierigkeits-Update (bei jedem Review)

Nach jeder Bewertung wird die Schwierigkeit in zwei Schritten angepasst:

**Schritt 1 — Linear Damping**:

> ΔD = −w[6] · (G − 3)
> D' = D + ΔD · (10 − D) / 9

Der Faktor `(10 − D) / 9` sorgt dafür, dass schon-sehr-schwere Karten (D nahe 10) nur noch schwach weiter ansteigen können — eine Karte darf nicht unbegrenzt in die Hölle wandern.

**Schritt 2 — Mean Reversion**:

> D_neu = w[7] · D₀(4) + (1 − w[7]) · D'

Die Schwierigkeit wird ganz leicht (Gewicht w[7] = 0.01, also 1%) in Richtung der Start-Schwierigkeit bei *Easy* zurückgezogen. Das verhindert ein dauerhaftes "Driften" der Schwierigkeit.

Anschließend wird D auf den Bereich [1, 10] geklemmt.

#### Stabilitäts-Update bei korrekter Antwort (Hard/Good/Easy)

Das ist die Kernformel von FSRS. Sie berechnet, wie stark sich die Stabilität durch diese Wiederholung vergrößert:

> S_neu = S · (1 + exp(w[8]) · (11 − D) · S^(−w[9]) · (exp((1 − R) · w[10]) − 1) · hardPenalty · easyBonus)

Was passiert da?

- **`exp(w[8])`** — Basiswachstumsfaktor (≈ 4.4)
- **`(11 − D)`** — leichte Karten (kleines D) wachsen stärker als schwere
- **`S^(−w[9])`** — schon-stabile Karten wachsen relativ langsamer (damit extrem stabile Karten nicht explodieren)
- **`(exp((1 − R) · w[10]) − 1)`** — *das ist die wichtigste Komponente*: Je niedriger R beim Review (also je näher am Vergessen Sie waren), desto stärker wächst die Stabilität. Wer **knapp davor** war zu vergessen, lernt am meisten.
- **`hardPenalty`** = w[15] = 0.29 bei *Schwer*, sonst 1
- **`easyBonus`** = w[16] = 2.61 bei *Leicht*, sonst 1

Der berühmte *Desirable Difficulty*-Effekt aus der Lernpsychologie steckt mathematisch in diesem `(1 − R)`-Term: Wiederholungen am Limit sind am wertvollsten.

#### Stabilitäts-Kollaps bei Vergessen (Again)

Wenn Sie *Nochmal* drücken, bricht die Stabilität nicht auf null ein (wie bei SM-2), sondern kollabiert kontrolliert:

> S_forget = w[11] · D^(−w[12]) · ((S + 1)^w[13] − 1) · exp((1 − R) · w[14])

- Schwere Karten verlieren mehr (`D^(−w[12])`)
- Aber hochstabile Karten bleiben relativ robust (der `(S+1)^w[13]`-Term)
- Und wenn Sie beim Vergessen noch eine hohe R hatten (also unerwartet vergessen), wird stärker bestraft

Das ist realistischer als SM-2: Eine Karte, die Sie seit zwei Jahren kennen und einmal vergessen, startet nicht wieder bei Tag 1.

#### Intervallberechnung

Nach jedem Update wird das neue Intervall gesetzt als:

> interval = max(1, round(S_neu))

Also: Ein Tag pro Einheit Stabilität. Die Rating-Buttons zeigen Ihnen vorab die Vorhersage für alle vier Bewertungen, indem sie die Berechnung mit der aktuellen `D`/`S`/`R` einmal pro Button durchspielen.

---

### A.4 SM-2 oder FSRS — was soll ich wählen?

- **SM-2** ist berechenbar, transparent und funktioniert seit Jahrzehnten. Wenn Sie einfache Intervalle bevorzugen und keine Lust auf Black-Box-Formeln haben, ist SM-2 eine solide Wahl.
- **FSRS-4.5** passt sich besser an Ihren individuellen Lernverlauf an, unterscheidet zwischen "schwer" und "wackelig" und ist besonders stark bei Karten, die Sie schon lange kennen. Für Vokabeln mit Langzeit-Horizont ist FSRS in der Regel effizienter.

Die App speichert die Spaced-Repetition-Daten getrennt für beide Abfragerichtungen (Russisch→Deutsch und Deutsch→Russisch), sodass Sie jede Richtung unabhängig trainieren können — selbst mit unterschiedlichen Algorithmen.

### A.5 Wo stehen die Algorithmen im Code?

Beide Implementierungen liegen in `js/sr.js`. Die Datei ist bewusst klein gehalten (~100 Zeilen) und enthält keine DOM- oder State-Abhängigkeiten, sodass sie direkt getestet werden kann. Die zugehörigen Tests stehen in `test_sr.js` (44 Tests, Aufruf: `node test_sr.js`) und verifizieren die Intervall-Sequenzen, die Monotonie-Eigenschaften (Easy ≥ Good ≥ Hard > Again) und die korrekte Umsetzung der FSRS-4.5-Formeln.

---

Viel Erfolg beim Russischlernen!
