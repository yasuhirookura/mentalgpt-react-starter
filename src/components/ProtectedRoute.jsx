// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';

export default function ProtectedRoute({ children }) {
  const [state, setState] = React.useState({ ready:false, user:null });
  React.useEffect(() => {
    const un = auth.onAuthStateChanged(u => setState({ ready:true, user:u }));
    return () => un && un();
  }, []);
  if (!state.ready) return <main className="container"><h2>読み込み中…</h2></main>;
  if (!state.user) return <Navigate to="/login" replace />;
  return children;
}