async function register() {
	if (model.app.authBusy) return;

	const username = model.viewState.createProfile.username.trim();
	const password = model.viewState.createProfile.password;
	const repeatPassword = model.viewState.createProfile.repeatPassword;

	if (!username || !password || !repeatPassword) {
		setAuthMessage("Fyll inn alle feltene.");
		updateView();
		return;
	}

	if (password !== repeatPassword) {
		setAuthMessage("Passordene er ikke like.");
		updateView();
		return;
	}

	const check = validatePassword(password);
	if (!check.ok) {
		setAuthMessage(check.error);
		updateView();
		return;
	}

	try {
		model.app.authBusy = true;
		updateView();

		// A library already exists (e.g. another tab created one) — don't clobber it.
		if (localStorage.getItem(STORAGE_KEY)) {
			model.app.authBusy = false;
			setAuthMessage(
				"Et bibliotek ble opprettet i en annen fane — last inn siden på nytt og logg inn.",
			);
			updateView();
			return;
		}

		const saltBytes = randomBytes(KDF_SALT_BYTES);
		const { verifyKey, encryptKey } = await deriveKeys(password, saltBytes);

		const newData = {
			user: { username },
			genre: ["Rock", "Jazz", "Country", "Pop", "EDM", "Diverse Sjangere"],
			location: ["Stue", "Loft", "Boden", "Butikk"],
			musicInfo: [
				{
					id: 1,
					title: "Abbey Road",
					artist: "The Beatles",
					location: [0],
					releaseYear: 1969,
					genre: [0],
					notes:
						"Released in 1969, recorded at EMI Studios on London's Abbey Road.",
					wishlist: false,
					coverImg: null,
				},
				{
					id: 2,
					title: "The Dark Side of the Moon",
					artist: "Pink Floyd",
					location: [2],
					releaseYear: 1973,
					genre: [0],
					notes:
						"Concept album exploring conflict, greed, time, and mental illness.",
					wishlist: false,
					coverImg: null,
				},
				{
					id: 3,
					title:
						"The Rise and Fall of Ziggy Stardust and the Spiders from Mars",
					artist: "David Bowie",
					location: [0],
					releaseYear: 1972,
					genre: [0],
					notes:
						"Loose concept album about a fictional androgynous rock star.",
					wishlist: false,
					coverImg: null,
				},
				{
					id: 4,
					title: "Kind of Blue",
					artist: "Miles Davis",
					location: [1],
					releaseYear: 1959,
					genre: [1],
					notes: "Widely regarded as the best-selling jazz album of all time.",
					wishlist: false,
					coverImg: null,
				},
			],
		};

		const verifyHmacBytes = await computeVerifyHmac(verifyKey);
		const { iv, ciphertext } = await encryptLibrary(
			encryptKey,
			JSON.stringify(newData),
		);

		// Re-check the race window between the first guard and this write.
		if (localStorage.getItem(STORAGE_KEY)) {
			model.app.authBusy = false;
			setAuthMessage(
				"Et bibliotek ble opprettet i en annen fane — last inn siden på nytt og logg inn.",
			);
			updateView();
			return;
		}

		const kdfSaltB64 = bytesToBase64(saltBytes);
		const verifyHmacB64 = bytesToBase64(verifyHmacBytes);
		const envelope = {
			schemaVersion: SCHEMA_VERSION,
			kdfSalt: kdfSaltB64,
			iv: bytesToBase64(iv),
			verifyHmac: verifyHmacB64,
			ciphertext: bytesToBase64(ciphertext),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));

		model.data = newData;
		model.app.crypto = {
			unlocked: true,
			encryptKey,
			verifyKey,
			kdfSaltB64,
			verifyHmacB64,
		};
		model.app.authBusy = false;
		clearRegisterForm();
		clearAuthMessage();
		changePage("homePage");
	} catch (err) {
		console.error("[register] failed:", err);
		model.app.authBusy = false;
		setAuthMessage(
			err.name === "QuotaExceededError"
				? "Ikke nok plass — frigjør lagring og prøv igjen."
				: "En uventet feil oppsto. Prøv igjen.",
		);
		updateView();
	}
}
