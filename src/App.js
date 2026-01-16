// src/App.js
import "./App.css";
import "./lib/windowApi";

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Firebase
import { authReady } from "./firebase";

// ページ
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
import ResetPassword from "./pages/ResetPassword";
import Welcome from "./pages/Welcome";
import Account from "./pages/Account";

// コンポーネント
import SiteFooter from "./components/SiteFooter";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // ✅ Auth 確定待ち（ログイン維持の要）
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    authReady.then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
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

        {/* 🔐 認証 */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/welcome" element={<Welcome />} />

        {/* 🔒 要ログインページ */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/archive"
          element={
            <ProtectedRoute>
              <Archive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        {/* 🚫 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SiteFooter />
    </BrowserRouter>
  );
}

export default App;