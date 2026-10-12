# Project note: Spindle

A summary of what Spindle is, how it works, how it is built and where it stands.

**Last updated:** 13.10.2026 · **Version:** v1.0.3 · **Status:** finished

---

## In short

Spindle is a library for a physical record collection: LPs and CDs on a shelf. You add an
album by scanning its barcode or typing it in, give it a genre and a shelf location, and find
it again later by searching or filtering. It runs in the browser, installs as an app on a
phone, and the library is encrypted on the device and never sent anywhere.

The name comes from the post at the centre of a turntable: the thing a record turns on.

## Background

Spindle began as a team assignment at GET Academy: a music library for one collector. When
the course moved on I rebuilt it as my own project, to see how far a vanilla JavaScript app
could go without a framework or a backend. The original team repository is linked from the
README; this one is a separate rebuild.

The idea stayed simple. A collection lives on a shelf, so the app should answer two
questions fast: do I own this, and where is it?

## How adding an album works

You open Add album and press Scan. On a phone the camera reads the barcode on the sleeve;
where the browser cannot scan, you type the number instead. If you have turned on look-ups,
Spindle asks MusicBrainz which releases carry that barcode and shows a short pick-list. You
pick one, and the empty fields fill in: artist, title, year, format, and the genres ticked
for you. The cover comes from the Cover Art Archive.

If you take your own photo of the sleeve instead, a crop dialog opens with a best guess at
the square. You can move, zoom, turn and straighten it before it is saved. You add the shelf
location and save. The album is encrypted and written to the browser, and it shows up in the
library straight away.

If the barcode is already in your library, Spindle says so on the first press and stops.
That is the question it exists to answer in a record shop.

## Stack

HTML, CSS and vanilla JavaScript with ES modules, no framework and no runtime dependencies.
Vite runs the dev server and the build, Biome formats and lints, and the tests run on Node's
built-in test runner. Encryption is the browser's own Web Crypto API.

It is hosted on Cloudflare Pages, which deploys every push to `main` and serves the security
headers. A service worker makes it open offline once installed.

## Architecture

MVC, one folder per layer, with dependencies pointing one way:

- **Model/** holds the data and everything that touches it: the album shape, encryption and
  persistence, backups, the MusicBrainz client, the cover store and the language tables. It
  never touches the DOM.
- **View/** builds the pages, one folder per page plus `Universal/` for the shared parts:
  navbar, dialogs, the crop dialog, the scanner.
- **Controller/** handles events and routing. It reads the Model, calls the View and is the
  only layer that talks to both.
- **test/** holds the Node tests. They cover the Model and the pure functions in the View,
  such as the crop maths.

## Decisions worth explaining

**No backend, on purpose.** The library is encrypted with a key derived from your password
(PBKDF2 with 600,000 iterations, then HKDF and AES-GCM) and stored in `localStorage`, with
covers in IndexedDB under the same key. Nothing leaves the device, so there is no server to
breach and no account to leak. The price is real: no sync between devices and no password
reset. Encrypted backups cover the first; the second is stated plainly where you create the
library.

**Cloudflare Pages, not GitHub Pages.** GitHub Pages cannot set response headers, so a real
Content Security Policy with `frame-ancestors` cannot be expressed there. Cloudflare Pages
serves it from one `_headers` file, and the dev server reads the same file so development
runs under the same rules.

**Barcode look-up is opt-in and narrow.** The first scan asks before anything is sent, and
the answer can be changed in Profile. Only the barcode goes out, to one host, and the CSP
allows exactly that host and the cover archive. The scanner uses the browser's built-in
barcode detector rather than a library, because a WebAssembly fallback would have meant
loosening the CSP for every user to help some of them.

## Demo

Try it at [spindle-music.pages.dev](https://spindle-music.pages.dev). It starts empty: you
create a library with a password and add your own albums. Everything stays in that browser,
so clearing the site's data deletes the library unless you have exported a backup.

## Status

Spindle is finished at v1.0.3, its sixth tagged release. 108 commits between 14 May and
13 October 2026; the first is the import of the team project it grew from. 123 tests, all
passing. Every version since v0.1 has a plan written up front, under `docs/`.

It was built to learn how far plain JavaScript goes when it is done properly: layered,
tested, accessible and secure by design. It went further than I expected.

## Common questions

| Question | Answer |
|---|---|
| Why no framework? | It started as a vanilla JavaScript assignment, and I wanted to see where plain modules stop being enough. They did not stop. Vite is there for the build, not for the code. |
| Why no backend? | Because the data is personal and the app works without one. Encryption on the device is the whole security model. |
| Can I use it on two devices? | Yes, through an encrypted backup: export on one, import on the other. There is no live sync. |
| What if I forget the password? | The library cannot be opened. There is no reset, by design. You can delete it and restore from a backup, or start again. |
| Does scanning work everywhere? | Where the browser has a barcode detector with the right formats, mostly Chrome on Android. Elsewhere you type the number and the look-up works the same. |
| How large is the codebase? | Around 12,000 lines of JavaScript, CSS and HTML in production and 1,400 lines of tests. |

## Feedback and contributions

Feedback is welcome, particularly on these points:

1. **iPhone and Safari.** This is the weakest part. I have tested on Android, Windows and
   desktop browsers, but not yet on a real iPhone. Safari has no barcode detector, handles the
   on-screen keyboard differently and treats installed web apps its own way.
2. **The interface on a small screen.** Is the library easy to scan at 320 px? Does adding an
   album feel quick enough to do standing at a shelf?
3. **The architecture.** Is the MVC split clean, or has the Controller layer grown too large?

The code is open under the Apache License 2.0, and pull requests are welcome.
I hope the tool can be useful to more people than me.

**Links:** [demo](https://spindle-music.pages.dev) ·
[code and releases](https://github.com/malinfossum/spindle) · plans under `docs/`
