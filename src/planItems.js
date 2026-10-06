// Tot ce poate apărea într-un meniu: rețetele din cărți + fructe și legume crude, ca porții obișnuite.
import { recipes } from "./recipes";
import { fruits } from "./fruits";
import { vegetables } from "./vegetables";

// porția obișnuită, în grame (partea comestibilă); fructele care nu se mănâncă
// de obicei ca gustare (lămâie, lime, merișoare crude, gutui, avocado, cocos) lipsesc
const FRUIT_SERVINGS = {
  "f-mar": 150, "f-para": 150, "f-banana": 120, "f-portocala": 150, "f-mandarina": 120,
  "f-grapefruit": 150, "f-kiwi": 100, "f-capsuni": 150, "f-zmeura": 125, "f-mure": 125,
  "f-afine": 125, "f-coacaze-rosii": 100, "f-agrise": 100, "f-cirese": 150, "f-visine": 150,
  "f-caise": 150, "f-piersici": 150, "f-nectarine": 150, "f-prune": 150, "f-struguri": 150,
  "f-pepene-rosu": 300, "f-pepene-galben": 250, "f-ananas": 150, "f-mango": 150, "f-papaya": 150,
  "f-rodie": 100, "f-smochine": 100, "f-kaki": 150, "f-litchi": 100, "f-fructul-pasiunii": 50,
};

// legumele crude din meniul recomandat (lângă mâncare, la prânz și cină); restul legumelor
// rămân doar în pagina „Legume crude”
const VEGETABLE_SERVINGS = {
  "l-castravete": 150, "l-rosii": 150, "l-ardei-rosu": 100, "l-ardei-verde": 100,
  "l-ceapa-verde": 30, "l-ciuperci": 100, "l-ridichi": 100,
};

function produceItems(list, servings, book, flag) {
  return list
    .filter((x) => servings[x.id])
    .map((x) => {
      const grams = servings[x.id];
      const k = grams / 100;
      return {
        id: x.id,
        title: x.name,
        book,
        [flag]: true,
        isProduce: true,
        grams,
        image: x.image,
        nutrition: Object.fromEntries(Object.entries(x.per100g).map(([key, v]) => [key, v * k])),
      };
    });
}

export const fruitItems = produceItems(fruits, FRUIT_SERVINGS, "Fructe crude", "isFruit");
export const vegetableItems = produceItems(vegetables, VEGETABLE_SERVINGS, "Legume crude", "isVeg");

export const planItemById = Object.fromEntries(
  [...recipes, ...fruitItems, ...vegetableItems].map((r) => [r.id, r])
);

// „1 porție” / „1,5 porții” la rețete, grame la fructe și legume
export function amountLabel(item, portions) {
  if (item.isProduce) return `${Math.round(item.grams * portions)} g`;
  return portions === 1 ? "1 porție" : `${String(portions).replace(".", ",")} porții`;
}
