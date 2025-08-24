import About from "./pages/About"; // 追加

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公開ページ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/about" element={<About />} />   {/* ←これを追加 */}

        {/* 認証系（既存） */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 404 → LP */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 全ページ共通フッター */}
      <SiteFooter />
    </BrowserRouter>
  );
}