// Russisch-Lernen — Konjugations-Modal
// Wird vor dem Hauptscript in index.html geladen.
// Erwartet folgende Globals (in index.html definiert):
//   - cards, currentIndex
//   - conjModalTitle, conjModalBody, conjModalOverlay
//   - t(key, params)

function showConjugationModal() {
    const card = cards[currentIndex];
    const c = card?.conjugation;
    if (!c) return;

    const infinitive = c.verb || card.speakableText;
    conjModalTitle.textContent = infinitive + ' — ' + card.answer;

    const aspectLabels = { 'НСВ': t('conj_aspect_nsv'), 'СВ': t('conj_aspect_sv') };
    let html = '';
    if (c.verb && c.verb !== card.speakableText.replace(/\u0301/g, '')) {
        html += '<p class="conj-aspect"><strong>' + t('conj_infinitive') + ':</strong> ' + c.verb + '</p>';
    }
    html += '<p class="conj-aspect"><strong>' + t('conj_aspect') + ':</strong> ' +
        (aspectLabels[c.aspect] || c.aspect || '—');
    if (c.aspect_partner) html += ' &nbsp;|&nbsp; <strong>' + t('conj_partner') + ':</strong> ' + c.aspect_partner;
    html += '</p>';

    // Present
    if (c.present) {
        html += '<table><thead><tr><th colspan="2">' + t('conj_present') + '</th></tr></thead><tbody>';
        for (const [person, form] of Object.entries(c.present)) {
            html += '<tr><td class="conj-person">' + person + '</td><td>' + form + '</td></tr>';
        }
        html += '</tbody></table>';
    }

    // Future
    if (c.future) {
        html += '<table><thead><tr><th colspan="2">' + t('conj_future') + '</th></tr></thead><tbody>';
        for (const [person, form] of Object.entries(c.future)) {
            html += '<tr><td class="conj-person">' + person + '</td><td>' + form + '</td></tr>';
        }
        html += '</tbody></table>';
    }

    // Past
    if (c.past) {
        const pastLabels = { 'м': t('conj_past_m'), 'ж': t('conj_past_f'), 'ср': t('conj_past_n'), 'мн': t('conj_past_pl') };
        html += '<table><thead><tr><th colspan="2">' + t('conj_past') + '</th></tr></thead><tbody>';
        for (const [key, form] of Object.entries(c.past)) {
            html += '<tr><td class="conj-person">' + (pastLabels[key] || key) + '</td><td>' + form + '</td></tr>';
        }
        html += '</tbody></table>';
    }

    // Imperative
    if (c.imperative) {
        html += '<table><thead><tr><th colspan="2">' + t('conj_imperative') + '</th></tr></thead><tbody>';
        for (const [person, form] of Object.entries(c.imperative)) {
            html += '<tr><td class="conj-person">' + person + '</td><td>' + form + '</td></tr>';
        }
        html += '</tbody></table>';
    }

    // Participles & Gerund
    const extras = [];
    if (c.participle_active) extras.push([t('conj_participle_active'), c.participle_active]);
    if (c.participle_passive) extras.push([t('conj_participle_passive'), c.participle_passive]);
    if (c.gerund) extras.push([t('conj_gerund'), c.gerund]);
    if (extras.length) {
        html += '<table><thead><tr><th colspan="2">' + t('conj_other') + '</th></tr></thead><tbody>';
        for (const [label, form] of extras) {
            html += '<tr><td class="conj-person">' + label + '</td><td>' + form + '</td></tr>';
        }
        html += '</tbody></table>';
    }

    conjModalBody.innerHTML = html;
    conjModalOverlay.classList.add('visible');
}
