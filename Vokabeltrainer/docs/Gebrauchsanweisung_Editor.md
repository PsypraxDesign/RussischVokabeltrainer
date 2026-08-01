# Vokabel-Editor -- Gebrauchsanweisung

## Überblick

Der **Vokabel-Editor** (`vokabel_editor.html`) ist eine eigenständige Browser-App zum Verwalten, Bearbeiten und Erweitern Ihrer russischen Vokabeldatenbank. Er arbeitet direkt mit der JSON-Datei, in der alle Vokabeln gespeichert sind, und kann per KI automatisch Konjugationstabellen, Deklinationstabellen und Betonungsdaten erzeugen.

Sie brauchen nichts zu installieren -- öffnen Sie die Datei einfach im Browser (Edge oder Chrome empfohlen).

---

## 1. Erste Schritte

### 1.1 Datei laden

Beim Start sehen Sie einen leeren Bildschirm mit dem Button **JSON-Datei laden**. Klicken Sie darauf und wählen Sie Ihre `vokabeln.json` aus dem Ordner `Vokabelliste_JSON/`.

Wenn Sie die Datei schon einmal geöffnet haben, erscheint zusätzlich der Button **Letzte Datei erneut öffnen** -- damit können Sie die zuletzt bearbeitete Datei ohne Dateidialog direkt öffnen.

### 1.2 Die Benutzeroberfläche

Nach dem Laden sehen Sie eine **Tabelle** mit allen Vokabeln und darüber zwei Werkzeugleisten:

**Obere Leiste (Aktionen):**
- **Datei laden** -- Eine andere JSON-Datei öffnen
- **Speichern** -- Änderungen in die JSON-Datei zurückschreiben
- **Rückgängig** -- Letzte Aktion widerrufen (auch Strg+Z)
- **CSV Export** -- Vokabeln als CSV-Datei exportieren
- **Alle Verben konjugieren** -- KI-Batch: Konjugationstabellen erzeugen
- **Alle Nomen deklinieren** -- KI-Batch: Deklinationstabellen erzeugen
- **Alle Betonungen** -- KI-Batch: Betonungsdaten erzeugen
- **Normalisieren** -- KI-Batch: Wörter auf Wörterbuchform bringen

**Untere Leiste (Filter):**
- **Suchfeld** -- Durchsucht russische Wörter, Übersetzungen und Grammatik
- **Quellenfilter** -- Zeigt nur Vokabeln aus einer bestimmten Lektion
- **Gelöschte anzeigen** -- Zum Löschen markierte Einträge sichtbar machen
- **API-Key** -- Ihr Anthropic-API-Schlüssel für die KI-Funktionen

---

## 2. Vokabeln bearbeiten

### 2.1 Felder bearbeiten

Klicken Sie direkt in eine Tabellenzelle, um sie zu bearbeiten. Folgende Felder sind editierbar:

| Spalte | Inhalt | Beispiel |
|--------|--------|----------|
| **Russisch** | Das russische Wort oder die Phrase | работать |
| **Deutsch** | Die deutsche Übersetzung | arbeiten |
| **Grammatik** | Wortart und grammatische Angaben | Verb, unvollendet |
| **Formen** | Zusätzliche Wortformen (kommagetrennt) | работают, работал |

Änderungen werden sofort übernommen. Vergessen Sie nicht, am Ende auf **Speichern** zu klicken!

### 2.2 Vokabeln löschen

Klicken Sie auf den roten **🗑**-Button am rechten Rand einer Zeile. Die Vokabel wird zunächst nur **zum Löschen markiert** (durchgestrichen dargestellt). Oben erscheint eine gelbe Leiste mit der Anzahl der markierten Einträge und zwei Optionen:

- **Endgültig entfernen** -- Löscht alle markierten Vokabeln unwiderruflich
- **Alle wiederherstellen** -- Macht alle Markierungen rückgängig

So können Sie in Ruhe mehrere Einträge markieren, bevor Sie sie endgültig löschen.

### 2.3 Rückgängig

