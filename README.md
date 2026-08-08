# CV → QR

Turn a **CV (PDF)** or **any link** into a scannable **QR code**. Scan it with a
phone and the link opens — or the PDF downloads.

## The core idea

A QR code stores **text**, not files. It can hold a URL of a few hundred
characters, but it can **never** contain a whole PDF. So the two inputs work
differently:

- **Link** → the URL goes straight into the QR. No server needed.
- **PDF** → the file is **uploaded and hosted first** to get a URL, and _that_
  URL goes into the QR.

```
INPUT ──► STORE (PDF only) ──► GENERATE QR ──► SCAN ──► OPEN / DOWNLOAD
link/pdf   file → URL           URL → image     phone     link or file
```

## Tech stack

- **Next.js (App Router)** — UI, upload API, and static file hosting in one app.
- **qrcode** — generates the QR image in the browser.
- **Local disk storage** — uploaded PDFs are saved to `public/uploads/` and
  served as static files. (Swappable for Supabase / S3 later.)

## Project structure

```
cv-to-qr/
├─ app/
│  ├─ page.js              # UI: Link tab + PDF tab, QR display & download
│  ├─ layout.js            # root layout + metadata
│  ├─ globals.css          # styling
│  └─ api/upload/route.js  # receives a PDF, stores it, returns its URL
├─ public/uploads/         # uploaded PDFs land here (git-ignored)
└─ next.config.mjs
```

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How it works, step by step

1. **Link tab** — paste a URL, click *Generate QR*. The QR encodes the link
   directly (`app/page.js` → `handleLink`).
2. **PDF tab** — choose a PDF, click *Upload & Generate QR*. The file is POSTed
   to `/api/upload`, saved under `public/uploads/`, and the returned URL is
   turned into a QR (`app/page.js` → `handlePdf`).
3. Either way you get a QR image you can **download as PNG**.

### Scanning from your phone

`localhost` only exists on your computer. To scan an uploaded-PDF QR from a
phone, run the app so it's reachable on your local network and use your
computer's LAN IP instead of `localhost`:

```bash
npm run dev -- -H 0.0.0.0
```

Then open `http://<your-computer-ip>:3000` (e.g. `http://192.168.1.20:3000`) so
the generated URLs point somewhere your phone can reach.

## Roadmap

- [x] **Phase 1** — Link → QR
- [x] **Phase 2** — PDF → hosted URL → QR (local storage)
- [ ] **Phase 3** — polish: SVG export, expiry, better mobile UX
- [ ] **Phase 4** — cloud storage (Supabase/S3), accounts, a dashboard & scan analytics
```
