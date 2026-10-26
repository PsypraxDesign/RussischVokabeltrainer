// Russisch-Lernen — Erkennung von Datenmuell in der Vokabelliste
// Geladen von index.html (Lesetext-Woerterbuch, JSON-Export) und
// vokabel_editor.html ("🧹 Müll löschen").
//
// Anlass: Am 06.04.2026 wurde vokabeln.json versehentlich als Vokabeltext
// importiert. Jede JSON-Zeile wurde zu einer Karte ("id: c_…", "front: …",
// "Род.: болезни", "added: 2026-…"), 10.616 Stueck mit Quelle "vokabeln.json".
// Eine Lektion stammt immer aus .txt/.csv/.docx — eine JSON-Datei als Quelle
// ist deshalb immer Muell.

// JSON-Feldnamen und Tabellen-Beschriftungen am Zeilenanfang
const METADATA_FIELD_PATTERN = /^\s*(id|front|back|input|verb|noun|grammar|forms?|source|translation|aspect|aspect_partner|gender|animate|stress|stressed|wordtype|conjugation|declension|present|past|future|imperative|participle_active|participle_passive|gerund|singular|plural|added|tags|topic|category|images|pos|им|род|дат|вин|тв|пр|я|ты|вы|мы|он|она|оно|они|он\/она\/оно|м|ж|ср|мн)\.?\s*:\s/i;

function isJunkVocabRecord(record) {
    if (!record) return true;
    if (/\.json$/i.test(record.source || '')) return true;
    return METADATA_FIELD_PATTERN.test((record.front || '').trim());
}
