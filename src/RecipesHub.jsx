import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Search, X } from "lucide-react";
import { recipes } from "./recipes";
import { readScroll, replaceSearch, saveScroll } from "./routes";
import { HeartButton } from "./favorites";
import { FILTERS, applyFilter, filterById } from "./recipeFilters";
import { fruits } from "./fruits";
import { vegetables } from "./vegetables";

// „Rețete pentru Fit From Home”: toate cărțile de rețete + fructe și legume crude, într-o singură pagină
const BOOKS = [...new Set(recipes.map((r) => r.book))].map((title) => {
  const list = recipes.filter((r) => r.book === title);
  return { title, count: list.length, sections: [...new Set(list.map((r) => r.section))], cover: photoOf(list[0]) };
});

function photoOf(recipe) {
  return `/recipes/${recipe.slug}.jpg`;
}

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const anchor = (section) => `sec-${norm(section).replace(/[^a-z0-9]+/g, "-")}`;

function RecipeCard({ recipe, onOpen }) {
  return (
    <div className="hubRecipe" role="button" tabIndex={0} onClick={() => onOpen(recipe)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(recipe)}>
      <img src={photoOf(recipe)} alt="" loading="lazy" />
      <HeartButton id={recipe.id} className="homeTileHeart" />
      <span className="hubRecipeText">
        <strong>{recipe.title}</strong>
        {recipe.nutrition?.kcal != null && (
          <small>{Math.round(recipe.nutrition.kcal)} kcal / porție{recipe.minutes != null ? ` · ${recipe.minutes} min` : ""}</small>
        )}
      </span>
    </div>
  );
}

export default function RecipesHub({ book, onOpenRecipe, onOpenBook, onOpenTool }) {
  // textul căutat (?q=...) și filtrul rapid (?f=...) stau în adresă, ca „Înapoi” de pe o rețetă
  // să ducă la aceleași rezultate
  const params = new URLSearchParams(window.location.search);
  const [query, setQueryState] = useState(() => params.get("q") ?? "");
  const [filterId, setFilterState] = useState(() => (filterById[params.get("f")] ? params.get("f") : null));
  const writeUrl = (qv, fv) => {
    const p = new URLSearchParams();
    if (qv) p.set("q", qv);
    if (fv) p.set("f", fv);
    replaceSearch(p.toString());
  };
  const setQuery = (value) => { setQueryState(value); writeUrl(value, filterId); };
  const setFilter = (id) => { const next = id === filterId ? null : id; setFilterState(next); writeUrl(query, next); };
  const q = norm(query.trim());
  const filter = filterById[filterId];
  const pageRef = useRef(null);

  const results = useMemo(() => {
    const base = filter ? applyFilter(filter) : recipes;
    return q ? base.filter((r) => norm(r.title).includes(q) || norm(r.section).includes(q)) : base;
  }, [q, filter]);
  const current = BOOKS.find((b) => b.title === book);

  // derularea e memorată pentru fiecare intrare din istoricul browserului: cu „Înapoi” revii
  // exact unde ai rămas, iar o carte deschisă din nou din carduri pornește de sus
  const scrollKey = `${window.location.pathname}@${window.history.state?.t ?? 0}`;
  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const top = readScroll(scrollKey);
    el.scrollTop = top;
    // pozele se încarcă treptat: mai încercăm puțin după, cât pagina își ia înălțimea finală
    const timer = setTimeout(() => { if (el.scrollTop < top) el.scrollTop = top; }, 150);
    return () => clearTimeout(timer);
  }, [book]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="calcPage" ref={pageRef} onScroll={(e) => saveScroll(scrollKey, e.currentTarget.scrollTop)}>
      <header className="calcHero hubHero">
        <div className="calcHeroIcon"><BookOpen size={26} /></div>
        <div>
          <h1>Rețete pentru Fit From Home</h1>
          <p>{recipes.length} de rețete sănătoase din {BOOKS.length} cărți, plus fructe și legume crude. Caută o rețetă sau alege o carte.</p>
        </div>
      </header>

      <label className="hubSearch">
        <Search size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută o rețetă (ex. ciorbă, clătite, pui)..." />
        {query && <button onClick={() => setQuery("")} aria-label="Șterge căutarea"><X size={16} /></button>}
      </label>

      <div className="mealBooks hubFilters">
        {FILTERS.map((f) => (
          <button key={f.id} className={`mealBook ${filterId === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.emoji} {f.title}
          </button>
        ))}
      </div>

      {q || filter ? (
        <section className="calcCard">
          <h2>
            {results.length ? `${results.length} rețete` : "Nicio rețetă găsită"}
            {filter && <small className="hubFilterNote"> · {filter.title} ({filter.subtitle.toLowerCase()})</small>}
          </h2>
          <div className="hubGrid">
            {results.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={onOpenRecipe} />)}
          </div>
        </section>
      ) : current ? (
        <>
          <button className="fruitBack" onClick={() => onOpenBook(null)}><ArrowLeft size={16} /> Toate cărțile</button>
          <section className="calcCard hubBook">
            <h2 className="hubBookTitle">{current.title} <small>· {current.count} rețete</small></h2>
            <div className="mealBooks">
              {current.sections.map((s) => (
                <a key={s} className="mealBook" href={`#${anchor(s)}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(anchor(s))?.scrollIntoView({ behavior: "smooth" }); }}>
                  {s}
                </a>
              ))}
            </div>
            {current.sections.map((s) => {
              const list = recipes.filter((r) => r.book === current.title && r.section === s);
              return (
                <div key={s} id={anchor(s)} className="hubSection">
                  <h3>{s} <small>({list.length})</small></h3>
                  <div className="hubGrid">
                    {list.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={onOpenRecipe} />)}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      ) : (
        <div className="hubBooks">
          {BOOKS.map((b) => (
            <button key={b.title} className="hubBookCard" onClick={() => onOpenBook(b.title)}>
              <img src={b.cover} alt="" />
              <span className="hubBookInfo">
                <strong>{b.title}</strong>
                <small>{b.count} rețete · {b.sections.length} secțiuni</small>
              </span>
            </button>
          ))}
          <button className="hubBookCard produce" onClick={() => onOpenTool("fructe")}>
            <img src={fruits[0].image} alt="" />
            <span className="hubBookInfo">
              <strong>Fructe crude</strong>
              <small>{fruits.length} fructe · valori nutriționale</small>
            </span>
          </button>
          <button className="hubBookCard produce" onClick={() => onOpenTool("legume")}>
            <img src={vegetables[0].image} alt="" />
            <span className="hubBookInfo">
              <strong>Legume crude</strong>
              <small>{vegetables.length} legume · valori nutriționale</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