Mit **Rückgängig** (oder Strg+Z) können Sie die letzte Bearbeitung widerrufen. Das funktioniert für Textänderungen und Löschmarkierungen.

---

## 3. Speichern und Synchronisieren

### 3.1 Speichern

Klicken Sie auf **Speichern**, um die bearbeitete JSON-Datei zu überschreiben. Der Editor merkt sich den Dateipfad und überschreibt die Originaldatei direkt -- kein Speicherdialog nötig (bei Edge/Chrome mit File System Access API).

### 3.2 Automatische Synchronisation

Beim Speichern werden die Konjugations-, Deklinations- und Betonungsdaten automatisch in die **IndexedDB des Vokabeltrainers** (`index.html`) synchronisiert. So stehen die Grammatiktabellen und Betonungsmarkierungen sofort in den Karteikarten und im Aussprachetrainer zur Verfügung.

### 3.3 CSV Export

Klicken Sie auf **CSV Export**, um die Vokabeln als Semikolon-getrennte CSV-Datei zu exportieren. Die Datei kann direkt in Excel oder Google Sheets geöffnet werden. Beim erneuten Export wird die gleiche Datei überschrieben -- kein erneuter Speicherdialog.

---

## 4. KI-Funktionen (Claude API)

Die KI-Funktionen nutzen die **Claude API** von Anthropic, um automatisch grammatische Daten zu erzeugen. Dafür brauchen Sie einen API-Schlüssel.

**Funktionen, die einen API-Key benötigen:**

| Funktion | Button | Beschreibung |
|----------|--------|--------------|
| Wortarten bestimmen | **Wortarten** | Klassifiziert jedes Wort (Verb, Nomen, Adjektiv, …) |
| Konjugationstabellen | **Konj.** / **Konjugation** | Erzeugt vollständige Verb-Konjugation (Aspekt, Tempora, Imperativ, Partizipien) |
| Deklinationstabellen | **Dekl.** / **Deklination** | Erzeugt Nomen-Deklination für alle 6 Kasus, Sg. + Pl. |
| Betonungsdaten | **Betonung** / **Alle Betonungen** | Markiert die betonte Silbe (für Aussprachetrainer) |
| Normalisierung | **Normalisieren** | Bringt Vokabeln in Wörterbuchform und übersetzt Grammatik-Tags ins Deutsche |
| Vokabelfilter (neue Texte) | beim Import | Filtert Lateinschrift, Zahlen, Uhrzeiten, Dubletten |

Alle Funktionen erzeugen **nur fehlende Daten**: Bestehende Konjugationen, Deklinationen, Betonungen und Wortarten werden übersprungen. So bleibt der API-Verbrauch minimal, wenn Sie eine Funktion erneut starten.

Funktionen **ohne API-Key** im Editor: Laden/Speichern, Bearbeiten der Zellen, Filter, Sortierung, CSV/JSON-Export, Löschen, virtuelle russische Tastatur.

**Hinweis zum Aussprachetrainer:** Der Aussprachetrainer (`aussprache_trainer.html`) verwendet **nicht** den Anthropic-Key, sondern einen separaten **Microsoft Azure Speech Service**-Key (Free F0 Tier reicht) plus eine Region (z.B. `germanywestcentral`). Dieser wird nur benötigt, wenn Sie Ihre Aussprache aufnehmen und bewerten lassen möchten.

### 4.1 API-Key einrichten

Es gibt zwei Wege, den API-Key bereitzustellen:

1. **Im Editor eingeben**: Tragen Sie den Schlüssel in das Feld **API-Key** in der Filterleiste ein. Der Schlüssel beginnt mit `sk-ant-api...`
2. **Per Datei**: Erstellen Sie eine Datei `api-key.js` im gleichen Ordner mit dem Inhalt:
   ```javascript
   const CLAUDE_API_KEY = 'sk-ant-api03-IHR-SCHLÜSSEL-HIER';
   ```
   Diese Datei wird beim Laden des Editors automatisch eingebunden.

