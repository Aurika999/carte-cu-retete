import React, { useMemo, useState } from "react";
import { Shuffle, RefreshCw, UtensilsCrossed } from "lucide-react";
import { recipes } from "./recipes";

// Ce secțiuni din cărți se potrivesc la fiecare masă
const ROLES = {
  "Rețete tradiționale": {
    "Mic dejun și gustări": ["breakfast"],
    "Pâine și aluaturi românești": ["breakfast"],
    "Supe și ciorbe": ["soup"],
    "Feluri principale clasice, mai ușoare": ["lunch", "dinner"],
    "Pește — Dunăre și Marea Neagră": ["lunch", "dinner"],
    "Deserturi cu mai puțin zahăr": ["snack"],
  },
  "Rețete gata în 10 minute": {
    "Shake-uri proteice": ["breakfast", "snack"],
    "Budinci de chia": ["breakfast", "snack"],
    "Budinci de ovăz": ["breakfast"],
    "Smoothie-uri": ["breakfast", "snack"],
    "Mic dejun / mese rapide": ["breakfast"],
    "Salate": ["dinner"],
    "Wrap-uri & omlete": ["breakfast", "dinner"],
    "Gustări sărate / mese rapide": ["snack"],
    "Gustări dulci rapide": ["snack"],
    "Mese rapide din supermarket (fără gătit)": ["lunch", "dinner"],
    "Deserturi": ["snack"],
    "Vegane / vegetariene (rapide)": ["lunch", "dinner"],
  },
  "Rețete internaționale": {
    "Aperitive și gustări fresh": ["dinner"],
    "Feluri principale reinterpretate": ["lunch", "dinner"],
    "Pâine și preparate de tip brunch": ["breakfast"],
    "Deserturi fără regrete": ["snack"],
  },
  "Rețete de post": {
    "Mic dejun": ["breakfast"],
    "Aperitive și gustări fresh": ["snack"],
    "Salate consistente și boluri": ["lunch", "dinner"],
    "Supe și ciorbe": ["soup"],
    "Feluri principale reinterpretate": ["lunch", "dinner"],
    "Băuturi și smoothie-uri": ["snack"],
    "Deserturi fără regrete": ["snack"],
  },
};

const MEALS = [
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

const PORTIONS = [1, 1.5, 2];

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

function pick(candidates, target, random, used, portions = PORTIONS) {
  const scored = candidates
    .filter((r) => !used.has(r.id))
    .map((r) => {
      const p = portions.reduce((best, x) =>
        Math.abs(r.nutrition.kcal * x - target) < Math.abs(r.nutrition.kcal * best - target) ? x : best
      );
      return { recipe: r, portions: p, diff: Math.abs(r.nutrition.kcal * p - target) };
    })
    .sort((a, b) => a.diff - b.diff);
  if (!scored.length) return null;
  const pool = scored.slice(0, 8);   // dintre cele mai potrivite, una la întâmplare
  const choice = pool[Math.floor(random() * pool.length)];
  used.add(choice.recipe.id);
  return choice;
}

function buildPlan(total, book, seeds) {
  const pool = recipes.filter((r) => book === "toate" || r.book === book);
  const byRole = (role) => pool.filter((r) => ROLES[r.book]?.[r.section]?.includes(role));
  const used = new Set();

  return MEALS.map((meal) => {
    const random = rng(seeds[meal.key] * 7919 + Math.round(total));
    const target = total * meal.share;
    const items = [];
    if (meal.key === "lunch") {
      const soups = byRole("soup");
      const soup = target >= 450 && soups.length ? pick(soups, Math.min(250, target * 0.35), random, used, [1]) : null;
      if (soup) items.push(soup);
      const main = pick(byRole("lunch"), target - (soup ? soup.recipe.nutrition.kcal : 0), random, used);
      if (main) items.push(main);
    } else {
      const item = pick(byRole(meal.key), target, random, used);
      if (item) items.push(item);
    }
    const sum = (key) => items.reduce((s, i) => s + (i.recipe.nutrition[key] || 0) * i.portions, 0);
    return { ...meal, target, items, kcal: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") };
  });
}

const fmt = (n) => Math.round(n).toLocaleString("ro-RO");
const fmtPortions = (p) => (p === 1 ? "1 porție" : `${String(p).replace(".", ",")} porții`);

export default function MealPlan({ target, macros, onOpenRecipe }) {
  const [book, setBook] = useState("toate");
  const [seeds, setSeeds] = useState({ breakfast: 1, lunch: 1, snack: 1, dinner: 1 });
  const plan = useMemo(() => buildPlan(target, book, seeds), [target, book, seeds]);

  const total = plan.reduce(
    (s, m) => ({ kcal: s.kcal + m.kcal, protein: s.protein + m.protein, carbs: s.carbs + m.carbs, fat: s.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const reshuffle = (key) =>
    setSeeds((s) => (key ? { ...s, [key]: s[key] + 1 } : Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v + 1]))));

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
          <button key={b.id} className={`mealBook ${book === b.id ? "active" : ""}`} onClick={() => setBook(b.id)}>
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
              <button className="mealSwap" onClick={() => reshuffle(meal.key)} title="Altă rețetă">
                <RefreshCw size={14} />
              </button>
            </div>
            {meal.items.length === 0 && <p className="mealEmpty">Nu sunt rețete potrivite în cartea aleasă.</p>}
            {meal.items.map(({ recipe, portions }) => (
              <button key={recipe.id} className="mealItem" onClick={() => onOpenRecipe(recipe)}>
                <span className="mealThumb"><img src={recipe.image} alt="" loading="lazy" /></span>
                <span className="mealInfo">
                  <strong>{recipe.title}</strong>
                  <small>{recipe.book} · {fmtPortions(portions)}</small>
                  <span className="mealMacros">
                    <b>{fmt(recipe.nutrition.kcal * portions)} kcal</b>
                    <i style={{ "--c": "#ef6f5e" }}>P {fmt((recipe.nutrition.protein || 0) * portions)} g</i>
                    <i style={{ "--c": "#f5a524" }}>C {fmt((recipe.nutrition.carbs || 0) * portions)} g</i>
                    <i style={{ "--c": "#7b6cf6" }}>G {fmt((recipe.nutrition.fat || 0) * portions)} g</i>
                  </span>
                </span>
              </button>
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
    </div>
  );
}
