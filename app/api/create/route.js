import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { shortId } from "@/lib/ids";

// Create a tracked code for a plain link.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const destination = (body?.destination || "").trim();
  if (!/^https?:\/\/.+/i.test(destination)) {
    return NextResponse.json(
      { error: "Enter a valid http(s) link." },
      { status: 400 }
    );
  }

  const id = shortId();
  const adminToken = shortId(24);

  try {
    const db = supabaseAdmin();
    const { error } = await db.from("codes").insert({
      id,
      type: "link",
      destination,
      admin_token: adminToken,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ id, adminToken });
}
