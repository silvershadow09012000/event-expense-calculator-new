import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

/* ===== Helpers (plain JS) ===== */
const isPhoneValid = (s) => /^\d{10}$/.test(s);
const isEmailValid = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const makeCaptcha = () => ({ a: Math.floor(1 + Math.random() * 9), b: Math.floor(1 + Math.random() * 9) });
const captchaAnswer = (c) => c.a + c.b;
function validateFormData(data, expectedCaptchaSum) {
  const { name, phone, email, city, eventType, eventDate, captcha } = data || {};
  if (!name || !phone || !email || !city || !eventType || !eventDate || !captcha) {
    return { ok: false, reason: "Please fill in all the fields including captcha." };
  }
  if (!isPhoneValid(phone)) return { ok: false, reason: "Phone number must be a 10 digit number." };
  if (!isEmailValid(email)) return { ok: false, reason: "Please enter a valid email address." };
  if (Number(captcha) !== expectedCaptchaSum) return { ok: false, reason: "Captcha is incorrect. Please try again." };
  return { ok: true };
}
function computeTotal(items, quantities) {
  if (!Array.isArray(items) || !quantities) return 0;
  return items.reduce((sum, it) => sum + (quantities[it.id] || 0) * (Number(it.price) || 0), 0);
}

/* ===== Simple toasts ===== */
const Toast = ({ t }) => (
  <div
    role="status"
    style={{
      padding: "10px 12px",
      color: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      background: t.type === "success" ? "#16a34a" : t.type === "error" ? "#dc2626" : "#374151",
    }}
  >
    {t.message}
  </div>
);

