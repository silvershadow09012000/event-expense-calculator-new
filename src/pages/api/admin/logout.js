export default function handler(req, res) {
  const secure = process.env.VERCEL ? "Secure; " : "";
  res.setHeader(
    "Set-Cookie",
    `admin_session=; ${secure}HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
  res.status(200).json({ ok: true });
}
