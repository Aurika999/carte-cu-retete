import React, { useState } from "react";
import { Apple, ArrowLeft, Info } from "lucide-react";
import { fruits } from "./fruits";

const NUTRIENTS = [
  { key: "protein", label: "Proteine", color: "#ef6f5e", kcalPerG: 4 },
  { key: "carbs", label: "Carbohidrați", color: "#f5a524", kcalPerG: 4 },
  { key: "fat", label: "Grăsimi", color: "#7b6cf6", kcalPerG: 9 },
  { key: "fiber", label: "Fibre", color: "#2bb3a3" },
];
const PRESETS = [100, 150, 200, 300];
const num = (n) => (Math.round(n * 10) / 10).toLocaleString("ro-RO");

function FruitDetail({ fruit, onBack }) {
  const [grams, setGrams] = useState(100);
  const f = grams / 100;
  const v = fruit.per100g;
  // ponderea caloriilor din proteine / carbohidrați / grăsimi
  const macroKcal = NUTRIENTS.filter((n) => n.kcalPerG).reduce((s, n) => s + v[n.key] * n.kcalPerG, 0) || 1;

  return (
    <>
      <button className="fruitBack" onClick={onBack}><ArrowLeft size={16} /> Toate fructele</button>
      <div className="fruitHero calcCard">
        <img className="fruitPhoto" src={fruit.image} alt={fruit.name} />
        <div className="fruitInfo">
          <span className="fruitKicker"><Apple size={14} /> Fruct crud</span>
          <h1>{fruit.name}</h1>

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
            <Info size={14} /> Valori pentru fructul crud, partea comestibilă (sursa: USDA FoodData Central).
          </p>
          <p className="fruitCredit">
            Foto: {fruit.credit.author}{fruit.credit.license ? `, ${fruit.credit.license}` : ""} ·{" "}
            <a href={fruit.credit.source} target="_blank" rel="noreferrer">Wikimedia Commons</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default function FruitGrid({ initialFruitId }) {
  const [selected, setSelected] = useState(() => fruits.find((f) => f.id === initialFruitId) ?? null);

  function open(fruit) {
    setSelected(fruit);
    document.querySelector(".calcPage")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="calcPage">
      {selected ? (
        <FruitDetail key={selected.id} fruit={selected} onBack={() => setSelected(null)} />
      ) : (
        <header className="calcHero fruitHeroBanner">
          <div className="calcHeroIcon"><Apple size={26} /></div>
          <div>
            <h1>Fructe crude</h1>
            <p>Valorile nutriționale pentru {fruits.length} fructe, la 100 g. Apasă pe un fruct ca să vezi detalii și să alegi cantitatea.</p>
          </div>
        </header>
      )}

      {/* grila cu toate fructele: singură pe pagina de start, sub fruct când e unul deschis */}
      <section className={`calcCard ${selected ? "fruitOthers" : ""}`}>
        {selected && <h2>Toate fructele <small>· valori la 100 g</small></h2>}
        <div className="fruitGrid">
          {fruits.map((x) => (
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
          <Info size={14} /> P = proteine, C = carbohidrați, G = grăsimi, F = fibre (grame la 100 g de fruct crud,
          partea comestibilă; sursa: USDA FoodData Central).
        </p>
        <details className="fruitCredits">
          <summary>Surse foto (Wikimedia Commons)</summary>
          <ul>
            {fruits.map((x) => (
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
