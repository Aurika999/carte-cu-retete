import React, { useMemo, useState } from "react";
import { Shuffle, RefreshCw, UtensilsCrossed, CalendarPlus, CalendarDays, Check } from "lucide-react";
import { recipes } from "./recipes";
import { fruitItems, vegetableItems, amountLabel } from "./planItems";
import { dateKey, formatDay, loadMenus, saveMenu } from "./menuStorage";

// Ce secțiuni din cărți se potrivesc la fiecare masă.
// "side" = garnituri / salate mici, folosite ca al doilea fel la prânz și cină.
const ROLES = {
  "Rețete tradiționale": {
    "Mic dejun și gustări": ["breakfast"],
    "Pâine și aluaturi românești": ["breakfast", "snack"],
    "Supe și ciorbe": ["soup"],
    "Feluri principale clasice, mai ușoare": ["lunch", "dinner"],
    "Pește — Dunăre și Marea Neagră": ["lunch", "dinner"],
    "Garnituri inteligente": ["side"],
    "Deserturi cu mai puțin zahăr": ["snack"],
    "Sărbători „ușoare”": ["dinner"],      // dulciurile de sărbătoare sunt mutate la gustare, mai jos
  },
  "Rețete gata în 10 minute": {
    "Shake-uri proteice": ["breakfast", "snack"],
    "Budinci de chia": ["breakfast", "snack"],
    "Budinci de ovăz": ["breakfast"],
    "Smoothie-uri": ["breakfast", "snack"],
    "Mic dejun / mese rapide": ["breakfast"],
    "Salate": ["lunch", "dinner", "side"],
    "Wrap-uri & omlete": ["breakfast", "dinner"],
    "Gustări sărate / mese rapide": ["snack"],
    "Gustări dulci rapide": ["snack"],
    "Mese rapide din supermarket (fără gătit)": ["lunch", "dinner"],
    "Deserturi": ["snack"],
    "Vegane / vegetariene (rapide)": ["lunch", "dinner"],
  },
  "Rețete internaționale": {
    "Aperitive și gustări fresh": ["lunch", "dinner", "side"],
    "Feluri principale reinterpretate": ["lunch", "dinner"],
    "Pâine și preparate de tip brunch": ["breakfast"],
    "Deserturi fără regrete": ["snack"],
  },
  "Rețete de post": {
    "Mic dejun": ["breakfast"],
    "Aperitive și gustări fresh": ["snack", "side"],
    "Tartinabile și pateuri vegetale": ["snack", "side"],
    "Salate consistente și boluri": ["lunch", "dinner", "side"],
    "Supe și ciorbe": ["soup"],
    "Feluri principale reinterpretate": ["lunch", "dinner"],
    "Garnituri și legume la cuptor": ["side"],
    "Pâine și patiserie de post": ["breakfast", "snack"],
    "Băuturi și smoothie-uri": ["snack"],
    "Deserturi fără regrete": ["snack"],
  },
};

const HOLIDAY_SWEETS = /cozonac|pască|mucenici|turte|colaci/i;

function rolesOf(r) {
  if (r.isFruit) return ["fruit"];
  if (r.isVeg) return ["veg"];
  if (r.section === "Sărbători „ușoare”" && HOLIDAY_SWEETS.test(r.title)) return ["snack"];
  return ROLES[r.book]?.[r.section] || [];
}

// primul fel al fiecărei mese: la gustare, mereu un fruct
const MAIN_ROLES = {
  breakfast: ["breakfast"],
  lunch: ["lunch"],
  snack: ["fruit"],
  dinner: ["dinner"],
};

// cu ce se completează o masă când primul fel are prea puține calorii
const EXTRA_ROLES = {
  breakfast: ["snack", "breakfast", "fruit"],
  lunch: ["side"],
  snack: ["snack"],
  dinner: ["side"],
};

export const MEALS = [
  { key: "breakfast", label: "Mic dejun", emoji: "🌅", share: 0.25, color: "#f5a524" },
  { key: "lunch", label: "Prânz", emoji: "☀️", share: 0.35, color: "#ef6f5e" },
  { key: "snack", label: "Gustare", emoji: "🍎", share: 0.1, color: "#2bb3a3" },
  { key: "dinner", label: "Cină", emoji: "🌙", share: 0.3, color: "#7b6cf6" },
];

const BOOKS = [
  { id: "toate", label: "Toate cărțile" },
  { id: "Rețete tradiționale", label: "Tradiționale" },
  { id: "Rețete gata în 10 minute", label: "Gata în 10 minute" },
  { id: "Rețete internaționale", label: "Internaționale" },
  { id: "Rețete de post", label: "De post 🌱" },
];

