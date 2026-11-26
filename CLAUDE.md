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
   (read it first if this session has not; keep capabilities `downloads`).
4. Commit and push to main. GitHub Pages publishes index.html at https://ssgsachin.github.io/Nephrorx/ within a few minutes.

## Rules that protect patient data
- Data lives in the browser (`localStorage` key `nephrorx-v1`). Never rename the key or change the data shape
  without migration code that upgrades old data in place; a mistake here loses every patient record.
- Never add analytics, trackers, or any network call that sends patient data anywhere, unless the owner asks
  and the destination is the clinic's own backend.
- Touch devices: keep form fields at 16px (iOS zooms otherwise) and tap targets around 40px.
- Medical content: generic drug names (NMC), registration number on the printout, eGFR = CKD-EPI 2021.
  Default doses in FORMULARY are editable suggestions; do not add dose-calculation or treatment advice
  features without the owner explicitly asking (that can make it regulated medical-device software).
