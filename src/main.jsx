import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Search, ChevronDown, BookOpen, Menu, X, Calculator, CalendarDays, Droplets, Apple, Carrot } from "lucide-react";
import { recipes } from "./recipes";
import CalorieCalculator from "./CalorieCalculator";
import MenuCalendar from "./MenuCalendar";
import WaterTracker from "./WaterTracker";
import ProduceGrid from "./ProduceGrid";
import RecipePage from "./RecipePage";
import { hasDetail, detailPath, recipeFromPath, loadDetail } from "./recipeDetails";
import "./styles.css";

// Cărți → secțiuni → rețete, în ordinea din recipes.js
function groupRecipes(list) {
  const books = [];
  for (const recipe of list) {
    let book = books.find((b) => b.title === recipe.book);
    if (!book) books.push((book = { title: recipe.book, sections: [] }));
    let section = book.sections.find((s) => s.title === recipe.section);
    if (!section) book.sections.push((section = { title: recipe.section, items: [] }));
    section.items.push(recipe);
  }
  return books;
}

const sectionKey = (book, section) => `${book}|${section}`;

function App({ onOpenDetail }) {
  const [selectedId, setSelectedId] = useState(null);
  // "calculator" / "calendar" / "apa" / "fructe" / "legume" / null (rețetă sau pagina de start);
  // linkurile …/#calculator, …/#calendar, …/#apa, …/#fructe și …/#legume deschid direct pagina
  const [tool, setTool] = useState(
    () =>
      ({ "#calculator": "calculator", "#calendar": "calendar", "#apa": "apa", "#fructe": "fructe", "#legume": "legume" })[
        window.location.hash
      ] ?? null
  );
  const [planDay, setPlanDay] = useState(null);   // ziua aleasă din calendar pentru un meniu nou
  const [visit, setVisit] = useState(0);          // la fiecare apăsare în meniu, pagina pornește de la început
  const [fruitId, setFruitId] = useState(null);   // fructul de deschis în „Fructe crude”
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  // Cărțile și secțiunile pornesc închise; la căutare se deschid toate
  const [openItems, setOpenItems] = useState({});
  const isOpen = (key) => Boolean(query.trim()) || Boolean(openItems[key]);

  // null = pagina de start, cu poza de copertă
  const selected = recipes.find((r) => r.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ro");
    if (!q) return recipes;
    return recipes.filter((r) =>
      r.title.toLocaleLowerCase("ro").includes(q)
    );
  }, [query]);
  const grouped = useMemo(() => groupRecipes(filtered), [filtered]);

  function choose(recipe) {
    setMobileOpen(false);
    if (hasDetail(recipe)) {
      // rețetele scrise ca text se deschid pe pagina lor, la /<titlul rețetei>
      onOpenDetail(recipe);
      return;
    }
    if (recipe.isProduce) {
      // un fruct / o legumă din meniu sau calendar deschide pagina lui din „Fructe crude” / „Legume crude”
      setFruitId(recipe.id);
      setSelectedId(null);
      setTool(recipe.isVeg ? "legume" : "fructe");
      setVisit((v) => v + 1);
      return;
    }
    setSelectedId(recipe.id);
    setTool(null);
  }

  function goHome() {
    setSelectedId(null);
    setTool(null);
    setMobileOpen(false);
  }

  function openTool(name, day = null) {
    setSelectedId(null);
    setFruitId(null);
    setTool(name);
    setPlanDay(day);
    setVisit((v) => v + 1);
    setMobileOpen(false);
  }

  function toggle(key) {
    setOpenItems((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  return (
    <div className="app">
      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <button className="brandHome" onClick={goHome} aria-label="Pagina de start">
            <div className="brandMark"><BookOpen size={19} /></div>
            <div>
              <div className="brandTitle">Be Fit From Home</div>
              <div className="brandEyebrow">Rețete Sănătoase</div>
            </div>
          </button>
          <button className="iconButton mobileClose" onClick={() => setMobileOpen(false)} aria-label="Închide meniul">
            <X size={20} />
          </button>
        </div>

        <div className="tocIntro">
          <div className="tocTitle">Cuprins</div>
        </div>

        <div className="search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută o rețetă..."
            aria-label="Caută o rețetă"
          />
          {query && (
            <button className="searchClear" onClick={() => setQuery("")} aria-label="Șterge căutarea">
              <X size={15} />
            </button>
          )}
        </div>

        <nav className="toc" aria-label="Cuprins rețete">
          {grouped.map((book) => (
            <div className="tocBook" key={book.title}>
              <button className="bookButton" onClick={() => toggle(book.title)}>
                <span>{book.title}</span>
                <ChevronDown size={18} className={isOpen(book.title) ? "chevron open" : "chevron"} />
              </button>
              {isOpen(book.title) && book.sections.map(({ title: section, items }) => {
                const key = sectionKey(book.title, section);
                const open = isOpen(key);
                return (
                  <div className="tocSection" key={key}>
                    <button className="sectionButton" onClick={() => toggle(key)}>
                      <span>{section}</span>
                      <ChevronDown size={16} className={open ? "chevron open" : "chevron"} />
                    </button>
                    {open && (
                      <div className="recipeList">
                        {items.map((recipe) => (
                          <button
                            key={recipe.id}
                            className={`recipeItem ${selected?.id === recipe.id ? "active" : ""}`}
                            onClick={() => choose(recipe)}
                          >
                            <span className="recipeNumber">{recipe.number}</span>
                            <span className="recipeName">{recipe.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="tocBook">
            <button className={`bookButton ${tool === "fructe" ? "bookActive" : ""}`} onClick={() => openTool("fructe")}>
              <span>Fructe crude</span>
              <Apple size={17} />
            </button>
          </div>
          <div className="tocBook">
            <button className={`bookButton ${tool === "legume" ? "bookActive" : ""}`} onClick={() => openTool("legume")}>
              <span>Legume crude</span>
              <Carrot size={17} />
            </button>
          </div>

          <button className={`calcNav ${tool === "calculator" ? "active" : ""}`} onClick={() => openTool("calculator")}>
            <span className="calcNavIcon"><Calculator size={18} /></span>
            <span>
              <strong>Calculator calorii</strong>
              <small>Câte calorii îți trebuie pe zi</small>
            </span>
          </button>
          <button className={`calcNav calNav ${tool === "calendar" ? "active" : ""}`} onClick={() => openTool("calendar")}>
            <span className="calcNavIcon"><CalendarDays size={18} /></span>
            <span>
              <strong>Calendarul meu</strong>
              <small>Meniurile salvate pe zile</small>
            </span>
          </button>
          <button className={`calcNav waterNav ${tool === "apa" ? "active" : ""}`} onClick={() => openTool("apa")}>
            <span className="calcNavIcon"><Droplets size={18} /></span>
            <span>
              <strong>Jurnal de apă</strong>
              <small>Câtă apă să bei și cât ai băut</small>
            </span>
          </button>

          <p className="slogan">Gătește smart, trăiește fit.</p>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <button className="mobileMenu iconButton" onClick={() => setMobileOpen(true)} aria-label="Deschide cuprinsul">
            <Menu size={21} />
          </button>
        </header>

        {tool === "calculator" ? (
          <CalorieCalculator
            key={planDay ?? "azi"}
            initialDay={planDay}
            onOpenRecipe={choose}
            onOpenCalendar={() => openTool("calendar")}
          />
        ) : tool === "apa" ? (
          <WaterTracker />
        ) : tool === "calendar" ? (
          <MenuCalendar onOpenRecipe={choose} onOpenCalculator={(day) => openTool("calculator", day)} />
        ) : tool === "fructe" || tool === "legume" ? (
          <ProduceGrid key={`${tool}-${visit}`} type={tool} initialId={fruitId} />
        ) : selected ? (
          <>
            <section className="recipeHeader">
              <div>
                <h1>{selected.title}</h1>
              </div>
            </section>

            <section className="viewerCard">
              <div className="pdfPageWrap">
                <img
                  key={selected.id}
                  className="pdfPageImage"
                  src={selected.image}
                  alt={`Rețeta ${selected.title}`}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="homeCover">
            <h1 className="homeTitle">
              Carte de rețete online: „Gusturi Tradiționale și Moderne”
            </h1>
            <img src="/cover.png" alt="Be Fit From Home — Rețete Sănătoase" />
          </section>
        )}
      </main>
    </div>
  );
}

// Pornirea: adresa din browser decide ce se vede. /<titlul rețetei> deschide pagina
// rețetei scrise ca text (recipeDetails.js); orice altă adresă, aplicația obișnuită.
function navigate(path) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Root() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const recipe = recipeFromPath(path);
  if (recipe) return <RecipeRoute key={recipe.id} recipe={recipe} onBack={() => navigate("/")} />;
  return <App onOpenDetail={(r) => navigate(detailPath(r))} />;
}

// descarcă textul rețetei (src/retete/<slug>.js) și o afișează
function RecipeRoute({ recipe, onBack }) {
  const [detail, setDetail] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadDetail(recipe).then((d) => alive && setDetail(d)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [recipe]);

  if (detail) return <RecipePage recipe={detail} onBack={onBack} />;
  return (
    <div className="rpPage rpLoading">
      <p>{failed ? "Rețeta nu a putut fi încărcată." : "Se încarcă rețeta…"}</p>
      <button className="rpBack" onClick={onBack}>Înapoi la meniu</button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
