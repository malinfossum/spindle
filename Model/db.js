// The one IndexedDB database, "spindle", and the helpers every store in it
// uses. They lived in covers.js while covers were the only store; the session
// key (v0.5) is the second, and auth.js cannot import them from covers.js —
// covers.js imports auth.js for the cipher, and that would be a cycle.
//
//   covers  — { id: "<uuid>", iv: Uint8Array(12), data: Uint8Array }, sealed
//             with the library key (see covers.js)
//   session — { id: "session", key: CryptoKey }, the non-extractable AES-GCM
//             key itself, kept only when "Stay unlocked" was ticked (see auth.js)

const DB_NAME = "spindle";
// 2 (v0.5) adds the session store. onupgradeneeded creates whichever store is
// missing, so a database at either version ends up with both.
const DB_VERSION = 2;
export const COVERS_STORE = "covers";
export const SESSION_STORE = "session";

let dbPromise = null;

export function openDb() {
	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;
			for (const name of [COVERS_STORE, SESSION_STORE]) {
				if (!db.objectStoreNames.contains(name))
					db.createObjectStore(name, { keyPath: "id" });
			}
		};

		request.onsuccess = () => {
			const db = request.result;
			// A newer build in another tab wants to upgrade: let go of this
			// connection so it can, and reopen lazily. A v0.4 tab never did this,
			// so the first upgrade to 2 waits for such a tab to close or reload.
			db.onversionchange = () => {
				db.close();
				dbPromise = null;
			};
			resolve(db);
		};
		request.onerror = () => reject(request.error);
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
export function run(store, work) {
	return new Promise((resolve, reject) => {
		const request = work(store);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function withStore(storeName, mode, work) {
	const db = await openDb();
	const tx = db.transaction(storeName, mode);
	const result = await work(tx.objectStore(storeName));

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
