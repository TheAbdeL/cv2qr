# CV → QR

> Turn a **CV (PDF)** or **any link** into a scannable **QR code** — hosted for
> free, scannable from any phone, and with built‑in **scan analytics** so you can
> see how many people scanned it, roughly where, and on what kind of device.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-149eca)
![Supabase](https://img.shields.io/badge/Supabase-Storage%20%2B%20Postgres-3ecf8e)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)

---

## Table of contents

- [What it does](#what-it-does)
- [The core idea](#the-core-idea)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running locally](#running-locally)
- [Using the app](#using-the-app)
- [Deploying to Vercel](#deploying-to-vercel)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [API & routes reference](#api--routes-reference)
- [Privacy](#privacy)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## What it does

1. You paste a **link** or upload a **CV as a PDF**.
2. The app gives you a **QR code** (downloadable as PNG) and a **private stats
   page**.
3. Anyone can **scan the QR** with their phone camera and instantly open the
   link or download the PDF.
4. Every scan is **logged**, and you watch the numbers grow on your private
   dashboard.

## The core idea

A QR code stores **text** (a short URL), **not files**. A whole PDF can never
fit inside a QR. So the two inputs are handled differently:

- **Link** → stored as‑is, wrapped in a short tracked URL.
- **PDF** → uploaded to **cloud storage** first to obtain a public file URL,
  which is then wrapped in a short tracked URL.

Crucially, the QR never encodes the raw destination. It encodes a short link
that points **back through this app** (`/s/<id>`). That indirection is what
makes analytics possible — every scan passes through the server, gets logged,
and is then redirected to the real destination.

## How it works

```
                        ┌─────────────────────────────┐
   CREATE               │            THE APP           │
   ─────────            │                             │
   Paste link  ─────────┼──► /api/create              │
                        │      insert row in `codes`  │
   Upload PDF  ─────────┼──► /api/upload              │
                        │      1. store file in        │
                        │         Supabase Storage     │
                        │      2. insert row in `codes`│
                        │                             │
                        │   returns { id, adminToken } │
                        └───────────────┬─────────────┘
                                        │
             QR encodes  https://your-app.com/s/<id>
                                        │
   SCAN (phone camera)                  ▼
   ──────────────────         ┌───────────────────────┐
   opens the short link ─────►│  /s/<id>              │
                              │   1. log scan in       │
                              │      `scans` (time,     │
                              │       country, city,    │
                              │       device)           │
                              │   2. 302 redirect ──────┼──► the link / the PDF
                              └───────────────────────┘

   VIEW STATS
   ──────────
   /dashboard/<adminToken>  ──►  reads `codes` + `scans`  ──►  table + counts
```

- The **public** `id` is what shows up in the QR / short link. It's safe to
  share — it only lets someone *open* the destination.
- The **secret** `adminToken` is the key to the private stats page. Possessing
  its URL is what grants access — no login required, but don't share it.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15** (App Router) | UI, API routes, and redirect logic in one deployable app |
| UI | **React 19** | Client component for the form + QR rendering |
| QR generation | **qrcode** | Builds the QR PNG in the browser |
| File storage | **Supabase Storage** | Free public bucket → gives each PDF a public URL |
| Database | **Supabase Postgres** | Stores `codes` and `scans` |
| Hosting | **Vercel** | Free Next.js hosting; auto‑deploys from GitHub; injects visitor geo headers |

Everything above has a free tier that comfortably covers a personal project.

## Project structure

```
cv2qr/
├─ app/
│  ├─ layout.js                  # root layout + <head> metadata
│  ├─ globals.css                # all styling (dark theme)
│  ├─ page.js                    # main UI: Link / PDF tabs, QR + private stats link
│  ├─ api/
│  │  ├─ create/route.js         # POST: link  → row in `codes`  → { id, adminToken }
│  │  └─ upload/route.js         # POST: PDF   → Supabase Storage → row in `codes`
│  ├─ s/[id]/route.js            # GET: a scan lands here → log it → 302 redirect
│  └─ dashboard/[token]/page.js  # private, server-rendered scan stats
├─ lib/
│  ├─ supabase.js                # server-only Supabase client (service-role key)
│  ├─ ids.js                     # short, unguessable id generator
│  └─ device.js                  # coarse device type from User-Agent
├─ supabase/
│  └─ schema.sql                 # run once in Supabase to create the tables
├─ .env.local.example            # template for the two secrets you must set
├─ next.config.mjs
├─ jsconfig.json                 # enables the "@/..." import alias
└─ package.json
```

## Prerequisites

- **Node.js 18.18+** (Node 20/22 recommended) and npm
- A free **[Supabase](https://supabase.com)** account
- A free **[Vercel](https://vercel.com)** account (for deployment)
- **git** + a **GitHub** account (Vercel deploys from GitHub)

## Setup

### 1. Clone & install

```bash
git clone https://github.com/TheAbdeL/cv2qr.git
cd cv2qr
npm install
```

### 2. Create a Supabase project

Sign in at [supabase.com](https://supabase.com) → **New project**. Pick a name
and a strong database password, choose a region near you, and wait ~1 minute
for it to provision.

### 3. Create the database tables

In the Supabase dashboard: **SQL Editor** → **New query** → paste the entire
contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. You should
see *Success*. This creates the `codes` and `scans` tables (and locks them down
with row‑level security).

### 4. Create the storage bucket

**Storage** → **New bucket**:

- **Name:** `cvs` (exactly this, lowercase)
- **Public bucket:** **ON** (so scanned PDFs are downloadable)
- **Create bucket**

### 5. Set your environment variables

Copy the template and fill it in:

```bash
cp .env.local.example .env.local
```

Get the values from Supabase → **Project Settings**:

- `NEXT_PUBLIC_SUPABASE_URL` — from **Settings → Data API → Project URL**.
  Use the **base URL only**, e.g. `https://abcdefgh.supabase.co`
  (**no** `/rest/v1/` suffix, no trailing slash — the client adds those).
- `SUPABASE_SERVICE_ROLE_KEY` — from **Settings → API Keys**. Use the
  **`service_role`** key (a long token starting with `eyJ…`) or a newer
  **`sb_secret_…`** secret key. **Not** the `anon` / *Publishable* key.

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (long secret string)
```

> ⚠️ The service‑role key is a **secret** with full database access. `.env.local`
> is git‑ignored — never commit it, and never expose this key in client code.

## Running locally

```bash
npm run dev
```

Open **http://localhost:3000**. Create a QR, and open your private stats link to
watch the scan register.

> **Note:** while running locally the QR encodes `http://localhost:3000/...`,
> which only works on your own machine — a phone can't reach it. Scanning from a
> phone works once the app is **deployed** (see below). Also, country/city are
> blank locally because those come from the host's geo headers, which only exist
> in production.

## Using the app

- **Link tab** — paste any `http(s)` URL → **Generate QR**.
- **PDF tab** — choose a PDF (max 5 MB) → **Upload & Generate QR**.
- In both cases you get:
  - the **QR image** + a **Download QR (PNG)** button,
  - the **public link** the QR encodes,
  - a **🔒 private stats page** link — keep this one to yourself.
- Open the private link anytime to see **total scans**, **countries**, and a
  per‑scan table (time, country, city, device).

## Deploying to Vercel

1. Push the repo to **GitHub** (private is fine).
2. Go to [vercel.com](https://vercel.com) → sign in **with GitHub** → **Add New →
   Project** → import **`cv2qr`**. The framework is auto‑detected as Next.js;
   leave the build settings at their defaults.
3. **Before deploying, expand *Environment Variables*** and add the same two
   values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   > This is the most common mistake — without them the site builds but errors
   > at runtime (exactly like localhost does before the keys are set).
4. **Deploy.** After ~1–2 minutes you get a public URL like
   `https://cv2qr.vercel.app`.

From now on the app is **scannable from any phone, anywhere**, and country/city
analytics populate automatically (Vercel adds the geo headers).

> Every future `git push` to the connected branch **auto‑redeploys** the site.
> **Tip:** QR codes you generated on `localhost` still point to your laptop —
> generate fresh ones on the live URL to get shareable, phone‑scannable codes.

## Environment variables

| Variable | Where it's used | Where to find it | Secret? |
|----------|-----------------|------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Server (Supabase client) | Supabase → Settings → Data API → Project URL | No (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (uploads + DB writes) | Supabase → Settings → API Keys → `service_role` | **Yes** |

Set these in `.env.local` for local dev **and** in the Vercel project settings
for production.

## Database schema

Defined in [`supabase/schema.sql`](supabase/schema.sql).

**`codes`** — one row per generated QR:

| Column | Type | Notes |
|--------|------|-------|
| `id` | text (PK) | short public id, shown in the `/s/<id>` link |
| `type` | text | `'link'` or `'pdf'` |
| `destination` | text | where scans redirect (the link, or the PDF's public URL) |
| `label` | text | optional friendly name (e.g. the PDF filename) |
| `admin_token` | text (unique) | secret key for the private stats page |
| `created_at` | timestamptz | defaults to now |

**`scans`** — one row per scan:

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint (PK) | auto‑increment |
| `code_id` | text (FK → codes.id) | which code was scanned |
| `scanned_at` | timestamptz | defaults to now |
| `country` / `city` | text | approximate, from the visitor's IP (production only) |
| `device` | text | `Mobile` / `Tablet` / `Desktop` / `Unknown` |
| `user_agent` | text | truncated UA string |

Both tables have **row‑level security enabled with no policies**, so the public
`anon` key can't touch them. The app reads/writes only from the server using the
`service_role` key, which bypasses RLS.

## API & routes reference

| Route | Method | Purpose | Returns |
|-------|--------|---------|---------|
| `/api/create` | POST | Create a tracked code from a link. Body: `{ "destination": "https://..." }` | `{ id, adminToken }` |
| `/api/upload` | POST | Upload a PDF (multipart `file`), store it, create a tracked code | `{ id, adminToken }` |
| `/s/[id]` | GET | Log a scan, then `302` redirect to the destination | redirect |
| `/dashboard/[token]` | GET | Private, server‑rendered scan stats for one code | HTML page |

## Privacy

Scans are logged with a timestamp, an **approximate** location (country/city
derived from the visitor's IP by the host), and a **coarse** device type
(mobile / tablet / desktop). Individual scanners **cannot be identified** — this
is aggregate analytics, not tracking of people. If you share the app publicly,
consider adding a short privacy note for scanners.

## Troubleshooting

**"Supabase is not configured…"** — `.env.local` is missing or the variables are
empty. Fill in both values and restart `npm run dev` (env changes require a
restart).

**"Invalid API key"** — the `SUPABASE_SERVICE_ROLE_KEY` value is wrong. It must
be the long `eyJ…` token (or `sb_secret_…`). A short ~36‑char value is usually
the *JWT Secret* or a *Publishable* key by mistake — those don't work.

**"new row violates row‑level security policy"** — you used the **`anon`** key
instead of **`service_role`**. Both are long `eyJ…` tokens, so they're easy to
confuse. The `service_role` key bypasses RLS; the `anon` key doesn't. Swap it.

**Requests 404 / weird `/rest/v1/rest/v1/` paths** — your
`NEXT_PUBLIC_SUPABASE_URL` includes a path like `/rest/v1/`. Use the **base URL
only** (`https://<ref>.supabase.co`).

**A phone can't scan my QR** — you generated it on `localhost`. Deploy to Vercel
and generate the QR on the live URL.

**Uploads fail with a storage error** — the `cvs` bucket doesn't exist or isn't
public. Recreate it as a **public** bucket named exactly `cvs`.

## Roadmap

- [x] **Phase 1** — Link → QR
- [x] **Phase 2** — PDF → hosted URL → QR
- [x] **Phase 3** — Cloud storage, tracked links, scan analytics, deployable
- [ ] **Phase 4** — user accounts (each user sees only their own codes), custom
      QR styling, CSV export of scans, per‑code expiry, and charts on the
      dashboard

---

Built step by step as a learning project. Contributions and ideas welcome.
