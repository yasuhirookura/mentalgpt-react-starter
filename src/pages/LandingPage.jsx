// src/pages/LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="landing">
      {/* ---------------- Hero Section ---------------- */}
      <section className="hero">
        <h1>MentalGPT</h1>
        <span
          style={{
            display: "inline-block",
            background: "#e9f2ff",
            color: "#0a6cff",
            fontWeight: 700,
            borderRadius: 8,
            padding: "4px 10px",
            marginTop: 8,
            fontSize: 14,
          }}
        >
          β版
        </span>

        <h2 className="hero-catch">
          あなたの心にやさしく寄り添う、AIメンタルサポート。
        </h2>

        <p className="hero-sub">
          対話することで気持ちが整理でき、<br className="sp-only" />
          心がふわっと軽くなる。<br />
          メンタル相談にアレンジされたAIに、<br className="sp-only" />
          24時間いつでも相談できるサービスです。
        </p>

        {/* ---------------- Free Trial Balloon ---------------- */}
        <div
          style={{
            display: "inline-block",
            position: "relative",
            background: "#ffc0cb",
            color: "#7a0030",
            fontWeight: "bold",
            borderRadius: 14,
            padding: "10px 18px",
            marginBottom: 4, // ← 間を詰めた
            fontSize: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          🎁 1週間無料体験！
          <span
            style={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "8px solid #ffc0cb",
            }}
          />
        </div>

        {/* ---------------- CTA Buttons ---------------- */}
        <div className="cta-row" style={{ marginTop: 4 }}>
          <Link to="/pricing" className="btn primary">
            今すぐ始める / プランを選ぶ
          </Link>
          <Link to="/login" className="btn outline">
            ログイン
          </Link>
        </div>

        <p className="mini-note">
          ※本サービスは医療行為ではありません（診断・治療は行いません）。<br />
          ※AI応答は OpenAI の API（ChatGPT）を利用しています。
        </p>
      </section>

      {/* ---------------- Features Section ---------------- */}
      <section className="features container">
        <h2>特徴</h2>
        <ul className="feature-list">
          <li>24時間いつでも相談できる</li>
          <li>プライバシーに配慮した安心設計</li>
          <li>やさしい応答と次の一歩の提案</li>
        </ul>
      </section>

      {/* ---------------- How-to Section ---------------- */}
      <section className="how container">
        <h2>使い方</h2>
        <ol className="howto">
          <li>プランを選んでアカウント作成</li>
          <li>気持ちや状況をチャットで入力</li>
          <li>AIがやさしく返答、セルフケアをサポート</li>
        </ol>
      </section>
    </main>
  );
}