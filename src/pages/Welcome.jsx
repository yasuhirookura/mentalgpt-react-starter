// src/pages/Welcome.jsx
import React, { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

// ✅ CRA(react-scripts) では REACT_APP_ プレフィックスが必須（ビルド時に注入）
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, // 例: mentalgpt-19189.firebaseapp.com
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Welcome() {
  const [status, setStatus] = useState<'loading' | 'sent' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const sentOnceRef = useRef(false);

  async function sendMail(targetEmail) {
    // 送信後の遷移先（ログインへ戻す）
    const continueUrl = `${window.location.origin}/login`;
    await sendPasswordResetEmail(auth, targetEmail, {
      url: continueUrl,
      handleCodeInApp: false, // 今回はブラウザで完結
    });
  }

  // 初回：session_id からメール取得 → 送信
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        if (!sessionId) throw new Error('session_id が見つかりません');

        const r = await fetch(`/api/checkout-email?session_id=${encodeURIComponent(sessionId)}`);
        const j = await r.json();
        if (!r.ok || !j?.email) {
          throw new Error(j?.error || 'メールアドレスの取得に失敗しました');
        }

        setEmail(j.email);

        if (!sentOnceRef.current) {
          await sendMail(j.email);
          sentOnceRef.current = true;
        }

        setStatus('sent');
      } catch (e) {
        console.error('[welcome] failed:', e);
        setErrMsg(
          e instanceof Error ? e.message : 'セットアップに失敗しました。時間をおいて再度お試しください。'
        );
        setStatus('error');
      }
    })();
  }, []);

  async function handleResend() {
    try {
      setStatus('loading');
      await sendMail(email);
      setStatus('sent');
    } catch (e) {
      console.error('[welcome] resend failed:', e);
      setErrMsg('再送に失敗しました。時間をおいてお試しください。');
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <main className="container" style={{ maxWidth: 680 }}>
        <h1>処理中です…</h1>
        <p>パスワード設定メールの準備をしています。</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="container" style={{ maxWidth: 680 }}>
        <h1>セットアップに失敗しました</h1>
        <p style={{ color: '#b91c1c' }}>{errMsg}</p>
        <p>
          お手数ですが、<b>ログイン画面の「パスワードをお忘れですか？」</b>からメールの再送をご利用ください。
        </p>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 680 }}>
      <h1>ようこそ！</h1>
      <p>
        <b>{email}</b> 宛に <b>パスワード設定用のメール</b> を送信しました。
      </p>
      <p>メール内のリンクからパスワードを設定し、ログインしてください。</p>
      <p style={{ marginTop: 12, color: '#666' }}>
        ※届かない場合は迷惑メールをご確認のうえ、数分待ってから下の「再送する」をお試しください。
      </p>
      <button
        type="button"
        onClick={handleResend}
        className="btn"
        style={{ marginTop: 12, padding: '8px 16px' }}
      >
        メールを再送する
      </button>
    </main>
  );
}