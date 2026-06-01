// Spindle — auth & encryption layer (task C)
//
// Why this file exists: login used to compare passwords as plaintext and the
// library was saved as plain JSON, so anyone with DevTools or file access could
// read both. This module derives keys from the password and encrypts the
// library at rest.
//
// A few things that look odd on purpose:
// - PBKDF2 runs 600 000 rounds. It is slow BY DESIGN — the ~300–500 ms you feel
//   on unlock is also what makes brute-forcing the password expensive.
// - One password becomes two keys. PBKDF2 gives a master key; HKDF splits it
//   into a separate HMAC "verify" key (checks the password) and an AES-GCM
//   "encrypt" key (encrypts the data). Reusing one key for both jobs is unsafe,
//   so we keep them apart via the HKDF `info` label.
// - We never wipe the password from memory. JavaScript strings are immutable and
//   garbage-collected, so there is no way to zero the bytes. We limit exposure
//   by deriving non-extractable keys and never storing the password itself.
//
// All cryptography uses the browser's Web Crypto API (crypto.subtle) — the
// platform's audited primitives. The only hand-written security helper is the
// constant-time comparison used for the HMAC password check.

const PBKDF2_ITERATIONS = 600_000;
const KDF_SALT_BYTES = 16;
const IV_BYTES = 12;
const HMAC_VERIFY_MESSAGE = "verify";
const MIN_PASSWORD_LENGTH = 8;
const WEAK_PASSWORDS = [
	"password",
	"12345678",
	"qwertyui",
	"iloveyou",
	"admin123",
	"letmein1",
	"welcome1",
	"passw0rd",
	"abc12345",
	"spindle12",
];

function isCryptoAvailable() {
	return !!(window.crypto && window.crypto.subtle);
}

function utf8(text) {
	return new TextEncoder().encode(text);
}

function randomBytes(length) {
	return crypto.getRandomValues(new Uint8Array(length));
}

function bytesToBase64(bytes) {
	let binary = "";
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}

function base64ToBytes(value) {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

// PBKDF2 (slow, salted) → master key → HKDF splits it into two purpose-bound,
// non-extractable keys: one for the HMAC password check, one for AES-GCM.
async function deriveKeys(password, saltBytes) {
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		utf8(password),
		{ name: "PBKDF2" },
		false,
		["deriveBits"],
	);

	// PBKDF2 (the slow, salted step) gives us 256 bits of master key material.
	// We can't deriveKey straight to HKDF — an HKDF key has no fixed length for
	// PBKDF2 to target — so we pull raw bits, then import them as the HKDF key.
	const masterBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: saltBytes,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		passwordKey,
		256,
	);

	const masterKey = await crypto.subtle.importKey(
		"raw",
		masterBits,
		{ name: "HKDF" },
		false,
		["deriveKey"],
	);

	const verifyKey = await crypto.subtle.deriveKey(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: new Uint8Array(0),
			info: utf8("verify-v1"),
		},
		masterKey,
		{ name: "HMAC", hash: "SHA-256", length: 256 },
		false,
		["sign"],
	);

	const encryptKey = await crypto.subtle.deriveKey(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: new Uint8Array(0),
			info: utf8("encrypt-v1"),
		},
		masterKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);

	return { verifyKey, encryptKey };
}

async function computeVerifyHmac(verifyKey) {
	const signature = await crypto.subtle.sign(
		"HMAC",
		verifyKey,
		utf8(HMAC_VERIFY_MESSAGE),
	);
	return new Uint8Array(signature);
}

// Compares two byte arrays without short-circuiting, so timing can't leak how
// many leading bytes matched. Length is not secret, so an early return is fine.
function constantTimeEqual(a, b) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a[i] ^ b[i];
	}
	return diff === 0;
}

async function encryptLibrary(encryptKey, plaintextStr) {
	const iv = randomBytes(IV_BYTES);
	const ciphertextBuffer = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		encryptKey,
		utf8(plaintextStr),
	);
	return { iv, ciphertext: new Uint8Array(ciphertextBuffer) };
}

// Throws on a wrong key or tampered ciphertext (AES-GCM auth tag fails).
// Callers treat any failure as "wrong password" and never leak which check failed.
async function decryptLibrary(encryptKey, ivBytes, ciphertextBytes) {
	const plaintextBuffer = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: ivBytes },
		encryptKey,
		ciphertextBytes,
	);
	return new TextDecoder().decode(plaintextBuffer);
}

function validatePassword(password) {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return { ok: false, error: "Passordet må være minst 8 tegn." };
	}
	if (WEAK_PASSWORDS.includes(password.toLowerCase())) {
		return {
			ok: false,
			error:
				"Velg et sterkere passord — dette er på vår liste over svake passord.",
		};
	}
	return { ok: true, error: "" };
}

function passwordStrength(password) {
	let score = 0;
	if (password.length >= MIN_PASSWORD_LENGTH) score++;
	if (/[a-z]/.test(password)) score++;
	if (/[A-Z]/.test(password)) score++;
	if (/[0-9]/.test(password)) score++;
	if (/[^a-zA-Z0-9]/.test(password)) score++;
	return Math.min(score, 4);
}

// Updates the strength bar's 5 spans and the screen-reader text directly, on
// purpose — calling updateView() on every keystroke would drop input focus.
function renderStrength(password, elementId) {
	const bar = document.getElementById(elementId);
	if (!bar) return;

	const score = passwordStrength(password);
	for (let i = 0; i < bar.children.length; i++) {
		bar.children[i].className = i < score ? "bar-on" : "bar-off";
	}

	const text = document.getElementById("password-strength-text");
	if (text) text.textContent = `Passordstyrke: ${score} av 4`;
}

function zeroKeys() {
	model.app.crypto.encryptKey = null;
	model.app.crypto.verifyKey = null;
	model.app.crypto.kdfSaltB64 = null;
	model.app.crypto.verifyHmacB64 = null;
	model.app.crypto.unlocked = false;
}
