import React from "react";
import { Link, useLocation } from "react-router-dom";

/** 各ページ先頭に置く「トップへ戻る」リンク */
export default function BackToHome({ to = "/" }) {
  const { pathname } = useLocation();
  if (pathname === to) return null;
  return (
    <p className="back-home">
      <Link to={to}>← トップへ戻る</Link>
    </p>
  );
}