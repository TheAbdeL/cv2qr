"use client";

import { useState } from "react";
import QRCode from "qrcode";

export default function Home() {
  const [mode, setMode] = useState("link"); // "link" | "pdf"
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [qr, setQr] = useState(null); // data URL of the generated QR image
  const [targetUrl, setTargetUrl] = useState(""); // what the QR encodes
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
    setTargetUrl("");
    setError("");
  }

  // Phase 1: a link becomes a QR directly, no server needed.
  async function handleLink(e) {
    e.preventDefault();
    reset();
    if (!link.trim()) return;
    setLoading(true);
    try {
      const dataUrl = await makeQr(link.trim());
      setTargetUrl(link.trim());
      setQr(dataUrl);
    } catch (err) {
      setError("Could not generate the QR code.");
    } finally {
      setLoading(false);
    }
  }

  // Phase 2: a PDF is uploaded, stored on the server, and the
  // returned URL becomes the QR.
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
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Turn the returned path into an absolute URL so a phone can open it.
      const absolute = `${window.location.origin}${data.url}`;
      const dataUrl = await makeQr(absolute);
      setTargetUrl(absolute);
      setQr(dataUrl);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <h1>CV → QR</h1>
      <p className="subtitle">
        Turn a CV PDF or any link into a scannable QR code.
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
              The file is stored on this server and the QR points to its
              download URL. To scan from your phone, both devices must be on the
              same network (use your computer&apos;s local IP instead of
              localhost).
            </p>
          </form>
        )}

        {error && <p className="error">{error}</p>}

        {qr && (
          <div className="result">
            <img src={qr} alt="Generated QR code" />
            <p className="link">
              Points to:{" "}
              <a href={targetUrl} target="_blank" rel="noreferrer">
                {targetUrl}
              </a>
            </p>
            <div className="downloads">
              <a href={qr} download="qr-code.png">
                ⬇ Download QR (PNG)
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
