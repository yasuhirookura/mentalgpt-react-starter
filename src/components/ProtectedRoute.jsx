import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// ログイン済みユーザーしか見られないページを守るためのコンポーネント
export default function ProtectedRoute({ children }) {
const { currentUser, loading } = useAuth();

// Firebase Auth の状態確認が終わっていなければ「少し待ってください」表示
if (loading) {
return <div style={{ textAlign: "center", marginTop: "40px" }}>読み込み中...</div>;
}

// 未ログインなら /login にリダイレクト
if (!currentUser) {
return <Navigate to={`/login?next=${encodeURIComponent(window.location.pathname)}`} />;
}

// 認証済みなら子コンポーネントをそのまま表示
return children;
}