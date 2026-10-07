// Adresele paginilor din aplicație (ex. /retete-fit-from-home, /retete-traditionale) și navigarea
// fără reîncărcarea paginii. Rețetele au adresa lor separat (vezi recipeDetails.js).
import { recipes } from "./recipes";
import { slugify } from "./recipeDetails";

export const TOOL_PATHS = {
  retete: "/retete-fit-from-home",
  fructe: "/fructe-crude",
  legume: "/legume-crude",
  calculator: "/planificator-meniuri",
  calendar: "/calendarul-meu",
  apa: "/jurnal-de-apa",
  reteta: "/creeaza-ti-reteta",
  cont: "/contul-meu",
};

// cărțile de rețete: „Rețete tradiționale” → /retete-traditionale
export const BOOKS = [...new Set(recipes.map((r) => r.book))];
export const bookPath = (book) => "/" + slugify(book).toLowerCase();

// adresele vechi cu # (…/#calculator) duc la adresele noi
const OLD_HASHES = {
  "#calculator": "calculator", "#calendar": "calendar", "#apa": "apa", "#fructe": "fructe",
  "#legume": "legume", "#reteta": "reteta", "#cont": "cont", "#retete": "retete",
};

export function redirectOldHash() {
  const tool = OLD_HASHES[window.location.hash];
  if (tool) window.history.replaceState(null, "", TOOL_PATHS[tool]);
}

// ce pagină a aplicației corespunde adresei: { tool, book } sau null (pagina de start / altceva)
export function parseRoute(pathname) {
  const path = "/" + pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  const tool = Object.keys(TOOL_PATHS).find((t) => TOOL_PATHS[t] === path);
  if (tool) return { tool, book: null };
  if (path === "/calculator-calorii") return { tool: "calculator", book: null };   // adresa veche
  const book = BOOKS.find((b) => bookPath(b) === path);
  if (book) return { tool: "retete", book };
  return null;
}

// navigare internă: adresa se schimbă, pagina nu se reîncarcă; „fromApp” arată că
// există o pagină anterioară în aplicație la care se poate reveni cu „Înapoi”
export function navigate(path, state = {}) {
  window.history.pushState({ ...state, fromApp: true, t: Date.now() }, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// actualizează adresa fără o intrare nouă în istoric (ex. textul căutat)
export function replaceSearch(search) {
  const url = window.location.pathname + (search ? `?${search}` : "");
  window.history.replaceState(window.history.state, "", url);
}

// poziția derulării pe fiecare pagină, ca „Înapoi” să ducă exact unde ai rămas
const SCROLL_KEY = (path) => `derulare:${path}`;
export function saveScroll(path, top) {
  try { sessionStorage.setItem(SCROLL_KEY(path), String(Math.round(top))); } catch { /* fără stocare */ }
}
export function readScroll(path) {
  try { return Number(sessionStorage.getItem(SCROLL_KEY(path))) || 0; } catch { return 0; }
}
