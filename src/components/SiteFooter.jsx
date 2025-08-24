import React from "react";
import { Link } from "react-router-dom";

function SiteFooter() {
  return (
    <footer style={{ padding: "20px", textAlign: "center", fontSize: "14px" }}>
      <nav>
        <Link to="/about" style={{ margin: "0 10px" }}>About</Link>
        <Link to="/privacy" style={{ margin: "0 10px" }}>Privacy Policy</Link>
        <Link to="/terms" style={{ margin: "0 10px" }}>Terms of Service</Link>
        <Link to="/legal" style={{ margin: "0 10px" }}>Legal Notice</Link>
      </nav>
      <p style={{ marginTop: "10px" }}>© 2025 MentalGPT / Okulab</p>
    </footer>
  );
}

export default SiteFooter;