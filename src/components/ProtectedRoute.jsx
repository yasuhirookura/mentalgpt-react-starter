// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function ProtectedRoute({ children }) {
const [checking, setChecking] = useState(true);
const [signedIn, setSignedIn] = useState(false);

useEffect(() => {
const unsub = onAuthStateChanged(auth, (user) => {
const ok = !!user;
setSignedIn(ok);
setChecking(false);

if (!ok) {
// 直前に見ようとしていたパスを保存（戻すため）
const returnTo = window.location.pathname + window.location.search;
localStorage.setItem('mgpt_return_to', returnTo);

const next = encodeURIComponent(returnTo);
window.location.replace(`/login?next=${next}`);
}
});
return () => unsub();
}, []);

if (checking) {
return (
<div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
<p style={{ color: '#64748b' }}>確認中です…</p>
</div>
);
}

return signedIn ? children : null;
}