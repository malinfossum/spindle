// Barcode → album fields (v0.4), and the cover that follows (v0.5). One
// number does at most one lookup and one cover request, and nothing goes out
// before the look-ups question has been answered yes once.
//
// The flow is a straight line, runLookup(): check the library, check the pref,
// send, fill, fetch the cover. The button and the scanner both call it — a
// scan is the press. Each stop renders and says where focus goes, because
// updateView() replaces #app and would otherwise drop it on <body>.

import { t } from "../../Model/i18n/i18n.js";
import { blankLookup, model, normalizeBarcode } from "../../Model/model.js";
import { fetchCover, lookupBarcode } from "../../Model/musicbrainz.js";
import { getPref, setPref } from "../../Model/prefs.js";
import { findByBarcode } from "../../Model/selectors.js";
import { openDialog } from "../../View/Universal/dialog.js";
import { downscaleCover } from "../../View/Universal/downscale.js";
import { renderFieldError } from "../../View/Universal/fieldError.js";
import { openScanner } from "../../View/Universal/scanner.js";
import { sniffImageType } from "../../View/Universal/sniff.js";
import { appRoot, updateView } from "../../View/Universal/updateView.js";

const LOOKUP_TIMEOUT_MS = 10_000;

// The four fields a match may fill, in the order focus is offered after a
// fill, and the input id each one renders as.
const FILLABLE = [
	["artist", "music-artist"],
	["title", "music-title"],
	["releaseYear", "music-year"],
	["format", "music-format"],
];

function focusById(id) {
	const node = appRoot.querySelector(`#${id}`);
	if (node) node.focus();
}

function failWith(errorKey) {
	const form = model.viewState.musicForm;
	form.errors.barcode = errorKey;
	form.lookup.status = "idle";
	form.lookup.cover = null;
	form.lookup.controller = null;
	updateView();
	focusById("music-barcode");
}

// Writes a match into the working copy — only into fields still empty. A
// lookup never overwrites something the person typed. The barcode is always
// set: it is what the fields were looked up by. Nothing reaches model.data
// until Save, exactly as the cover preview. The text fields are filled and
// shown before the cover request starts, so a cover failure never costs the
// metadata.
async function fill(match, digits) {
	const info = model.viewState.musicInfo;
	const lookup = model.viewState.musicForm.lookup;
	let firstFilled = null;

	for (const [field, id] of FILLABLE) {
		const value = match[field === "releaseYear" ? "year" : field];
		const empty = info[field] === "" || info[field] === null;
		if (!empty || value === "" || value === null) continue;
		info[field] = value;
		firstFilled ??= id;
	}

	info.barcode = digits;
	lookup.matches = [];
	lookup.filled = { artist: match.artist, title: match.title };
	lookup.cover = null;
	lookup.status = "idle";
	// The cover request that follows hangs off the same controller, so leaving
	// the page or editing the number aborts it exactly as it aborts the lookup.
	const controller = new AbortController();
	lookup.controller = controller;
	updateView();
	focusById(firstFilled ?? "music-barcode");

	await addCover(match, controller);
}

// Fetches the front cover for a filled match — only when the cover field is
// still empty, the same fill-only-empty rule as the text fields. The blob is
// trusted by its bytes, not its header: the same sniff a chosen file gets,
// then the same downscale, so a fetched cover is stored exactly as a photo.
// Every exit but two writes lookup.cover and re-renders the line: an abort
// (the page moved on, the number changed) says nothing, and a cover the
// person chose while the archive was slow wins silently — they already have
// what they wanted.
async function addCover(match, controller) {
	const form = model.viewState.musicForm;

	if (form.coverPreview) return settleCover(null, controller);
	if (match.releaseGroupId === "") return settleCover("none", controller);

	let result;
	try {
		result = await fetchCover(
			match.releaseGroupId,
			AbortSignal.any([controller.signal, AbortSignal.timeout(LOOKUP_TIMEOUT_MS)]),
		);
	} catch {
		result = { status: "failed" };
	}
	if (form.lookup.controller !== controller) return;

	if (result.status !== "ok") return settleCover(result.status, controller);

	const mime = await sniffImageType(result.blob);
	const dataUrl = mime ? await downscaleCover(result.blob) : null;
	if (form.lookup.controller !== controller) return;
	if (!dataUrl) return settleCover("failed", controller);

	if (form.coverPreview) return settleCover(null, controller);
	form.coverPreview = dataUrl;
	settleCover("added", controller);
}

// Ends the cover step: records the result, drops the controller, re-renders,
// and puts focus back where the fill left it — updateView() replaces the
// field that had it.
function settleCover(state, controller) {
	const lookup = model.viewState.musicForm.lookup;
	if (lookup.controller !== controller) return;
	lookup.cover = state;
	lookup.controller = null;
	const active = document.activeElement?.id;
	updateView();
	if (active) focusById(active);
}

