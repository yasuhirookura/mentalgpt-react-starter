// src/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);
        const user = auth.currentUser;
        if (!user) throw new Error("not signed in");

        // Firebase ID トークンを取得
        const idToken = await user.getIdToken();

        // サーバーへ問い合わせ（/api/account-summary）
        const r = await fetch("/api/account-summary", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "failed");

        setSummary(j);
      } catch (e) {
        console.error("[account] error", e);
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="container"><p>読み込み中…</p></main>;
  if (error)   return <main className="container"><p>エラー: {error}</p></main>;

  return (
    <main className="container" style={{maxWidth: 700}}>
      <h1>アカウント</h1>
      <div className="card">
        <p><b>メール:</b> {auth.currentUser?.email}</p>
        <p><b>プラン:</b> {summary?.plan || "-"}</p>
        <p><b>次回請求日:</b> {summary?.nextInvoice || "-"}</p>
        <form method="POST" action="/api/create-portal-session">
          <button className="btn">お支払いを管理（Stripe）</button>
        </form>
      </div>
    </main>
  );
}