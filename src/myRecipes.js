// Rețetele create din „Ce ai în frigider?”, salvate întregi (poză, ingrediente, pași, valori).
// Cu cont: Firestore, users/<uid>/myRecipes/<id>. Fără cont: în browser.
// La autentificare, cele din browser trec în cont.
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const KEY = "retete-create";
const readLocal = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const writeLocal = (list) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; }
};
const cloud = (user) => Boolean(user && db);
const col = (user) => collection(db, "users", user.uid, "myRecipes");

// cele mai noi primele
export async function listMyRecipes(user) {
  if (!cloud(user)) return readLocal();
  const local = readLocal();
  if (local.length) {
    await Promise.all(local.map((r) => setDoc(doc(col(user), r.id), r)));
    writeLocal([]);
  }
  const snap = await getDocs(col(user));
  return snap.docs.map((d) => d.data()).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getMyRecipe(user, id) {
  if (cloud(user)) {
    const snap = await getDoc(doc(col(user), id));
    if (snap.exists()) return snap.data();
  }
  return readLocal().find((r) => r.id === id) ?? null;
}

// salvează rețeta și întoarce-o cu id
export async function saveMyRecipe(user, recipe) {
  const entry = { ...recipe, id: recipe.id ?? `c${Date.now()}`, createdAt: recipe.createdAt ?? new Date().toISOString() };
  if (cloud(user)) await setDoc(doc(col(user), entry.id), entry);
  else if (!writeLocal([entry, ...readLocal().filter((r) => r.id !== entry.id)])) {
    // browserul e plin: păstrăm doar ultimele 20 de rețete
    writeLocal([entry, ...readLocal().slice(0, 19)]);
  }
  return entry;
}

export async function deleteMyRecipe(user, id) {
  if (cloud(user)) await deleteDoc(doc(col(user), id));
  writeLocal(readLocal().filter((r) => r.id !== id));
}
