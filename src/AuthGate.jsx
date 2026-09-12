import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

export async function signOutUser() {
  await signOut(auth);
}

const PENDING_EMAIL_KEY = "dwts-pending-signin-email";

// Firebase needs to know where to send people back to after they click the
// emailed link. This has to be a domain listed in Firebase's "Authorized
// domains" (Authentication → Settings) or the link will fail — localhost is
// authorized by default, your real deployed domain needs adding by hand.
const actionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true,
};

/**
 * Wraps the whole app. Shows a small sign-in screen until the person has
 * clicked the emailed link; renders children once they're actually signed in.
 * Everything below this component can assume `auth.currentUser` exists.
 */
export default function AuthGate({ children }) {
  // 'checking' | 'signed-out' | 'link-sent' | 'confirm-email' | 'signed-in' | 'error'
  const [status, setStatus] = useState("checking");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      // Landing here via the emailed link takes priority over anything else.
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let savedEmail = window.localStorage.getItem(PENDING_EMAIL_KEY);
        if (!savedEmail) {
          // Common case: the link was opened on a different device/browser
          // than the one that requested it (e.g. clicked from a phone's mail
          // app). Firebase can't recover the email in that case — ask again.
          setStatus("confirm-email");
          return;
        }
        try {
          await signInWithEmailLink(auth, savedEmail, window.location.href);
          window.localStorage.removeItem(PENDING_EMAIL_KEY);
          // Clean the sign-in params out of the URL so a refresh doesn't
          // try to replay them.
          window.history.replaceState({}, "", window.location.pathname);
        } catch (e) {
          setStatus("error");
          setError("That sign-in link is invalid or has expired. Request a new one below.");
          return;
        }
      }
    })();

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { setStatus("signed-in"); return; }
      // A stray null callback shouldn't interrupt the mid-flow screens
      // (waiting on the emailed link, or confirming email on a new device).
      // From anywhere else — including a real sign-out — go to signed-out.
      setStatus((prev) => (prev === "link-sent" || prev === "confirm-email" ? prev : "signed-out"));
    });
    return unsub;
  }, []);

  async function requestLink(targetEmail) {
    setError("");
    try {
      await sendSignInLinkToEmail(auth, targetEmail, actionCodeSettings);
      window.localStorage.setItem(PENDING_EMAIL_KEY, targetEmail);
      setStatus("link-sent");
    } catch (e) {
      setError(e.message || "Couldn't send the sign-in email. Check the address and try again.");
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

  if (status === "link-sent") {
    return (
      <Shell>
        <div className="marquee" style={{ fontSize: 24, color: "var(--gold)", marginBottom: 12 }}>
          CHECK YOUR EMAIL
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 8 }}>
          We sent a sign-in link to <strong style={{ color: "var(--text)" }}>{email}</strong>.
          Open it on whichever device you want signed in — it can be a different one than
          this screen.
        </p>
        <p style={{ color: "var(--muted)", fontSize: 12.5 }}>
          Didn't get it? Check spam, or{" "}
          <button className="linklike" onClick={() => setStatus("signed-out")}>try again</button>.
        </p>
      </Shell>
    );
  }

  if (status === "confirm-email") {
    return (
      <Shell>
        <div className="marquee" style={{ fontSize: 24, color: "var(--gold)", marginBottom: 12 }}>
          CONFIRM YOUR EMAIL
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
          You opened this link on a different device than the one that requested it. Type the
          same email you signed in with to finish.
        </p>
        <EmailForm
          value={email}
          onChange={setEmail}
          error={error}
          onSubmit={async () => {
            try {
              await signInWithEmailLink(auth, email, window.location.href);
              window.history.replaceState({}, "", window.location.pathname);
            } catch (e) {
              setError("That email didn't match this link. Double-check and try again.");
            }
          }}
          buttonLabel="Confirm and sign in"
        />
      </Shell>
    );
  }

  // 'signed-out' or 'error'
  return (
    <Shell>
      <div className="marquee" style={{ fontSize: 24, color: "var(--gold)", marginBottom: 4 }}>
        DWTS FANTASY LEAGUE
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, margin: "10px 0 20px" }}>
        Enter your email and we'll send you a sign-in link — no password. Signing in this way
        means your team follows you if you switch phones.
      </p>
      <EmailForm
        value={email}
        onChange={setEmail}
        error={error}
        onSubmit={() => requestLink(email)}
        buttonLabel="Send sign-in link"
      />
    </Shell>
  );
}

function EmailForm({ value, onChange, error, onSubmit, buttonLabel }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSubmit(); }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(242,193,78,.3)",
          background: "rgba(255,255,255,.06)", color: "var(--text, #FFF9F2)", fontSize: 15,
        }}
      />
      {error && <div style={{ color: "#FF6B6B", fontSize: 12.5 }}>{error}</div>}
      <button type="submit" className="btn btn-gold">{buttonLabel}</button>
    </form>
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
        .linklike {
          background: none; border: none; color: #F2C14E; text-decoration: underline;
          cursor: pointer; font-size: inherit; padding: 0;
        }
      `}</style>
      {children}
    </div>
  );
}