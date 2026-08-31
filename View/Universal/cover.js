// Drawing a cover that lives in IndexedDB.
//
// Reading one is asynchronous, and every render in this app is synchronous — so
// a render draws what it already has and a pass afterwards fills in the rest.
// The alternative, loading every cover into memory at unlock, is what the move
// to IndexedDB was meant to avoid: a thousand albums would mean a thousand
// decrypted images held for the whole session.
//
// So: coverInner() draws the cached image if there is one and the disc
// placeholder if there is not, the wrapper carries data-cover-id, and
// hydrateCovers() runs after updateView() and replaces the placeholders it can.
// A re-render of an already-seen cover is instant, because the cache answers.
//
// The cache holds decrypted images, so logout clears it.

import { readCover } from "../../Model/covers.js";
import { t } from "../../Model/i18n/i18n.js";
import { escapeHtml } from "./escape.js";
import { icon } from "./icons.js";

const cache = new Map();

// Ids that came back empty — a deleted row, or one belonging to another
// library. Without this every render would queue the same doomed read again.
const missing = new Set();

export function clearCoverCache() {
	cache.clear();
	missing.clear();
}

function imgMarkup(dataUrl) {
	return /*HTML*/ `<img src="${escapeHtml(dataUrl)}" alt="${t("music.coverAlt")}">`;
}

// The attribute that marks a slot for hydration. Nothing to hydrate for an
// album with no stored cover, or one still carrying an inline one, so the
// attribute is left off entirely in those cases.
export function coverAttr(album) {
	return album?.coverId && !album.coverImg ? ` data-cover-id="${escapeHtml(album.coverId)}"` : "";
}

// What goes inside the slot right now: the image if there is one to draw, the
// placeholder if there is not. iconSize matches the slot it sits in, and the
// form asks for a different placeholder — a picture frame reads as "choose one",
// where the disc reads as "this is an album".
//
// coverImg is the pre-v0.3 inline cover. migrateInlineCovers() moves those into
// IndexedDB at the next unlock, but drawing them here as well means a library
// that has not been through that — a migration that failed, a tab that has not
// reloaded — shows its covers rather than appearing to have lost them.
export function coverInner(album, iconSize, placeholder = "disc") {
	if (album?.coverImg) return imgMarkup(album.coverImg);

	const cached = album?.coverId ? cache.get(album.coverId) : null;
	return cached ? imgMarkup(cached) : icon(placeholder, { size: iconSize });
}

// Fills in every slot whose cover is not cached yet. Reads run in parallel and
// each one paints as it lands, so one slow decrypt does not hold up the others.
export async function hydrateCovers(root) {
	const slots = [...root.querySelectorAll("[data-cover-id]")];
	if (slots.length === 0) return;

	const pending = new Map();

	for (const slot of slots) {
		const id = slot.dataset.coverId;
		if (missing.has(id)) continue;

		const cached = cache.get(id);
		if (cached) {
			// Already decrypted, but this slot was drawn before the cache had it.
			if (!slot.querySelector("img")) slot.innerHTML = imgMarkup(cached);
			continue;
		}

		if (!pending.has(id)) pending.set(id, []);
		pending.get(id).push(slot);
	}

	await Promise.all(
		[...pending.entries()].map(async ([id, targets]) => {
			const dataUrl = await readCover(id);

			if (!dataUrl) {
				missing.add(id);
				return;
			}

			cache.set(id, dataUrl);

			// The DOM may have been replaced while this was decrypting — a
			// navigation, a filter change — so only paint slots still on the page.
			for (const slot of targets) {
				if (slot.isConnected) slot.innerHTML = imgMarkup(dataUrl);
			}
		}),
	);
}

// After a cover is replaced or removed, so the next render does not paint the
// old picture from cache.
export function forgetCover(coverId) {
	if (!coverId) return;
	cache.delete(coverId);
	missing.delete(coverId);
}
