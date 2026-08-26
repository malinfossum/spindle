# Spindle

A local music library for organizing physical LP and CD collections, built in vanilla JavaScript.

**Status:** v0.1.0 released. v0.2 in progress — the build step has landed; hash routing is next.

## Run locally

```
npm install
npm run dev
```

`npm run build` writes a production bundle to `dist/`, and `npm run preview` serves it.

Spindle needs a secure context for encryption — opening `index.html` directly via `file://` will fail, because the Web Crypto API is unavailable there.

## Features

- Browse your collection as album cards
- Search by artist, title, or genre
- View and edit album details — notes, release year, genre, and shelf location
- Add new albums with a cover image upload
- Wishlist for albums you don't own yet
- A local profile with custom genres and locations
- Encrypted backup and restore, plus an opt-in readable export
- Norwegian and English interface, switchable in the app
- Light and dark theme, remembered between visits
- Mobile and desktop layouts

## Stack

- HTML, CSS, vanilla JavaScript — ES modules, no framework
- MVC structure with separate `Model/`, `View/`, and `Controller/` folders
- Vite for the dev server and the build, Biome for formatting and linting
- State persisted to `localStorage`
- Library data encrypted at rest with Web Crypto (PBKDF2 + HKDF + AES-GCM)

## Roadmap

- Hash routing, so pages are linkable and the back button works

## Privacy

Your library lives on your device. Spindle does not send any data to a server, does not load third-party scripts, and does not track you.

Your library is encrypted at rest with a key derived from your password using PBKDF2 (600,000 iterations, SHA-256) and HKDF. Without your password the data cannot be read — there is no password reset. Export a backup regularly: **Profile → Backup**, or the backup panel on the welcome screen if you are locked out. The encrypted backup opens only with the password it was created with.

Spindle is designed for one browser tab at a time. If you do open a second one, the tab that falls behind notices, stops saving and asks you to reload — so two tabs can no longer quietly overwrite each other. Language and theme changes follow along between tabs immediately.

## Credits

Spindle is inspired by a team project Malin Fossum built with Henry Elendheim and Hans Nilsen in GET Academy Emne 2. This repository is Malin's solo project — a new, independently developed take on the idea.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
