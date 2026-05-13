const SCHEMA_VERSION = 1;
const STORAGE_KEY = "spindle:v1:state";
const STORAGE_PROBE_KEY = "__spindle_probe__";
const QUOTA_WARN_PERCENT = 80;
const QUOTA_HARD_STOP_PERCENT = 95;

function probeStorage() {
	try {
		localStorage.setItem(STORAGE_PROBE_KEY, "1");
		localStorage.removeItem(STORAGE_PROBE_KEY);
		return true;
	} catch (err) {
		return false;
	}
}

function loadState() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return null;

		if (parsed.schemaVersion !== SCHEMA_VERSION) {
			console.warn(
				"[persistence] unsupported schema version:",
				parsed.schemaVersion,
			);
			return null;
		}
		return parsed;
	} catch (err) {
		console.error("[persistence] loadState failed:", err);
		return null;
	}
}

function persistState() {
	if (model.app.storageUnavailable) return;

	const envelope = {
		schemaVersion: SCHEMA_VERSION,
		library: model.data,
		app: {
			loggedInID: model.app.loggedInID,
		},
	};

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
		model.app.storageError = "";
		model.app.storageQuotaExceeded = false;
	} catch (err) {
		if (err.name === "QuotaExceededError" || err.code === 22) {
			model.app.storageQuotaExceeded = true;
		} else {
			model.app.storageError =
				"Endringen din kunne ikke lagres. Eksporter dataen din snart for å unngå å miste den.";
		}
		console.error("[persistence] persistState failed:", err);
	}

	refreshStorageEstimate();
}

async function refreshStorageEstimate() {
	if (!navigator.storage || !navigator.storage.estimate) {
		model.app.storage = null;
		return;
	}
	try {
		const est = await navigator.storage.estimate();
		const usage = est.usage || 0;
		const quota = est.quota || 0;
		const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
		model.app.storage = { usage, quota, percent };
	} catch (err) {
		model.app.storage = null;
	}
}

function isStorageNearFull() {
	const storage = model.app.storage;
	if (!storage) return false;
	return storage.percent >= QUOTA_HARD_STOP_PERCENT;
}

function formatBytes(bytes) {
	if (!bytes || bytes < 0) return "0 B";
	const units = ["B", "kB", "MB", "GB"];
	let value = bytes;
	let i = 0;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}
	return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

(function bootPersistence() {
	if (!probeStorage()) {
		model.app.storageUnavailable = true;
		console.warn("[persistence] localStorage is disabled in this browser.");
		return;
	}

	const saved = loadState();
	if (saved && saved.library) {
		model.data = saved.library;
		if (saved.app && typeof saved.app.loggedInID !== "undefined") {
			model.app.loggedInID = saved.app.loggedInID;
			if (model.app.loggedInID !== null) {
				model.app.currentPage = "homePage";
			}
		}
	}

	refreshStorageEstimate();
})();
