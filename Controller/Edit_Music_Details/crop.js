// Pointer, wheel and key handling for the crop dialog (v0.7), and since v0.8
// the turn button and the straighten slider. The frame
// lives here; View/Universal/cropFrame.js does its maths and
// View/Universal/cropDialog.js draws it. cropPhoto() starts from a frame and
// resolves with the frame I chose, in the photo's pixels, or null for Cancel,
// Escape and leaving the page.

import { formatNumber, t } from "../../Model/i18n/i18n.js";
import { openCropDialog } from "../../View/Universal/cropDialog.js";
import {
	canZoomIn,
	canZoomOut,
	clampFrame,
	keyStep,
	panBy,
	screenToPhoto,
	setTilt,
	turnQuarter,
	wheelFactor,
	ZOOM_STEP,
	zoomAt,
	zoomBy,
	zoomLevel,
} from "../../View/Universal/cropFrame.js";

// The straighten grid stays this long after the last change of tilt, then
// fades over GRID_FADE (or goes at once under reduced motion).
const GRID_LINGER = 500;
const GRID_FADE = 200;

export async function cropPhoto(bitmap, start) {
	const photo = { width: bitmap.width, height: bitmap.height };
	let frame = clampFrame(start, photo);
	const view = openCropDialog(bitmap);
	const { stage } = view;
	const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

	// One draw per frame, however many moves arrive in between.
	let queued = 0;
	let grid = 0;
	const paint = () => {
		if (!queued) {
			queued = requestAnimationFrame(() => {
				queued = 0;
				view.draw(frame, grid);
			});
		}
	};
	const update = (next) => {
		frame = next;
		view.setZoomLimits(canZoomIn(frame, photo), canZoomOut(frame, photo));
		view.showTilt(frame.tilt);
		paint();
	};
	update(frame);

	// The grid shows while the tilt changes, and fades once it has stopped.
	let gridTimer = 0;
	let fading = 0;
	const fadeGrid = () => {
		if (calm.matches) {
			grid = 0;
			paint();
			return;
		}
		const began = performance.now();
		const step = (now) => {
			grid = Math.max(0, 1 - (now - began) / GRID_FADE);
			paint();
			fading = grid > 0 ? requestAnimationFrame(step) : 0;
		};
		fading = requestAnimationFrame(step);
	};
	const showGrid = () => {
		cancelAnimationFrame(fading);
		fading = 0;
		grid = 1;
		paint();
		clearTimeout(gridTimer);
		gridTimer = setTimeout(fadeGrid, GRID_LINGER);
	};

	// How many photo pixels one CSS pixel of the stage covers, and a screen
	// point as a photo point.
	const photoPerPx = () => frame.side / Math.max(1, stage.clientWidth);
	const pointAt = (clientX, clientY) => {
		const box = stage.getBoundingClientRect();
		const scale = photoPerPx();
		return screenToPhoto(
			frame,
			(clientX - box.left - box.width / 2) * scale,
			(clientY - box.top - box.height / 2) * scale,
		);
	};

	// One pointer drags; two pinch around their midpoint.
	const pointers = new Map();
	stage.addEventListener("pointerdown", (event) => {
		stage.setPointerCapture(event.pointerId);
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
	});
	stage.addEventListener("pointermove", (event) => {
		const last = pointers.get(event.pointerId);
		if (!last) return;

		if (pointers.size === 1) {
			const scale = photoPerPx();
			pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
			update(
				panBy(
					frame,
					photo,
					(event.clientX - last.x) * scale,
					(event.clientY - last.y) * scale,
				),
			);
			return;
		}

		const [a, b] = [...pointers.values()];
		const before = Math.hypot(a.x - b.x, a.y - b.y);
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const [c, d] = [...pointers.values()];
		const after = Math.hypot(c.x - d.x, c.y - d.y);
		if (before === 0 || after === 0) return;
		const [mx, my] = pointAt((c.x + d.x) / 2, (c.y + d.y) / 2);
		// Fingers apart (after > before) is a smaller square: zoom in.
		update(zoomAt(frame, photo, frame.side * (before / after), mx, my));
	});
	const lift = (event) => pointers.delete(event.pointerId);
	stage.addEventListener("pointerup", lift);
	stage.addEventListener("pointercancel", lift);
	// Belt and braces: a pointer the stage loses by any other path is forgotten
	// too, so a stale finger can never turn the next drag into a pinch.
	stage.addEventListener("lostpointercapture", lift);

	// The wheel zooms around the cursor, 10 % a notch, by distance on a trackpad.
	stage.addEventListener(
		"wheel",
		(event) => {
			if (event.deltaY === 0) return;
			event.preventDefault();
			const [px, py] = pointAt(event.clientX, event.clientY);
			update(zoomBy(frame, photo, wheelFactor(event.deltaY, event.deltaMode), px, py));
		},
		{ passive: false },
	);

	// Arrows, + and -, and Enter for Use. Escape is the native dialog's own.
	// A key held with Ctrl, Cmd or Alt is the browser's (Ctrl + − is its zoom).
	stage.addEventListener("keydown", (event) => {
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		if (event.key === "Enter") {
			event.preventDefault();
			view.finish("use");
			return;
		}
		const next = keyStep(frame, photo, event.key, event.shiftKey);
		if (next === null) return;
		event.preventDefault();
		update(next);
	});

	// Every button press says what it did (v0.8). The slider needs no line:
	// its own value is spoken.
	const sayZoom = () =>
		view.say(t("crop.zoomLevel", { n: formatNumber(zoomLevel(frame, photo)) }));
	view.zoomIn.addEventListener("click", () => {
		update(zoomBy(frame, photo, ZOOM_STEP));
		sayZoom();
	});
	view.zoomOut.addEventListener("click", () => {
		update(zoomBy(frame, photo, 1 / ZOOM_STEP));
		sayZoom();
	});
	view.rotate.addEventListener("click", () => {
		update(turnQuarter(frame, photo));
		view.say(t("crop.rotated", { n: formatNumber(frame.quarter * 90) }));
	});
	view.tilt.addEventListener("input", () => {
		update(setTilt(frame, photo, Number(view.tilt.value)));
		showGrid();
	});
	view.cancel.addEventListener("click", () => view.finish("cancel"));
	view.use.addEventListener("click", () => view.finish("use"));

	// A phone turned sideways resizes the stage; the canvas follows.
	const resize = new ResizeObserver(() => update(frame));
	resize.observe(stage);

	const outcome = await view.closed;
	resize.disconnect();
	cancelAnimationFrame(queued);
	cancelAnimationFrame(fading);
	clearTimeout(gridTimer);
	return outcome === "use" ? frame : null;
}
