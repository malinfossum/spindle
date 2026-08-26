import {
	base64ToBytes,
	bytesToBase64,
	encryptLibrary,
	IV_BYTES,
	isCryptoAvailable,
	KDF_SALT_BYTES,
} from "./auth.js";
import { model } from "./model.js";

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "spindle:v1:state";
const STORAGE_PROBE_KEY = "__spindle_probe__";
export const QUOTA_WARN_PERCENT = 80;
const QUOTA_HARD_STOP_PERCENT = 95;
const VERIFY_HMAC_BYTES = 32;

function probeStorage() {
	try {
		localStorage.setItem(STORAGE_PROBE_KEY, "1");
		localStorage.removeItem(STORAGE_PROBE_KEY);
		return true;
	} catch {
		return false;
	}
}

// The single source of truth for the envelope's shape. Shared by readEnvelope()
// — which checks what localStorage holds — and by the backup importer in task J,
// which checks what a file holds. One checker means the two can never drift into
// disagreeing about what a valid envelope looks like. Returns:
//   { ok: false, reason: "old-shape" }    → a pre-task-C plain-JSON save
//   { ok: false, reason: "too-new" }      → written by a newer build of Spindle
//   { ok: false, reason: "corrupt", ... } → malformed
//   { ok: true, envelope }                → a valid encrypted envelope
export function validateEnvelope(parsed) {
	if (!parsed || typeof parsed !== "object") {
		return { ok: false, reason: "corrupt", message: "ugyldig format" };
	}

	// A newer schema may use fields, or a cipher, that this build does not
	// implement. Refusing is safer than half-understanding the data.
	if (typeof parsed.schemaVersion === "number" && parsed.schemaVersion > SCHEMA_VERSION) {
		return { ok: false, reason: "too-new", message: "nyere skjemaversjon" };
	}

	if ("library" in parsed || "app" in parsed) {
		return { ok: false, reason: "old-shape" };
	}

	const { kdfSalt, iv, verifyHmac, ciphertext } = parsed;
	if (!kdfSalt || !iv || !verifyHmac || !ciphertext) {
		return { ok: false, reason: "corrupt", message: "mangler felt" };
	}

	try {
		if (
			base64ToBytes(kdfSalt).length !== KDF_SALT_BYTES ||
			base64ToBytes(iv).length !== IV_BYTES ||
			base64ToBytes(verifyHmac).length !== VERIFY_HMAC_BYTES
		) {
			return { ok: false, reason: "corrupt", message: "ugyldige feltlengder" };
		}
		base64ToBytes(ciphertext);
	} catch {
		return { ok: false, reason: "corrupt", message: "ugyldig base64" };
	}

	return {
		ok: true,
		envelope: {
			schemaVersion: parsed.schemaVersion,
			kdfSalt,
			iv,
			verifyHmac,
			ciphertext,
		},
	};
}

// What localStorage holds, run through the shared shape check. Returns null when
// nothing is stored; otherwise a validateEnvelope() result.
export function readEnvelope() {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { ok: false, reason: "corrupt", message: "ugyldig JSON" };
	}

	return validateEnvelope(parsed);
}

// `message` on the error branch is an i18n key, ready for the storage banner.
export function loadState() {
	const result = readEnvelope();
	if (result === null) return { kind: "none" };
	if (result.ok) return { kind: "encrypted", envelope: result.envelope };
	if (result.reason === "old-shape") return { kind: "none" };
	if (result.reason === "too-new") {
		return { kind: "error", message: "storage.tooNew" };
	}
	return { kind: "error", message: "storage.corrupt" };
}

// persistState() is async and serialized: each call chains onto the previous so
// two quick saves can't race and overwrite each other. Both slots point to
// actuallyPersist so one rejected save doesn't break the chain for the next.
let saveChain = Promise.resolve();

export function persistState() {
	saveChain = saveChain.then(actuallyPersist, actuallyPersist);
	return saveChain;
}

async function actuallyPersist() {
	if (!model.app.crypto.unlocked) return;
	// Another tab owns the stored library now — see Controller/Universal/storageSync.js.
	// Writing our copy over it would erase whatever that tab has done since.
	if (model.app.libraryStale) return;

	const encryptKey = model.app.crypto.encryptKey;
	const kdfSaltB64 = model.app.crypto.kdfSaltB64;
	const verifyHmacB64 = model.app.crypto.verifyHmacB64;
	const plaintext = JSON.stringify(model.data);

	try {
		const { iv, ciphertext } = await encryptLibrary(encryptKey, plaintext);
		// Logged out, or another tab saved, while we were encrypting.
		if (!model.app.crypto.unlocked || model.app.libraryStale) return;

		const envelope = {
			schemaVersion: SCHEMA_VERSION,
			kdfSalt: kdfSaltB64,
			iv: bytesToBase64(iv),
			verifyHmac: verifyHmacB64,
			ciphertext: bytesToBase64(ciphertext),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
		model.app.storageError = "";
		model.app.storageQuotaExceeded = false;
	} catch (err) {
		console.error("[persistence] save failed:", err);
		if (err.name === "QuotaExceededError" || err.code === 22) {
			model.app.storageQuotaExceeded = true;
		} else {
			model.app.storageError = "storage.saveFailed";
		}
	}

	refreshStorageEstimate();
}

async function refreshStorageEstimate() {
	if (!navigator.storage?.estimate) {
		model.app.storage = null;
		return;
	}
	try {
		const est = await navigator.storage.estimate();
		const usage = est.usage || 0;
		const quota = est.quota || 0;
		const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
		model.app.storage = { usage, quota, percent };
	} catch {
		model.app.storage = null;
	}
}

export function isStorageNearFull() {
	const storage = model.app.storage;
	if (!storage) return false;
	return storage.percent >= QUOTA_HARD_STOP_PERCENT;
}

export function formatBytes(bytes) {
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
	// Web Crypto needs a secure context (https / localhost). Without it we can
	// neither encrypt nor decrypt, so stop here and explain via the storage banner.
	if (!isCryptoAvailable()) {
		model.app.storageError = "storage.needsHttps";
		console.warn("[persistence] Web Crypto unavailable — needs a secure context.");
		return;
	}

	if (!probeStorage()) {
		model.app.storageUnavailable = true;
		console.warn("[persistence] localStorage is disabled in this browser.");
		return;
	}

	const state = loadState();
	if (state.kind === "error") {
		model.app.storageError = state.message;
	}

	// Everyone lands on the welcome page; it offers both "Create library" and
	// "Log in" and emphasises the right one based on whether a library exists.
	model.app.currentPage = "welcome";

	refreshStorageEstimate();
})();
