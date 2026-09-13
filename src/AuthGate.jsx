import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

export async function signOutUser() {
  await signOut(auth);
}

const googleProvider = new GoogleAuthProvider();

/**
 * Wraps the whole app. Shows a "Sign in with Google" screen until someone's
 * actually signed in; renders children once they are. Everything below this
 * component can assume auth.currentUser exists.
 */
export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | signed-out | signed-in
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setStatus(user ? "signed-in" : "signed-out");
    });
    return unsub;
  }, []);

  async function handleSignIn() {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged above picks up the result automatically.
    } catch (e) {
      setError(e.message || "Sign-in failed. Try again.");
    }
  }

  if (status === "signed-in") return children;

  if (status === "checking") {
    return (
      <Shell>
        <div className="marquee" style={{ fontSize: 22, color: "var(--gold)" }}>loading…</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="marquee" style={{ fontSize: 24, color: "var(--gold)", marginBottom: 4 }}>
        DWTS FANTASY LEAGUE
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, margin: "10px 0 20px" }}>
        Sign in with Google to continue — this is what lets your team follow you if you switch phones.
      </p>
      {error && (
        <div style={{ color: "#FF6B6B", fontSize: 12.5, marginBottom: 14 }}>{error}</div>
      )}
      <button className="btn btn-gold" style={{ width: "100%" }} onClick={handleSignIn}>
        Sign in with Google
      </button>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100vh", maxWidth: 480, margin: "0 auto", padding: "72px 24px",
      background: "#160D24", color: "#FFF9F2", fontFamily: "'Manrope', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;600;700&display=swap');
        .marquee { font-family: 'Anton', sans-serif; letter-spacing: .02em; }
        .btn-gold {
          background: linear-gradient(120deg,#F2C14E,#F5DFA7); color: #2A1140;
          border: none; border-radius: 11px; padding: 13px 20px; font-weight: 700;
          font-size: 15px; cursor: pointer;
        }
      `}</style>
      {children}
    </div>
  );
}
