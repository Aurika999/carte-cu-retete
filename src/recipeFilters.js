// Filtrele rapide (pagina de start și „Rețete pentru Fit From Home”), după valorile per porție.
import { recipes } from "./recipes";

// sosurile și băuturile nu sunt mese, nu apar în filtre
const EXCLUDED = /Sosuri|Băuturi/;
const meal = (r) => !EXCLUDED.test(r.section) && r.nutrition?.kcal;

export const FILTERS = [
  {
    id: "slabire", emoji: "🥗", title: "Sub 400 kcal", subtitle: "Sățioase, pentru slăbire", color: "#2bb3a3",
    test: (r) => r.nutrition.kcal <= 400 && (r.nutrition.protein ?? 0) >= 15,
  },
  {
    id: "proteine", emoji: "💪", title: "Bogat în proteine", subtitle: "Peste 25 g / porție", color: "#ef6f5e",
    test: (r) => (r.nutrition.protein ?? 0) >= 25,
  },
  {
    id: "rapid", emoji: "⏱️", title: "Gata în 15 minute", subtitle: "Pentru zilele aglomerate", color: "#f5a524",
    test: (r) => r.minutes != null && r.minutes <= 15,
  },
  {
    id: "keto", emoji: "🥑", title: "Keto / Low-carb", subtitle: "Sub 15 g carbohidrați", color: "#4f9d3a",
    test: (r) => r.nutrition.carbs != null && r.nutrition.carbs <= 15 && r.nutrition.kcal >= 120,
  },
  {
    id: "post", emoji: "🌱", title: "De post", subtitle: "Fără produse animale", color: "#7b6cf6",
    test: (r) => r.book === "Rețete de post",
  },
];

export const filterById = Object.fromEntries(FILTERS.map((f) => [f.id, f]));
export const applyFilter = (f) => recipes.filter((r) => meal(r) && f.test(r));