### 4.2 Wortarten bestimmen

Klicken Sie auf **Wortarten** in der oberen Leiste. Der Editor sendet alle Vokabeln (ohne bestehende Klassifikation) in 30er-Batches an die Claude API und bestimmt für jede die Wortart:

- **Verb**, **Nomen**, **Adjektiv**, **Adverb**, **Pronomen**, **Zahlwort**, **Präposition**, **Konjunktion**, **Partikel**, **Interjektion**, **Prädikativ**, **Phrase**, **Name**

Die Wortart wird in der Spalte **Wortart** farbig angezeigt und steuert, welche Grammatik-Funktionen verfügbar sind: Nur bei Verben erscheint der Konjugations-Button, nur bei Nomen der Deklinations-Button.

**Empfohlene Reihenfolge:** Führen Sie die Wortarten-Bestimmung **vor** der Konjugation und Deklination aus. So werden alle Wörter zuverlässig der richtigen Kategorie zugeordnet.

### 4.3 Konjugationstabellen erzeugen

**Einzeln:** In der Spalte **Konj./Dekl.** erscheint bei Verben ein Button **Konj.**. Klicken Sie darauf, um die Konjugationstabelle zu generieren.

**Alle auf einmal:** Klicken Sie auf **Konjugation** in der oberen Leiste. Der Editor:

1. Erkennt alle Verben (per Wortart-Klassifikation oder Heuristik als Fallback)
2. Überspringt Verben, die bereits eine Konjugation haben
3. Sendet die Verben in **5er-Batches** an die Claude API
4. Zeigt den Fortschritt als Zähler (z.B. "23 / 191")
5. Wartet 2 Sekunden zwischen den Batches, um Rate-Limits zu vermeiden

Die erzeugte Konjugationstabelle enthält:
- **Aspekt** (vollendet/unvollendet) und Aspektpartner
- **Präsens** (nur bei unvollendeten Verben)
- **Futur** (zusammengesetzt bei НСВ, einfach bei СВ)
- **Vergangenheit** (männlich, weiblich, sächlich, Plural)
- **Imperativ** (du/Sie)
- **Partizipien** (aktiv, passiv) und **Gerundium**

Nach der Erzeugung zeigt die Spalte **✓ anzeigen** -- klicken Sie darauf, um die Tabelle in einem Popup zu sehen.

### 4.4 Deklinationstabellen erzeugen

Funktioniert analog zur Konjugation, aber für **Nomen**:

**Einzeln:** Button **erzeugen** in der Spalte **Deklination**.

**Alle auf einmal:** Klicken Sie auf **Alle Nomen deklinieren**.

Die erzeugte Deklinationstabelle enthält:
- **Genus** (männlich, weiblich, sächlich)
- **Belebtheit** (belebt/unbelebt)
- **Singular und Plural** für alle 6 Kasus:
  - Nominativ (Им.)
  - Genitiv (Род.)
  - Dativ (Дат.)
  - Akkusativ (Вин.)
  - Instrumental (Тв.)
  - Präpositiv (Пр.)

Sonderfall: Bei Pluraliatantum-Nomen (z.B. "деньги" -- Geld) wird nur die Pluralform erzeugt.

### 4.5 Betonungsdaten erzeugen

**Einzeln:** Button **erzeugen** in der Spalte **Betonung**.

**Alle auf einmal:** Klicken Sie auf **Alle Betonungen**.

Der Editor sendet die Wörter in **20er-Batches** an die Claude API (Betonungsdaten sind kleiner als Konjugationstabellen, daher größere Batches). Für jedes Wort wird gespeichert:

- **stressed**: Das Wort mit Akzentzeichen (z.B. "рабо́та")
- **pos**: Position des betonten Vokals (z.B. 2 = zweiter Vokal)
- **total**: Gesamtzahl der Vokale im Wort

Diese Daten werden vom **Aussprachetrainer** genutzt, um die Betonung jedes Worts anzuzeigen und im Waveform-Diagramm zu markieren.

