# Event Expense Calculator (Made Creative Works)

Next.js (Pages Router) app:
- Gated details form + math CAPTCHA
- Expense calculator (predefined + custom items)
- Excel/CSV-driven items with header validation
- PDF export (jsPDF + autotable)
- Email via Gmail SMTP (Nodemailer)
- Ready to embed in Wix via iframe

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
# open http://localhost:3000/expense-calculator
```

## Deploy (Vercel)
- Import repo into Vercel
- Add env vars from `.env.local.example`
- Use `/expense-calculator` as the embed URL in your Wix iframe
