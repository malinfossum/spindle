// Cover images, kept in IndexedDB.
//
// They used to live inside the library JSON, which meant inside the one
// localStorage value — and localStorage is capped at a handful of megabytes per
// origin however much disk the browser actually offers. A cover is up to 2 MB of
// base64, so a few dozen of them filled the only store the library had. The
// metadata stays in localStorage, where it is small and where the existing
// envelope, verification and cross-tab logic already live; only the images move.
//
// They move encrypted. A cover is a picture of something someone owns, so
// storing it in the clear beside an encrypted library would be a hole in the
// promise rather than a change of container. Each row holds its own IV and
// ciphertext, sealed with the same key as the library:
//
//   { id: "<uuid>", iv: Uint8Array(12), data: Uint8Array }
//
// One useful consequence: an encrypted backup can copy these rows out verbatim
// without a key, exactly as it copies the envelope out of localStorage, so
// export still works while the library is locked.

import { decryptLibrary, encryptLibrary } from "./auth.js";
import { model } from "./model.js";

const DB_NAME = "spindle";
const DB_VERSION = 1;
const STORE = "covers";

let dbPromise = null;

function openDb() {
	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE, { keyPath: "id" });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		// Another tab is holding an older version open. Nothing here upgrades
		// across versions yet, so this only matters when one does.
		request.onblocked = () => reject(new Error("IndexedDB upgrade blocked by another tab"));
	}).catch((err) => {
		// A failed open must not be cached as a permanent no: private-mode and
		// storage-blocked failures can clear between attempts.
		dbPromise = null;
		throw err;
	});

	return dbPromise;
}

// One place that turns a request into a promise, so no call site writes its own
// onsuccess/onerror pair.
function run(store, work) {
	return new Promise((resolve, reject) => {
		const request = work(store);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function withStore(mode, work) {
	const db = await openDb();
	const tx = db.transaction(STORE, mode);
	const result = await work(tx.objectStore(STORE));

	// Resolve on the transaction, not on the request: a write is not durable
	// until its transaction commits, and reporting success before then would let
	// the app navigate away from a save that has not landed.
	await new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
	});

	return result;
}

export function newCoverId() {
	return crypto.randomUUID();
}

// Encrypts and stores one cover. Needs the library unlocked, since the key is
// the library's own.
export async function putCover(id, dataUrl) {
	if (!model.app.crypto.unlocked) throw new Error("cannot store a cover while locked");

	const { iv, ciphertext } = await encryptLibrary(model.app.crypto.encryptKey, dataUrl);
	await withStore("readwrite", (store) => run(store, (s) => s.put({ id, iv, data: ciphertext })));
}

// The decrypted data URL, or null when there is no such row. A row that fails to
// decrypt is treated the same way: it belongs to a different library, and a
// missing cover is better than a thrown render.
export async function readCover(id) {
	if (!id || !model.app.crypto.unlocked) return null;

	const row = await withStore("readonly", (store) => run(store, (s) => s.get(id)));
	if (!row) return null;

	try {
		return await decryptLibrary(model.app.crypto.encryptKey, row.iv, row.data);
	} catch (err) {
		console.warn("[covers] could not decrypt cover:", id, err);
		return null;
	}
}

export async function deleteCover(id) {
	if (!id) return;
	await withStore("readwrite", (store) => run(store, (s) => s.delete(id)));
}

// Every row as stored — still encrypted. This is what the backup writes out.
export async function readAllRows() {
	return withStore("readonly", (store) => run(store, (s) => s.getAll()));
}

// Replaces the whole store with rows from a backup. Import replaces the library
// outright, so the covers of the library being replaced go with it.
export async function replaceAllRows(rows) {
	await withStore("readwrite", async (store) => {
		await run(store, (s) => s.clear());
		for (const row of rows) {
			await run(store, (s) => s.put(row));
		}
	});
}

// Drops rows no album points at any more. Deleting an album deletes its cover
// directly; this catches what a crash, a restored backup or an older build left
// behind, and runs once per unlock.
export async function pruneCovers(keepIds) {
	const keep = new Set(keepIds.filter(Boolean));
	const rows = await readAllRows();
	const orphans = rows.filter((row) => !keep.has(row.id));

	for (const row of orphans) {
		await deleteCover(row.id);
	}

	return orphans.length;
}

// Moves covers out of a library that still carries them inline. Runs after every
// unlock: it is what turns a v0.2 library into a v0.3 one, and it is a no-op the
// second time. Returns true when something changed, so the caller knows to save.
//
// A cover that cannot be written is left on the album rather than dropped — a
// library that is still too big to save is a better outcome than one that
// silently lost its artwork.
export async function migrateInlineCovers() {
	let changed = false;

	for (const album of model.data.musicInfo) {
		if (typeof album.coverImg === "string" && album.coverImg) {
			const id = newCoverId();
			try {
				await putCover(id, album.coverImg);
				album.coverId = id;
			} catch (err) {
				// Leave the cover on the album: a library that is still too big to
				// save beats one that quietly lost its artwork.
				console.error("[covers] migration failed for album", album.id, err);
				continue;
			}
		}

		// Every album ends up with the v0.3 shape, including the ones that never
		// had a cover: coverId present, coverImg gone. Left alone, `coverImg: null`
		// would sit in the library and in every export from here on.
		if ("coverImg" in album) {
			delete album.coverImg;
			changed = true;
		}
		if (album.coverId === undefined) {
			album.coverId = null;
			changed = true;
		}
	}

	return changed;
}
