// Rețetele scrise ca pagini întregi (text, nu imagine): câte un fișier în src/retete/,
// numit după rețetă (ex. src/retete/Salata-cu-piept-de-pui.js). Fiecare se deschide la
// adresa /<slug> (ex. /Salata-cu-piept-de-pui) și e afișat de RecipePage.jsx.
//
// Fișierele sunt încărcate abia când e deschisă rețeta (nu toate odată, la pornire).
// Cele generate din PDF se pot regenera cu: python scripts/build_recipe_pages.py
import { recipes } from "./recipes";

const loaders = Object.fromEntries(
  Object.entries(import.meta.glob("./retete/*.js")).map(([file, load]) => [
    file.replace("./retete/", "").replace(/\.js$/, "").toLowerCase(),
    load,
  ])
);

// „Salată cu piept de pui” → „Salata-cu-piept-de-pui” (fără diacritice, cratime în loc de spații)
export function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const hasDetail = (recipe) => Boolean(recipe.slug && loaders[recipe.slug.toLowerCase()]);
export const detailPath = (recipe) => "/" + (recipe.slug ?? slugify(recipe.title));

const bySlug = Object.fromEntries(recipes.filter(hasDetail).map((r) => [r.slug.toLowerCase(), r]));
// adresele vechi, după titlu (ex. /Salat%C4%83%20cu%20piept%20de%20pui)
const byTitle = Object.fromEntries(recipes.filter(hasDetail).map((r) => [slugify(r.title).toLowerCase(), r]));

// rețeta (din recipes.js) corespunzătoare adresei din browser, sau null
export function recipeFromPath(pathname) {
  let name;
  try {
    name = decodeURIComponent(pathname.replace(/^\/+|\/+$/g, ""));
  } catch {
    return null;
  }
  if (!name) return null;
  const key = slugify(name).toLowerCase();
  return bySlug[key] ?? byTitle[key] ?? null;
}

// textul complet al rețetei (se descarcă la prima deschidere)
export async function loadDetail(recipe) {
  const module = await loaders[recipe.slug.toLowerCase()]();
  return module.default;
}
