import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Trash2, Plus, Flame } from "lucide-react";
import { MEALS } from "./MealPlan";
import { planItemById as byId, amountLabel } from "./planItems";
import { dateKey, deleteMenu, formatDay, loadMenus } from "./menuStorage";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const fmt = (n) => Math.round(n).toLocaleString("ro-RO");

// reface meniul salvat (id-uri + porții) cu rețetele și caloriile lor
function expand(menu) {
  const meals = MEALS.map((meal) => {
    const saved = menu.meals.find((m) => m.key === meal.key);
    const items = (saved?.items || [])
      .map((i) => ({ recipe: byId[i.id], portions: i.portions }))
      .filter((i) => i.recipe);
    const sum = (key) => items.reduce((s, i) => s + (i.recipe.nutrition[key] || 0) * i.portions, 0);
    return { ...meal, items, kcal: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") };
  });
  const total = (key) => meals.reduce((s, m) => s + m[key], 0);
  return { meals, kcal: total("kcal"), protein: total("protein"), carbs: total("carbs"), fat: total("fat") };
}

export default function MenuCalendar({ onOpenRecipe, onOpenCalculator }) {
  const today = dateKey(new Date());
  const [menus, setMenus] = useState(loadMenus);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);

  const days = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;   // săptămâna începe luni
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { key: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === month.getMonth() };
    });
  }, [month]);

  const monthKey = dateKey(month).slice(0, 7);
  const monthMenus = Object.entries(menus).filter(([k]) => k.startsWith(monthKey));
  const avgKcal = monthMenus.length
    ? monthMenus.reduce((s, [, m]) => s + expand(m).kcal, 0) / monthMenus.length
    : 0;

  const menu = menus[selected] ? expand(menus[selected]) : null;
  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  function remove() {
    if (!window.confirm(`Ștergi meniul din ${formatDay(selected)}?`)) return;
    deleteMenu(selected);
    setMenus(loadMenus());
  }

  return (
    <div className="calcPage">
      <header className="calcHero calHero">
        <div className="calcHeroIcon"><CalendarDays size={26} /></div>
        <div>
          <h1>Calendarul meu de meniuri</h1>
          <p>Meniurile salvate din calculatorul de calorii, pe zile. Apasă pe o zi ca să vezi ce ai de mâncat.</p>
        </div>
      </header>

      <div className="calGrid">
        <section className="calcCard">
          <div className="calMonthHead">
            <button className="calNavBtn" onClick={() => shift(-1)} aria-label="Luna anterioară"><ChevronLeft size={18} /></button>
            <h2>{month.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}</h2>
            <button className="calNavBtn" onClick={() => shift(1)} aria-label="Luna următoare"><ChevronRight size={18} /></button>
          </div>
          <button
            className="calToday"
            onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today); }}
          >
            Azi
          </button>

          <div className="calWeekdays">{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="calDays">
            {days.map((d) => {
              const m = menus[d.key];
              const kcal = m ? expand(m).kcal : 0;
              return (
                <button
                  key={d.key}
                  className={[
                    "calDay",
                    d.inMonth ? "" : "out",
                    d.key === today ? "today" : "",
                    d.key === selected ? "selected" : "",
                    m ? "has" : "",
                  ].join(" ")}
                  onClick={() => setSelected(d.key)}
                >
                  <span className="calDayNum">{d.day}</span>
                  {m && (
                    <>
                      <span className="calDots">
                        {MEALS.map((meal) => <i key={meal.key} style={{ background: meal.color }} />)}
                      </span>
                      <span className="calDayKcal">{fmt(kcal)}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="calStats">
            <div><strong>{monthMenus.length}</strong><small>zile planificate luna aceasta</small></div>
            <div><strong>{avgKcal ? fmt(avgKcal) : "–"}</strong><small>kcal în medie pe zi</small></div>
          </div>
        </section>

        <section className="calcCard calDetail">
          <h2 className="calDetailTitle">{formatDay(selected)}</h2>
          {menu ? (
            <>
              <div className="calDetailTotal">
                <Flame size={18} />
                <strong>{fmt(menu.kcal)} kcal</strong>
                <span>din {fmt(menus[selected].target)} kcal țintă</span>
              </div>
              <div className="calChips">
                <i style={{ "--c": "#ef6f5e" }}>Proteine {fmt(menu.protein)} g</i>
                <i style={{ "--c": "#f5a524" }}>Carbohidrați {fmt(menu.carbs)} g</i>
                <i style={{ "--c": "#7b6cf6" }}>Grăsimi {fmt(menu.fat)} g</i>
              </div>

              <div className="calMeals">
                {menu.meals.map((meal) => (
                  <div key={meal.key} className="calMeal" style={{ "--meal": meal.color }}>
                    <div className="calMealHead">
                      <span><span className="calcEmoji">{meal.emoji}</span> {meal.label}</span>
                      <small>{fmt(meal.kcal)} kcal</small>
                    </div>
                    {meal.items.map(({ recipe, portions }) => (
                      <button key={recipe.id} className="mealItem" onClick={() => onOpenRecipe(recipe)}>
                        <span className={`mealThumb ${recipe.isProduce ? "fruit" : ""}`}><img src={recipe.image} alt="" loading="lazy" /></span>
                        <span className="mealInfo">
                          <strong>{recipe.title}</strong>
                          <small>{amountLabel(recipe, portions)} · {fmt(recipe.nutrition.kcal * portions)} kcal</small>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <button className="calDelete" onClick={remove}><Trash2 size={15} /> Șterge meniul din această zi</button>
            </>
          ) : (
            <div className="calEmpty">
              <span className="calEmptyIcon">🗓️</span>
              <p>Nu ai salvat încă un meniu pentru această zi.</p>
              <button className="mealSaveBtn" onClick={() => onOpenCalculator(selected)}><Plus size={16} /> Creează un meniu</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
