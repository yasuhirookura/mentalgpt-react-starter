import React, { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
// ルーティングを使っていなければ window.location.href でもOK
// import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate();

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut(getAuth());
      // 必要なら一時情報をクリア
      try { localStorage.removeItem('plan'); } catch {}
      // 画面遷移
      // navigate('/login');
      window.location.href = '/login';
    } catch (e) {
      console.error('logout failed:', e);
      alert('ログアウトに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={loading}>
      {loading ? 'ログアウト中…' : 'ログアウト'}
    </button>
  );
}