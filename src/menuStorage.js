// Meniurile salvate în calendar, pe zile:
// { "2026-10-06": { target, book, savedAt, meals: [{ key, items: [{ id, portions }] }] } }
//
// Cu cont (user ≠ null): în Firestore, la users/<uid>/menus/<zi> — le găsești pe orice dispozitiv.
// Fără cont: în browser (localStorage), ca înainte.
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

const KEY = "calendar-meniuri";

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function storeLocal(menus) {
  try {
    localStorage.setItem(KEY, JSON.stringify(menus));
    return true;
  } catch {
    return false;   // stocarea poate fi blocată (ex. fereastră privată)
  }
}

const menusOf = (user) => collection(db, "users", user.uid, "menus");
const useCloud = (user) => Boolean(user && db);

export async function loadMenus(user) {
  if (!useCloud(user)) return loadLocal();
  const snap = await getDocs(menusOf(user));
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
}

export async function hasMenu(user, day) {
  if (!useCloud(user)) return Boolean(loadLocal()[day]);
  return (await getDoc(doc(menusOf(user), day))).exists();
}

// întoarce true dacă s-a salvat
export async function saveMenu(user, day, menu) {
  const entry = { ...menu, savedAt: new Date().toISOString() };
  if (!useCloud(user)) return storeLocal({ ...loadLocal(), [day]: entry });
  await setDoc(doc(menusOf(user), day), entry);
  return true;
}

export async function deleteMenu(user, day) {
  if (!useCloud(user)) {
    const menus = loadLocal();
    delete menus[day];
    return storeLocal(menus);
  }
  await deleteDoc(doc(menusOf(user), day));
  return true;
}

// La ștergerea contului: toate meniurile lui din Firestore
export async function deleteAllMenus(user) {
  if (!useCloud(user)) return;
  const snap = await getDocs(menusOf(user));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (!snap.empty) await batch.commit();
}

// La autentificare: meniurile din browser trec în cont (fără să le înlocuiască pe cele
// deja salvate în cont pentru aceeași zi), apoi sunt șterse din browser.
export async function migrateLocalMenus(user) {
  const local = loadLocal();
  const days = Object.keys(local);
  if (!useCloud(user) || days.length === 0) return 0;
  const existing = await loadMenus(user);
  const batch = writeBatch(db);
  let moved = 0;
  for (const day of days) {
    if (!existing[day]) {
      batch.set(doc(menusOf(user), day), local[day]);
      moved += 1;
    }
  }
  if (moved) await batch.commit();
  storeLocal({});
  return moved;
}

export function formatDay(key, options = { weekday: "long", day: "numeric", month: "long" }) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ro-RO", options);
}
