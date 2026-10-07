// Pointer, wheel and key handling for the crop dialog (v0.7), and since v0.8
// the turn button, the straighten slider and the two-finger twist. The frame
// lives here; View/Universal/cropFrame.js does its maths and
// View/Universal/cropDialog.js draws it. cropPhoto() starts from a frame and
// resolves with the frame I chose, in the photo's pixels, or null for Cancel,
// Escape and leaving the page.

import { formatNumber, t } from "../../Model/i18n/i18n.js";
import { openCropDialog } from "../../View/Universal/cropDialog.js";
import {
	angleDelta,
	canZoomIn,
	canZoomOut,
	clampFrame,
	keyStep,
	panBy,
	screenToPhoto,
	setTilt,
	settleTwist,
	turnQuarter,
	twistTilt,
	wheelFactor,
	ZOOM_STEP,
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

	// One pointer drags; two pinch around their midpoint and twist. A twist
	// remembers the tilt when the second finger landed, how far the fingers
	// have turned since, and the angle of the line between them last time.
	const pointers = new Map();
	let twist = null;
	const pair = () => [...pointers.values()].slice(0, 2);
	const lineAngle = (a, b) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

	stage.addEventListener("pointerdown", (event) => {
		stage.setPointerCapture(event.pointerId);
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if (pointers.size === 2) {
			const [a, b] = pair();
			twist = { startTilt: frame.tilt, turned: 0, angle: lineAngle(a, b) };
		}
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

		const [a, b] = pair();
		const before = Math.hypot(a.x - b.x, a.y - b.y);
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const [c, d] = pair();
		const after = Math.hypot(c.x - d.x, c.y - d.y);
		if (before === 0 || after === 0) return;

		const angle = lineAngle(c, d);
		twist.turned += angleDelta(twist.angle, angle);
		twist.angle = angle;
		const tilt = twistTilt(twist.startTilt, twist.turned);
		if (tilt !== frame.tilt) showGrid();

		const [mx, my] = pointAt((c.x + d.x) / 2, (c.y + d.y) / 2);
		// Fingers apart (after > before) is a smaller square: zoom in.
		update(setTilt(frame, photo, tilt, mx, my, before / after));
	});
	// pointerup, pointercancel and lostpointercapture can all arrive for one
	// finger; only the first one counts.
	const lift = (event) => {
		if (!pointers.delete(event.pointerId) || !twist) return;
		if (pointers.size >= 2) {
			// A third finger lifted, or one of the pair: carry on from the pair
			// that is left, without a jump.
			const [a, b] = pair();
			twist.angle = lineAngle(a, b);
			return;
		}
		// The gesture is over. Close to straight is straight.
		twist = null;
		const settled = settleTwist(frame.tilt);
		if (settled !== frame.tilt) update(setTilt(frame, photo, settled));
	};
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
