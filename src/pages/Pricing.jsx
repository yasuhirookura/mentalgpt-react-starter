import React from "react";
import { Link } from "react-router-dom";
import "./site.css";

export default function Pricing() {
  return (
    <main className="container pad">
      <h1>料金プラン</h1>

      <div className="plan-card">
        <h2>スタンダード</h2>
        <div className="price">月額 980円（税込）</div>
        <ul>
          <li>1日 最大10回の相談（各 〜400文字）</li>
          <li>履歴保存：30日</li>
          <li>いつでも解約可能</li>
        </ul>
        <Link className="btn primary" to="/login">登録してはじめる</Link>
      </div>

      <p className="note">
        7日間の無料体験あり（期間内の解約で料金は発生しません）。
      </p>
      <p className="mini-note">
        ※本サービスは医療行為ではありません。
      </p>
    </main>
  );
}
