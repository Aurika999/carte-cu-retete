// Rețetele favorite (❤️), disponibile în toată aplicația prin useFavorites(): { ids, isFavorite, toggle }.
// Cu cont: în Firestore, la users/<uid>/data/favorites ({ ids: [...] }). Fără cont: în browser.
// La autentificare, favoritele din browser se adaugă la cele din cont.
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";

const KEY = "favorite";
const FavoritesContext = createContext(null);
export const useFavorites = () => useContext(FavoritesContext);

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};
const writeLocal = (ids) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* fără stocare */
  }
};

export function FavoritesProvider({ children }) {
  const { user, ready } = useAuth();
  const [ids, setIds] = useState(readLocal);
  const ref = user && db ? doc(db, "users", user.uid, "data", "favorites") : null;

  useEffect(() => {
    if (!ready) return undefined;
    if (!ref) {
      setIds(readLocal());
      return undefined;
    }
    let alive = true;
    getDoc(ref)
      .then(async (snap) => {
        const cloud = snap.exists() ? snap.data().ids ?? [] : [];
        const local = readLocal();
        const merged = [...new Set([...cloud, ...local])];
        if (local.length) {
          await setDoc(ref, { ids: merged });
          writeLocal([]);
        }
        if (alive) setIds(merged);
      })
      .catch(() => alive && setIds([]));
    return () => { alive = false; };
  }, [user, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id) {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
    setIds(next);
    if (ref) setDoc(ref, { ids: next }).catch(() => setIds(ids));   // dacă nu s-a salvat, revine
    else writeLocal(next);
  }

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite: (id) => ids.includes(id), toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// butonul ❤️ refolosit pe carduri
export function HeartButton({ id, className = "" }) {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(id);
  return (
    <button
      type="button"
      className={`heartBtn ${on ? "on" : ""} ${className}`}
      onClick={(e) => { e.stopPropagation(); toggle(id); }}
      aria-label={on ? "Scoate de la favorite" : "Adaugă la favorite"}
      title={on ? "Scoate de la favorite" : "Adaugă la favorite"}
    >
      {on ? "❤️" : "🤍"}
    </button>
  );
}
