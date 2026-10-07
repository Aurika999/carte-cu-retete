import React, { useEffect } from "react";
import { ArrowLeft, ChefHat, Clock, Lightbulb, ListChecks, Users } from "lucide-react";

const fmt = (n) => n.toLocaleString("ro-RO");
const VALUES = [
  { key: "kcal", label: "Calorii", unit: "kcal", color: "#ef6f5e" },
  { key: "protein", label: "Proteine", unit: "g", color: "#e2574c" },
  { key: "carbs", label: "Carbohidrați", unit: "g", color: "#f5a524" },
  { key: "fat", label: "Grăsimi", unit: "g", color: "#7b6cf6" },
  { key: "fiber", label: "Fibre", unit: "g", color: "#2bb3a3" },
];

// Pagina întreagă a unei rețete scrise ca text (fișierele din src/retete/)
export default function RecipePage({ recipe, onBack }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${recipe.title} — Be Fit From Home`;
    window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, [recipe.title]);

  // pașii: un „group” (ex. Varianta 2) începe din nou numerotarea de la 1
  let number = 0;
  const steps = recipe.steps.map((s) => (s.group ? ((number = 0), s) : { ...s, number: ++number }));
  const groups = recipe.nutrition?.groups ?? [];

  return (
    <div className="rpPage">
      <header className="rpTop">
        <button className="rpBack" onClick={onBack} aria-label="Înapoi la pagina anterioară">
          <ArrowLeft size={20} />
          <span>Înapoi</span>
        </button>
        <span className="rpBrand">Be Fit From Home</span>
      </header>

      <main className="rpMain">
        <section className="rpHero">
          <img className="rpPhoto" src={recipe.photo} alt={recipe.title} />
          <div className="rpHeroText">
            {recipe.book && <span className="rpCrumb">{recipe.book} · {recipe.section}</span>}
            <h1>{recipe.title}</h1>
            {recipe.intro && <p className="rpIntro">{recipe.intro}</p>}
            <div className="rpChips">
              {recipe.servings && <span className="rpServings"><Users size={15} /> {recipe.servings} porții</span>}
              {recipe.time && <span className="rpServings rpTime"><Clock size={15} /> {recipe.time}</span>}
            </div>
          </div>
        </section>

        <div className="rpColumns">
          <section className="rpCard rpIngredients">
            <h2><ListChecks size={18} /> Ingrediente {recipe.servings && <small>({recipe.servings} porții)</small>}</h2>
            {recipe.ingredients.map((g, i) => (
              <div key={i} className="rpGroup">
                {g.group && <h3>{g.group}:</h3>}
                <ul>
                  {g.items.map((item, k) => <li key={k}>{item}</li>)}
                </ul>
              </div>
            ))}
          </section>

          <section className="rpCard rpSteps">
            <h2><ChefHat size={18} /> Mod de preparare</h2>
            <ol>
              {steps.map((s, i) =>
                s.group ? (
                  <li key={i} className="rpStepGroup">{s.group}</li>
                ) : (
                  <li key={i}>
                    <span className="rpStepNum">{s.number}</span>
                    <p>{s.title && <strong>{s.title} </strong>}{s.text}</p>
                  </li>
                )
              )}
            </ol>
          </section>
        </div>

        {(recipe.tips?.length > 0 || recipe.notes?.length > 0) && (
          <section className="rpCard rpTips">
            <h2><Lightbulb size={18} /> Sfaturi practice</h2>
            {recipe.tips?.length > 0 && (
              <ul>
                {recipe.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
            {recipe.notes?.map((n, i) => (
              <div key={i} className="rpNote">
                <p><strong>{n.label}:</strong> {n.text}</p>
                {n.items && (
                  <ul>
                    {n.items.map((t, k) => <li key={k}>{t}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {groups.length > 0 && (
          <section className="rpCard rpNutrition">
            <h2>Valori nutriționale per porție {recipe.nutrition.portion && <small>({recipe.nutrition.portion})</small>}</h2>
            {groups.map((g, i) => (
              <div key={i} className="rpNutritionGroup">
                {g.name && <h3>{g.name}</h3>}
                <div className="rpValues">
                  {VALUES.filter((v) => g[v.key] != null).map((v) => (
                    <div key={v.key} className="rpValue" style={{ "--c": v.color }}>
                      <small>{v.label}</small>
                      <strong>{fmt(g[v.key])} {v.unit}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        <button className="rpBack rpBackBottom" onClick={onBack}>
          <ArrowLeft size={18} /> <span>Înapoi</span>
        </button>
      </main>
    </div>
  );
}
