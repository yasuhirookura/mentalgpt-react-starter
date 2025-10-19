// src/pages/Welcome.jsx
import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

// ★既存の Firebase Web SDK の設定を使ってください（環境に合わせて値を置換）
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Welcome() {
  const [status, setStatus] = useState('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        if (!sessionId) throw new Error('no session_id');

        // サーバー経由でメールを取得
        const r = await fetch(`/api/checkout-email?session_id=${encodeURIComponent(sessionId)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'failed to fetch email');

        setEmail(j.email);

        // パスワード設定用メールを送信（リンククリック後に /login へ戻す例）
        await sendPasswordResetEmail(auth, j.email, {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false,
        });

        setStatus('sent');
      } catch (e) {
        console.error('[welcome] failed:', e);
        setStatus('error');
      }
    })();
  }, []);

  if (status === 'loading') return <main className="container"><h1>処理中です…</h1></main>;
  if (status === 'error')
    return (
      <main className="container">
        <h1>セットアップに失敗しました</h1>
        <p>大変お手数ですが、<b>ログイン画面の「パスワードをお忘れですか？」</b>から、登録メール宛に再送してください。</p>
      </main>
    );

  return (
    <main className="container" style={{ maxWidth: 680 }}>
      <h1>ようこそ！</h1>
      <p>{email} 宛に <b>パスワード設定用のメール</b> をお送りしました。</p>
      <p>メール内のリンクからパスワードを設定し、ログインしてください。</p>
      <p style={{marginTop: 12, color:'#666'}}>※届かない場合は迷惑メールをご確認のうえ、数分待って再度お試しください。</p>
    </main>
  );
}