### 4.6 Normalisieren

Klicken Sie auf **Normalisieren**, um die Vokabeln per KI auf die **Wörterbuchform** zu bringen:

- Konjugierte Verben → Infinitiv (z.B. "начинает" → "начинать")
- Deklinierte Nomen → Nominativ Singular (z.B. "документов" → "документ")
- Deklinierte Adjektive → Nominativ Singular maskulin (z.B. "красивая" → "красивый")
- Die **deutsche Übersetzung** wird an die Grundform angepasst (z.B. "beginnt" → "beginnen")
- **Russische Grammatik-Abkürzungen** werden durch deutsche ersetzt (z.B. "НСВ" → "Verb, unvollendet")

Die Normalisierung berücksichtigt den aktuellen **Quellenfilter** -- wenn Sie eine bestimmte Lektion ausgewählt haben, werden nur deren Vokabeln normalisiert.

### 4.7 Fehlerbehandlung und Rate-Limits

Alle KI-Funktionen haben eine eingebaute Fehlerbehandlung:

- **Rate-Limit (429)**: Der Editor wartet automatisch die vom Server angegebene Zeit und versucht es erneut (bis zu 3 Versuche)
- **Überlastung (529)**: Wartet 30 Sekunden und versucht es erneut
- **Ungültiger Key (401)**: Zeigt sofort eine Fehlermeldung
- **Teilfehler**: Wenn einzelne Batches fehlschlagen, werden die bereits erzeugten Daten behalten. Sie können die fehlgeschlagenen Einträge durch erneutes Klicken auf den Batch-Button nachgenerieren.

Der Fortschritt wird in der oberen Leiste als Zähler angezeigt (z.B. "45 / 191"). Bei Wartezeiten durch Rate-Limits wird die verbleibende Wartezeit angezeigt.

---

## 5. Suchen und Filtern

### 5.1 Textsuche

Tippen Sie in das **Suchfeld**, um Vokabeln zu finden. Die Suche durchsucht gleichzeitig:
- Das russische Wort
- Die deutsche Übersetzung
- Die Grammatik-Angabe
- Die Quellenangabe
- Zusätzliche Formen

Die Tabelle wird während des Tippens sofort gefiltert.

### 5.2 Quellenfilter

Über das **Dropdown-Menü** können Sie die Anzeige auf eine bestimmte Quelle (Lektion) einschränken. Jede Quelle zeigt in Klammern die Anzahl der Vokabeln:

- *Alle Quellen (1099)* -- Alle Vokabeln anzeigen
- *Im Restaurant.txt (42)* -- Nur Vokabeln aus dieser Lektion
- *AI: МОЯ ФИРМА (28)* -- Vokabeln aus der KI-generierten Lektion

### 5.3 Sortierung

Klicken Sie auf eine **Spaltenüberschrift**, um die Tabelle nach dieser Spalte zu sortieren. Ein weiterer Klick kehrt die Sortierrichtung um.

---

## 6. Zusammenspiel mit dem Vokabeltrainer

### 6.1 Datenfluss

```
vokabel_editor.html                    index.html
┌──────────────────┐                  ┌──────────────────┐
│  vokabeln.json   │──── Speichern ──→│   IndexedDB      │
│  (Datei)         │    + Sync        │   (Browser-DB)   │
│                  │                  │                  │
│  + conjugation   │                  │  Karteikarten    │
│  + declension    │                  │  zeigen Konj./   │
│  + stress        │                  │  Dekl.-Tabellen  │
└──────────────────┘                  └──────────────────┘
                                              │
                                              ▼
                                      ┌──────────────────┐
                                      │ aussprache_       │
                                      │ trainer.html      │
                                      │                  │
                                      │ nutzt stress-    │
                                      │ Daten für        │
                                      │ Betonungs-       │
                                      │ markierung       │
                                      └──────────────────┘
```

### 6.2 Was wird synchronisiert?

