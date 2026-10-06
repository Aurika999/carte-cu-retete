import React, { useEffect, useMemo, useState } from "react";
import { ChefHat, Info, Minus, Plus, Save, Search, Trash2, Users, X, FilePlus2 } from "lucide-react";
import { CATEGORIES, ingredients, ingredientById } from "./ingredients";

// Rețeta în lucru și rețetele salvate se păstrează în browser (localStorage)
const DRAFT_KEY = "reteta-in-lucru";
const SAVED_KEY = "retetele-mele";

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stocarea poate fi blocată; pagina merge și fără ea */
  }
};

const EMPTY = { id: null, name: "", servings: 2, items: [] };   // items: [{ id, grams }]
const NUTRIENTS = [
  { key: "protein", label: "Proteine", color: "#ef6f5e", kcalPerG: 4 },
  { key: "carbs", label: "Carbohidrați", color: "#f5a524", kcalPerG: 4 },
  { key: "fat", label: "Grăsimi", color: "#7b6cf6", kcalPerG: 9 },
  { key: "fiber", label: "Fibre", color: "#2bb3a3" },
];
const num = (n) => (Math.round(n * 10) / 10).toLocaleString("ro-RO");
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function totalsOf(items) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const { id, grams } of items) {
    const ing = ingredientById[id];
    if (!ing) continue;
    for (const k of Object.keys(t)) t[k] += (ing.per100g[k] || 0) * grams / 100;
  }
  return t;
}

function Thumb({ ing }) {
  return ing.image
    ? <img className="rbThumb" src={ing.image} alt="" loading="lazy" />
    : <span className="rbThumb rbEmoji">{ing.emoji}</span>;
}

