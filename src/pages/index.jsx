import Link from "next/link";

const NOTE_TEXT =
  "This tool developed by MADE CREATIVE WORKS is only a first step towards letting our clients know and calculate a rough estimate of your given event. Please note, this is not an official quote / estimate by MADE CREATIVE WORKS. For an exact quote or estimate, please feel free to contact us so that we can help you plan and execute your event.";

const PRIVACY_TEXT =
  "MADE CREATIVE WORKS collects your data such as name and contact information to get in touch with you and improve your experience of organising your event.";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fafafa",
      }}
    >
      <main style={{ flex: "1 0 auto", padding: "40px 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
          Event Expense Calculator
        </h1>
        <p style={{ color: "#444", marginBottom: "12px" }}>
          Powered and Built by <strong>MADE CREATIVE WORKS</strong>
        </p>

        <p
          style={{
            maxWidth: "900px",
            margin: "8px auto 24px",
            fontSize: "15px",
            lineHeight: "1.5",
            color: "#555",
          }}
        >
          {NOTE_TEXT}
        </p>

        <Link href="/expense-calculator">
          <button
            style={{
              padding: "12px 24px",
              background: "#111827",
              color: "#fff",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Go to Calculator →
          </button>
        </Link>
      </main>

      <footer
        style={{
          borderTop: "1px solid #ddd",
          background: "#fff",
          padding: "20px 16px",
          fontSize: "14px",
          color: "#333",
        }}
      >
        <p style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
          {PRIVACY_TEXT}
        </p>
        <p style={{ marginBottom: "8px" }}>
          Powered and Built by <strong>MADE CREATIVE WORKS</strong>
        </p>
        <div style={{ display: "grid", gap: "6px" }}>
          <div>
            MADE CREATIVE WORKS, BC 86, Welling Compound, Independence Road,
            Camp, Belagavi, Karnataka, India – 590001
          </div>
          <div>
            <a href="tel:9535395538">9535395538</a> /{" "}
            <a href="tel:9901315423">9901315423</a>
          </div>
          <div>
            <a href="mailto:madeinbelgaum@gmail.com">
              madeinbelgaum@gmail.com
            </a>
          </div>
          <div>
            <a
              href="http://www.madecreativeworks.com"
              target="_blank"
              rel="noreferrer"
            >
              www.madecreativeworks.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
