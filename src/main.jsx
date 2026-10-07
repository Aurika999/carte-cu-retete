import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, Menu, X, Calculator, CalendarDays, Droplets, ChefHat, LogIn, LogOut } from "lucide-react";
import { AuthProvider, useAuth } from "./auth";
import CalorieCalculator from "./CalorieCalculator";
import MenuCalendar from "./MenuCalendar";
import WaterTracker from "./WaterTracker";
import ProduceGrid from "./ProduceGrid";
import RecipeBuilder from "./RecipeBuilder";
import AccountPage from "./AccountPage";
import RecipesHub from "./RecipesHub";
import Home from "./Home";
import { FavoritesProvider } from "./favorites";
import RecipePage from "./RecipePage";
import { hasDetail, detailPath, recipeFromPath, loadDetail } from "./recipeDetails";
import { TOOL_PATHS, bookPath, navigate, parseRoute, redirectOldHash } from "./routes";
import "./styles.css";

// Aplicația cu meniul din stânga. Pagina afișată vine din adresa din browser (route):
// { tool, book } — ex. /retete-traditionale → { tool: "retete", book: "Rețete tradiționale" }.
function App({ route, state }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const tool = route?.tool ?? null;

  function choose(recipe) {
    setMobileOpen(false);
    if (recipe.isProduce) {
      // un fruct / o legumă din meniu sau calendar deschide pagina lui din „Fructe crude” / „Legume crude”
      navigate(TOOL_PATHS[recipe.isVeg ? "legume" : "fructe"], { fruitId: recipe.id });
    } else if (hasDetail(recipe)) {
      navigate(detailPath(recipe));
    }
  }

  function openTool(name, extra = {}) {
    setMobileOpen(false);
    navigate(TOOL_PATHS[name], extra);
  }

  const goHome = () => { setMobileOpen(false); navigate("/"); };
  const navButton = (name, className, Icon, title, subtitle, active = tool === name) => (
    <button className={`calcNav ${className} ${active ? "active" : ""}`} onClick={() => openTool(name)}>
      <span className="calcNavIcon"><Icon size={18} /></span>
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
    </button>
  );

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

        <nav className="toc" aria-label="Meniu">
          {navButton("retete", "hubNav", BookOpen, "Rețete pentru Fit From Home", "Cărțile de rețete, fructe și legume crude",
            ["retete", "fructe", "legume"].includes(tool))}
          {navButton("calculator", "", Calculator, "Calculator calorii", "Câte calorii îți trebuie pe zi")}
          {navButton("calendar", "calNav", CalendarDays, "Calendarul meu", "Meniurile salvate pe zile")}
          {navButton("apa", "waterNav", Droplets, "Jurnal de apă", "Câtă apă să bei și cât ai băut")}
          {navButton("reteta", "rbNav", ChefHat, "Creează-ți rețeta", "Alege ingredientele, vezi caloriile")}
          <p className="slogan">Gătește smart, trăiește fit.</p>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <button className="mobileMenu iconButton" onClick={() => setMobileOpen(true)} aria-label="Deschide cuprinsul">
            <Menu size={21} />
          </button>
          <AccountButton onOpenAccount={() => openTool("cont")} />
        </header>

        {tool === "calculator" ? (
          <CalorieCalculator
            key={state.planDay ?? "azi"}
            initialDay={state.planDay}
            onOpenRecipe={choose}
            onOpenCalendar={() => openTool("calendar")}
          />
        ) : tool === "apa" ? (
          <WaterTracker />
        ) : tool === "calendar" ? (
          <MenuCalendar onOpenRecipe={choose} onOpenCalculator={(day) => openTool("calculator", { planDay: day })} />
        ) : tool === "retete" ? (
          <RecipesHub
            book={route.book}
            onOpenRecipe={choose}
            onOpenBook={(b) => navigate(b ? bookPath(b) : TOOL_PATHS.retete)}
            onOpenTool={openTool}
          />
        ) : tool === "cont" ? (
          <AccountPage onOpenCalendar={() => openTool("calendar")} />
        ) : tool === "reteta" ? (
          <RecipeBuilder />
        ) : tool === "fructe" || tool === "legume" ? (
          <ProduceGrid key={`${tool}-${state.t ?? 0}`} type={tool} initialId={state.fruitId} />
        ) : (
          <Home
            onOpenRecipe={choose}
            onSearch={(q) => navigate(`${TOOL_PATHS.retete}?q=${encodeURIComponent(q)}`)}
            onFilter={(f) => navigate(`${TOOL_PATHS.retete}?f=${f}`)}
            onOpenTool={openTool}
          />
        )}
      </main>
    </div>
  );
}

// Pornirea: adresa din browser decide ce se vede — o rețetă (/Salata-cu-piept-de-pui),
// o pagină a aplicației (/retete-traditionale, /calculator-calorii...) sau pagina de start.
redirectOldHash();

function Root() {
  const read = () => ({ path: window.location.pathname, state: window.history.state ?? {} });
  const [loc, setLoc] = useState(read);
  useEffect(() => {
    const onPop = () => setLoc(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const route = parseRoute(loc.path);
  const recipe = !route && recipeFromPath(loc.path);
  if (recipe) {
    // „Înapoi”: la pagina din aplicație de unde a fost deschisă rețeta (cu tot cu poziția derulării);
    // dacă rețeta a fost deschisă direct dintr-un link, la cartea ei
    const back = () => (loc.state.fromApp ? window.history.back() : navigate(bookPath(recipe.book)));
    return <RecipeRoute key={recipe.id} recipe={recipe} onBack={back} />;
  }
  return <App route={route} state={loc.state} />;
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
      <button className="rpBack" onClick={onBack}>Înapoi</button>
    </div>
  );
}

// butonul din bara de sus: „Intră în cont” sau numele utilizatorului (deschide „Contul meu”) + „Ieși”
function AccountButton({ onOpenAccount }) {
  const { user, ready, configured, displayName, openLogin, logout } = useAuth();
  if (!ready || !configured) return null;
  if (!user) {
    return (
      <button className="accountBtn" onClick={openLogin}>
        <LogIn size={16} /> Intră în cont
      </button>
    );
  }
  return (
    <div className="accountBox">
      <button className="accountMe" onClick={onOpenAccount} title="Contul meu">
        <span className="accountAvatar">{(displayName?.[0] ?? "?").toUpperCase()}</span>
        <span className="accountEmail">{displayName}</span>
      </button>
      <button className="accountOut" onClick={logout} title="Ieși din cont"><LogOut size={15} /> Ieși</button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <FavoritesProvider>
      <Root />
    </FavoritesProvider>
  </AuthProvider>
);
