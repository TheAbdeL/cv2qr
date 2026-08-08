import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
//
// NEVER import this into a client component ("use client"). The service-role
// key bypasses row-level security and must stay on the server.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local (see .env.local.example)."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
