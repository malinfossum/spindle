# Spindle

A music library for physical collections (LPs and CDs), built in vanilla JavaScript.

Originally developed as a team assignment in GET Academy Emne 2 with Henry Elendheim. This repository is the rebuilt, general-purpose, open-source version maintained by Malin Fossum. The project provides a practical way to organize a physical music collection: browse the library, search albums, view and edit details, manage a wishlist, and (in upcoming releases) keep your data persisted and encrypted locally.

---

## Kjør lokalt

Åpne `index.html` direkte i nettleseren
eller bruk Live Server i VS Code.

---

## Funksjoner

- Oversikt over musikksamlingen med albumkort
- Søk etter artist, albumtittel og sjanger
- Detaljvisning med notater, utgivelsesår, sjanger og lokasjon
- Legg til nye album med opplasting av eget coverbilde
- Rediger eksisterende album
- Ønskeliste
- Brukerprofil for én lokal samling
- Innlogging og registrering
- Egendefinerte sjangre og lokasjoner
- Responsivt oppsett med navigasjon for desktop og mobil
- Lys og mørk temabryter
- MVC-inspirert struktur med HTML, CSS og JavaScript

---

## Dokumentasjon

Dette prosjektet ble utviklet som kundeprosjekt i **GET Academy Emne 2**.

Kunden ønsket et enkelt digitalt bibliotek for en fysisk musikksamling. Hovedbehovet var å gjøre det lettere å holde oversikt over hvilke album man eier, søke raskt i samlingen, se hvor albumene befinner seg og oppdatere biblioteket over tid.

Prosjektet startet med kundedialog, kartlegging av behov, wireframes og modellplanlegging før selve implementeringen. Utviklingen ble strukturert rundt **must-have**-funksjonalitet først, og deretter **nice-to-have**-forbedringer.

### Kundens viktigste behov

- Enkel oversikt over musikksamlingen
- Søke-funksjonalitet
- Sporing av lokasjon på album
- Legge til og redigere album
- Notater og utgivelsesår
- Ønskeliste

### Nice-to-have-utvidelser

- Brukerkonto med passordbeskyttelse av lokal samling
- Egendefinerte sjangre og lokasjoner
- Støtte for coverbilder

### Teknisk tilnærming

Appen er bygget med:

- **HTML** for struktur
- **CSS** for styling og responsivt oppsett
- **JavaScript** for applikasjonslogikk
- En **MVC-inspirert struktur** med separate mapper for `Model`, `View` og `Controller`

Data håndteres med JavaScript-objekter og arrays, og brukergrensesnittet rendres basert på applikasjonens state.

### Prosjektstruktur

```text
Model/
View/
Controller/
CSS/
Images/
index.html
```

### Merknad

Dette er et frontend-basert skoleprosjekt. Innlogging og brukerroller er implementert på klientsiden for demonstrasjon og læring.

---

## Kreditering

Opprinnelig utviklet av Malin Fossum og Henry Elendheim som **Team 2**-prosjekt i GET Academy Emne 2. Denne versjonen er Malin Fossums egen open-source-videreføring av prosjektet, med original credit til Henry i `git log`.
