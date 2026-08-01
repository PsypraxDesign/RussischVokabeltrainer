/**
 * Classification test: runs isVerb() and isNoun() from vokabel_editor.html
 * against the real vokabeln.json and reports potential misclassifications.
 *
 * Run: node test_classification.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const EDITOR_URL = 'file:///' + path.resolve(__dirname, '..', 'vokabel_editor.html').replace(/\\/g, '/');
const VOCAB_PATH = path.resolve(__dirname, '..', 'Vokabelliste_JSON', 'vokabeln.json');

(async () => {
    if (!fs.existsSync(VOCAB_PATH)) {
        console.error(`ERROR: Vocabulary file not found: ${VOCAB_PATH}`);
        console.error('This test requires Vokabelliste_JSON/vokabeln.json. Aborting.');
        process.exit(1);
    }
    let vocabData;
    try {
        vocabData = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
    } catch (e) {
        console.error(`ERROR: Could not read/parse ${VOCAB_PATH}: ${e.message}`);
        process.exit(1);
    }
    console.log(`Loaded ${vocabData.length} vocabulary items from vokabeln.json\n`);

    // Tracks whether any BUG / mismatch was reported, so CI actually fails.
    let problemsFound = 0;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded' });

    // Inject vocab data and classify each item
    const results = await page.evaluate((data) => {
        const output = [];
        for (const item of data) {
            const verb = isVerb(item);
            const noun = isNoun(item);
            output.push({
                front: item.front,
                back: item.back,
                grammar: item.grammar || '',
                isVerb: verb,
                isNoun: noun,
                hasConjugation: !!item.conjugation,
                hasDeclension: !!item.declension,
            });
        }
        return output;
    }, vocabData);

    // Analyze results
    const verbs = results.filter(r => r.isVerb);
    const nouns = results.filter(r => r.isNoun);
    const neither = results.filter(r => !r.isVerb && !r.isNoun);
    const both = results.filter(r => r.isVerb && r.isNoun);

    console.log(`=== Classification Summary ===`);
    console.log(`Total items: ${results.length}`);
    console.log(`Classified as verb: ${verbs.length}`);
    console.log(`Classified as noun: ${nouns.length}`);
    console.log(`Neither verb nor noun: ${neither.length}`);
    console.log(`Both verb AND noun (BUG!): ${both.length}`);

    // Report items classified as both (should never happen)
    if (both.length > 0) {
        problemsFound += both.length;
        console.log(`\n=== BUG: Classified as BOTH verb and noun ===`);
        for (const r of both) {
            console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
        }
    }

    // Report verbs that have declension data (mismatch)
    const verbsWithDecl = results.filter(r => r.isVerb && r.hasDeclension);
    if (verbsWithDecl.length > 0) {
        problemsFound += verbsWithDecl.length;
        console.log(`\n=== Mismatch: classified as verb but has declension data ===`);
        for (const r of verbsWithDecl) {
            console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
        }
    }

    // Report nouns that have conjugation data (mismatch)
    const nounsWithConj = results.filter(r => r.isNoun && r.hasConjugation);
    if (nounsWithConj.length > 0) {
        problemsFound += nounsWithConj.length;
        console.log(`\n=== Mismatch: classified as noun but has conjugation data ===`);
        for (const r of nounsWithConj) {
            console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
        }
    }

    // Report items with conjugation data but NOT classified as verb
    const conjNotVerb = results.filter(r => r.hasConjugation && !r.isVerb);
    if (conjNotVerb.length > 0) {
        problemsFound += conjNotVerb.length;
        console.log(`\n=== Has conjugation data but NOT classified as verb ===`);
        for (const r of conjNotVerb) {
            console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
        }
    }

    // Report items with declension data but NOT classified as noun
    const declNotNoun = results.filter(r => r.hasDeclension && !r.isNoun);
    if (declNotNoun.length > 0) {
        problemsFound += declNotNoun.length;
        console.log(`\n=== Has declension data but NOT classified as noun ===`);
        for (const r of declNotNoun) {
            console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
        }
    }

    // Suspicious verbs: classified as verb but grammar says otherwise
    const suspiciousVerbs = verbs.filter(r => {
        const g = r.grammar.toLowerCase();
        return g.includes('subst') || g.includes('adj') || g.includes('adv') ||
               g.includes('narechie') || g.includes('наречие') || g.includes('существ') ||
               g.includes('männl') || g.includes('weibl') || g.includes('sächl');
    });
    if (suspiciousVerbs.length > 0) {
        problemsFound += suspiciousVerbs.length;
        console.log(`\n=== Suspicious: classified as verb but grammar suggests otherwise ===`);
        for (const r of suspiciousVerbs) {
            console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
        }
    }

    // Suspicious nouns: classified as noun but grammar says verb/adj/adv
    const suspiciousNouns = nouns.filter(r => {
        const g = r.grammar.toLowerCase();
        return g.includes('verb') || g.includes('глагол') || g.includes('adj') ||
               g.includes('прилаг') || g.includes('adv') || g.includes('наречие') ||
               g.includes('prädikat') || g.includes('modal');
    });
    if (suspiciousNouns.length > 0) {
        problemsFound += suspiciousNouns.length;
        console.log(`\n=== Suspicious: classified as noun but grammar suggests otherwise ===`);
        for (const r of suspiciousNouns) {
            console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
        }
    }

    // Show "neither" items for review (these won't get conj/decl buttons)
    console.log(`\n=== Neither verb nor noun (${neither.length} items) ===`);
    for (const r of neither) {
        console.log(`  "${r.front}" | "${r.back}" | grammar: "${r.grammar}"`);
    }

    await browser.close();

    if (problemsFound > 0) {
        console.log(`\nDone. ${problemsFound} classification problem(s) / mismatch(es) found.`);
        process.exit(1);
    }
    console.log('\nDone. No classification problems found.');
    process.exit(0);
})().catch((err) => {
    console.error('FATAL:', err);
    process.exit(1);
});
