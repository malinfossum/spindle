// Spindle — export / import behaviour (v0.1 task J).
//
// Without this, a cleared browser profile means a lost library: there is no
// account, no cloud copy and no password reset by design. Everything here is the
// Controller half — the file format itself lives in Model/backup.js.
//
// Browsers cannot write a file silently. A download is: serialise → Blob →
// object URL → click a temporary <a download> → revoke the URL.

// A real backup is a few hundred kB. Anything past this is not one, and reading
// it as text would only stall the tab.
const IMPORT_MAX_BYTES = 10 * 1024 * 1024;

const IMPORT_ERROR_KEYS = {
	notJson: "backup.errNotJson",
	notBackup: "backup.errNotBackup",
	tooNew: "backup.errTooNew",
	plaintextFile: "backup.errPlaintext",
};

const EXPORT_ERROR_KEYS = {
	noLibrary: "backup.errNoLibrary",
	corrupt: "backup.errCorrupt",
	tooNew: "backup.errTooNew",
	locked: "backup.errLocked",
};

function setBackupMessage(key, tone) {
	model.app.backupMessage = { key, tone };
}

function clearBackupMessage() {
	model.app.backupMessage = { key: "", tone: "info" };
}

function downloadJson(filename, payload) {
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();

	// The object URL pins the Blob in memory until it is revoked, but revoking it
	// in the same tick can cut the download off in some browsers. Let the click
	// finish first.
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Works locked or unlocked: the encrypted envelope is copied out as-is.
function exportEncryptedBackup() {
	const result = buildEncryptedBackup();

	if (!result.ok) {
		setBackupMessage(EXPORT_ERROR_KEYS[result.reason] || "error.unexpected", "error");
		updateView();
		return;
	}

	downloadJson(backupFilename("encrypted"), result.backup);
	setBackupMessage("backup.exportDone", "success");
	updateView();
}

// Opt-in, and gated behind a dialog that says plainly what the file will be.
async function exportPlaintextBackup() {
	const confirmed = await openDialog({
		title: t("backup.plaintextTitle"),
		body: t("backup.plaintextBody"),
		confirmText: t("backup.plaintextConfirm"),
		danger: true,
	});
	if (!confirmed) return;

	const result = buildPlaintextBackup();
	if (!result.ok) {
		setBackupMessage(EXPORT_ERROR_KEYS[result.reason] || "error.unexpected", "error");
		updateView();
		return;
	}

	downloadJson(backupFilename("plaintext"), result.backup);
	setBackupMessage("backup.plaintextDone", "success");
	updateView();
}

// Import replaces the library outright, so it confirms destructively and then
// logs out: the imported envelope opens with the password IT was created with,
// not whatever is unlocked right now. Reusing the live session keys against
// someone else's ciphertext would simply fail to decrypt on the next save.
async function importBackupFile(input) {
	const file = input.files && input.files[0];
	if (!file) return;

	// Clear the picker straight away so re-choosing the same file after a
	// cancelled or failed import still fires a change event.
	input.value = "";

	if (file.size > IMPORT_MAX_BYTES) {
		setBackupMessage("backup.errTooLarge", "error");
		updateView();
		return;
	}

	let text;
	try {
		text = await file.text();
	} catch (err) {
		console.error("[backup] could not read file:", err);
		setBackupMessage("backup.errReadFailed", "error");
		updateView();
		return;
	}

	const parsed = parseBackup(text);
	if (!parsed.ok) {
		setBackupMessage(IMPORT_ERROR_KEYS[parsed.reason] || "backup.errNotBackup", "error");
		updateView();
		return;
	}

	const confirmed = await openDialog({
		title: t("backup.importTitle"),
		body: t("backup.importBody"),
		confirmText: t("backup.importConfirm"),
		danger: true,
	});
	if (!confirmed) return;

	// Zero the keys BEFORE the write. actuallyPersist() bails on a locked
	// library, so this closes the window where a save already in flight could
	// land on top of the envelope we are about to store.
	zeroKeys();

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.envelope));
	} catch (err) {
		console.error("[backup] import failed:", err);
		setBackupMessage(
			err.name === "QuotaExceededError" || err.code === 22
				? "error.noSpace"
				: "backup.errWriteFailed",
			"error",
		);
		updateView();
		return;
	}

	// The banner may still be complaining about the library this one replaced.
	model.app.storageError = "";
	model.app.storageQuotaExceeded = false;

	logout();
	changePage("login");
	// After changePage, which clears it — the message has to survive the move.
	setAuthMessage("backup.importDone");
	updateView();
}
