// src/App.js
import "./App.css";
import "./lib/windowApi"; // ← window.api をセット

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Firebase 初期化完了を待つ
import { authReady } from "./firebase";

// --- ページ ---
import LandingPage from "./pages/LandingPage";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Legal from "./pages/Legal";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Dashboard from "./pages/Dashboard";
import MyPage from "./pages/MyPage";
import Archive from "./pages/Archive";
import LoginForm from "./LoginForm";
import SiteFooter from "./components/SiteFooter";

// 課金フロー関連
import Welcome from "./pages/Welcome";            // 決済後のパスワード設定案内
import Account from "./pages/Account";            // マイアカウント（プラン/請求）
import ProtectedRoute from "./components/ProtectedRoute.jsx"; // 認証ガード
import ResetPassword from "./pages/ResetPassword";            // パスワード再発行

function App() {
  // 🔒 Auth 初期化待ち（永続ログインの安定化）
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    authReady.then(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    // 初回ロード時のチラつき防止用の簡易ローディング
    return (
      <div style={{ textAlign: "center", paddingTop: 120, fontSize: 16 }}>
        🔄 読み込み中…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 🌐 公開ページ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />

        {/* 🔐 認証系 */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/welcome" element={<Welcome />} /> {/* 決済→遷移 */}

        {/* アプリ内ページ */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/archive" element={<Archive />} />

        {/* 課金アカウント（要ログイン） */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        {/* 🚫 404 → LP */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SiteFooter />
    </BrowserRouter>
  );
}

export default App;