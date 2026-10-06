// Tot ce poate apărea într-un meniu: rețetele din cărți + fructe crude, ca porții obișnuite.
import { recipes } from "./recipes";
import { fruits } from "./fruits";

// porția obișnuită, în grame (partea comestibilă); fructele care nu se mănâncă
// de obicei ca gustare (lămâie, lime, merișoare crude, gutui, avocado, cocos) lipsesc
const SERVINGS = {
  "f-mar": 150, "f-para": 150, "f-banana": 120, "f-portocala": 150, "f-mandarina": 120,
  "f-grapefruit": 150, "f-kiwi": 100, "f-capsuni": 150, "f-zmeura": 125, "f-mure": 125,
  "f-afine": 125, "f-coacaze-rosii": 100, "f-agrise": 100, "f-cirese": 150, "f-visine": 150,
  "f-caise": 150, "f-piersici": 150, "f-nectarine": 150, "f-prune": 150, "f-struguri": 150,
  "f-pepene-rosu": 300, "f-pepene-galben": 250, "f-ananas": 150, "f-mango": 150, "f-papaya": 150,
  "f-rodie": 100, "f-smochine": 100, "f-kaki": 150, "f-litchi": 100, "f-fructul-pasiunii": 50,
};

export const fruitItems = fruits
  .filter((f) => SERVINGS[f.id])
  .map((f) => {
    const grams = SERVINGS[f.id];
    const k = grams / 100;
    return {
      id: f.id,
      title: f.name,
      book: "Fructe crude",
      isFruit: true,
      grams,
      image: f.image,
      nutrition: Object.fromEntries(Object.entries(f.per100g).map(([key, v]) => [key, v * k])),
    };
  });

export const planItemById = Object.fromEntries([...recipes, ...fruitItems].map((r) => [r.id, r]));

// „1 porție” / „1,5 porții” la rețete, grame la fructe
export function amountLabel(item, portions) {
  if (item.isFruit) return `${Math.round(item.grams * portions)} g`;
  return portions === 1 ? "1 porție" : `${String(portions).replace(".", ",")} porții`;
}
