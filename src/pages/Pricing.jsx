// src/pages/Pricing.jsx
import React, { useMemo, useState, useEffect } from "react";

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState(null); // "light" | "standard" | null
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isLocal = useMemo(() => {
    if (typeof window === "undefined") return false;
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("success") === "1") setNotice("お申し込みが開始されました。メールをご確認ください。");
    if (qs.get("canceled") === "1") setNotice("お申し込みをキャンセルしました。");
  }, []);

  async function handleSubscribe(plan) {
    if (loadingPlan) return;
    setError("");
    setNotice("");
    setLoadingPlan(plan);
    try {
      try { localStorage.setItem("plan", plan); } catch {}

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`failed: ${res.status} ${t}`);
      }

      const data = await res.json();
      if (data && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (e) {
      console.error("[pricing] checkout error:", e);
      setError("お申し込みの開始に失敗しました。少し待ってから再度お試しください。");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 680, margin: "0 auto", padding: 16 }}>
      <h1>料金プラン</h1>

      {isLocal && (
        <div
          style={{
            margin: "12px 0 20px",
            padding: "10px 12px",
            border: "1px dashed #cbd5e1",
            borderRadius: 8,
            background: "#f8fafc",
            fontSize: 13,
            color: "#334155",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>テスト決済ヒント</div>
          <div>カード番号: 4242 4242 4242 4242 / 有効期限: 12/34 / CVC: 123</div>
        </div>
      )}

      {notice && (
        <div
          style={{
            margin: "0 0 20px",
            padding: "10px 12px",
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            color: "#1e3a8a",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          style={{
            margin: "0 0 20px",
            padding: "10px 12px",
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* ライトプラン */}
      <section style={{ marginBottom: 32, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>ライトプラン</h2>
        <p>ワンコイン! 月額 500円（税込）</p>
        <ul>
          <li>1日 最大10回の相談（各 400文字まで）</li>
          <li>履歴保存：30日</li>
          <li>無料トライアル：7日間</li>
        </ul>
        <button
          type="button"
          className="btn primary"
          style={{ marginTop: 8, fontSize: "1.1rem", fontWeight: 600, padding: "10px 18px" }}
          onClick={() => handleSubscribe("light")}
          disabled={!!loadingPlan}
        >
          {loadingPlan === "light" ? "処理中…" : "ライトプランを申し込む（¥500/月）"}
        </button>
      </section>

      {/* スタンダードプラン */}
      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>スタンダードプラン</h2>
        <p>月額 980円（税込）</p>
        <ul>
          <li>1日 最大30回の相談（各 400文字まで）</li>
          <li>履歴保存：90日</li>
          <li>CSV出力機能</li>
        </ul>
        <button
          type="button"
          className="btn primary"
          style={{ marginTop: 8, fontSize: "1.1rem", fontWeight: 600, padding: "10px 18px" }}
          onClick={() => handleSubscribe("standard")}
          disabled={!!loadingPlan}
          title="すぐに課金が開始されます"
        >
          {loadingPlan === "standard" ? "処理中…" : "スタンダードプランを申し込む（¥980/月）"}
        </button>
      </section>

      <p style={{ fontSize: 13, color: "#666", marginTop: 20, textAlign: "center" }}>
        ※申込みを途中でキャンセルしたら、プランは未契約です。
      </p>
    </main>
  );
}