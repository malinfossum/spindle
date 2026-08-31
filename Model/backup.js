// Spindle — backup file format (v0.1 task J).
//
// Export is deliberately NOT a crypto operation. The envelope already sitting in
// localStorage IS the encrypted artifact, so an encrypted backup is a file-write
// of exactly those bytes. Re-encrypting would require the library to be unlocked
// and would gain nothing — worse, it would mean a backup could only ever be made
// by someone who can already open the library, which is the wrong way round.
//
// Model layer: builds and validates plain objects only. Blobs, downloads and
// file pickers belong to Controller/Universal/backup.js.

import { base64ToBytes, bytesToBase64 } from "./auth.js";
import { readAllRows, readCover } from "./covers.js";
import { model } from "./model.js";
import { readEnvelope, validateEnvelope } from "./persistence.js";

const BACKUP_FORMAT = "spindle-backup";
const BACKUP_APP_VERSION = "0.1";

// Filenames are not UI strings — they stay English in both languages so a file
// keeps its meaning when it is moved between machines or e-mailed on.
export function backupFilename(kind) {
	const date = new Date().toISOString().slice(0, 10);
	const suffix = kind === "plaintext" ? "-plaintext" : "";
	return `spindle-backup-${date}${suffix}.json`;
}

// The stored envelope, wrapped in a thin outer object that names the format and
// the build that wrote it, plus the cover rows.
//
// Still works while the library is locked, which is the property worth
// protecting: covers are stored already encrypted, with the same key as the
// envelope, so they are copied out as ciphertext exactly as the envelope is. The
// bytes are base64'd only because JSON cannot hold a Uint8Array.
export async function buildEncryptedBackup() {
	const result = readEnvelope();
	if (result === null) return { ok: false, reason: "noLibrary" };
	if (!result.ok) {
		return { ok: false, reason: result.reason === "too-new" ? "tooNew" : "corrupt" };
	}

	let covers = [];
	try {
		covers = (await readAllRows()).map((row) => ({
			id: row.id,
			iv: bytesToBase64(row.iv),
			data: bytesToBase64(row.data),
		}));
	} catch (err) {
		// A backup without covers still restores the library, and refusing to make
		// one because IndexedDB is unavailable would be the worse failure.
		console.warn("[backup] covers could not be read:", err);
	}

	return {
		ok: true,
		backup: {
			format: BACKUP_FORMAT,
			appVersion: BACKUP_APP_VERSION,
			kind: "encrypted",
			exportedAt: new Date().toISOString(),
			envelope: result.envelope,
			covers,
		},
	};
}

// Serialises the decrypted library, so it needs an unlocked one. Opt-in only —
// the controller puts an explicit warning in front of this.
//
// Covers are decrypted into it as data URLs. That is what "readable copy" means,
// and leaving them out would make the readable copy the only export that loses
// half the library.
export async function buildPlaintextBackup() {
	if (!model.app.crypto.unlocked) return { ok: false, reason: "locked" };

	const covers = {};
	for (const album of model.data.musicInfo) {
		if (!album.coverId) continue;
		const dataUrl = await readCover(album.coverId);
		if (dataUrl) covers[album.coverId] = dataUrl;
	}

	return {
		ok: true,
		backup: {
			format: BACKUP_FORMAT,
			appVersion: BACKUP_APP_VERSION,
			kind: "plaintext",
			exportedAt: new Date().toISOString(),
			data: model.data,
			covers,
		},
	};
}

// Reads an incoming file's text and decides whether it holds an envelope this
// build can restore. The shape check itself is validateEnvelope() in
// persistence.js — the same one the stored library goes through — so import and
// load can never drift apart on what "valid" means.
//
// A bare envelope is accepted alongside the wrapper: someone who copies the
// localStorage value out by hand should still be able to get their library back.
// The format marker is informational; validation is the actual gate.
//
// Returns { ok: true, envelope } or { ok: false, reason } where reason maps to
// one of the backup.err* strings.
export function parseBackup(text) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		return { ok: false, reason: "notJson" };
	}

	if (!parsed || typeof parsed !== "object") {
		return { ok: false, reason: "notJson" };
	}

	// A plaintext export is a one-way door in v0.1: restoring one would mean
	// validating every field of an untrusted library and re-encrypting it with
	// the live key. Say that plainly instead of failing as "unreadable".
	if (parsed.kind === "plaintext" || (!parsed.envelope && parsed.data)) {
		return { ok: false, reason: "plaintextFile" };
	}

	const result = validateEnvelope(parsed.envelope ? parsed.envelope : parsed);
	if (result.reason === "too-new") return { ok: false, reason: "tooNew" };
	if (!result.ok) return { ok: false, reason: "notBackup" };

	return { ok: true, envelope: result.envelope, covers: parseCoverRows(parsed.covers) };
}

// Cover rows from a backup file, back as bytes. Anything malformed is dropped
// rather than failing the import: a library restored without one cover beats a
// library not restored at all, and every row is opaque ciphertext here anyway —
// it is only proved good when the key that opens the envelope decrypts it.
function parseCoverRows(covers) {
	if (!Array.isArray(covers)) return [];

	const rows = [];
	for (const row of covers) {
		if (!row || typeof row.id !== "string" || typeof row.iv !== "string") continue;
		if (typeof row.data !== "string") continue;

		try {
			rows.push({ id: row.id, iv: base64ToBytes(row.iv), data: base64ToBytes(row.data) });
		} catch {
			console.warn("[backup] skipped a malformed cover row");
		}
	}

	return rows;
}
