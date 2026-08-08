"use client";

import { useState } from "react";
import QRCode from "qrcode";

export default function Home() {
  const [mode, setMode] = useState("link"); // "link" | "pdf"
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [qr, setQr] = useState(null); // data URL of the generated QR image
  const [shortUrl, setShortUrl] = useState(""); // the tracked URL the QR encodes
  const [statsUrl, setStatsUrl] = useState(""); // private dashboard URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Build a QR PNG (data URL) from any text/URL.
  async function makeQr(text) {
    return QRCode.toDataURL(text, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  }

  function reset() {
    setQr(null);
    setShortUrl("");
    setStatsUrl("");
    setError("");
  }

  // Turn a freshly-created code into a QR pointing at our tracking URL.
  async function finish(id, adminToken) {
    const origin = window.location.origin;
    const tracked = `${origin}/s/${id}`;
    setShortUrl(tracked);
    setStatsUrl(`${origin}/dashboard/${adminToken}`);
    setQr(await makeQr(tracked));
  }

  // A link becomes a tracked code, then a QR.
  async function handleLink(e) {
    e.preventDefault();
    reset();
    if (!link.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: link.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the link.");
      await finish(data.id, data.adminToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // A PDF is uploaded to cloud storage, wrapped in a tracked code, then a QR.
  async function handlePdf(e) {
    e.preventDefault();
    reset();
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      await finish(data.id, data.adminToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <h1>CV → QR</h1>
      <p className="subtitle">
        Turn a CV PDF or any link into a scannable QR code — and see who scans
        it.
      </p>

      <div className="tabs">
        <button
          className={`tab ${mode === "link" ? "active" : ""}`}
          onClick={() => {
            setMode("link");
            reset();
          }}
        >
          🔗 Link
        </button>
        <button
          className={`tab ${mode === "pdf" ? "active" : ""}`}
          onClick={() => {
            setMode("pdf");
            reset();
          }}
        >
          📄 PDF
        </button>
      </div>

      <div className="card">
        {mode === "link" ? (
          <form key="link-form" onSubmit={handleLink}>
            <label htmlFor="link">Paste a link</label>
            <input
              id="link"
              type="text"
              placeholder="https://example.com/my-cv"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Generating…" : "Generate QR"}
            </button>
          </form>
        ) : (
          <form key="pdf-form" onSubmit={handlePdf}>
            <label htmlFor="file">Upload a PDF (CV)</label>
            <input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Uploading…" : "Upload & Generate QR"}
            </button>
            <p className="hint">
              The PDF is stored in cloud storage and the QR points to a tracked
              link that redirects to it — scannable from any phone once
              deployed.
            </p>
          </form>
        )}

        {error && <p className="error">{error}</p>}

        {qr && (
          <div className="result">
            <img src={qr} alt="Generated QR code" />
            <p className="link">
              Public link (in the QR):{" "}
              <a href={shortUrl} target="_blank" rel="noreferrer">
                {shortUrl}
              </a>
            </p>
            <div className="downloads">
              <a href={qr} download="qr-code.png">
                ⬇ Download QR (PNG)
              </a>
            </div>
            <p className="hint stats-hint">
              🔒 Your private stats page — keep this to yourself:
              <br />
              <a href={statsUrl} target="_blank" rel="noreferrer">
                {statsUrl}
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
