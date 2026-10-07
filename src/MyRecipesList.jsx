import React, { useEffect, useState } from "react";
import { Clock, Flame, Refrigerator, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "./auth";
import { deleteMyRecipe, listMyRecipes } from "./myRecipes";
import { navigate } from "./routes";

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("ro-RO", { day: "numeric", month: "long" }) : "");

// „Rețetele mele create” (din „Ce ai în frigider?”), în Planificatorul de meniuri
export default function MyRecipesList() {
  const { user, ready } = useAuth();
  const [list, setList] = useState(null);

  useEffect(() => {
    if (!ready) return undefined;
    let alive = true;
    listMyRecipes(user).then((l) => alive && setList(l)).catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [user, ready]);

  async function remove(e, r) {
    e.stopPropagation();
    if (!window.confirm(`Ștergi rețeta „${r.title}”?`)) return;
    await deleteMyRecipe(user, r.id).catch(() => {});
    setList((l) => l.filter((x) => x.id !== r.id));
  }

  return (
    <section className="calcCard myRec">
      <div className="mealHead">
        <div>
          <h2><Sparkles size={16} /> Rețetele mele create</h2>
          <p>
            Rețetele create din „Ce ai în frigider?” se salvează aici automat
            {user ? " (în contul tău)." : " (în acest browser — intră în cont ca să le ai pe orice dispozitiv)."}
          </p>
        </div>
        <button className="mealShuffle" onClick={() => navigate("/#frigider")}>
          <Refrigerator size={16} /> Creează una nouă
        </button>
      </div>

      {list === null ? (
        <p className="mealEmpty">Se încarcă…</p>
      ) : list.length === 0 ? (
        <p className="mealEmpty">Încă nu ai creat nicio rețetă. Alege ingredientele pe care le ai acasă în „Ce ai în frigider?”, pe pagina de start.</p>
      ) : (
        <div className="hubGrid">
          {list.map((r) => {
            const kcal = r.nutrition?.groups?.[0]?.kcal;
            return (
              <div key={r.id} className="hubRecipe" role="button" tabIndex={0}
                onClick={() => navigate(`/reteta-mea/${r.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/reteta-mea/${r.id}`)}>
                <img src={r.photo} alt="" loading="lazy" />
                <button className="heartBtn homeTileHeart myRecDel" onClick={(e) => remove(e, r)} aria-label="Șterge rețeta" title="Șterge rețeta">
                  <Trash2 size={15} />
                </button>
                <span className="hubRecipeText">
                  <strong>{r.title}</strong>
                  <small>
                    {kcal != null && <><Flame size={11} /> {Math.round(kcal)} kcal / porție · </>}
                    <Clock size={11} /> {r.time} · {fmtDate(r.createdAt)}
                  </small>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
