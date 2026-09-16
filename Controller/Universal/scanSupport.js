// Decides once, at boot, whether the live scanner can be offered (v0.4).
//
// "BarcodeDetector" in window is not enough: desktop Chrome on Windows and
// Linux exposes the constructor and reports no formats, so the camera would
// open and no frame would ever match. The format list is the test. The
// three formats are what a record sleeve carries: EAN-13 (Europe), UPC-A
// (North America) and EAN-8 (small sleeves).

import { model } from "../../Model/model.js";

export const SCAN_FORMATS = ["ean_13", "upc_a", "ean_8"];

export async function initScanSupport() {
	model.app.canScan = false;
	model.app.scanFormats = [];

	if (!navigator.mediaDevices?.getUserMedia) return;
	if (typeof BarcodeDetector === "undefined") return;

	let supported;
	try {
		supported = await BarcodeDetector.getSupportedFormats();
	} catch {
		return;
	}

	if (!Array.isArray(supported) || !supported.includes("ean_13")) return;

	model.app.scanFormats = SCAN_FORMATS.filter((format) => supported.includes(format));
	model.app.canScan = true;
}
