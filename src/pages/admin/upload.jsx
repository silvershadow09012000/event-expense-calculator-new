import React, { useState } from "react";

export default function AdminUpload() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const toBase64 = async (file) => {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!file) { setMsg("Please choose an .xlsx file"); return; }
    try {
      const base64 = await toBase64(file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Upload failed");
      setMsg("✅ Uploaded & saved items successfully.");
    } catch (err) {
      setMsg(`❌ ${err.message || "Upload failed"}`);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f9fafb" }}>
      <form onSubmit={submit} style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", width: 460 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Upload Item List (.xlsx)</h1>
        <p style={{ marginBottom: 12, color: "#374151" }}>Headers required: <b>EventType</b>, <b>Item</b>, <b>Price</b></p>
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="submit" style={{ marginTop: 12, width: "100%", padding: "10px 12px", background: "#111827", color: "#fff", borderRadius: 8 }}>
          Upload & Save
        </button>
        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
        <button type="button" onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" }).catch(()=>{});
          window.location.href = "/admin";
        }} style={{ marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" }}>
          Log out
        </button>
      </form>
    </main>
  );
}
