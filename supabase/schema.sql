-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.

-- One row per QR code (a link or an uploaded PDF).
create table if not exists codes (
  id          text primary key,        -- short public id, shown in the /s/<id> link
  type        text not null check (type in ('link', 'pdf')),
  destination text not null,           -- where scans get redirected (link or file URL)
  label       text,                    -- optional friendly name (e.g. the PDF filename)
  admin_token text not null unique,    -- secret key for the private stats page
  created_at  timestamptz not null default now()
);

-- One row per scan.
create table if not exists scans (
  id         bigint generated always as identity primary key,
  code_id    text not null references codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  country    text,
  city       text,
  device     text,
  user_agent text
);

create index if not exists scans_code_id_idx on scans (code_id);

-- Lock the tables down. The app only touches them from the server with the
-- service-role key, which bypasses RLS. With RLS enabled and no policies, the
-- public anon key cannot read or write these tables.
alter table codes enable row level security;
alter table scans enable row level security;
