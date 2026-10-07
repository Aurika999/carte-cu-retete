import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarPlus, ChefHat, ChevronLeft, ChevronRight, Clock, Droplets, Flame, Plus, Refrigerator, Search, X } from "lucide-react";
import { recipes } from "./recipes";
import { useAuth } from "./auth";
import { HeartButton, useFavorites } from "./favorites";
import { FILTERS, applyFilter, filterById } from "./recipeFilters";
import { MEALS, suggestMeal } from "./MealPlan";
import { planItemById } from "./planItems";
import { calcTargets, savedCalcForm } from "./calories";
import { GLASS, addWaterToday, todayEntry } from "./waterStorage";
import { dateKey, loadMenus, saveMenu } from "./menuStorage";

const photoOf = (r) => `/recipes/${r.slug}.jpg`;
const fmt = (n) => Math.round(n).toLocaleString("ro-RO");
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
// amestecare stabilă pentru o zi (aceeași listă toată ziua, alta mâine)
const shuffleForDay = (list, salt) =>
  [...list].sort((a, b) => hash(`${salt}|${a.id}`) - hash(`${salt}|${b.id}`));

// rețete potrivite ca masă principală pentru „Rețeta zilei” (fără deserturi, budinci, shake-uri)
const NOT_MAIN = /Desert|Budinci|Shake|Smoothie|Gustări dulci/;
const HERO_POOL = applyFilter({
  test: (r) => r.nutrition.kcal >= 200 && (r.nutrition.protein ?? 0) >= 12 && !NOT_MAIN.test(r.section),
});

// ingrediente rapide pentru „Ce ai în frigider?” (expresii pe text fără diacritice)
const FRIDGE = [
  ["Pui", "\\bpui\\b"], ["Ouă", "\\bou(a|ale)?\\b"], ["Orez", "\\borez"], ["Roșii", "\\brosi"],
  ["Ciuperci", "\\bciuperc"], ["Cartofi", "\\bcartof"], ["Brânză", "\\bbranz"], ["Iaurt", "\\biaurt"],
  ["Ton", "\\bton\\b"], ["Somon", "\\bsomon"], ["Năut", "\\bnaut"], ["Linte", "\\blinte"],
  ["Ovăz", "\\bovaz"], ["Banane", "\\bbanan"], ["Mere", "\\bmer(e|i)?\\b"], ["Broccoli", "\\bbroccoli"],
  ["Spanac", "\\bspanac"], ["Morcovi", "\\bmorcov"], ["Ceapă", "\\bceap"], ["Ardei", "\\bardei"],
  ["Dovlecel", "\\bdovlecel"], ["Fasole", "\\bfasol"], ["Tofu", "\\btofu"], ["Paste", "\\bpaste\\b"],
];

function menuKcal(menu) {
  return (menu?.meals ?? []).reduce(
    (s, m) => s + m.items.reduce((t, i) => t + (planItemById[i.id]?.nutrition.kcal ?? 0) * i.portions, 0),
    0
  );
}

function RecipeTile({ recipe, onOpen }) {
  return (
    <div className="homeTile" onClick={() => onOpen(recipe)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(recipe)}>
      <img src={photoOf(recipe)} alt="" loading="lazy" />
      <HeartButton id={recipe.id} className="homeTileHeart" />
      <div className="homeTileText">
        <strong>{recipe.title}</strong>
        <span>
          <Flame size={12} /> {fmt(recipe.nutrition.kcal)} kcal
          {recipe.minutes != null && <><Clock size={12} /> {recipe.minutes} min</>}
        </span>
      </div>
    </div>
  );
}

