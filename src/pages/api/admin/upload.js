import * as XLSX from "xlsx";
import { put } from "@vercel/blob";

const isNumber = (v) => Number.isFinite(Number(v));

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  // Very simple gate: cookie is checked by middleware already
  const cookie = req.headers.cookie || "";
  if (!cookie.includes("admin_session=1")) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const { base64 } = req.body || {};
    if (!base64) { res.status(400).json({ error: "Missing file data" }); return; }
    const buf = Buffer.from(base64, "base64");

    // Parse Excel
    const wb = XLSX.read(buf, { type: "buffer" });
    if (!wb.SheetNames?.length) { res.status(400).json({ error: "Workbook has no sheets" }); return; }
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows.length) { res.status(400).json({ error: "Sheet is empty" }); return; }

    // Validate headers
    const header = (rows[0] || []).map((h) => String(h || "").trim());
    const lc = new Map(header.map((h, i) => [h.toLowerCase(), i]));
    const required = ["eventtype", "item", "price"];
    const missing = required.filter((r) => !lc.has(r));
    if (missing.length) {
      res.status(400).json({ error: `Invalid headers. Missing: ${missing.join(", ")}. Expected: EventType, Item, Price` });
      return;
    }
    const idxE = lc.get("eventtype");
    const idxI = lc.get("item");
    const idxP = lc.get("price");

    // Build grouped JSON
    const grouped = {};
    let id = Date.now();
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const ev = String(row[idxE] ?? "").trim();
      const name = String(row[idxI] ?? "").trim();
      const price = Number(row[idxP]);
      if (!ev || !name || !isNumber(price)) continue;
      const key = ev.toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ id: id++, name, price });
    }
    if (!Object.keys(grouped).length) {
      res.status(400).json({ error: "No valid rows found (check data types & blanks)" });
      return;
    }

    // Save to a fixed Blob path (overwrites each time)
    const json = JSON.stringify(grouped);
    const result = await put("items.json", json, {
      access: "public",
      addRandomSuffix: false,            // keep the same path
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    res.status(200).json({ ok: true, url: result.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process upload" });
  }
}
