// src/pages/Pricing.jsx
import React from "react";

export default function Pricing() {
  return (
    <main className="container" style={{ maxWidth: 680 }}>
      <h1>料金プラン</h1>

      {/* ライトプラン */}
      <section style={{ marginBottom: 32, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>ライトプラン</h2>
        <p>月額 980円（税込）</p>
        <ul>
          <li>1日 最大10回の相談（各 400文字まで）</li>
          <li>履歴保存：30日</li>
        </ul>
        <a
          href="#"
          // 本番では例: "https://buy.stripe.com/xxx_light" に差し替え
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ marginTop: 8, display: "inline-block" }}
        >
          ライトを申し込む（¥980/月）
        </a>
      </section>

      {/* スタンダードプラン */}
      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>スタンダードプラン</h2>
        <p>月額 1,980円（税込）</p>
        <ul>
          <li>1日 最大30回の相談（各 400文字まで）</li>
          <li>履歴保存：90日</li>
          <li>CSV出力機能</li>
        </ul>
        <a
          href="#"
          // 本番では例: "https://buy.stripe.com/yyy_standard" に差し替え
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ marginTop: 8, display: "inline-block" }}
        >
          スタンダードを申し込む（¥1,980/月）
        </a>
      </section>
    </main>
  );
}