# Spindle

A local music library for organizing physical LP and CD collections, built in vanilla JavaScript.

**Live:** [spindle-music.pages.dev](https://spindle-music.pages.dev)

**Status:** v0.1.0 is the last tagged release. The v0.2 work has landed on `main`: a build step, hash routing, and real security headers on the deployed site.

## Run locally

```
npm install
npm run dev
```

`npm run build` writes a production bundle to `dist/`, and `npm run preview` serves it.

Spindle needs a secure context for encryption. Opening `index.html` directly via `file://` will fail, because the Web Crypto API is unavailable there.

## Features

- Browse your collection as album cards
- Search by artist, title, or genre
- View and edit album details: notes, release year, genre, and shelf location
- Add new albums with a cover image upload
- Wishlist for albums you don't own yet
- A local profile with custom genres and locations
- Encrypted backup and restore, plus an opt-in readable export
- Norwegian and English interface, switchable in the app
- Light and dark theme, remembered between visits
- Mobile and desktop layouts

## Stack

- HTML, CSS, vanilla JavaScript: ES modules, no framework
- MVC structure with separate `Model/`, `View/`, and `Controller/` folders
- Vite for the dev server and the build, Biome for formatting and linting
- State persisted to `localStorage`
- Library data encrypted at rest with Web Crypto (PBKDF2 + HKDF + AES-GCM)

## Roadmap

- A better search: submit with Enter, live suggestions, filters, and history
- Richer album details, and a rebuilt edit screen
- Log out moved out of the main navigation

## Privacy

Your library lives on your device. Spindle does not send any data to a server, does not load third-party scripts, and does not track you.

Creating a library creates a profile in this browser, with a password. That password is never sent anywhere; it derives the key that encrypts your library at rest, using PBKDF2 (600,000 iterations, SHA-256) and HKDF. Without your password the data cannot be read, and there is no password reset. Export a backup regularly: **Profile → Backup**, or the backup panel on the welcome screen if you are locked out. The encrypted backup opens only with the password it was created with.

Spindle is designed for one browser tab at a time. If you do open a second one, the tab that falls behind notices, stops saving and asks you to reload, so two tabs can no longer quietly overwrite each other. Language and theme changes follow along between tabs immediately.

## Credits

Spindle began as a team assignment at GET Academy. The original team repository is on [GitHub](https://github.com/HenryElendheim/Teamoppgaver-Emne-2). This repository is a separate, independently developed rebuild.

## License

Apache License 2.0. See [LICENSE](LICENSE).
