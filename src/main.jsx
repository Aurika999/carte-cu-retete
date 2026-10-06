import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Search, ChevronDown, BookOpen, ExternalLink, Menu, X, Calculator } from "lucide-react";
import { recipes } from "./recipes";
import CalorieCalculator from "./CalorieCalculator";
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

function App() {
  const [selectedId, setSelectedId] = useState(null);
  // linkul …/#calculator deschide direct calculatorul
  const [showCalculator, setShowCalculator] = useState(() => window.location.hash === "#calculator");
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
    setSelectedId(recipe.id);
    setShowCalculator(false);
    setMobileOpen(false);
  }

  function goHome() {
    setSelectedId(null);
    setShowCalculator(false);
    setMobileOpen(false);
  }

  function openCalculator() {
    setSelectedId(null);
    setShowCalculator(true);
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
              <div className="brandEyebrow">BT FIT</div>
              <div className="brandTitle">Cărți de rețete</div>
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

          <button className={`calcNav ${showCalculator ? "active" : ""}`} onClick={openCalculator}>
            <span className="calcNavIcon"><Calculator size={18} /></span>
            <span>
              <strong>Calculator calorii</strong>
              <small>Câte calorii îți trebuie pe zi</small>
            </span>
          </button>
        </nav>

        <div className="sidebarFoot">
          <span>Conținutul este afișat direct din PDF.</span>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <button className="mobileMenu iconButton" onClick={() => setMobileOpen(true)} aria-label="Deschide cuprinsul">
            <Menu size={21} />
          </button>
          {selected && (
            <a
              className="openPdf"
              href={`/${selected.pdf}#page=${selected.pdfPage}`}
              target="_blank"
              rel="noreferrer"
            >
              Deschide PDF <ExternalLink size={15} />
            </a>
          )}
        </header>

        {showCalculator ? (
          <CalorieCalculator />
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
            <img src="/cover.png" alt="Cărți de rețete" />
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