Beim Speichern im Editor werden folgende Daten in die IndexedDB des Vokabeltrainers geschrieben:
- **Konjugationstabellen** → Anzeige über den "Konjugation"-Button auf Karteikarten
- **Deklinationstabellen** → Anzeige über den "Deklination"-Button auf Karteikarten
- **Betonungsdaten** → Betonungsmarkierung im Aussprachetrainer

### 6.3 Auto-Normalisierung

Wenn eine konjugierte oder deklinierte Form auf einer Karteikarte steht (z.B. "работают"), ersetzt der Vokabeltrainer sie automatisch durch die Grundform ("работать"), sofern Konjugations- bzw. Deklinationsdaten vorhanden sind. Das funktioniert nur bei einzelnen Wörtern -- Phrasen bleiben unverändert.

---

## 7. Typischer Arbeitsablauf

Ein typischer Ablauf zur Pflege Ihrer Vokabeldatenbank:

1. **Editor öffnen**: `vokabel_editor.html` im Browser öffnen
2. **Datei laden**: `vokabeln.json` öffnen (oder "Letzte Datei erneut öffnen")
3. **Prüfen und bereinigen**:
   - Duplikate oder fehlerhafte Einträge suchen und löschen
   - Grammatik-Angaben korrigieren
   - Bei Bedarf **Normalisieren** klicken, um Wörterbuchformen herzustellen
4. **Wortarten und Grammatikdaten erzeugen**:
   - **Wortarten** klicken -- klassifiziert alle Vokabeln (Verb, Nomen, Adjektiv, ...)
   - **Konjugation** klicken -- erzeugt Konjugationstabellen für alle Verben
   - **Deklination** klicken -- erzeugt Deklinationstabellen für alle Nomen
   - **Betonung** klicken -- erzeugt Betonungsdaten für alle Vokabeln
5. **Speichern**: Die Daten werden in die JSON-Datei geschrieben und automatisch in die IndexedDB synchronisiert
6. **Im Vokabeltrainer nutzen**: `index.html` öffnen -- die Konjugations- und Deklinationstabellen sind sofort auf den Karteikarten verfügbar
7. **Im Aussprachetrainer nutzen**: `aussprache_trainer.html` öffnen -- die Betonungsdaten werden automatisch angezeigt

---

## 8. Tastenkürzel

| Taste | Funktion |
|-------|----------|
| **Strg+Z** | Rückgängig |
| **Escape** | Popup-Fenster (Konjugation/Deklination) schließen |

---

## 9. Technische Hinweise

- Der Editor funktioniert am besten in **Microsoft Edge** oder **Google Chrome** (File System Access API für direktes Speichern)
- In Firefox wird stattdessen ein Download-Dialog angezeigt
- Die JSON-Datei kann beliebig groß sein -- der Editor paginiert die Anzeige nicht, lädt aber alle Daten auf einmal
- Die `api-key.js`-Datei sollte **nicht** in ein öffentliches Repository hochgeladen werden (sie ist in `.gitignore` aufgeführt)
- Alle Daten bleiben lokal im Browser -- der API-Key wird nur für direkte Anfragen an die Claude API verwendet

---

## 10. Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| "Letzte Datei erneut öffnen" fehlt | Sie haben die Datei noch nie im Editor geöffnet. Laden Sie sie einmal manuell. |
| KI-Buttons ausgegraut | Laden Sie zuerst eine JSON-Datei. Die Buttons werden erst nach dem Laden aktiviert. |
| "Bitte API-Key eingeben" | Tragen Sie Ihren Anthropic-API-Schlüssel im Feld rechts in der Filterleiste ein, oder erstellen Sie die Datei `api-key.js`. |
| Konjugation/Deklination fehlgeschlagen | Prüfen Sie den API-Key. Klicken Sie erneut auf den Batch-Button -- bereits erzeugte Daten bleiben erhalten, nur fehlende werden nachgeneriert. |
| Änderungen nicht im Vokabeltrainer sichtbar | Stellen Sie sicher, dass Sie im Editor auf **Speichern** geklickt haben. Die Synchronisation passiert nur beim Speichern. |
