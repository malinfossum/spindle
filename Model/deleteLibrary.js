// Deleting the library (v0.9). The order is the whole point: the covers and the
// stay-unlocked key go first, in one IndexedDB transaction, and only once that
// has committed does the library itself leave localStorage. A failed first step
// leaves everything exactly as it was. Pure, with the steps passed in, so Node
// can prove the order without a browser.
export async function wipeLibrary({ clearStores, removeLibrary, resetLookups }) {
	try {
		await clearStores();
	} catch (error) {
		return { ok: false, reason: "stores", error };
	}
	removeLibrary();
	resetLookups();
	return { ok: true };
}
