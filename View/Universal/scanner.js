// Live barcode scanner in a native <dialog>, shaped like dialog.js (v0.4).
// openScanner() resolves to a digit string, or null on any other exit.
//
// The invariant is track shutdown, not the happy path: a stream that outlives
// the dialog is the one thing that would make the browser's camera indicator
// lie. Every exit — a match, Close, Esc, backdrop, Back — goes through the
// same function, and that function stops every track first.

import { t } from "../../Model/i18n/i18n.js";
import { model, normalizeBarcode } from "../../Model/model.js";

// At most five detections a second. A timestamp check on requestAnimationFrame
// rather than setInterval, so it stops with the tab.
const DETECT_EVERY_MS = 200;

export function openScanner() {
	return new Promise((resolve) => {
		const opener = document.activeElement;

		const dialog = document.createElement("dialog");
		dialog.className = "dialog dialog-scanner";
		dialog.setAttribute("aria-labelledby", "scanner-title");

		const heading = document.createElement("h2");
		heading.className = "dialog-title";
		heading.id = "scanner-title";
		heading.textContent = t("scanner.title");

		const video = document.createElement("video");
		video.className = "scanner-video";
		video.autoplay = true;
		video.muted = true;
		video.playsInline = true;

		const hint = document.createElement("p");
		hint.className = "dialog-body";
		hint.textContent = t("scanner.hint");

		const actions = document.createElement("div");
		actions.className = "dialog-actions";
		const closeBtn = document.createElement("button");
		closeBtn.className = "btn btn-ghost";
		closeBtn.textContent = t("scanner.close");
		closeBtn.addEventListener("click", () => dialog.close("cancel"));
		actions.append(closeBtn);

		dialog.append(heading, video, hint, actions);
		document.body.appendChild(dialog);

		let stream = null;
		let result = null;
		let frame = 0;

		dialog.addEventListener("click", (event) => {
			const box = dialog.getBoundingClientRect();
			const clickedInside =
				event.clientX >= box.left &&
				event.clientX <= box.right &&
				event.clientY >= box.top &&
				event.clientY <= box.bottom;
			if (!clickedInside) dialog.close("cancel");
		});

		// Back or forward while scanning: same echo test as dialog.js.
		const openedOn = window.location.hash;
		const onLeave = () => {
			if (window.location.hash !== openedOn) dialog.close("cancel");
		};
		window.addEventListener("hashchange", onLeave);

		// The one exit.
		dialog.addEventListener("close", () => {
			cancelAnimationFrame(frame);
			for (const track of stream?.getTracks() ?? []) track.stop();
			video.srcObject = null;
			window.removeEventListener("hashchange", onLeave);
			dialog.remove();
			if (opener?.isConnected && typeof opener.focus === "function") opener.focus();
			else document.getElementById("music-barcode")?.focus();
			resolve(dialog.returnValue === "match" ? result : null);
		});

		dialog.showModal();
		closeBtn.focus();

		navigator.mediaDevices
			.getUserMedia({ video: { facingMode: "environment" } })
			.then((granted) => {
				// Closed before the permission prompt was answered.
				if (!dialog.open) {
					for (const track of granted.getTracks()) track.stop();
					return;
				}
				stream = granted;
				video.srcObject = stream;

				const detector = new BarcodeDetector({ formats: model.app.scanFormats });
				let last = 0;
				const tick = async (now) => {
					if (!dialog.open) return;
					frame = requestAnimationFrame(tick);
					if (now - last < DETECT_EVERY_MS || video.readyState < 2) return;
					last = now;

					let found;
					try {
						found = await detector.detect(video);
					} catch {
						// A frame that cannot be decoded is just the next frame.
						return;
					}
					for (const code of found) {
						const digits = normalizeBarcode(code.rawValue);
						if (digits === "") continue;
						result = digits;
						dialog.close("match");
						return;
					}
				};
				frame = requestAnimationFrame(tick);
			})
			.catch(() => {
				// The .then above may have thrown after assigning stream (for
				// example the BarcodeDetector constructor) — stop it here too.
				for (const track of stream?.getTracks() ?? []) track.stop();
				stream = null;
				// Refused, no camera, or anything else: say so, keep Close.
				hint.textContent = t("error.cameraUnavailable");
				hint.setAttribute("role", "alert");
				video.remove();
			});
	});
}
