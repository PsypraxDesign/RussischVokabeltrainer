// Russisch-Lernen — Deklinations-Modal
// Wird vor dem Hauptscript in index.html geladen.
// Erwartet folgende Globals (in index.html definiert):
//   - cards, currentIndex
//   - declModalTitle, declModalBody, declModalOverlay
//   - t(key, params)

function showDeclensionModal() {
    const card = cards[currentIndex];
    const d = card?.declension;
    if (!d) return;

    const nominative = d.noun || card.speakableText;
    declModalTitle.textContent = nominative + ' — ' + card.answer;

    const genderLabels = { 'м': t('decl_gender_m'), 'ж': t('decl_gender_f'), 'ср': t('decl_gender_n') };
    const caseKeys = ['Им.', 'Род.', 'Дат.', 'Вин.', 'Тв.', 'Пр.'];
    const caseLabels = {
        'Им.': t('decl_case_nom'), 'Род.': t('decl_case_gen'), 'Дат.': t('decl_case_dat'),
        'Вин.': t('decl_case_acc'), 'Тв.': t('decl_case_ins'), 'Пр.': t('decl_case_prep')
    };

    let html = '';
    if (d.noun && d.noun !== card.speakableText.replace(/\u0301/g, '')) {
        html += '<p class="conj-aspect"><strong>' + t('decl_noun') + ':</strong> ' + escapeHtml(d.noun) + '</p>';
    }
    html += '<p class="conj-aspect"><strong>' + t('decl_gender') + ':</strong> ' +
        escapeHtml(genderLabels[d.gender] || d.gender || '—') +
        ' &nbsp;|&nbsp; ' + (d.animate ? t('decl_animate') : t('decl_inanimate')) + '</p>';

    // Singular
    if (d.singular) {
        html += '<table><thead><tr><th colspan="2">' + t('decl_singular') + '</th></tr></thead><tbody>';
        for (const c of caseKeys) {
            if (d.singular[c] !== undefined) {
                html += '<tr><td class="conj-person">' + escapeHtml(caseLabels[c] || c) + '</td><td>' + escapeHtml(d.singular[c]) + '</td></tr>';
            }
        }
        html += '</tbody></table>';
    }

    // Plural
    if (d.plural) {
        html += '<table><thead><tr><th colspan="2">' + t('decl_plural') + '</th></tr></thead><tbody>';
        for (const c of caseKeys) {
            if (d.plural[c] !== undefined) {
                html += '<tr><td class="conj-person">' + escapeHtml(caseLabels[c] || c) + '</td><td>' + escapeHtml(d.plural[c]) + '</td></tr>';
            }
        }
        html += '</tbody></table>';
    }

    declModalBody.innerHTML = html;
    declModalOverlay.classList.add('visible');
}
