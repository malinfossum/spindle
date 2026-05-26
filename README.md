# Spindle

A local music library for organizing physical LP and CD collections, built in vanilla JavaScript.

## Run locally

Use Live Server in VS Code, or serve the folder over HTTPS.

Spindle needs a secure context for encryption — opening `index.html` directly via `file://` will fail in some browsers because the Web Crypto API is unavailable there.

## Features

- Browse your collection as album cards
- Search by artist, title, or genre
- View and edit album details — notes, release year, genre, and shelf location
- Add new albums with a cover image upload
- Wishlist for albums you don't own yet
- A local profile with custom genres and locations
- Light and dark theme
- Mobile and desktop layouts

## Stack

- HTML, CSS, vanilla JavaScript
- MVC structure with separate `Model/`, `View/`, and `Controller/` folders
- State persisted to `localStorage`
- Library data encrypted at rest with Web Crypto (PBKDF2 + HKDF + AES-GCM)

## Roadmap

- Data export and import

## Privacy

Your library lives on your device. Spindle does not send any data to a server, does not load third-party scripts, and does not track you.

Your library is encrypted at rest with a key derived from your password using PBKDF2 (600,000 iterations, SHA-256) and HKDF. Without your password the data cannot be read — there is no password reset. Export regularly once import/export ships.

Spindle is designed for one browser tab at a time. Don't run it in two tabs at once on the same device until v0.2 — concurrent edits can overwrite each other.

## Credits

Spindle is inspired by a team project Malin Fossum built with Henry Elendheim and Hans Nilsen in GET Academy Emne 2. This repository is Malin's solo project — a new, independently developed take on the idea.

## License

Apache License 2.0 — see [LICENSE](LICENSE).

> The app UI is currently in Norwegian.