// generator de numere aleatoare cu „sămânță”: același seed dă același meniu
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PORTIONS = [1, 1.5, 2];

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// O rețetă la întâmplare dintre TOATE cele potrivite (nu doar cele mai apropiate
// caloric), ca fiecare rețetă să aibă șansa să apară. Dacă se dă un interval de
// calorii, se preferă rețetele din el.
function pickOne(candidates, random, used, minKcal = 0, maxKcal = Infinity) {
  const free = candidates.filter((r) => !used.has(r.id));
  const inRange = free.filter((r) => r.nutrition.kcal >= minKcal && r.nutrition.kcal <= maxKcal);
  const fallback = free.filter((r) => r.nutrition.kcal <= maxKcal);
  const pool = inRange.length ? inRange : fallback.length ? fallback : free;
  if (!pool.length) return null;
  const recipe = pool[Math.floor(random() * pool.length)];
  used.add(recipe.id);
  return recipe;
}

export function buildPlan(total, book, round, seeds) {
  // fructele se potrivesc la orice carte aleasă (inclusiv „De post”)
  const pool = [...recipes.filter((r) => book === "toate" || r.book === book), ...fruitItems, ...vegetableItems];
  const byRoles = (roles) => pool.filter((r) => rolesOf(r).some((role) => roles.includes(role)));
  const used = new Set();

  return MEALS.map((meal) => {
    const target = total * meal.share;
    // fiecare fel („slot”) are propriul generator, ca să poată fi schimbat separat
    const random = (slot) => rng(hash(`${round}|${meal.key}|${slot}|${seeds[`${meal.key}:${slot}`] || 0}`));
    const items = [];
    const sumKcal = () => items.reduce((s, i) => s + i.recipe.nutrition.kcal, 0);

    if (meal.key === "lunch" && target >= 450) {
      const soup = pickOne(byRoles(["soup"]), random("soup"), used, 0, target * 0.4);
      if (soup) items.push({ recipe: soup, slot: "soup" });
    }
    const main = pickOne(byRoles(MAIN_ROLES[meal.key]), random("main"), used, 0, (target - sumKcal()) * 1.1);
    if (main) items.push({ recipe: main, slot: "main" });

    // la prânz și la cină, mereu o legumă crudă lângă mâncare (crudități / salată);
    // caloriile ei contează la cât mai trebuie completat
    const veg = meal.key === "lunch" || meal.key === "dinner" ? pickOne(byRoles(["veg"]), random("veg"), used) : null;
    const vegKcal = veg ? veg.nutrition.kcal : 0;

    // primul fel are prea puține calorii → al doilea fel care completează diferența
    const missing = target - sumKcal() - vegKcal;
    if (missing > Math.max(90, target * 0.2)) {
      const extra = pickOne(byRoles(EXTRA_ROLES[meal.key]), random("extra"), used, missing * 0.45, missing * 1.15);
      if (extra) items.push({ recipe: extra, slot: "extra" });
    }
    if (veg) items.push({ recipe: veg, slot: "veg" });

    // porțiile fiecărui fel (1 / 1,5 / 2), combinația cea mai apropiată de țintă;
    // la egalitate, cea cu mai puține porții
    let best = { diff: Infinity, size: Infinity, combo: items.map(() => 1) };
    const tryCombo = (combo) => {
      const kcal = items.reduce((s, it, k) => s + it.recipe.nutrition.kcal * combo[k], 0);
      const diff = Math.abs(kcal - target);
      const size = combo.reduce((a, b) => a + b, 0);
      if (diff < best.diff - 1 || (Math.abs(diff - best.diff) <= 1 && size < best.size)) best = { diff, size, combo };
    };
    const walk = (k, combo) => (k === items.length ? tryCombo(combo) : PORTIONS.forEach((p) => walk(k + 1, [...combo, p])));
    walk(0, []);
    items.forEach((it, k) => (it.portions = best.combo[k]));

    const sum = (key) => items.reduce((s, i) => s + (i.recipe.nutrition[key] || 0) * i.portions, 0);
    return { ...meal, target, items, kcal: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") };
  });
}

const SLOT_LABELS = { soup: "Supă / ciorbă", main: "Fel principal", extra: "Al doilea fel", veg: "Legumă crudă" };
const fmt = (n) => Math.round(n).toLocaleString("ro-RO");

export default function MealPlan({ target, macros, onOpenRecipe, onOpenCalendar, initialDay }) {
  const [book, setBook] = useState("toate");
  const [round, setRound] = useState(1);     // „Alt meniu” schimbă tot
  const [seeds, setSeeds] = useState({});    // { "lunch:main": 2, ... } schimbă câte un fel
  const plan = useMemo(() => buildPlan(target, book, round, seeds), [target, book, round, seeds]);
  const [day, setDay] = useState(() => initialDay || dateKey(new Date()));
  const [saved, setSaved] = useState(null);   // mesajul de confirmare după salvare

  function save() {
    const replaced = Boolean(loadMenus()[day]);
    const ok = saveMenu(day, {
      target: Math.round(target),
      book,
      meals: plan.map((m) => ({ key: m.key, items: m.items.map((i) => ({ id: i.recipe.id, portions: i.portions })) })),
    });
    setSaved(ok ? { day, replaced } : { error: true });
  }

  const total = plan.reduce(
    (s, m) => ({ kcal: s.kcal + m.kcal, protein: s.protein + m.protein, carbs: s.carbs + m.carbs, fat: s.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  // fără argument: alt meniu întreg; cu o masă: toate felurile ei; cu „masă:slot”: doar acel fel
  const reshuffle = (key) => {
    setSaved(null);
    if (!key) return setRound((r) => r + 1);
    const slots = key.includes(":") ? [key] : ["soup", "main", "extra", "veg"].map((s) => `${key}:${s}`);
    setSeeds((s) => ({ ...s, ...Object.fromEntries(slots.map((k) => [k, (s[k] || 0) + 1])) }));
  };

  return (
    <div className="calcCard mealPlan">
      <div className="mealHead">
        <div>
          <h2><UtensilsCrossed size={16} /> Meniul tău recomandat pentru azi</h2>
          <p>Ales din rețetele noastre, ca să ajungi la <strong>{fmt(target)} kcal</strong>. Apasă pe o rețetă ca s-o deschizi.</p>
        </div>
        <button className="mealShuffle" onClick={() => reshuffle()}>
          <Shuffle size={16} /> Alt meniu
        </button>
      </div>

      <div className="mealBooks">
        {BOOKS.map((b) => (
          <button key={b.id} className={`mealBook ${book === b.id ? "active" : ""}`} onClick={() => { setBook(b.id); setSaved(null); }}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="mealList">
        {plan.map((meal) => (
          <div key={meal.key} className="meal" style={{ "--meal": meal.color }}>
            <div className="mealTop">
              <span className="mealLabel"><span className="calcEmoji">{meal.emoji}</span> {meal.label}</span>
              <span className="mealKcal">
                {fmt(meal.kcal)} <small>/ {fmt(meal.target)} kcal</small>
              </span>
              <button className="mealSwap" onClick={() => reshuffle(meal.key)} title="Schimbă toată masa">
                <RefreshCw size={14} />
              </button>
            </div>
            {meal.items.length === 0 && <p className="mealEmpty">Nu sunt rețete potrivite în cartea aleasă.</p>}
            {meal.items.map(({ recipe, portions, slot }) => (
              <div key={recipe.id} className="mealRow">
                <button className="mealItem" onClick={() => onOpenRecipe(recipe)}>
                  <span className={`mealThumb ${recipe.isProduce ? "fruit" : ""}`}><img src={recipe.image} alt="" loading="lazy" /></span>
                  <span className="mealInfo">
                    <strong>{recipe.title}</strong>
                    <small>{recipe.isFruit ? "Fruct crud" : SLOT_LABELS[slot]} · {amountLabel(recipe, portions)}</small>
                    <span className="mealMacros">
                      <b>{fmt(recipe.nutrition.kcal * portions)} kcal</b>
                      <i style={{ "--c": "#ef6f5e" }}>P {fmt((recipe.nutrition.protein || 0) * portions)} g</i>
                      <i style={{ "--c": "#f5a524" }}>C {fmt((recipe.nutrition.carbs || 0) * portions)} g</i>
                      <i style={{ "--c": "#7b6cf6" }}>G {fmt((recipe.nutrition.fat || 0) * portions)} g</i>
                    </span>
                  </span>
                </button>
                <button className="mealSwap mealSwapItem" onClick={() => reshuffle(`${meal.key}:${slot}`)} title="Schimbă doar acest fel">
                  <RefreshCw size={13} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mealTotal">
        <div className="mealTotalRow">
          <span>Total pe zi</span>
          <strong>{fmt(total.kcal)} / {fmt(target)} kcal</strong>
        </div>
        <div className="mealBar"><span style={{ width: `${Math.min(100, (total.kcal / target) * 100)}%` }} /></div>
        <div className="mealTotalMacros">
          {[
            { label: "Proteine", v: total.protein, goal: macros.protein, c: "#ef6f5e" },
            { label: "Carbohidrați", v: total.carbs, goal: macros.carbs, c: "#f5a524" },
            { label: "Grăsimi", v: total.fat, goal: macros.fat, c: "#7b6cf6" },
          ].map((m) => (
            <div key={m.label} style={{ "--c": m.c }}>
              <small>{m.label}</small>
              <strong>{fmt(m.v)} <em>/ {fmt(m.goal)} g</em></strong>
              <div className="mealBar thin"><span style={{ width: `${Math.min(100, (m.v / m.goal) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mealSave">
        <label className="mealSaveDay">
          <CalendarDays size={16} />
          <span>Ziua:</span>
          <input type="date" value={day} onChange={(e) => { setDay(e.target.value); setSaved(null); }} />
        </label>
        <button className="mealSaveBtn" onClick={save} disabled={!day}>
          <CalendarPlus size={17} /> Salvează în calendar
        </button>
        {saved && !saved.error && (
          <span className="mealSaved">
            <Check size={15} /> {saved.replaced ? "Meniul a fost înlocuit" : "Salvat"} pentru {formatDay(saved.day)}.
            {onOpenCalendar && <button onClick={onOpenCalendar}>Vezi calendarul →</button>}
          </span>
        )}
        {saved?.error && <span className="mealSaved error">Nu s-a putut salva: browserul blochează stocarea.</span>}
      </div>
    </div>
  );
}
