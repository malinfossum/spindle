// The crop dialog (v0.7), shaped like dialog.js and scanner.js: a native
// <dialog> from showModal(), text written with textContent. It draws and it
// reports. Moving the frame (pointer, wheel and keys) is the Controller's
// job, in Controller/Edit_Music_Details/crop.js.
//
// The photo is drawn on a <canvas>, not an <img>: an <img> would need a blob:
// URL, and img-src allows 'self' and data: only.
//
// There is no backdrop dismiss, unlike the confirm dialog. On a desktop a drag
// that ends outside the box would land as a backdrop click and throw the crop
// away; on a phone the dialog fills the screen and has no backdrop. Cancel and
// Escape are the ways out.

import { t } from "../../Model/i18n/i18n.js";
import { frameTransform } from "./cropFrame.js";

// The stage redraws on every move, and a 48-megapixel phone photo is larger
// than many phone GPUs take as one texture. So the stage draws from a copy at
// most this long on its long side. The saved cover is still cut from the
// full photo; only the preview comes from the copy. A normal 12-megapixel
// photo (4000 × 3000) is under the limit and gets no copy.
const DISPLAY_EDGE = 4096;

function displayCopy(bitmap) {
	const scale = Math.min(1, DISPLAY_EDGE / Math.max(bitmap.width, bitmap.height));
	if (scale === 1) return { source: bitmap, scale: 1, release() {} };
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) return { source: bitmap, scale: 1, release() {} };
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return {
		source: canvas,
		scale: canvas.width / bitmap.width,
		// A zero-size canvas hands its memory back at once, not at the next GC.
		release() {
			canvas.width = 0;
			canvas.height = 0;
		},
	};
}

function button(className, text, label) {
	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = className;
	btn.textContent = text;
	if (label) btn.setAttribute("aria-label", label);
	return btn;
}

export function openCropDialog(bitmap) {
	const dialog = document.createElement("dialog");
	dialog.className = "dialog dialog-crop";
	dialog.setAttribute("aria-labelledby", "crop-title");

	const heading = document.createElement("h2");
	heading.className = "dialog-title";
	heading.id = "crop-title";
	heading.textContent = t("crop.title");

	// role="application" makes a screen reader pass the arrow keys through
	// instead of reading the page with them. This is the one widget in the app
	// where that is right.
	const stage = document.createElement("div");
	stage.className = "crop-stage";
	stage.tabIndex = 0;
	stage.setAttribute("role", "application");
	stage.setAttribute("aria-label", t("crop.stage"));
	stage.setAttribute("aria-describedby", "crop-hint");
	const canvas = document.createElement("canvas");
	canvas.setAttribute("aria-hidden", "true");
	stage.append(canvas);

	const hint = document.createElement("p");
	hint.className = "dialog-body crop-hint";
	hint.id = "crop-hint";
	hint.textContent = t("crop.hint");

	const zoomOut = button("btn crop-zoom", "−", t("crop.zoomOut"));
	const zoomIn = button("btn crop-zoom", "+", t("crop.zoomIn"));
	const cancel = button("btn btn-ghost", t("dialog.cancel"));
	const use = button("btn btn-accent", t("crop.use"));

	// Two pairs, so a row that does not fit wraps as zoom, then Cancel and Use.
	const zoomPair = document.createElement("div");
	zoomPair.className = "crop-pair";
	zoomPair.append(zoomOut, zoomIn);
	const answerPair = document.createElement("div");
	answerPair.className = "crop-pair crop-answer";
	answerPair.append(cancel, use);
	const actions = document.createElement("div");
	actions.className = "dialog-actions crop-actions";
	actions.append(zoomPair, answerPair);

	dialog.append(heading, stage, hint, actions);
	document.body.appendChild(dialog);

	const buttons = [zoomOut, zoomIn, cancel, use];
	const preview = displayCopy(bitmap);

	// Once only: the first answer disables every button, so a double tap on
	// Use cannot encode twice.
	function finish(outcome) {
		if (!dialog.open) return;
		for (const btn of buttons) btn.disabled = true;
		dialog.close(outcome);
	}

	const closed = new Promise((resolve) => {
		// Back or forward while cropping: same echo test as dialog.js.
		const openedOn = window.location.hash;
		const onLeave = () => {
			if (window.location.hash !== openedOn) finish("dismiss");
		};
		window.addEventListener("hashchange", onLeave);

		// The one exit. Escape closes with an empty returnValue.
		dialog.addEventListener("close", () => {
			window.removeEventListener("hashchange", onLeave);
			preview.release();
			dialog.remove();
			resolve(dialog.returnValue === "" ? "dismiss" : dialog.returnValue);
		});
	});

	// The canvas is the stage's CSS size × devicePixelRatio, so the photo is
	// sharp on a phone. It is resized only when that size changed.
	function draw(frame) {
		const px = Math.max(1, Math.round(stage.clientWidth * window.devicePixelRatio));
		if (canvas.width !== px) {
			canvas.width = px;
			canvas.height = px;
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, px, px);
		ctx.imageSmoothingQuality = "high";
		// Turned, tilted and zoomed by the frame, from the copy when there is
		// one. The saved cover is drawn through the same transform.
		ctx.setTransform(...frameTransform(frame, px, preview.scale));
		ctx.drawImage(preview.source, 0, 0);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	// A zoom button that disables itself while focused would drop focus to
	// <body>, so focus moves to the other one first.
	function setZoomLimits(canIn, canOut) {
		if (!canIn && document.activeElement === zoomIn) zoomOut.focus();
		if (!canOut && document.activeElement === zoomOut) zoomIn.focus();
		zoomIn.disabled = !canIn;
		zoomOut.disabled = !canOut;
	}

	dialog.showModal();
	stage.focus();

	return { stage, zoomIn, zoomOut, cancel, use, draw, setZoomLimits, finish, closed };
}
