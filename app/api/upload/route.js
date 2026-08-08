import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

// Max upload size (5 MB) — keeps stray huge files out.
const MAX_BYTES = 5 * 1024 * 1024;

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

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadsDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  // Prefix with a timestamp and sanitise the name to avoid collisions/path tricks.
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  await writeFile(join(uploadsDir, safeName), buffer);

  // This path is served statically by Next from /public.
  return NextResponse.json({ url: `/uploads/${safeName}` });
}
