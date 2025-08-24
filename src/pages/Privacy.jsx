import React from "react";
import "./site.css";

export default function Privacy() {
  return (
    <main className="legal container pad">
      <h1>プライバシーポリシー</h1>
      <p>OKULAB（以下「当社」）は、本サービス「MentalGPT」における個人情報の取扱いについて以下の通り定めます。</p>

      <h2>1. 取得する情報</h2>
      <ul>
        <li>アカウント情報（メールアドレス等）</li>
        <li>相談内容（ユーザー入力テキスト）</li>
        <li>技術情報（Cookie、IP、端末情報、利用ログ 等）</li>
      </ul>

      <h2>2. 利用目的</h2>
      <ul>
        <li>本サービスの提供・改善・不正利用防止</li>
        <li>ユーザーサポート、重要なお知らせの通知</li>
        <li>法令遵守のため</li>
      </ul>

      <h2>3. 第三者提供</h2>
      <p>法令に基づく場合を除き、本人の同意なく第三者に個人情報を提供しません。</p>

      <h2>4. 外部サービスの利用</h2>
      <p>
        本サービスは Firebase（認証・データ保存）、Stripe（決済）、OpenAI API を利用します。
        クレジットカード情報は当社で保持しません。
      </p>

      <h2>5. セキュリティ</h2>
      <p>適切な安全管理措置を講じ、個人情報の漏えい等の防止に努めます。</p>

      <h2>6. 開示・訂正・削除</h2>
      <p>ユーザーは、法令に基づき、ご自身の情報の開示等を請求できます。</p>

      <h2>7. お問い合わせ</h2>
      <p>本ポリシーに関するお問い合わせは <a href="mailto:info@okulab.com">info@okulab.com</a> まで。</p>

      <p className="date">制定：2025年8月24日 / 最終更新：2025年8月24日</p>
    </main>
  );
}
