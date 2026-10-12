# Spindle

A local music library for organizing physical LP and CD collections, built in vanilla JavaScript.

**Live:** [spindle-music.pages.dev](https://spindle-music.pages.dev)

**Status:** finished at v1.0.1. Read the [project note](docs/project-note.md) for how it works, how it is built and where it stands.

## Run locally

```
npm install
npm run dev
```

`npm run build` writes a production bundle to `dist/`, and `npm run preview` serves it. The preview registers the service worker, so after a rebuild the first reload still shows the previous build; close every preview tab and open it again to get the new one.

Spindle needs a secure context for encryption. Opening `index.html` directly via `file://` will fail, because the Web Crypto API is unavailable there.

## Features

- Browse your collection as album cards
- Search by artist, title, or genre, and filter by genre, shelf location, format, or decade
- View and edit album details: notes, release year, genre, and shelf location
- Add new albums with a cover photo, cropped to a square you can move, zoom, turn and straighten before it is saved
- Barcode look-up on MusicBrainz, with the album cover from the Cover Art Archive and the album's genres ticked for you (opt-in, sends nothing from your library)
- Wishlist for albums you don't own yet
- A local profile with custom genres and locations
- Encrypted backup and restore, plus an opt-in readable export
- Delete the library from Profile, or from the login page when it will not open
- Norwegian and English interface, switchable in the app
- Light and dark theme, remembered between visits
- Installable as an app, and once installed it opens without a network
- Mobile and desktop layouts

## Stack

- HTML, CSS, vanilla JavaScript: ES modules, no framework
- MVC structure with separate `Model/`, `View/`, and `Controller/` folders
- Vite for the dev server and the build, Biome for formatting and linting
- State persisted to `localStorage`
- Library data encrypted at rest with Web Crypto (PBKDF2 + HKDF + AES-GCM)

## Privacy

Your library lives on your device. Spindle does not send any data to a server, does not load third-party scripts, and does not track you. Two exceptions, both opt-in: if you turn on barcode look-ups, the scanned number is sent to musicbrainz.org and the cover of the album you pick is fetched from coverartarchive.org (nothing from your library) and they see your IP address as with any web request; and if you tick "Stay unlocked on this device" when logging in, the key that opens your library is kept in this browser until you log out, so anyone holding the device can open it meanwhile. Spindle also keeps a copy of its own files in the browser's cache, so it can open offline. That cache holds the app and nothing else: your library, your covers and your key are never in it.

Creating a library creates a profile in this browser, with a password. That password is never sent anywhere; it derives the key that encrypts your library at rest, using PBKDF2 (600,000 iterations, SHA-256) and HKDF. Without your password the data cannot be read, and there is no password reset. Export a backup regularly: **Profile → Backup**, or the backup panel on the welcome screen if you are locked out. The encrypted backup opens only with the password it was created with.

Spindle is designed for one browser tab at a time. If you do open a second one, the tab that falls behind notices, stops saving and asks you to reload, so two tabs can no longer quietly overwrite each other. Language and theme changes follow along between tabs immediately.

## Credits

Spindle began as a team assignment at GET Academy. The original team repository is on [GitHub](https://github.com/HenryElendheim/Teamoppgaver-Emne-2). This repository is a separate, independently developed rebuild.

## License

Apache License 2.0. See [LICENSE](LICENSE).
