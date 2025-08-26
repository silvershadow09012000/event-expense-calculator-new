export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f9fafb" }}>
      {/* Header Section */}
      <header style={{ padding: "20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Event Expense Calculator</h1>
        <p style={{ marginTop: "4px", color: "#555" }}>
          Powered and Built by <strong>MADE CREATIVE WORKS</strong>
        </p>
        <p style={{ marginTop: "12px", maxWidth: "800px", marginLeft: "auto", marginRight: "auto", color: "#444" }}>
          This tool developed by <strong>MADE CREATIVE WORKS</strong> is only a first step towards letting our
          clients know and calculate a rough estimate of your given event. Please note, this is not an official quote / 
          estimate by <strong>MADE CREATIVE WORKS</strong>. For an exact quote or estimate, please feel free to contact us 
          so that we can help you plan and execute your event.
        </p>
      </header>

      {/* Form Section */}
      <main style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <form style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", width: "100%", maxWidth: "500px" }}>
          <input type="text" placeholder="Name" style={inputStyle} />
          <input type="text" placeholder="Phone Number" style={inputStyle} />
          <input type="email" placeholder="Email Address" style={inputStyle} />
          <input type="text" placeholder="City of Residence" style={inputStyle} />
          <input type="text" placeholder="Type of Event" style={inputStyle} />
          <input type="date" style={inputStyle} />

          <div style={{ marginTop: "12px", marginBottom: "12px" }}>
            <label><strong>What is 7 + 4 ?</strong></label>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <input type="text" placeholder="Your answer" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" style={{ padding: "8px 16px", border: "1px solid #ccc", borderRadius: "6px", background: "#f9fafb" }}>Refresh</button>
            </div>
          </div>

          <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#4b5563", color: "#fff", fontWeight: "600", borderRadius: "6px", border: "none" }}>
            Proceed
          </button>
        </form>
      </main>

      {/* Footer Section */}
      <footer style={{ marginTop: "auto", padding: "16px", textAlign: "center", borderTop: "1px solid #e5e7eb", fontSize: "14px", backgroundColor: "#fff" }}>
        <p style={{ marginBottom: "8px", color: "#555" }}>
          MADE CREATIVE WORKS collects your data such as name and contact information to get in touch with you and 
          improve your experience of organising your event.
        </p>
        <p style={{ fontSize: "12px", color: "#777" }}>
          Powered and Built by <strong>MADE CREATIVE WORKS</strong>
        </p>
        <div style={{ marginTop: "8px" }}>
          <p>MADE CREATIVE WORKS, BC 86, Welling Compound, Independence Road, Camp, Belagavi, Karnataka, India – 590001</p>
          <p>
            <a href="tel:9535395538">9535395538</a> / <a href="tel:9901315423">9901315423</a>
          </p>
          <p>
            <a href="mailto:madeinbelgaum@gmail.com">madeinbelgaum@gmail.com</a>
          </p>
          <p>
            <a href="http://www.madecreativeworks.com" target="_blank" rel="noreferrer">
              www.madecreativeworks.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  border: "1px solid #ddd",
  borderRadius: "6px",
};
