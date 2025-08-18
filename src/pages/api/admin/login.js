export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  // 24h cookie
  const secure = process.env.VERCEL ? "Secure; " : "";
  res.setHeader(
    "Set-Cookie",
    `admin_session=1; ${secure}HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
  );
  res.status(200).json({ ok: true });
}
