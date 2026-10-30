// Город — Zahlen als russische Wörter (mit Betonung), 0 bis 999 999
// Für Preise und Wechselgeld: zahlwort(360) → "три́ста шестьдеся́т",
// rubel(360) → "три́ста шестьдеся́т рубле́й".

(function () {
    const EINER = ['', 'оди́н', 'два', 'три', 'четы́ре', 'пять', 'шесть', 'семь', 'во́семь', 'де́вять',
        'де́сять', 'оди́ннадцать', 'двена́дцать', 'трина́дцать', 'четы́рнадцать', 'пятна́дцать',
        'шестна́дцать', 'семна́дцать', 'восемна́дцать', 'девятна́дцать'];
    const ZEHNER = ['', '', 'два́дцать', 'три́дцать', 'со́рок', 'пятьдеся́т', 'шестьдеся́т', 'се́мьдесят', 'во́семьдесят', 'девяно́сто'];
    const HUNDERTER = ['', 'сто', 'две́сти', 'три́ста', 'четы́реста', 'пятьсо́т', 'шестьсо́т', 'семьсо́т', 'восемьсо́т', 'девятьсо́т'];

    // Endung nach Zahl: 1 → form1, 2–4 → form2, sonst form5 (11–14 immer form5)
    function form(n, form1, form2, form5) {
        const z = n % 100;
        if (z >= 11 && z <= 14) return form5;
        const e = n % 10;
        if (e === 1) return form1;
        if (e >= 2 && e <= 4) return form2;
        return form5;
    }

    function bis999(n, weiblich) {
        const teile = [];
        const h = Math.floor(n / 100), rest = n % 100;
        if (h) teile.push(HUNDERTER[h]);
        if (rest < 20) {
            if (rest) teile.push(weiblichEiner(rest, weiblich));
        } else {
            teile.push(ZEHNER[Math.floor(rest / 10)]);
            if (rest % 10) teile.push(weiblichEiner(rest % 10, weiblich));
        }
        return teile.join(' ');
    }

    // ты́сяча ist weiblich: одна́ ты́сяча, две ты́сячи
    function weiblichEiner(n, weiblich) {
        if (!weiblich) return EINER[n];
        if (n === 1) return 'одна́';
        if (n === 2) return 'две';
        return EINER[n];
    }

    function zahlwort(n) {
        n = Math.floor(Math.abs(n));
        if (n === 0) return 'ноль';
        const t = Math.floor(n / 1000), rest = n % 1000;
        const teile = [];
        if (t) {
            const tausend = form(t, 'ты́сяча', 'ты́сячи', 'ты́сяч');
            teile.push(t === 1 ? 'ты́сяча' : bis999(t, true) + ' ' + tausend);
        }
        if (rest) teile.push(bis999(rest, false));
        return teile.join(' ');
    }

    function rubel(n) {
        return zahlwort(n) + ' ' + form(n, 'рубль', 'рубля́', 'рубле́й');
    }

    // Ordnungszahlen 1–20, männlich (эта́ж, ряд …), mit Betonung.
    // Nominativ = Akkusativ bei unbelebten: на пя́тый эта́ж (wohin?)
    // Präpositiv: на пя́том этаже́ (wo?) — Genitiv: пя́того (ма́я)
    const ORDINAL = ['', 'пе́рвый', 'второ́й', 'тре́тий', 'четвёртый', 'пя́тый', 'шесто́й', 'седьмо́й', 'восьмо́й',
        'девя́тый', 'деся́тый', 'оди́ннадцатый', 'двена́дцатый', 'трина́дцатый', 'четы́рнадцатый',
        'пятна́дцатый', 'шестна́дцатый', 'семна́дцатый', 'восемна́дцатый', 'девятна́дцатый', 'двадца́тый'];

    function ordinal(n, kasus = 'nom') {
        const nom = ORDINAL[n];
        if (!nom || kasus === 'nom' || kasus === 'akk') return nom || String(n);
        // тре́тий ist weich: тре́тьем, тре́тьего
        if (nom === 'тре́тий') return kasus === 'praep' ? 'тре́тьем' : 'тре́тьего';
        // Betonte Endung -о́й (второ́й) bleibt betont: второ́м, второ́го
        if (nom.endsWith('о́й')) return nom.slice(0, -3) + (kasus === 'praep' ? 'о́м' : 'о́го');
        // Endung -ый (пя́тый): Betonung bleibt im Stamm — пя́том, пя́того
        return nom.slice(0, -2) + (kasus === 'praep' ? 'ом' : 'ого');
    }

    window.Zahlwort = { zahlwort, rubel, form, ordinal };
})();
