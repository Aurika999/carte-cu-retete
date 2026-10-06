import React, { useState } from "react";
import { Apple, ArrowLeft, Carrot, Info } from "lucide-react";
import { fruits } from "./fruits";
import { vegetables } from "./vegetables";

// Fructe crude / Legume crude: aceeași pagină, alte date și alte texte
export const PRODUCE = {
  fructe: {
    items: fruits, title: "Fructe crude", kicker: "Fruct crud", Icon: Apple, banner: "fruitHeroBanner",
    all: "Toate fructele", count: (n) => `${n} fructe`, one: "un fruct", of: "fruct crud", note: "fructul crud",
  },
  legume: {
    items: vegetables, title: "Legume crude", kicker: "Legumă crudă", Icon: Carrot, banner: "vegHeroBanner",
    all: "Toate legumele", count: (n) => `${n} legume`, one: "o legumă", of: "legumă crudă", note: "leguma crudă",
  },
};

const NUTRIENTS = [
  { key: "protein", label: "Proteine", color: "#ef6f5e", kcalPerG: 4 },
  { key: "carbs", label: "Carbohidrați", color: "#f5a524", kcalPerG: 4 },
  { key: "fat", label: "Grăsimi", color: "#7b6cf6", kcalPerG: 9 },
  { key: "fiber", label: "Fibre", color: "#2bb3a3" },
];
const PRESETS = [100, 150, 200, 300];
const num = (n) => (Math.round(n * 10) / 10).toLocaleString("ro-RO");

function Detail({ item, kind, onBack }) {
  const [grams, setGrams] = useState(100);
  const f = grams / 100;
  const v = item.per100g;
  const { Icon } = kind;
  // ponderea caloriilor din proteine / carbohidrați / grăsimi
  const macroKcal = NUTRIENTS.filter((n) => n.kcalPerG).reduce((s, n) => s + v[n.key] * n.kcalPerG, 0) || 1;

  return (
    <>
      <button className="fruitBack" onClick={onBack}><ArrowLeft size={16} /> {kind.all}</button>
      <div className="fruitHero calcCard">
        <img className="fruitPhoto" src={item.image} alt={item.name} />
        <div className="fruitInfo">
          <span className="fruitKicker"><Icon size={14} /> {kind.kicker}</span>
          <h1>{item.name}</h1>

          <div className="fruitGrams">
            <span>Cantitate:</span>
            {PRESETS.map((g) => (
              <button key={g} className={`mealBook ${grams === g ? "active" : ""}`} onClick={() => setGrams(g)}>{g} g</button>
            ))}
            <label className="fruitGramsInput">
              <input type="number" min={10} max={1000} step={10} value={grams}
                onChange={(e) => setGrams(Math.min(1000, Math.max(10, Number(e.target.value) || 10)))} /> g
            </label>
          </div>

          <div className="fruitKcal">
            <strong>{Math.round(v.kcal * f)}</strong>
            <span>kcal în {grams} g</span>
          </div>

          <div className="fruitStack">
            {NUTRIENTS.filter((n) => n.kcalPerG).map((n) => (
              <span key={n.key} style={{ width: `${(v[n.key] * n.kcalPerG / macroKcal) * 100}%`, background: n.color }} />
            ))}
          </div>

          <div className="fruitNutrients">
            {NUTRIENTS.map((n) => (
              <div key={n.key} className="fruitNutrient" style={{ "--c": n.color }}>
                <small>{n.label}</small>
                <strong>{num(v[n.key] * f)} g</strong>
                {n.kcalPerG && <em>{Math.round((v[n.key] * n.kcalPerG / macroKcal) * 100)}% din calorii</em>}
              </div>
            ))}
          </div>

          <p className="calcNote">
            <Info size={14} /> Valori pentru {kind.note}, partea comestibilă (sursa: USDA FoodData Central).
          </p>
          <p className="fruitCredit">
            Foto: {item.credit.author}{item.credit.license ? `, ${item.credit.license}` : ""} ·{" "}
            <a href={item.credit.source} target="_blank" rel="noreferrer">Wikimedia Commons</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default function ProduceGrid({ type = "fructe", initialId }) {
  const kind = PRODUCE[type];
  const { items, Icon } = kind;
  const [selected, setSelected] = useState(() => items.find((x) => x.id === initialId) ?? null);

  function open(item) {
    setSelected(item);
    document.querySelector(".calcPage")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="calcPage">
      {selected ? (
        <Detail key={selected.id} item={selected} kind={kind} onBack={() => setSelected(null)} />
      ) : (
        <header className={`calcHero ${kind.banner}`}>
          <div className="calcHeroIcon"><Icon size={26} /></div>
          <div>
            <h1>{kind.title}</h1>
            <p>Valorile nutriționale pentru {kind.count(items.length)}, la 100 g. Apasă pe {kind.one} ca să vezi detalii și să alegi cantitatea.</p>
          </div>
        </header>
      )}

      {/* grila: singură pe pagina de start, sub fruct / legumă când e unul deschis */}
      <section className={`calcCard ${selected ? "fruitOthers" : ""}`}>
        {selected && <h2>{kind.all} <small>· valori la 100 g</small></h2>}
        <div className="fruitGrid">
          {items.map((x) => (
            <button key={x.id} className={`fruitCard ${selected?.id === x.id ? "active" : ""}`} onClick={() => open(x)}>
              <img src={x.image} alt={x.name} loading="lazy" />
              <strong>{x.name}</strong>
              <span>{x.per100g.kcal} kcal</span>
              <small>
                P {num(x.per100g.protein)} · C {num(x.per100g.carbs)} · G {num(x.per100g.fat)} · F {num(x.per100g.fiber)}
              </small>
            </button>
          ))}
        </div>

        <p className="calcNote" style={{ marginTop: 14 }}>
          <Info size={14} /> P = proteine, C = carbohidrați, G = grăsimi, F = fibre (grame la 100 g de {kind.of},
          partea comestibilă; sursa: USDA FoodData Central).
        </p>
        <details className="fruitCredits">
          <summary>Surse foto (Wikimedia Commons)</summary>
          <ul>
            {items.map((x) => (
              <li key={x.id}>
                {x.name}: {x.credit.author}{x.credit.license ? `, ${x.credit.license}` : ""} —{" "}
                <a href={x.credit.source} target="_blank" rel="noreferrer">sursa</a>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
