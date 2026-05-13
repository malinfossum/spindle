# Geir's Musikkbibliotek

En enkel musikkbibliotek-app laget i vanilla JavaScript som kundeprosjekt i GET Academy Emne 2.

Målet med prosjektet var å lage et praktisk og brukervennlig verktøy for å organisere en fysisk musikksamling med CD-er og LP-er. Brukeren kan bla i samlingen, søke etter album, se detaljer, legge til nye album, redigere eksisterende innhold og bruke ønskeliste. Den ferdige versjonen inneholder også brukerkontoer, profilsider og rollebasert tilgang med `user`, `child` og `admin`.

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
- Brukerprofiler med egne albumsamlinger
- Innlogging og registrering
- Rollebasert tilgang for `user`, `child` og `admin`
- Admin-verktøy for å administrere delte sjangre og lokasjoner
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

- Brukerkontoer og profiler
- Flere brukerroller
- Admin-funksjonalitet
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

Laget av **Team 2** som en del av GET Academy Emne 2.
