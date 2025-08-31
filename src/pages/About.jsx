import React from "react";
import BackToHome from "../components/BackToHome";

export default function About() {
  return (
    <main className="container pad page-container">
      <BackToHome />
      <h1>About MentalGPT</h1>

      <p>
        私（大倉恭弘）は、広告オフィス「ベースボール」を営む個人事業主です。
        自身の運営するウェブサイト「Okulab（オークラボ）」上で、
        サブブランドとして「MentalGPT」を開発・提供しています。
      </p>

      <p>
        私は2024年から2年続けて手術を受け、その後の生活のなかで気持ちが沈む時期もありました。
        そんななか、ChatGPTに健康面や精神面の悩みを話すことでポジティブなアドバイスを得られた経験から、
        「誰でも気軽に気持ちを記録し、振り返れるサービス」を作りたいと考えました。
        その結果として生まれたのが MentalGPT です。
      </p>

      <p>
        本サービスのAI応答は OpenAI が提供する API（ChatGPT）を利用して生成されています。
        品質向上のためにモデルを変更する場合があります。
      </p>

      <p>
        MentalGPT は医療行為や診断を目的とするものではありません。
        あくまでセルフケア・自己理解を助けるツールとしてご利用ください。
      </p>

      <p>
        運営：ベースボール（個人事業主）<br />
        代表：大倉恭弘<br />
        ウェブサイト：<a href="https://okulab.com/">okulab.com</a>
      </p>
    </main>
  );
}