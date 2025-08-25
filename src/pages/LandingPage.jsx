import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="hero">
        <h1>MentalGPT</h1>
        <p className="lead">
          あなたの心にやさしく寄り添う、AIメンタルサポート。<br />
          いつでも、どこでも、安心して自分の気持ちを言葉に。
        </p>
        <div className="cta-row">
          <Link to="/login" className="btn primary">今すぐはじめる</Link>
          <Link to="/pricing" className="btn outline">料金を見る</Link>
        </div>
        <p className="mini-note">
          ※本サービスは医療行為ではありません（診断・治療は行いません）。
        </p>
      </section>

      <section className="features container">
        <h2>特徴</h2>
        <ul className="feature-list">
          <li>24時間いつでも相談できる</li>
          <li>プライバシーに配慮した安心設計</li>
          <li>やさしい応答と次の一歩の提案</li>
        </ul>
      </section>

      <section className="how container">
        <h2>使い方</h2>
        <ol className="howto">
          <li>アカウント作成（Google / メール）</li>
          <li>気持ちや状況をチャットで入力</li>
          <li>AIがやさしく返答、セルフケアをサポート</li>
        </ol>
      </section>
    </main>
  );
}
