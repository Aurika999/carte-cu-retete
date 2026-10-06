// Ingredientele pentru „Creează-ți rețeta”: valori nutriționale la 100 g (USDA FoodData Central,
// SR Legacy). Carnea, peștele și cerealele sunt crude / uscate (se cântăresc înainte de gătit),
// leguminoasele sunt fierte. Fructele și legumele vin din fruits.js / vegetables.js.
import { fruits } from "./fruits";
import { vegetables } from "./vegetables";

export const CATEGORIES = [
  { id: "carne", label: "Carne și pește", emoji: "🍗" },
  { id: "lactate", label: "Ouă și lactate", emoji: "🥛" },
  { id: "cereale", label: "Cereale, pâine, paste", emoji: "🌾" },
  { id: "leguminoase", label: "Leguminoase și tofu", emoji: "🫘" },
  { id: "grasimi", label: "Uleiuri, nuci, semințe", emoji: "🥜" },
  { id: "altele", label: "Dulciuri și altele", emoji: "🍯" },
  { id: "legume", label: "Legume", emoji: "🥕" },
  { id: "fructe", label: "Fructe", emoji: "🍎" },
];

// [id, nume, categorie, emoji, kcal, proteine, carbohidrați, grăsimi, fibre, gramaj implicit]
const BASE = [
  ["piept-pui", "Piept de pui (crud)", "carne", "🍗", 120, 22.5, 0, 2.6, 0, 150],
  ["pulpa-pui", "Pulpă de pui fără piele (crudă)", "carne", "🍗", 121, 19.7, 0, 4.1, 0, 150],
  ["piept-curcan", "Piept de curcan (crud)", "carne", "🦃", 114, 23.7, 0, 1.5, 0, 150],
  ["vita-tocata-5", "Carne tocată de vită 5% grăsime", "carne", "🥩", 137, 21.4, 0, 5, 0, 150],
  ["vita-tocata-15", "Carne tocată de vită 15% grăsime", "carne", "🥩", 215, 18.6, 0, 15, 0, 150],
  ["muschi-porc", "Mușchi de porc (crud)", "carne", "🥩", 120, 21, 0, 3.5, 0, 150],
  ["somon", "Somon (crud)", "carne", "🐟", 208, 20.4, 0, 13.4, 0, 150],
  ["cod", "Cod (crud)", "carne", "🐟", 82, 17.8, 0, 0.7, 0, 150],
  ["ton-conserva", "Ton în apă (conservă, scurs)", "carne", "🐟", 116, 25.5, 0, 0.8, 0, 100],
  ["creveti", "Creveți (cruzi)", "carne", "🦐", 85, 20.1, 0, 0.5, 0, 150],
  ["ou", "Ou întreg (1 ou ≈ 50 g)", "lactate", "🥚", 143, 12.6, 0.7, 9.5, 0, 50],
  ["albus", "Albuș de ou", "lactate", "🥚", 52, 10.9, 0.7, 0.2, 0, 100],
  ["lapte-15", "Lapte 1,5%", "lactate", "🥛", 47, 3.4, 4.9, 1.5, 0, 200],
  ["lapte-migdale", "Lapte de migdale neîndulcit", "lactate", "🥛", 15, 0.6, 0.6, 1.1, 0, 200],
  ["iaurt-grecesc-2", "Iaurt grecesc 2%", "lactate", "🥣", 73, 9.9, 3.9, 1.9, 0, 150],
  ["skyr", "Skyr", "lactate", "🥣", 63, 11, 4, 0.2, 0, 150],
  ["branza-vaci", "Brânză de vaci / cottage cheese", "lactate", "🧀", 84, 11, 4.3, 2.3, 0, 100],
  ["telemea", "Telemea / feta", "lactate", "🧀", 264, 14.2, 4.1, 21.3, 0, 30],
  ["mozzarella", "Mozzarella (parțial degresată)", "lactate", "🧀", 254, 24.3, 2.8, 15.9, 0, 50],
  ["parmezan", "Parmezan", "lactate", "🧀", 392, 35.8, 3.2, 25.8, 0, 15],
  ["smantana-20", "Smântână 20%", "lactate", "🥛", 198, 2.4, 4.6, 19.4, 0, 30],
  ["unt", "Unt", "lactate", "🧈", 717, 0.9, 0.1, 81.1, 0, 10],
  ["orez-alb", "Orez alb (crud)", "cereale", "🍚", 365, 7.1, 80, 0.7, 1.3, 70],
  ["orez-brun", "Orez brun (crud)", "cereale", "🍚", 370, 7.9, 77.2, 2.9, 3.5, 70],
  ["ovaz", "Fulgi de ovăz", "cereale", "🌾", 379, 13.2, 67.7, 6.5, 10.1, 50],
  ["paste", "Paste (crude)", "cereale", "🍝", 371, 13, 74.7, 1.5, 3.2, 80],
  ["quinoa", "Quinoa (crudă)", "cereale", "🌾", 368, 14.1, 64.2, 6.1, 7, 70],
  ["malai", "Mălai", "cereale", "🌽", 362, 8.1, 76.9, 3.6, 7.3, 70],
  ["faina-alba", "Făină albă", "cereale", "🌾", 364, 10.3, 76.3, 1, 2.7, 50],
  ["paine-integrala", "Pâine integrală", "cereale", "🍞", 252, 12.5, 42.7, 3.5, 6, 60],
  ["paine-alba", "Pâine albă", "cereale", "🍞", 266, 8.9, 49.4, 3.3, 2.7, 60],
  ["naut-fiert", "Năut fiert", "leguminoase", "🫘", 164, 8.9, 27.4, 2.6, 7.6, 150],
  ["linte-fiarta", "Linte fiartă", "leguminoase", "🫘", 116, 9, 20.1, 0.4, 7.9, 150],
  ["fasole-rosie-fiarta", "Fasole roșie fiartă", "leguminoase", "🫘", 127, 8.7, 22.8, 0.5, 6.4, 150],
  ["fasole-alba-fiarta", "Fasole albă fiartă", "leguminoase", "🫘", 139, 9.7, 25.1, 0.4, 6.3, 150],
  ["tofu", "Tofu ferm", "leguminoase", "🧊", 144, 17.3, 2.8, 8.7, 2.3, 150],
  ["ulei-masline", "Ulei de măsline", "grasimi", "🫒", 884, 0, 0, 100, 0, 10],
  ["ulei-floarea-soarelui", "Ulei de floarea-soarelui", "grasimi", "🌻", 884, 0, 0, 100, 0, 10],
  ["nuci", "Nuci", "grasimi", "🌰", 654, 15.2, 13.7, 65.2, 6.7, 30],
  ["migdale", "Migdale", "grasimi", "🌰", 579, 21.2, 21.6, 49.9, 12.5, 30],
  ["unt-arahide", "Unt de arahide", "grasimi", "🥜", 588, 25.1, 20, 50.4, 6, 20],
  ["seminte-chia", "Semințe de chia", "grasimi", "🌱", 486, 16.5, 42.1, 30.7, 34.4, 15],
  ["seminte-in", "Semințe de in", "grasimi", "🌱", 534, 18.3, 28.9, 42.2, 27.3, 15],
  ["seminte-floarea-soarelui", "Semințe de floarea-soarelui", "grasimi", "🌻", 584, 20.8, 20, 51.5, 8.6, 20],
  ["miere", "Miere", "altele", "🍯", 304, 0.3, 82.4, 0, 0.2, 15],
  ["zahar", "Zahăr", "altele", "🍬", 387, 0, 100, 0, 0, 10],
  ["cacao", "Cacao pudră neîndulcită", "altele", "🍫", 228, 19.6, 57.9, 13.7, 37, 10],
  ["ciocolata-neagra", "Ciocolată neagră 70–85%", "altele", "🍫", 598, 7.8, 45.9, 42.6, 10.9, 20],
  ["pasta-rosii", "Pastă de roșii", "altele", "🥫", 82, 4.3, 18.9, 0.5, 4.1, 30],
  ["rosii-conserva", "Roșii din conservă", "altele", "🥫", 32, 1.6, 7.3, 0.3, 1.9, 200],
  ["mustar", "Muștar", "altele", "🟡", 60, 3.7, 5.8, 3.3, 4, 10],
];

const fromBase = BASE.map(([id, name, category, emoji, kcal, protein, carbs, fat, fiber, grams]) => ({
  id: `i-${id}`, name, category, emoji, grams,
  per100g: { kcal, protein, carbs, fat, fiber },
}));

const fromProduce = (list, category, emoji, grams) =>
  list.map((x) => ({ id: x.id, name: x.name, category, emoji, image: x.image, grams, per100g: x.per100g }));

export const ingredients = [
  ...fromBase,
  ...fromProduce(vegetables, "legume", "🥕", 100),
  ...fromProduce(fruits, "fructe", "🍎", 100),
];

export const ingredientById = Object.fromEntries(ingredients.map((i) => [i.id, i]));
