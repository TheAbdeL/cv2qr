import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deviceFromUA } from "@/lib/device";

// The URL the QR encodes. Every scan lands here: we log it, then redirect
// the visitor on to the real link or PDF.
export async function GET(request, { params }) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: code } = await db
    .from("codes")
    .select("destination")
    .eq("id", id)
    .single();

  if (!code) {
    return new NextResponse("This code was not found.", { status: 404 });
  }

  // Log the scan. Vercel injects the geo headers for free in production;
  // locally they're absent, so those columns are just null.
  const h = request.headers;
  const ua = h.get("user-agent") || "";
  const city = h.get("x-vercel-ip-city");
  await db.from("scans").insert({
    code_id: id,
    country: h.get("x-vercel-ip-country"),
    city: city ? decodeURIComponent(city) : null,
    device: deviceFromUA(ua),
    user_agent: ua.slice(0, 300),
  });

  return NextResponse.redirect(code.destination, 302);
}