export default function ExpenseCalculatorPage() {
  /* toasts */
  const [toasts, setToasts] = useState([]);
  const pushToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  /* simulated navigation */
  const [currentPage, setCurrentPage] = useState("form"); // "form" | "calculator"

  /* form state */
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    eventType: "",
    eventDate: "",
    captcha: "",
  });
  const [submittedForm, setSubmittedForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* captcha */
  const [captcha, setCaptcha] = useState(makeCaptcha());
  const answer = useMemo(() => captchaAnswer(captcha), [captcha]);
  const isCaptchaCorrect = Number(formData.captcha) === answer && formData.captcha.length > 0;

  /* items & calculator */
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [customEventName, setCustomEventName] = useState("");
  const [eventItems, setEventItems] = useState({
    wedding: [
      { id: 1, name: "Chairs", price: 100 },
      { id: 2, name: "Tables", price: 500 },
    ],
    corporate: [
      { id: 3, name: "Projector", price: 1500 },
      { id: 4, name: "PA System", price: 2000 },
    ],
    engagement: [],
    "baby shower": [],
    "naming ceremony": [],
    anniversary: [],
    "house opening": [],
    birthday: [],
  });
  const [customItems, setCustomItems] = useState([]);

  const SAMPLE_XLSX = "/sample.xlsx";
  const SAMPLE_CSV = "/sample.csv";

  /* Excel/CSV load with header validation */
  useEffect(() => {
    (async () => {
      async function tryLoad(url, kind) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("not-ok");
        if (kind === "xlsx") {
          const buf = await res.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array" });
          if (!wb.SheetNames?.length) throw new Error("no-sheets");
          const sheet = wb.Sheets[wb.SheetNames[0]];
          return XLSX.utils.sheet_to_json(sheet, { header: 1 });
        } else {
          const text = await res.text();
          const rows = text
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "")));
          return rows;
        }
      }
      try {
        let rows;
        try {
          rows = await tryLoad(SAMPLE_XLSX, "xlsx");
        } catch {
          rows = await tryLoad(SAMPLE_CSV, "csv");
        }
        if (!rows || !rows.length) {
          pushToast("error", "The sheet appears empty.");
          return;
        }
        const header = (rows[0] || []).map((h) => String(h || "").trim());
        const lc = new Map(header.map((h, i) => [h.toLowerCase(), i]));
        const required = ["eventtype", "item", "price"];
        const missing = required.filter((r) => !lc.has(r));
        if (missing.length) {
          pushToast("error", `Invalid headers. Missing: ${missing.join(", ")}. Expected: EventType, Item, Price`);
          return;
        }
        const idxE = lc.get("eventtype");
        const idxI = lc.get("item");
        const idxP = lc.get("price");
        const grouped = {};
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const ev = String(row[idxE] ?? "").trim();
          const name = String(row[idxI] ?? "").trim();
          const price = Number(row[idxP]);
          if (!ev || !name || !Number.isFinite(price)) continue;
          const key = ev.toLowerCase();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: Date.now() + r, name, price });
        }
        if (!Object.keys(grouped).length) {
          pushToast("error", "No valid rows found in the sheet.");
          return;
        }
        setEventItems((prev) => ({ ...prev, ...grouped }));
        pushToast("success", "Items loaded successfully.");
      } catch (e) {
        console.error(e);
        pushToast("error", "Failed to load sample.xlsx/csv.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* handlers */
  const refreshCaptcha = () => {
    setCaptcha(makeCaptcha());
    setFormData((s) => ({ ...s, captcha: "" }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const verdict = validateFormData(formData, answer);
    if (!verdict.ok) {
      pushToast("error", verdict.reason);
      if (verdict.reason.toLowerCase().includes("captcha")) refreshCaptcha();
      return;
    }
    setIsSubmitting(true);
    try {
      setSubmittedForm({ ...formData });
      await new Promise((r) => setTimeout(r, 200));
      setCurrentPage("calculator");
      setFormData({ name: "", phone: "", email: "", city: "", eventType: "", eventDate: "", captcha: "" });
      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToForm = () => {
    setFormData((s) => ({ ...s, ...(submittedForm ?? s), captcha: "" }));
    setCaptcha(makeCaptcha());
    setCurrentPage("form");
    pushToast("info", "Restored details — please solve the new CAPTCHA");
  };

  const handleQuantityChange = (id, value) =>
    setQuantities((q) => ({ ...q, [id]: Math.max(0, Number(value) || 0) }));

  const addCustomItem = () => setCustomItems((s) => [...s, { id: Date.now(), name: "New Item", price: 0 }]);
  const updateCustomItem = (id, field, value) =>
    setCustomItems((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: field === "price" ? Number(value) || 0 : value } : r)));
  const deleteCustomItem = (id) => {
    setCustomItems((rows) => rows.filter((r) => r.id !== id));
    setQuantities((q) => {
      const c = { ...q };
      delete c[id];
      return c;
    });
  };

  const calculateTotal = () =>
    selectedEvent === "custom"
      ? computeTotal(customItems, quantities)
      : !selectedEvent || !eventItems[selectedEvent]
      ? 0
      : computeTotal(eventItems[selectedEvent], quantities);

  const buildDetails = () => {
    const base = submittedForm || formData;
    const list = selectedEvent === "custom" ? customItems : eventItems[selectedEvent || ""] || [];
    const items = list.map((it) => ({
      name: it.name,
      price: it.price,
      quantity: quantities[it.id] || 0,
      subtotal: (quantities[it.id] || 0) * it.price,
    }));
    return {
      name: base?.name || "",
      phone: base?.phone || "",
      email: base?.email || "",
      city: base?.city || "",
      eventDate: base?.eventDate || "",
      selectedEvent: selectedEvent === "custom" ? customEventName || "Custom Event" : selectedEvent,
      items,
      total: calculateTotal(),
    };
  };

  const generatePDF = async () => {
    try {
      const d = buildDetails();
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Event Expense Calculator", 14, 20);
      doc.setFontSize(10);
      doc.text("Powered and Built by MADE CREATIVE WORKS", 14, 26);
      doc.setFontSize(12);
      doc.text(`Event: ${d.selectedEvent || ""}`, 14, 36);
      const body = (d.items || []).map((row) => [row.name, `₹${row.price}`, row.quantity, `₹${row.subtotal}`]);
      doc.autoTable({ head: [["Item", "Price", "Quantity", "Subtotal"]], body, startY: 46 });
      const y = doc.lastAutoTable?.finalY || 46;
      doc.text(`Total: ₹${d.total}`, 14, y + 10);
      doc.save("Event_Expense_Summary.pdf");
      pushToast("success", "PDF downloaded.");
    } catch {
      pushToast("error", "Failed to generate PDF.");
    }
  };

  const sendEmail = async () => {
    const d = buildDetails();
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Email failed.");
      }
      pushToast("success", "Details emailed successfully!");
    } catch (err) {
      console.error(err);
      pushToast("error", err?.message || "Failed to send email.");
    }
  };

  /* ===== Render ===== */
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f9fafb", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}
    >
      <main className="flex-1" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {currentPage === "form" && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>Event Expense Calculator</h1>
            <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 24, textAlign: "center" }}>
              Powered and Built by MADE CREATIVE WORKS
            </p>

            <form
              onSubmit={handleFormSubmit}
              style={{
                width: "100%",
                maxWidth: 520,
                background: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                borderRadius: 16,
                padding: 24,
                display: "grid",
                gap: 12,
              }}
            >
              <input
                required
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border rounded"
                style={{ padding: "10px 12px" }}
              />
              <input
                required
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border rounded"
                style={{ padding: "10px 12px" }}
              />
              <input
                required
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border rounded"
                style={{ padding: "10px 12px" }}
              />
              <input
                required
                placeholder="City of Residence"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="border rounded"
                style={{ padding: "10px 12px" }}
              />
              <input
                required
                placeholder="Type of Event"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="border rounded"
                style={{ padding: "10px 12px" }}
              />
              <input
                required
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="border rounded"
                style={{ padding: "10px 12px" }}
              />

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, background: "#e5e7eb", padding: "8px 12px", borderRadius: 8 }}>
                    What is {captcha.a} + {captcha.b} ?
                  </span>
                  <input
                    placeholder="Your answer"
                    value={formData.captcha}
                    onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
                    className="border rounded"
                    style={{ padding: "10px 12px" }}
                  />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}
                  >
                    Refresh
                  </button>
                  <span aria-live="polite" style={{ marginLeft: 4, fontSize: 18 }}>
                    {formData.captcha.length > 0 ? (isCaptchaCorrect ? "✅" : "❌") : ""}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: isCaptchaCorrect ? "#059669" : "#6b7280" }}>
                  {isCaptchaCorrect ? "Ready to submit!" : "Solve the CAPTCHA to enable submit"}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isCaptchaCorrect || isSubmitting}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#111827",
                  color: "#fff",
                  borderRadius: 8,
                  opacity: !isCaptchaCorrect || isSubmitting ? 0.6 : 1,
                  cursor: !isCaptchaCorrect || isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Submitting…" : "Proceed"}
              </button>
            </form>
          </>
        )}

        {currentPage === "calculator" && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>Expense Calculator</h1>
            <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 24, textAlign: "center" }}>
              Powered and Built by MADE CREATIVE WORKS
            </p>

            <div
              style={{
                width: "100%",
                maxWidth: 960,
                marginBottom: 24,
                display: "flex",
                gap: 12,
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={goBackToForm}
                style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}
              >
                ← Back to Details
              </button>
              <button
                onClick={() => {
                  const aoa = [
                    ["EventType", "Item", "Price"],
                    ["wedding", "Chairs", 100],
                    ["wedding", "Tables", 500],
                    ["corporate", "Projector", 1500],
                    ["corporate", "PA System", 2000],
                  ];
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.aoa_to_sheet(aoa);
                  XLSX.utils.book_append_sheet(wb, ws, "Template");
                  XLSX.writeFile(wb, "Event_Items_Template.xlsx");
                  pushToast("success", "Excel template downloaded.");
                }}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                Download Excel Template
              </button>
            </div>

            <div style={{ width: "100%", maxWidth: 480, marginBottom: 24 }}>
              <select
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
              >
                <option value="">Select Event Type</option>
                {Object.keys(eventItems).map((k) => (
                  <option key={k} value={k}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </option>
                ))}
                <option value="custom">➕ Custom Event</option>
              </select>
            </div>

            {selectedEvent === "custom" && (
              <div style={{ width: "100%", maxWidth: 1024, marginBottom: 24 }}>
                <input
                  placeholder="Enter Custom Event Name"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  style={{ marginBottom: 12, width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
                />
                <button
                  onClick={addCustomItem}
                  style={{ marginBottom: 12, padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}
                >
                  Add Item
                </button>
                <div style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderRadius: 12, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f3f4f6" }}>
                      <tr>
                        <th style={{ padding: 8, border: "1px solid #e5e7eb", textAlign: "left" }}>Item Name</th>
                        <th style={{ padding: 8, border: "1px solid #e5e7eb", textAlign: "left" }}>Price</th>
                        <th style={{ padding: 8, border: "1px solid #e5e7eb", textAlign: "left" }}>Quantity</th>
                        <th style={{ padding: 8, border: "1px solid #e5e7eb", textAlign: "left" }}>Subtotal</th>
                        <th style={{ padding: 8, border: "1px solid #e5e7eb", textAlign: "left" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customItems.map((item) => (
                        <tr key={item.id}>
                          <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>
                            <input
                              value={item.name}
                              onChange={(e) => updateCustomItem(item.id, "name", e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
                            />
                          </td>
                          <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateCustomItem(item.id, "price", e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
                            />
                          </td>
                          <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>
                            <input
                              type="number"
                              min={0}
                              value={quantities[item.id] || ""}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              style={{ width: 96, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
                            />
                          </td>
                          <td style={{ padding: 8, border: "1px solid #e5e7eb", fontWeight: 600 }}>
                            ₹{(quantities[item.id] || 0) * item.price}
                          </td>
                          <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>
                            <button
                              onClick={() => deleteCustomItem(item.id)}
                              style={{ padding: "8px 10px", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, background: "#fff" }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedEvent && selectedEvent !== "custom" && eventItems[selectedEvent] && (
              <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 768 }}>
                {eventItems[selectedEvent].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ color: "#4b5563" }}>₹{item.price} per item</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        min={0}
                        value={quantities[item.id] || ""}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        placeholder="Qty"
                        style={{ width: 96, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
                      />
                      <span style={{ fontWeight: 600 }}>₹{(quantities[item.id] || 0) * item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedEvent && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: "#fff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  borderRadius: 16,
                  textAlign: "center",
                  width: "100%",
                  maxWidth: 768,
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Total Expense</h2>
                <p style={{ fontSize: 22, marginTop: 8, color: "#059669", fontWeight: 700 }}>₹{calculateTotal()}</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
                  <button
                    onClick={() => setQuantities({})}
                    style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}
                  >
                    Reset Quantities
                  </button>
                  <button
                    onClick={sendEmail}
                    style={{ padding: "10px 12px", borderRadius: 8, background: "#111827", color: "#fff" }}
                  >
                    Send Details via Email
                  </button>
                  <button
                    onClick={generatePDF}
                    style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Toasts */}
      <div style={{ position: "fixed", top: 16, right: 16, display: "grid", gap: 8, zIndex: 50 }}>
        {toasts.map((t) => (
          <Toast key={t.id} t={t} />
        ))}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 14 }} role="contentinfo">
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 16px" }}>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            Powered and Built by <span style={{ fontWeight: 600 }}>MADE CREATIVE WORKS</span>
          </p>
          <div style={{ display: "grid", gap: 6 }}>
            <div>MADE CREATIVE WORKS, BC 86, Welling Compound, Independence Road, Camp, Belagavi, Karnataka, India – 590001</div>
            <div>
              <a href="tel:9535395538">9535395538</a> / <a href="tel:9901315423">9901315423</a>
            </div>
            <div><a href="mailto:madeinbelgaum@gmail.com">madeinbelgaum@gmail.com</a></div>
            <div><a href="http://www.madecreativeworks.com" target="_blank" rel="noreferrer">www.madecreativeworks.com</a></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
