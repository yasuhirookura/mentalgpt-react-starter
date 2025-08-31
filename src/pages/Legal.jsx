import React from "react";
import BackToHome from "../components/BackToHome";

export default function Legal() {
  return (
    <main className="legal container pad">
      <BackToHome />
      <h1>特定商取引法に基づく表記</h1>

      <h2>販売事業者</h2><p>ベースボール（個人事業主）</p>
      <h2>運営責任者</h2><p>大倉恭弘</p>
      <h2>所在地</h2><p>東京都江東区福住2-8-10-1010</p>
      <h2>電話番号</h2><p>03-6240-3191 / 080-5028-2037（優先）</p>
      <h2>お問い合わせ</h2><p><a href="mailto:info@okulab.com">info@okulab.com</a></p>

      <h2>販売価格</h2><p>ライトプラン 月額980円（税込） / スタンダードプラン 月額1,980円（税込）</p>
      <h2>商品代金以外の必要料金</h2><p>インターネット接続にかかる通信費はお客様のご負担となります。</p>
      <h2>支払い方法</h2><p>クレジットカード（Stripe決済）</p>
      <h2>支払い時期</h2><p>お申し込み時に即時決済されます。以後は契約に基づき毎月自動更新。</p>
      <h2>サービス提供時期</h2><p>決済完了後、ただちに利用可能となります。</p>

      <h2>返品・キャンセルについて</h2>
      <p>デジタルサービスの特性上、原則として返品・返金はお受けしておりません。法令に基づく場合およびシステム不具合等で利用不能が確認できる場合は、個別に対応いたします。</p>

      <h2>免責事項</h2>
      <p>
        本サービスは医療行為、診断、治療を行うものではありません。
        必要に応じ医療機関や専門機関にご相談ください。
      </p>

      <p className="mini-note">※AI応答は OpenAI の API（ChatGPT）を利用しています。</p>
      <p className="date">掲載日：2025年8月31日</p>
    </main>
  );
}