# NephroRx — prescription desk

Version 1: a single-page app (`index.html`) that runs in any browser with no server.

- Patient registration with auto UHID
- Investigation grid: one column per report date, auto eGFR (CKD-EPI 2021), high/low flags
- "Paste report text" reader: you confirm every value before it is added
- Medicine list for nephrology, copy-last-prescription, templates
- A4 printable prescription; WhatsApp message to the patient's number
- Data is stored in the browser (localStorage); use Clinic settings → backup

`app.html` is the same page without the document wrapper (used for the claude.ai preview).

## iPad / iPhone
- Touch-sized controls; text fields are 16px so iOS Safari does not zoom on tap.
- iPad portrait (and phones) use one column with a "← Patients" button; landscape shows the list beside the sheet.
- "PDF for WhatsApp" builds an A4 PDF in the browser (html2canvas + jsPDF from cdnjs) and opens the share sheet
  (Web Share API on the hosted copy; the `downloads` capability inside claude.ai).
- `index.html` + `manifest.webmanifest` + icons make it installable with Safari → Share → Add to Home Screen.
  Run `./build.sh` after editing `app.html`.
