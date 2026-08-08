# CV → QR

Turn a **CV (PDF)** or **any link** into a scannable **QR code** — hosted for
free, and with **scan analytics** so you can see who scans it.

## The core idea

A QR code stores **text**, not files. So the two inputs work differently:

- **Link** → we store it and hand back a short tracked URL.
- **PDF** → the file is uploaded to **cloud storage** first to get a public URL.

Either way, the QR encodes a tracked link on **your** app, not the raw
destination. That's what makes analytics possible:

```
QR ──► https://yourapp.com/s/AB12        (your app)
                 │  1. log the scan: time, approx country/city, device
                 ▼
          302 redirect ──► the real link or the PDF   (open / download)
```

A private stats page at `/dashboard/<secret-token>` then shows every scan.

## Tech stack (all free tiers)

- **Next.js (App Router)** — UI, upload API, redirect + logging.
- **Supabase** — Storage (the PDFs) + Postgres (codes & scan events).
- **Vercel** — hosting, auto-deploys from GitHub.
- **qrcode** — generates the QR image in the browser.

## Project structure

```
cv-to-qr/
├─ app/
│  ├─ page.js                    # UI: Link / PDF tabs, QR + private stats link
│  ├─ api/create/route.js        # link  → tracked code
│  ├─ api/upload/route.js        # PDF   → Supabase Storage → tracked code
│  ├─ s/[id]/route.js            # scan lands here: log, then redirect
│  └─ dashboard/[token]/page.js  # private scan stats
├─ lib/                          # supabase client, id + device helpers
├─ supabase/schema.sql           # database tables — run once in Supabase
└─ .env.local.example            # which secrets to set
```

## Setup

### 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com), create a new project (free).

### 2. Create the database tables

Supabase → **SQL Editor** → New query → paste the contents of
[`supabase/schema.sql`](supabase/schema.sql) → **Run**.

### 3. Create the storage bucket

Supabase → **Storage** → **New bucket** → name it `cvs` → make it **Public** →
create.

### 4. Add your keys locally

Copy the example env file and fill it in from Supabase → **Settings → API**:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> The service-role key is a **secret**. `.env.local` is git-ignored — never
> commit it.

### 5. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, make a QR, scan it, then open your private stats
link to see the scan appear.

## Deploy to Vercel (free)

1. Push this repo to GitHub (private is fine).
2. Go to [vercel.com](https://vercel.com), **Add New → Project**, import the repo.
3. In the project's **Environment Variables**, add the same two keys from your
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
4. **Deploy.** You get a public `https://<your-app>.vercel.app` URL.

Now any QR you generate points at your live app, so anyone can scan it from any
phone — and every scan shows up on your private stats page.

## Privacy

Scans are logged with a timestamp, approximate location (country/city derived
from the visitor's IP by Vercel), and a coarse device type. Individual scanners
**cannot** be identified — this is aggregate analytics, not tracking of people.

## Roadmap

- [x] **Phase 1** — Link → QR
- [x] **Phase 2** — PDF → hosted URL → QR
- [x] **Phase 3** — Cloud storage, tracked links, scan analytics, deployable
- [ ] **Phase 4** — accounts (so each user sees only their own codes), custom
      QR styling, CSV export, per-code expiry
```