export default function RecipeBuilder() {
  const [recipe, setRecipe] = useState(() => read(DRAFT_KEY, EMPTY));
  const [saved, setSaved] = useState(() => read(SAVED_KEY, []));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("toate");
  const [message, setMessage] = useState("");

  useEffect(() => write(DRAFT_KEY, recipe), [recipe]);

  const results = useMemo(() => {
    const q = norm(query.trim());
    return ingredients.filter(
      (i) => (category === "toate" || i.category === category) && (!q || norm(i.name).includes(q))
    );
  }, [query, category]);

  const totals = useMemo(() => totalsOf(recipe.items), [recipe.items]);
  const servings = Math.max(1, recipe.servings || 1);
  const macroKcal = NUTRIENTS.filter((n) => n.kcalPerG).reduce((s, n) => s + totals[n.key] * n.kcalPerG, 0) || 1;
  const totalGrams = recipe.items.reduce((s, i) => s + i.grams, 0);
  const update = (patch) => { setRecipe((r) => ({ ...r, ...patch })); setMessage(""); };

  function add(ing) {
    if (recipe.items.some((i) => i.id === ing.id)) return;
    update({ items: [...recipe.items, { id: ing.id, grams: ing.grams }] });
  }
  const setGrams = (id, grams) =>
    update({ items: recipe.items.map((i) => (i.id === id ? { ...i, grams: Math.max(0, Math.min(5000, grams)) } : i)) });
  const remove = (id) => update({ items: recipe.items.filter((i) => i.id !== id) });

  function save() {
    const name = recipe.name.trim() || "Rețeta mea";
    const entry = { ...recipe, name, id: recipe.id ?? `r${Date.now()}`, savedAt: new Date().toISOString() };
    const list = [entry, ...saved.filter((s) => s.id !== entry.id)];
    setSaved(list);
    write(SAVED_KEY, list);
    setRecipe(entry);
    setMessage(`„${name}” a fost salvată în Rețetele mele.`);
  }
  function removeSaved(id) {
    const list = saved.filter((s) => s.id !== id);
    setSaved(list);
    write(SAVED_KEY, list);
  }

  return (
    <div className="calcPage">
      <header className="calcHero rbHero">
        <div className="calcHeroIcon"><ChefHat size={26} /></div>
        <div>
          <h1>Creează-ți rețeta</h1>
          <p>Alege ingredientele și cantitățile, iar caloriile și macronutrienții se calculează pe loc — total și pe porție.</p>
        </div>
      </header>

      <div className="rbGrid">
        {/* ---------- ingrediente disponibile ---------- */}
        <section className="calcCard rbPicker">
          <h2>Adaugă ingrediente</h2>
          <label className="fruitSearch rbSearch">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută un ingredient (ex. pui, orez, roșii)..." />
            {query && <button onClick={() => setQuery("")} aria-label="Șterge căutarea"><X size={14} /></button>}
          </label>
          <div className="mealBooks rbCats">
            <button className={`mealBook ${category === "toate" ? "active" : ""}`} onClick={() => setCategory("toate")}>Toate</button>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`mealBook ${category === c.id ? "active" : ""}`} onClick={() => setCategory(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="rbResults">
            {results.map((ing) => {
              const added = recipe.items.some((i) => i.id === ing.id);
              return (
                <button key={ing.id} className={`rbResult ${added ? "added" : ""}`} onClick={() => add(ing)} disabled={added}>
                  <Thumb ing={ing} />
                  <span className="rbResultText">
                    <strong>{ing.name}</strong>
                    <small>{ing.per100g.kcal} kcal / 100 g</small>
                  </span>
                  <span className="rbAdd">{added ? "✓" : <Plus size={16} />}</span>
                </button>
              );
            })}
            {results.length === 0 && <p className="mealEmpty">Niciun ingredient nu se potrivește căutării.</p>}
          </div>
        </section>

        {/* ---------- rețeta ---------- */}
        <section className="rbRecipe">
          <div className="calcCard">
            <div className="rbHead">
              <input
                className="rbName"
                value={recipe.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Numele rețetei (ex. Bol cu pui și orez)"
              />
              <label className="rbServings">
                <Users size={15} /> Porții:
                <button onClick={() => update({ servings: Math.max(1, servings - 1) })} aria-label="Mai puține porții"><Minus size={14} /></button>
                <strong>{servings}</strong>
                <button onClick={() => update({ servings: Math.min(20, servings + 1) })} aria-label="Mai multe porții"><Plus size={14} /></button>
              </label>
            </div>

            {recipe.items.length === 0 ? (
              <p className="rbEmpty">🍳 Încă nu ai adăugat ingrediente. Alege-le din listă — le poți schimba cantitatea oricând.</p>
            ) : (
              <div className="rbItems">
                {recipe.items.map(({ id, grams }) => {
                  const ing = ingredientById[id];
                  if (!ing) return null;
                  return (
                    <div key={id} className="rbItem">
                      <Thumb ing={ing} />
                      <span className="rbItemName">
                        <strong>{ing.name}</strong>
                        <small>{Math.round(ing.per100g.kcal * grams / 100)} kcal</small>
                      </span>
                      <div className="rbGrams">
                        <button onClick={() => setGrams(id, grams - 10)} aria-label="Mai puțin"><Minus size={13} /></button>
                        <input type="number" min={0} max={5000} value={grams} onChange={(e) => setGrams(id, Number(e.target.value) || 0)} />
                        <span>g</span>
                        <button onClick={() => setGrams(id, grams + 10)} aria-label="Mai mult"><Plus size={13} /></button>
                      </div>
                      <button className="rbRemove" onClick={() => remove(id)} aria-label="Scoate ingredientul"><Trash2 size={15} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="calcCard rbTotals">
            <div className="rbKcal">
              <div>
                <small>Total rețetă ({Math.round(totalGrams)} g)</small>
                <strong>{Math.round(totals.kcal)} <span>kcal</span></strong>
              </div>
              <div className="rbPerServing">
                <small>Pe porție ({servings === 1 ? "1 porție" : `din ${servings}`}, ~{Math.round(totalGrams / servings)} g)</small>
                <strong>{Math.round(totals.kcal / servings)} <span>kcal</span></strong>
              </div>
            </div>
            <div className="fruitStack">
              {NUTRIENTS.filter((n) => n.kcalPerG).map((n) => (
                <span key={n.key} style={{ width: `${(totals[n.key] * n.kcalPerG / macroKcal) * 100}%`, background: n.color }} />
              ))}
            </div>
            <div className="fruitNutrients">
              {NUTRIENTS.map((n) => (
                <div key={n.key} className="fruitNutrient" style={{ "--c": n.color }}>
                  <small>{n.label} / porție</small>
                  <strong>{num(totals[n.key] / servings)} g</strong>
                  <em>total {num(totals[n.key])} g{n.kcalPerG && totals.kcal > 0 ? ` · ${Math.round((totals[n.key] * n.kcalPerG / macroKcal) * 100)}% din calorii` : ""}</em>
                </div>
              ))}
            </div>
            <div className="rbActions">
              <button className="mealSaveBtn" onClick={save} disabled={recipe.items.length === 0}><Save size={16} /> Salvează rețeta</button>
              <button className="mealBook" onClick={() => { setRecipe(EMPTY); setMessage(""); }}><FilePlus2 size={14} /> Rețetă nouă</button>
              {message && <span className="mealSaved">{message}</span>}
            </div>
            <p className="calcNote">
              <Info size={14} /> Cântărește carnea, peștele, orezul și pastele crude, înainte de gătit. Valorile sunt estimative
              (sursa: USDA FoodData Central).
            </p>
          </div>

          {saved.length > 0 && (
            <div className="calcCard">
              <h2>Rețetele mele</h2>
              <div className="rbSaved">
                {saved.map((s) => {
                  const t = totalsOf(s.items);
                  return (
                    <div key={s.id} className={`rbSavedItem ${s.id === recipe.id ? "active" : ""}`}>
                      <button className="rbSavedOpen" onClick={() => { setRecipe(s); setMessage(""); }}>
                        <strong>{s.name}</strong>
                        <small>{s.items.length} ingrediente · {Math.round(t.kcal / Math.max(1, s.servings))} kcal / porție</small>
                      </button>
                      <button className="rbRemove" onClick={() => removeSaved(s.id)} aria-label="Șterge rețeta"><Trash2 size={15} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
