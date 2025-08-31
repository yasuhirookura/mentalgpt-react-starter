import React from "react";
import { Link } from "react-router-dom";

export default function BackToHome({ className = "" }) {
  return (
    <p className={`back-to-home ${className}`}>
      <Link to="/">← トップへ戻る</Link>
    </p>
  );
}