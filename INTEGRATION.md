# Connecting a clinic website or app to NephroRx

NephroRx currently runs entirely on the doctor's iPad: patient records stay in the device's browser
storage and there is no server. The connections below work within that design.

## 1. Open or register a patient from your website/app (link)
Add a "Start consultation" / "Open in EMR" button in your admin screen or appointment notification:

    https://ssgsachin.github.io/Nephrorx/#patient?name=Asha%20Rao&phone=9000011111&age=50&sex=F

- `phone` (10-digit Indian mobile, any formatting) — if it matches a registered patient, that patient opens.
- Otherwise a New patient form opens, prefilled with `name`, `age`, `sex` (M/F/O, or male/female/other), `address`.
  The doctor checks details and records consent before saving. Nothing is saved automatically.
- URL-encode every value. The data sits after `#`, which browsers never send to the web server,
  and NephroRx clears it from the address bar as soon as it is read.
- It must be opened on the device that holds the records (the doctor's iPad).

## 2. Patient lists (CSV)
- Import: Clinic settings → Import patients (CSV). First row = column names. Recognised columns:
  `Name` (or `First name` + `Last name`), `Age`, `Sex`/`Gender`, `Phone`/`Mobile`/`WhatsApp`, `Address`/`Area`/`City`.
  Rows whose mobile number is already registered are skipped.
- Export: Clinic settings → Export patient list (CSV):
  `UHID,Name,Age,Sex,Phone,Address,Consent date,Last visit`.

## 3. Links shown to patients
Clinic settings → Your website & app: website, app store link, online booking link. These print on the
prescription (with a QR code to the booking link) and are added to the WhatsApp message.

## Planned (Phase 2: online database)
- Appointments booked on the website appearing in NephroRx automatically, and prescriptions/reports
  visible to patients inside your app, need the online database. That phase adds a small authenticated
  API (JSON, with a FHIR R4 export for ABDM compatibility). Patient data will never be put in links or
  sent to third parties without consent.
