function aboutPage() {
	// Static content only — no user data is interpolated here, so nothing needs
	// escaping. The about.* strings carry their own <a> markup (external links
	// open in a new tab with rel="noopener noreferrer" so the opened page can't
	// reach back through window.opener — tab-nabbing), which is safe because
	// they are developer-authored, never user input.
	return /*HTML*/ `
    <section class="about" aria-labelledby="about-heading">
        <div class="about-top">
            <button class="btn btn-ghost" type="button" onclick="changePage('welcome')">
                ${t("about.back")}
            </button>
        </div>

        <h1 class="about-title" id="about-heading">${t("about.title")}</h1>
        <p class="about-lead">${t("about.lead")}</p>

        <h2 class="about-subtitle">${t("about.originsTitle")}</h2>
        <p class="about-text">${t("about.originsBody")}</p>

        <h2 class="about-subtitle">${t("about.privacyTitle")}</h2>
        <p class="about-text">${t("about.privacyBody")}</p>

        <h2 class="about-subtitle">${t("about.a11yTitle")}</h2>
        <p class="about-text">${t("about.a11yBody")}</p>

        <h2 class="about-subtitle">${t("about.licenseTitle")}</h2>
        <p class="about-text">${t("about.licenseBody")}</p>
    </section>
    `;
}