// The button. Validates the field, then hands over to the one path.
export async function lookupPressed(event) {
	event.preventDefault();

	const form = model.viewState.musicForm;
	// The button is disabled while busy, but Enter in the small form is not.
	if (form.lookup.status === "busy") return;

	const field = appRoot.querySelector("#music-barcode");
	const digits = normalizeBarcode((field?.value ?? "").replace(/\s/g, ""));
	if (digits === "") {
		// Patched in place, the way barcodeTyped patches: a re-render would
		// drop the typed value back to "" and take the error with it.
		form.errors.barcode = "error.barcodeInvalid";
		if (field) {
			renderFieldError(field, "error.barcodeInvalid");
			field.focus();
		}
		return;
	}

	await runLookup(digits);
}

// The one path, whichever way the number arrived (v0.5): owned check, pref,
// fetch, fill, cover. `digits` is already a valid barcode.
async function runLookup(digits) {
	const form = model.viewState.musicForm;
	const lookup = form.lookup;
	if (lookup.status === "busy") return;

	// A valid press starts clean: whatever the last press said about this
	// number no longer applies.
	form.errors.barcode = "";

	// Already on the shelf? One press tells, the next press goes — a second
	// copy is legitimate, and the two-press shape is the same for someone who
	// cannot see the note appear. A scan must not add a copy quietly either,
	// so a second scan of the same sleeve is the second press.
	const owned = findByBarcode(digits, model.viewState.musicInfo.id);
	if (owned && lookup.owned !== owned.id) {
		lookup.owned = owned.id;
		updateView();
		focusById("music-barcode-owned");
		return;
	}

	const pref = getPref("lookups");
	if (pref === "off") {
		// No means no: nothing is asked, the line says where to turn it on,
		// and the number stays in the field.
		lookup.status = "off";
		updateView();
		focusById("music-barcode");
		return;
	}
	if (pref === "unset") {
		const agreed = await openDialog({
			title: t("dialog.lookupTitle"),
			body: t("dialog.lookupBody"),
			confirmText: t("dialog.lookupConfirm"),
			cancelText: t("dialog.lookupCancel"),
		});
		if (!agreed) return;
		setPref("lookups", "on");
	}

	const controller = new AbortController();
	lookup.status = "busy";
	lookup.controller = controller;
	lookup.filled = null;
	lookup.cover = null;
	lookup.matches = [];
	updateView();

	let result;
	try {
		result = await lookupBarcode(
			digits,
			AbortSignal.any([controller.signal, AbortSignal.timeout(LOOKUP_TIMEOUT_MS)]),
		);
	} catch {
		result = { status: "failed" };
	}

	// The page moved on (resetLookup() aborted us) or a newer press replaced
	// us: whatever came back is about a form that is gone.
	if (model.viewState.musicForm.lookup.controller !== controller) return;

	if (result.status === "busy") return failWith("error.lookupBusy");
	if (result.status === "failed") return failWith("error.lookupFailed");
	if (result.matches.length === 0) return failWith("error.barcodeNoMatch");

	if (result.matches.length === 1) {
		await fill(result.matches[0], digits);
		return;
	}

	lookup.matches = result.matches;
	lookup.status = "idle";
	lookup.controller = null;
	updateView();
	const first = appRoot.querySelector('[data-action="barcode-pick"]');
	if (first) first.focus();
}

export function pickMatch(index) {
	const match = model.viewState.musicForm.lookup.matches[index];
	// A stale render: the list this button came from is gone.
	if (!match) return;
	const field = appRoot.querySelector("#music-barcode");
	void fill(match, normalizeBarcode((field?.value ?? "").replace(/\s/g, "")));
}

// Any input in the field: the number the notes were about is gone, so the
// error, the match list, the owned note and the status go with it — patched
// in place, because a re-render on every keystroke would drop focus.
export function barcodeTyped(input) {
	const form = model.viewState.musicForm;
	model.viewState.musicInfo.barcode = normalizeBarcode(input.value.replace(/\s/g, ""));

	const controller = form.lookup.controller;
	form.lookup = blankLookup();
	// A request in flight is about a number that is being changed.
	controller?.abort();

	form.errors.barcode = "";
	renderFieldError(input, "");
	const matches = appRoot.querySelector("#music-lookup-matches");
	if (matches) matches.hidden = true;
	const owned = appRoot.querySelector("#music-barcode-owned");
	if (owned) owned.remove();
	const status = appRoot.querySelector("#music-lookup-status");
	if (status) status.textContent = "";
	const btn = appRoot.querySelector("#music-lookup-btn");
	if (btn) {
		btn.disabled = false;
		btn.setAttribute("aria-busy", "false");
	}
}

// A scan is the press (v0.5): the digits land in the field and the one path
// runs. The field is only re-typed when the number changed — re-typing the
// same number would blank the owned note, and a second scan of the same
// sleeve has to be the second press that sends.
export async function scanPressed() {
	const digits = await openScanner();
	if (digits === null) return;

	const field = appRoot.querySelector("#music-barcode");
	if (!field) return;
	if (field.value !== digits) {
		field.value = digits;
		barcodeTyped(field);
	}
	await runLookup(digits);
}
