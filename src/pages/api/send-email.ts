import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

const isPhoneValid = (s: string) => /^\d{10}$/.test(s);
const isEmailValid = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    if (body.phone && !isPhoneValid(body.phone)) return res.status(400).json({ error: "Invalid phone. Must be 10 digits." });
    if (body.email && !isEmailValid(body.email)) return res.status(400).json({ error: "Invalid email format." });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const to = process.env.EMAIL_TO || "madeinbelgaum@gmail.com";
    const from = process.env.EMAIL_FROM || "madeinbelgaum@gmail.com";
    const subject = `Event Expense Summary - ${body.selectedEvent || "Event"}`;

    const text = `Event: ${body.selectedEvent || ""}
Date: ${body.eventDate || ""}

Items:
${(body.items || []).filter((it:any)=>(it.quantity??0)>0).map((it:any)=>`- ${it.name}: ₹${it.price} x ${it.quantity} = ₹${it.subtotal}`).join("\n") || "(No items selected.)"}

Total: ₹${body.total}

User:
Name: ${body.name || ""}
Phone: ${body.phone || ""}
Email: ${body.email || ""}
City: ${body.city || ""}
`;

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
        <h2 style="margin:0 0 8px 0">Event Expense Summary</h2>
        <p><strong>Event:</strong> ${body.selectedEvent || ""}</p>
        <p><strong>Date:</strong> ${body.eventDate || ""}</p>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Item</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Price</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Qty</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${
              (body.items || [])
                .filter((it:any)=>(it.quantity??0)>0)
                .map((it:any)=> `<tr>
                  <td style="padding:8px;border:1px solid #e5e7eb">${it.name}</td>
                  <td style="padding:8px;border:1px solid #e5e7eb">₹${Number(it.price || 0).toLocaleString("en-IN")}</td>
                  <td style="padding:8px;border:1px solid #e5e7eb">${Number(it.quantity || 0)}</td>
                  <td style="padding:8px;border:1px solid #e5e7eb">₹${Number(it.subtotal || 0).toLocaleString("en-IN")}</td>
                </tr>`).join("") || `<tr><td colspan="4" style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">No items selected.</td></tr>`
            }
          </tbody>
        </table>
        <p style="margin:12px 0 20px 0;font-size:16px"><strong>Total:</strong> ₹${Number(body.total||0).toLocaleString("en-IN")}</p>
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#374151">User Details</h3>
        <p style="margin:0"><strong>Name:</strong> ${body.name || ""}</p>
        <p style="margin:0"><strong>Phone:</strong> ${body.phone || ""}</p>
        <p style="margin:0"><strong>Email:</strong> ${body.email || ""}</p>
        <p style="margin:0"><strong>City:</strong> ${body.city || ""}</p>
      </div>
    `;

    await transporter.sendMail({
      from, to, subject, text, html,
      replyTo: (body.email && isEmailValid(body.email)) ? body.email : undefined,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Email failed to send." });
  }
}
