// Contul utilizatorului (Firebase Authentication, email + parolă), disponibil în toată aplicația
// prin useAuth(): { user, ready, configured, openLogin, logout }.
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { LogIn, Mail, Lock, UserRound, X } from "lucide-react";
import { auth, firebaseReady } from "./firebase";
import { migrateLocalMenus } from "./menuStorage";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const ERRORS = {
  "auth/invalid-credential": "Email sau parolă greșită.",
  "auth/wrong-password": "Email sau parolă greșită.",
  "auth/user-not-found": "Nu există un cont cu acest email.",
  "auth/invalid-email": "Adresa de email nu este validă.",
  "auth/email-already-in-use": "Există deja un cont cu acest email. Intră în cont.",
  "auth/weak-password": "Parola trebuie să aibă cel puțin 6 caractere.",
  "auth/too-many-requests": "Prea multe încercări. Mai încearcă peste câteva minute.",
  "auth/network-request-failed": "Nu există conexiune la internet.",
  "auth/operation-not-allowed": "Autentificarea cu email și parolă nu este activată în Firebase.",
  "auth/missing-password": "Scrie parola.",
  "auth/requires-recent-login": "Din motive de siguranță, ieși din cont și intră din nou, apoi reîncearcă.",
};
const message = (err) => ERRORS[err?.code] ?? "A apărut o eroare. Încearcă din nou.";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!firebaseReady);
  const [loginOpen, setLoginOpen] = useState(false);
  const [, setVersion] = useState(0);   // la schimbarea numelui, obiectul user rămâne același: forțăm redesenarea

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        // meniurile salvate în browser înainte de autentificare trec în cont
        try {
          await migrateLocalMenus(u);
        } catch {
          /* rămân în browser; se pot muta la următoarea autentificare */
        }
      }
      setUser(u);
      setReady(true);
    });
  }, []);

  const refreshUser = async () => {
    if (auth?.currentUser) await auth.currentUser.reload();
    setUser(auth?.currentUser ?? null);
    setVersion((v) => v + 1);
  };

  const value = {
    user,
    ready,
    configured: firebaseReady,
    // numele afișat: cel din cont sau, dacă lipsește, emailul
    displayName: user ? user.displayName || user.email : "",
    openLogin: () => setLoginOpen(true),
    logout: () => auth && signOut(auth),
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} onSignedUp={refreshUser} />}
    </AuthContext.Provider>
  );
}

export { message as authErrorMessage };

function LoginDialog({ onClose, onSignedUp }) {
  const [mode, setMode] = useState("login");   // "login" | "signup" | "reset"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!firebaseReady) {
      setError("Conturile nu sunt încă configurate (lipsesc cheile Firebase în .env.local).");
      return;
    }
    if (mode === "signup" && password !== confirm) {
      setError("Parolele nu coincid.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email.trim(), password);
      else if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(user, { displayName: name.trim() });
        await onSignedUp();
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setInfo("Ți-am trimis pe email un link pentru o parolă nouă.");
        setBusy(false);
        return;
      }
      onClose();
    } catch (err) {
      setError(message(err));
    }
    setBusy(false);
  }

  const switchTo = (m) => { setMode(m); setError(""); setInfo(""); };
  const titles = { login: "Intră în cont", signup: "Cont nou", reset: "Resetează parola" };

  return (
    <div className="authBackdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="authDialog" onSubmit={submit}>
        <button type="button" className="authClose" onClick={onClose} aria-label="Închide"><X size={18} /></button>
        <div className="authIcon"><LogIn size={22} /></div>
        <h2>{titles[mode]}</h2>
        <p className="authSub">
          {mode === "reset"
            ? "Scrie emailul contului și îți trimitem un link pentru o parolă nouă."
            : "Meniurile din calendar se salvează în contul tău și le găsești pe orice dispozitiv."}
        </p>

        {mode !== "reset" && (
          <div className="authTabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchTo("login")}>Autentificare</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchTo("signup")}>Cont nou</button>
          </div>
        )}

        {mode === "signup" && (
          <label className="authField">
            <UserRound size={16} />
            <input type="text" required maxLength={60} autoComplete="name" placeholder="Numele tău"
              value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="authField">
          <Mail size={16} />
          <input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== "reset" && (
          <label className="authField">
            <Lock size={16} />
            <input
              type="password" required minLength={6} placeholder="Parolă (minim 6 caractere)"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {mode === "signup" && (
          <label className="authField">
            <Lock size={16} />
            <input type="password" required minLength={6} autoComplete="new-password" placeholder="Repetă parola"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
        )}

        {error && <p className="authError">{error}</p>}
        {info && <p className="authInfo">{info}</p>}

        <button type="submit" className="mealSaveBtn authSubmit" disabled={busy}>
          {busy ? "Se încarcă…" : mode === "login" ? "Intră în cont" : mode === "signup" ? "Creează contul" : "Trimite linkul"}
        </button>

        {mode === "login" && <button type="button" className="authLink" onClick={() => switchTo("reset")}>Am uitat parola</button>}
        {mode === "reset" && <button type="button" className="authLink" onClick={() => switchTo("login")}>Înapoi la autentificare</button>}
      </form>
    </div>
  );
}
