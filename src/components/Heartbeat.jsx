// src/components/Heartbeat.jsx
import React from "react";
import "./Heartbeat.css";

export default function Heartbeat({ active = false, size = 40, label = "考え中…" }) {
  return (
    <div className="mgpt-heart-wrap" aria-live="polite" aria-label={active ? "考え中" : "待機中"}>
      <svg
        className={`mgpt-heart ${active ? "is-active" : "is-paused"}`}
        viewBox="0 0 24 24"
        role="img"
        aria-label="Heart"
        style={{ width: size, height: size }}
      >
        <path
          fill="currentColor"
          d="M12 21s-6.7-5-9.2-8.3C1 10.1 1 8.5 1 8.5 1 5.5 3.5 3 6.5 3
             8.5 3 10.2 4 12 6.1 13.8 4 15.5 3 17.5 3 20.5 3 23 5.5 23 8.5
             c0 0 0 1.6-1.8 4.2C18.7 16 12 21 12 21z"
        />
      </svg>
      <span className="mgpt-heart-text">{active ? label : ""}</span>
    </div>
  );
}