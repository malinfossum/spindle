// iOS Safari only (v1.0.4). Safari may delete a site's storage after 7 days
// without use, and the Home Screen app keeps its own storage that Safari
// cannot see. A library made in Safari can vanish, and it never reaches the
// installed app. So on iOS the library is created in the installed app only,
// and Welcome and Register show these steps where the Create button would be.

import { t } from "../../Model/i18n/i18n.js";

export function iosInstallSteps() {
	return /*HTML*/ `
    <section class="ios-install" aria-labelledby="ios-install-title">
        <h2 class="ios-install-title" id="ios-install-title">${t("ios.installTitle")}</h2>
        <ol class="ios-install-steps">
            <li>${t("ios.installStep1")}</li>
            <li>${t("ios.installStep2")}</li>
            <li>${t("ios.installStep3")}</li>
        </ol>
        <p class="ios-install-why">${t("ios.installWhy")}</p>
    </section>`;
}
