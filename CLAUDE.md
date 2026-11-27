# NephroRx — instructions for Claude

The owner is a practising nephrologist, not a programmer, who uses this on an iPad.
They will ask for changes in plain words. Do the whole job: change, test, publish, save. Explain the
result in plain language without code jargon, and ask only when a decision is genuinely theirs.

## Files
- `app.html` — the whole app (HTML + CSS + JS, no build tools). Edit only this file.
- `index.html` — generated from app.html by `./build.sh` (adds the home-screen/iPad app tags). Never edit by hand.
- `manifest.webmanifest`, `icon-*.png` — home-screen app files.
- `tests/smoke.js` — end-to-end test on laptop, iPad portrait/landscape and phone.
- `BACKOFFICE.md` — the owner's routine (backups, consent, security).
- `INTEGRATION.md` — how the owner's existing website/app connects (patient link `#patient?...`, CSV import/export). Keep it in sync with the code.

## Every change
1. Edit `app.html`.
2. `npm install` (first time in a session) then `npm test`: it rebuilds index.html and must print "All checks passed".
   Add a check to tests/smoke.js for any new feature.
3. Republish the preview with the Artifact tool: file `app.html`, url https://claude.ai/artifact/QSswE3Zquvg22TvwwqGagb
   (read it first if this session has not; keep capabilities `downloads` and `sample` with images).
4. Commit and push to main. GitHub Pages publishes index.html at https://ssgsachin.github.io/Nephrorx/ within a few minutes.

## Main features (where they live in app.html)
- Prescription languages: `TR` table (English + hi, mr, gu, kn, ml, te, or, bn, pa, as), `rxHTML(lang)`, `waText()`.
  Translations of fixed phrases were written by Claude; the owner was asked to have them checked by native speakers.
- Follow-up: `prefillFromLast()` loads the last visit's medicines, diagnosis and advice into a new visit.
- Smart suggestions/templates: `learn()`, `suggestFor()`, `PHR_SEED`; per-field ☆ templates in `settings.pins`;
  medicine usage and usual doses in `settings.drugUse`. All learned on the device, nothing sent anywhere.
- Scans/photos: IndexedDB `nephrorx-files` (`FDB`), shrunk to 1800 px JPEG; included in backups.
- AI report reading: `aiPrompt()`/`cleanAI()` via the artifact `sample` capability (only inside the Claude app).
  The hosted home-screen app has no AI until a clinic backend holds an API key (Phase 2). Every AI value is shown
  for review before it is saved; never write AI output to the record without that step.

## Rules that protect patient data
- Data lives in the browser (`localStorage` key `nephrorx-v1`). Never rename the key or change the data shape
  without migration code that upgrades old data in place; a mistake here loses every patient record.
- Never add analytics, trackers, or any network call that sends patient data anywhere, unless the owner asks
  and the destination is the clinic's own backend. The owner asked for AI report reading: report photos/text go
  to Claude only when the doctor taps "Read with AI"; the prompt asks it not to return identifiers.
- Touch devices: keep form fields at 16px (iOS zooms otherwise) and tap targets around 40px.
- Medical content: generic drug names (NMC), registration number on the printout, eGFR = CKD-EPI 2021.
  Default doses in FORMULARY are editable suggestions; do not add dose-calculation or treatment advice
  features without the owner explicitly asking (that can make it regulated medical-device software).