function Carousel({ title, items, onOpen }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  if (!items.length) return null;
  return (
    <section className="homeSection">
      <div className="homeSectionHead">
        <h2>{title}</h2>
        <div className="homeArrows">
          <button onClick={() => scroll(-1)} aria-label="Înapoi"><ChevronLeft size={18} /></button>
          <button onClick={() => scroll(1)} aria-label="Înainte"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="homeCarousel" ref={ref}>
        {items.map((r) => <RecipeTile key={r.id} recipe={r} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

export default function Home({ onOpenRecipe, onSearch, onFilter, onOpenTool }) {
  const { user, ready, displayName } = useAuth();
  const { ids: favoriteIds } = useFavorites();
  const today = dateKey(new Date());
  const firstName = user ? (displayName || "").split(/[\s@]/)[0] : "";

  // ---- panou: apă și calorii ----
  const [water, setWater] = useState(todayEntry);
  const form = savedCalcForm();
  const target = form ? calcTargets(form).target : null;
  const [todayMenu, setTodayMenu] = useState(null);
  useEffect(() => {
    if (!ready) return;
    loadMenus(user).then((m) => setTodayMenu(m[today] ?? null)).catch(() => setTodayMenu(null));
  }, [user, ready, today]);
  const planned = menuKcal(todayMenu);

  // ---- rețeta zilei ----
  const hero = useMemo(() => HERO_POOL[hash(today) % HERO_POOL.length], [today]);
  const [mealPick, setMealPick] = useState(null);   // null = închis; altfel cheia mesei propuse
  const [added, setAdded] = useState("");

  async function addToCalendar(mealKey) {
    setMealPick(null);
    try {
      const menus = await loadMenus(user);
      const menu = menus[today] ?? { target: Math.round(target ?? 0), book: "toate", meals: [] };
      const meals = MEALS.map((m) => menu.meals.find((x) => x.key === m.key) ?? { key: m.key, items: [] });
      const meal = meals.find((m) => m.key === mealKey);
      if (!meal.items.some((i) => i.id === hero.id)) meal.items.push({ id: hero.id, portions: 1 });
      const next = { ...menu, meals };
      await saveMenu(user, today, next);
      setTodayMenu(next);
      setAdded(MEALS.find((m) => m.key === mealKey).label);
    } catch {
      setAdded("eroare");
    }
  }

  // ---- recomandări ----
  const recommended = useMemo(() => {
    const goal = form?.goal ?? "";
    const base = goal.startsWith("slabire") ? applyFilter(filterById.slabire)
      : goal === "masa" ? applyFilter(filterById.proteine) : HERO_POOL;
    return shuffleForDay(base.filter((r) => r.id !== hero.id), today).slice(0, 14);
  }, [form?.goal, hero.id, today]);
  const favorites = favoriteIds.map((id) => recipes.find((r) => r.id === id)).filter(Boolean);

  // ---- ce ai în frigider ----
  const [fridge, setFridge] = useState([]);       // [{ label, re }]
  const [custom, setCustom] = useState("");
  const [fridgeResults, setFridgeResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const toggleFridge = (label, re) => {
    setFridgeResults(null);
    setFridge((f) => (f.some((x) => x.label === label) ? f.filter((x) => x.label !== label) : [...f, { label, re }]));
  };
  function addCustom(e) {
    e.preventDefault();
    const t = norm(custom.trim());
    if (!t) return;
    toggleFridge(custom.trim(), `\\b${t.slice(0, Math.max(3, Math.min(5, t.length)))}`);
    setCustom("");
  }
  async function findRecipes() {
    if (!fridge.length) return;
    setSearching(true);
    const index = (await import("./ingredientIndex")).default;
    const res = fridge.map((f) => new RegExp(f.re));
    const found = recipes
      .filter((r) => index[r.id] && res.every((re) => re.test(index[r.id].t)))
      .sort((a, b) => index[a.id].n - index[b.id].n);
    setFridgeResults(found);
    setSearching(false);
  }

  const [query, setQuery] = useState("");
  const waterPct = Math.min(100, (water.ml / water.goal) * 100);

  return (
    <div className="calcPage homePage">
      <h1 className="homeGreeting">
        {firstName ? `Bine ai venit, ${firstName}!` : "Bine ai venit!"} <span>Ce gătim sănătos astăzi?</span>
      </h1>

      <form className="hubSearch homeSearch" onSubmit={(e) => { e.preventDefault(); if (query.trim()) onSearch(query.trim()); }}>
        <Search size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută o rețetă (ex. ciorbă, clătite, pui)..." />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Șterge"><X size={16} /></button>}
      </form>

      {/* ---------- panou: apă + calorii ---------- */}
      <div className="homeDash">
        <div className="homeDashCard water">
          <div className="homeDashTop">
            <span><Droplets size={16} /> Apă azi</span>
            <button className="homeDashLink" onClick={() => onOpenTool("apa")}>Jurnal →</button>
          </div>
          <strong>{(water.ml / 1000).toLocaleString("ro-RO", { maximumFractionDigits: 2 })} <small>/ {(water.goal / 1000).toLocaleString("ro-RO")} L</small></strong>
          <div className="homeBar"><span style={{ width: `${waterPct}%` }} /></div>
          <div className="homeDashBtns">
            <button onClick={() => setWater(addWaterToday(GLASS))}><Plus size={14} /> 250 ml</button>
            <button className="ghost" onClick={() => setWater(addWaterToday(-GLASS))} disabled={!water.ml}>− 250 ml</button>
          </div>
        </div>
        <div className="homeDashCard kcal">
          <div className="homeDashTop">
            <span><Flame size={16} /> Calorii azi</span>
            <button className="homeDashLink" onClick={() => onOpenTool(todayMenu ? "calendar" : "calculator")}>
              {todayMenu ? "Meniul de azi →" : "Calculator →"}
            </button>
          </div>
          {target ? (
            <>
              <strong>{fmt(planned)} <small>/ {fmt(target)} kcal</small></strong>
              <div className="homeBar kcal"><span style={{ width: `${Math.min(100, (planned / target) * 100)}%` }} /></div>
              <p>
                {!todayMenu ? "Încă nu ai un meniu pentru azi — creează-l din calculator."
                  : planned <= target ? `Mai ai ${fmt(target - planned)} kcal până la ținta ta.`
                  : `Ai depășit ținta cu ${fmt(planned - target)} kcal.`}
              </p>
            </>
          ) : (
            <p>Calculează-ți necesarul de calorii ca să vezi aici cât mai ai de mâncat azi.</p>
          )}
        </div>
      </div>

      {/* ---------- rețeta zilei + filtre ---------- */}
      <div className="homeTop">
        <section className="homeHero">
          <img src={photoOf(hero)} alt={hero.title} />
          <span className="homeHeroBadge">Rețeta zilei</span>
          <HeartButton id={hero.id} className="homeHeroHeart" />
          <div className="homeHeroBody">
            <h2>{hero.title}</h2>
            <div className="homeMacros">
              <span><strong>{fmt(hero.nutrition.kcal)}</strong> kcal</span>
              <span><strong>{fmt(hero.nutrition.protein ?? 0)} g</strong> proteine</span>
              {hero.minutes != null && <span><strong>{hero.minutes}</strong> min</span>}
            </div>
            <div className="homeHeroBtns">
              <button className="homeCook" onClick={() => onOpenRecipe(hero)}><ChefHat size={16} /> Gătește acum</button>
              <div className="homeCalWrap">
                <button className="homeCal" onClick={() => setMealPick(mealPick ? null : suggestMeal(hero))}>
                  <CalendarPlus size={16} /> Adaugă în calendar
                </button>
                {mealPick && (
                  <div className="homeMealMenu">
                    <small>Adaugă azi la:</small>
                    {MEALS.map((m) => (
                      <button key={m.key} className={m.key === mealPick ? "suggested" : ""} onClick={() => addToCalendar(m.key)}>
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {added && (
              <p className="homeAdded">
                {added === "eroare" ? "Nu s-a putut adăuga. Încearcă din nou."
                  : <>✓ Adăugată la {added}, azi. <button onClick={() => onOpenTool("calendar")}>Vezi calendarul →</button></>}
              </p>
            )}
          </div>
        </section>

        <section className="homeFilters">
          <h2>Filtre rapide</h2>
          <div className="homeFilterGrid">
            {FILTERS.map((f) => (
              <button key={f.id} className="homeFilter" style={{ "--c": f.color }} onClick={() => onFilter(f.id)}>
                <span className="homeFilterEmoji">{f.emoji}</span>
                <span>
                  <strong>{f.title}</strong>
                  <small>{f.subtitle}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <Carousel title="Rețete recomandate pentru tine" items={recommended} onOpen={onOpenRecipe} />
      <Carousel title="❤️ Favoritele mele" items={favorites} onOpen={onOpenRecipe} />

      {/* ---------- ce ai în frigider ---------- */}
      <section className="homeSection calcCard homeFridge">
        <h2><Refrigerator size={18} /> Ce ai în frigider?</h2>
        <p>Alege 2–3 ingrediente pe care le ai acasă și îți arătăm ce poți găti cu ele.</p>
        <div className="homeChips">
          {FRIDGE.map(([label, re]) => (
            <button key={label} className={`mealBook ${fridge.some((f) => f.label === label) ? "active" : ""}`} onClick={() => toggleFridge(label, re)}>
              {label}
            </button>
          ))}
          {fridge.filter((f) => !FRIDGE.some(([l]) => l === f.label)).map((f) => (
            <button key={f.label} className="mealBook active" onClick={() => toggleFridge(f.label, f.re)}>{f.label} ✕</button>
          ))}
        </div>
        <div className="homeFridgeRow">
          <form className="fruitSearch rbSearch" onSubmit={addCustom}>
            <Plus size={15} />
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Alt ingredient (ex. dovleac) + Enter" />
          </form>
          <button className="mealSaveBtn" onClick={findRecipes} disabled={!fridge.length || searching}>
            <Search size={16} /> {searching ? "Caut…" : "Caută rețete"}
          </button>
        </div>
        {fridgeResults && (
          <>
            <h3 className="homeFridgeCount">
              {fridgeResults.length
                ? `${fridgeResults.length} rețete cu ${fridge.map((f) => f.label.toLowerCase()).join(" + ")}`
                : "Nicio rețetă cu toate ingredientele alese — încearcă mai puține."}
            </h3>
            <div className="hubGrid">
              {fridgeResults.slice(0, 24).map((r) => <RecipeTile key={r.id} recipe={r} onOpen={onOpenRecipe} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
