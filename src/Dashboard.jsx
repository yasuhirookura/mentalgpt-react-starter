// src/Dashboard.jsx
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import MentalGPT from "./MentalGPT";

function Dashboard({ user }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>ようこそ、{user?.email} さん！</h2>
        <button onClick={handleLogout}>ログアウト</button>
      </div>

      <MentalGPT user={user} />
    </div>
  );
}

export default Dashboard;