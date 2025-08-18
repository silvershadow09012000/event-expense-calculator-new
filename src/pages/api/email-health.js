import nodemailer from "nodemailer";

export default async function handler(req, res) {
  try {
    const expected = process.env.EMAIL_HEALTH_TOKEN || "";
    if (expected) {
      const got = req.headers["x-health-token"] || "";
      if (got !== expected) {
        res.status(401).json({ ok: false, error: "Unauthorized" });
        return;
      }
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.verify();
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "SMTP verification failed",
      reason: (err && (err.code || err.message)) || "unknown",
    });
  }
}
