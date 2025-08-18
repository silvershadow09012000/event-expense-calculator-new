import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    // Find items.json in your Blob store
    const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
    const found = blobs.find((b) => b.pathname === "items.json");
    if (!found) {
      res.status(200).json({ ok: true, items: null }); // not uploaded yet
      return;
    }
    const r = await fetch(found.url);
    const data = await r.json();
    res.status(200).json({ ok: true, items: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Failed to read items" });
  }
}
