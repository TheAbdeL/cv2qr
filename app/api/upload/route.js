import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { shortId } from "@/lib/ids";

// Max upload size (5 MB) — keeps stray huge files out.
const MAX_BYTES = 5 * 1024 * 1024;
// Storage bucket name — create a PUBLIC bucket with this name in Supabase.
const BUCKET = "cvs";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 5 MB)." },
      { status: 400 }
    );
  }

  const id = shortId();
  const adminToken = shortId(24);

  try {
    const db = supabaseAdmin();

    // Upload the PDF to Supabase Storage.
    const objectName = `${shortId()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(objectName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Public URL the QR will ultimately point a visitor to.
    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(objectName);

    const { error: dbErr } = await db.from("codes").insert({
      id,
      type: "pdf",
      destination: pub.publicUrl,
      label: file.name,
      admin_token: adminToken,
    });
    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ id, adminToken });
}
