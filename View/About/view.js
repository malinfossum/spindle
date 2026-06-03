function aboutPage() {
	// Static content only — no user data is interpolated here, so nothing needs
	// escaping. External links open in a new tab with rel="noopener noreferrer"
	// so the opened page can't reach back through window.opener (tab-nabbing).
	return /*HTML*/ `
    <section class="about" aria-labelledby="about-heading">
        <div class="about-top">
            <button class="btn btn-ghost" type="button" onclick="changePage('welcome')">
                ← Tilbake
            </button>
        </div>

        <h1 class="about-title" id="about-heading">Om Spindle</h1>
        <p class="about-lead">
            Spindle er et bibliotek for fysisk musikk — CD-er, LP-er og kassetter.
            Alt lever lokalt i nettleseren din. Ingen konto, ingen sky.
        </p>

        <h2 class="about-subtitle">Opphav</h2>
        <p class="about-text">
            Spindle begynte som en lagoppgave på GET Academy (Emne 2), laget sammen med
            <a class="about-link"
               href="https://github.com/HenryElendheim/Teamoppgaver-Emne-2"
               target="_blank" rel="noopener noreferrer">Henry Elendheim</a>,
            med mindre bidrag fra Hans Nilsen. Det er bygget om her som et åpent
            prosjekt for allmenn bruk — ikke knyttet til én bestemt samling.
        </p>

        <h2 class="about-subtitle">Personvern</h2>
        <p class="about-text">
            Ingen server, ingen sporing, ingen tredjeparter. Biblioteket ditt krypteres
            i ro med en nøkkel utledet fra passordet ditt (PBKDF2 + HKDF). Uten passordet
            kan dataen ikke leses — det finnes ingen passordgjenoppretting, så eksporter
            jevnlig.
        </p>

        <h2 class="about-subtitle">Tilgjengelighet</h2>
        <p class="about-text">
            Spindle bygges tastatur- og skjermleservennlig: semantisk HTML, synlig fokus,
            tilstrekkelig kontrast, og respekt for «redusert bevegelse».
        </p>

        <h2 class="about-subtitle">Lisens og kildekode</h2>
        <p class="about-text">
            Apache-2.0. Copyright 2026 Malin Fossum.
            <a class="about-link"
               href="https://github.com/malinfossum/spindle"
               target="_blank" rel="noopener noreferrer">Se kildekoden på GitHub</a>.
        </p>
    </section>
    `;
}
