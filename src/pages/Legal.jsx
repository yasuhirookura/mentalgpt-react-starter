import React from "react";
import "./site.css";

export default function Legal() {
  return (
    <main className="legal container pad">
      <h1>特定商取引法に基づく表記</h1>

      <h2>販売事業者</h2><p>OKULAB（個人/法人いずれか明記）</p>
      <h2>運営責任者</h2><p>氏名（または代表者名）</p>
      <h2>所在地</h2><p>東京都〇〇区〇〇 1-2-3（市区町村までで可）</p>
      <h2>お問い合わせ</h2><p><a href="mailto:info@okulab.com">info@okulab.com</a></p>

      <h2>販売価格</h2><p>月額 980円（税込）</p>
      <h2>お支払い方法</h2><p>クレジットカード決済（Stripe）</p>
      <h2>役務の提供時期</h2><p>決済完了後、即時に利用可能</p>
      <h2>キャンセル・返金</h2><p>デジタルサービスの特性上、原則返金不可（法令に基づく場合を除く）</p>

      <h2>免責事項</h2>
      <p>
        本サービスは医療行為、診断、治療を行うものではありません。
        必要に応じ医療機関や専門機関にご相談ください。
      </p>

      <p className="date">掲載日：2025年8月20日</p>
    </main>
  );
}
