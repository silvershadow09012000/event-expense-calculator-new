import React, { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j?.error || "Login failed");
        return;
      }
      window.location.href = "/admin/upload";
    } catch {
      setMsg("Login failed");
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f9fafb" }}>
      <form onSubmit={submit} style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", width: 360 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Admin Login</h1>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, marginBottom: 12 }}
        />
        <button type="submit" style={{ width: "100%", padding: "10px 12px", background: "#111827", color: "#fff", borderRadius: 8 }}>
          Sign in
        </button>
        {msg && <p style={{ color: "#dc2626", marginTop: 10 }}>{msg}</p>}
      </form>
    </main>
  );
}
