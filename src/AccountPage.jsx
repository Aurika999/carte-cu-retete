import React, { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { CalendarDays, KeyRound, LogIn, LogOut, Mail, Save, Trash2, UserRound } from "lucide-react";
import { authErrorMessage, useAuth } from "./auth";
import { deleteAllMenus, loadMenus } from "./menuStorage";

const fmtDate = (s) =>
  s ? new Date(s).toLocaleString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–";

// confirmă parola actuală (Firebase o cere înainte de schimbarea parolei sau ștergerea contului)
const reauth = (user, password) => reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

function Notice({ state }) {
  if (!state) return null;
  return <p className={state.error ? "authError" : "authInfo"}>{state.error || state.ok}</p>;
}

export default function AccountPage({ onOpenCalendar }) {
  const { user, ready, configured, displayName, openLogin, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");
  const [nameState, setNameState] = useState(null);
  const [menuCount, setMenuCount] = useState(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwState, setPwState] = useState(null);
  const [delPw, setDelPw] = useState("");
  const [delState, setDelState] = useState(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setName(user?.displayName ?? "");
    if (!user) return;
    loadMenus(user).then((m) => setMenuCount(Object.keys(m).length)).catch(() => setMenuCount(null));
  }, [user]);

  if (!ready) return <div className="calcPage"><p>Se încarcă…</p></div>;

  if (!user) {
    return (
      <div className="calcPage">
        <div className="calcCard accEmpty">
          <span className="calEmptyIcon">👤</span>
          <h2>Contul meu</h2>
          <p>
            {configured
              ? "Intră în cont sau creează-ți unul ca să-ți vezi datele și să-ți salvezi meniurile pe orice dispozitiv."
              : "Conturile nu sunt configurate în această versiune a aplicației."}
          </p>
          {configured && <button className="mealSaveBtn" onClick={openLogin}><LogIn size={16} /> Intră în cont</button>}
        </div>
      </div>
    );
  }

  async function saveName(e) {
    e.preventDefault();
    setBusy("name");
    try {
      await updateProfile(user, { displayName: name.trim() });
      await refreshUser();
      setNameState({ ok: "Numele a fost salvat." });
    } catch (err) {
      setNameState({ error: authErrorMessage(err) });
    }
    setBusy("");
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pw.next !== pw.confirm) return setPwState({ error: "Parolele noi nu coincid." });
    setBusy("pw");
    try {
      await reauth(user, pw.current);
      await updatePassword(user, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      setPwState({ ok: "Parola a fost schimbată." });
    } catch (err) {
      setPwState({ error: authErrorMessage(err) });
    }
    setBusy("");
  }

  async function removeAccount(e) {
    e.preventDefault();
    if (!window.confirm("Ștergi definitiv contul și toate meniurile salvate în el? Acțiunea nu poate fi anulată.")) return;
    setBusy("del");
    try {
      await reauth(user, delPw);
      await deleteAllMenus(user);
      await deleteUser(user);
    } catch (err) {
      setDelState({ error: authErrorMessage(err) });
      setBusy("");
    }
  }

  return (
    <div className="calcPage">
      <header className="calcHero accHero">
        <div className="accBigAvatar">{(displayName?.[0] ?? "?").toUpperCase()}</div>
        <div>
          <h1>{user.displayName || "Contul meu"}</h1>
          <p>{user.email}</p>
        </div>
      </header>

      <div className="accGrid">
        <section className="calcCard">
          <h2><UserRound size={17} /> Datele contului</h2>
          <form className="accForm" onSubmit={saveName}>
            <label className="accLabel">Nume</label>
            <label className="authField">
              <UserRound size={16} />
              <input value={name} maxLength={60} required placeholder="Numele tău"
                onChange={(e) => { setName(e.target.value); setNameState(null); }} />
            </label>
            {!user.displayName && <p className="accHint">Contul nu are încă un nume — completează-l ca să apară în locul emailului.</p>}
            <button className="mealSaveBtn" disabled={busy === "name" || name.trim() === (user.displayName ?? "")}>
              <Save size={15} /> {busy === "name" ? "Se salvează…" : "Salvează numele"}
            </button>
            <Notice state={nameState} />
          </form>

          <dl className="accFacts">
            <div><dt><Mail size={14} /> Email</dt><dd>{user.email}</dd></div>
            <div><dt>Cont creat</dt><dd>{fmtDate(user.metadata.creationTime)}</dd></div>
            <div><dt>Ultima autentificare</dt><dd>{fmtDate(user.metadata.lastSignInTime)}</dd></div>
            <div>
              <dt><CalendarDays size={14} /> Meniuri salvate</dt>
              <dd>
                {menuCount ?? "–"}{" "}
                {onOpenCalendar && <button className="accLink" onClick={onOpenCalendar}>Vezi calendarul →</button>}
              </dd>
            </div>
          </dl>

          <button className="accLogout" onClick={logout}><LogOut size={15} /> Ieși din cont</button>
        </section>

        <div className="accSide">
          <section className="calcCard">
            <h2><KeyRound size={17} /> Schimbă parola</h2>
            <form className="accForm" onSubmit={changePassword}>
              {[
                ["current", "Parola actuală", "current-password"],
                ["next", "Parola nouă (minim 6 caractere)", "new-password"],
                ["confirm", "Repetă parola nouă", "new-password"],
              ].map(([key, label, ac]) => (
                <label key={key} className="authField">
                  <KeyRound size={16} />
                  <input type="password" required minLength={key === "current" ? 1 : 6} autoComplete={ac} placeholder={label}
                    value={pw[key]} onChange={(e) => { setPw({ ...pw, [key]: e.target.value }); setPwState(null); }} />
                </label>
              ))}
              <button className="mealSaveBtn" disabled={busy === "pw"}>{busy === "pw" ? "Se schimbă…" : "Schimbă parola"}</button>
              <Notice state={pwState} />
            </form>
          </section>

          <section className="calcCard accDanger">
            <h2><Trash2 size={17} /> Șterge contul</h2>
            <p className="accHint">Se șterg definitiv contul și toate meniurile salvate în calendar. Scrie parola ca să confirmi.</p>
            <form className="accForm" onSubmit={removeAccount}>
              <label className="authField">
                <KeyRound size={16} />
                <input type="password" required autoComplete="current-password" placeholder="Parola actuală"
                  value={delPw} onChange={(e) => { setDelPw(e.target.value); setDelState(null); }} />
              </label>
              <button className="accDeleteBtn" disabled={busy === "del"}>{busy === "del" ? "Se șterge…" : "Șterge contul"}</button>
              <Notice state={delState} />
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
