// Testseite vom Netz trennen (Review 25.10.2026, M2).
//
// Ohne diese Sperre laedt jede Testseite die echte api-key.js: Mit dem
// Azure-Schluessel ist dann die Azure-Stimme vorgewaehlt, und Tests wie
// test_vocab_click.js loesten echte (kostenpflichtige) Azure-Anfragen aus.
//
// - api-key.js wird durch eine leere Datei ersetzt (keine echten Schluessel)
// - jede http(s)-Anfrage wird abgebrochen (Claude, Azure, Google Fonts)
// - lokale Dateien (file://) laufen normal
//
// Aufruf direkt nach browser.newPage(), vor dem ersten goto().
async function isolatePage(page) {
    await page.setRequestInterception(true);
    page.on('request', req => {
        if (req.isInterceptResolutionHandled && req.isInterceptResolutionHandled()) return;
        const url = req.url();
        if (/\/api-key\.js(\?.*)?$/.test(url)) {
            req.respond({ status: 200, contentType: 'application/javascript', body: '// Test: keine Schluessel\n' });
        } else if (/^https?:/i.test(url)) {
            req.abort();
        } else {
            req.continue();
        }
    });
}

module.exports = { isolatePage };
