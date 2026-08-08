import { supabaseAdmin } from "@/lib/supabase";

// Always render fresh — scan counts change over time.
export const dynamic = "force-dynamic";

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default async function Dashboard({ params }) {
  const { token } = await params;
  const db = supabaseAdmin();

  // The secret token IS the access key — possessing this URL grants access.
  const { data: code } = await db
    .from("codes")
    .select("*")
    .eq("admin_token", token)
    .single();

  if (!code) {
    return (
      <main className="wrap">
        <h1>Scan stats</h1>
        <p className="subtitle">This stats link is invalid or was removed.</p>
      </main>
    );
  }

  const { data: scans } = await db
    .from("scans")
    .select("*")
    .eq("code_id", code.id)
    .order("scanned_at", { ascending: false });

  const list = scans || [];
  const countries = new Set(list.map((s) => s.country).filter(Boolean));

  return (
    <main className="wrap">
      <h1>Scan stats</h1>
      <p className="subtitle">
        {code.type === "pdf" ? `PDF · ${code.label || "file"}` : "Link"} · code{" "}
        <code>{code.id}</code>
      </p>

      <div className="stat-row">
        <div className="stat">
          <div className="stat-num">{list.length}</div>
          <div className="stat-label">total scans</div>
        </div>
        <div className="stat">
          <div className="stat-num">{countries.size}</div>
          <div className="stat-label">countries</div>
        </div>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <p className="subtitle" style={{ margin: 0 }}>
            No scans yet. Share your QR code and check back here.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="scan-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>{fmt(s.scanned_at)}</td>
                    <td>{s.country || "—"}</td>
                    <td>{s.city || "—"}</td>
                    <td>{s.device || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="hint">
        Location is approximate (derived from the visitor&apos;s IP) and only
        available once the app is deployed. Individual scanners can&apos;t be
        identified.
      </p>
    </main>
  );
}
