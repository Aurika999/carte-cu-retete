// „Creează rețeta mea” din „Ce ai în frigider?”: din ingredientele alese compune o rețetă
// (tip de preparat, gramaje, mod de preparare, sfaturi), calculează exact caloriile din
// valorile ingredientelor (ingredients.js) și desenează o poză de prezentare din pozele lor.
// Fără AI: reguli + șabloane, aceleași ingrediente dau mereu aceeași rețetă.
import { ingredients, ingredientById } from "./ingredients";

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// ingredientele rapide din „Ce ai în frigider?” → ingredientul din listă
const CHIP_TO_ID = {
  Pui: "i-piept-pui", "Ouă": "i-ou", Orez: "i-orez-alb", "Roșii": "l-rosii", Ciuperci: "l-ciuperci",
  Cartofi: "l-cartof", "Brânză": "i-telemea", Iaurt: "i-iaurt-grecesc-2", Ton: "i-ton-conserva",
  Somon: "i-somon", "Năut": "i-naut-fiert", Linte: "i-linte-fiarta", "Ovăz": "i-ovaz", Banane: "f-banana",
  Mere: "f-mar", Broccoli: "l-broccoli", Spanac: "l-spanac", Morcovi: "l-morcov", "Ceapă": "l-ceapa",
  Ardei: "l-ardei-rosu", Dovlecel: "l-dovlecel", Fasole: "i-fasole-rosie-fiarta", Tofu: "i-tofu", Paste: "i-paste",
};

// un ingredient scris de utilizator (ex. „pepene”, „ceapa verde”) → cel mai potrivit din listă
export function matchIngredient(label) {
  if (CHIP_TO_ID[label]) return ingredientById[CHIP_TO_ID[label]];
  const q = norm(label);
  if (!q) return null;
  const names = ingredients.map((i) => ({ i, n: norm(i.name.replace(/\(.*?\)/g, "")) }));
  return (
    names.find((x) => x.n === q)?.i ??
    names.find((x) => x.n.startsWith(q + " ") || x.n.startsWith(q))?.i ??
    names.find((x) => x.n.split(/[\s,/]+/).some((w) => w.startsWith(q.slice(0, Math.max(4, q.length - 1)))))?.i ??
    null
  );
}

// rolul fiecărui ingredient în preparat
function roleOf(ing) {
  const id = ing.id;
  if (id === "i-ou" || id === "i-albus") return "egg";
  if (/i-(naut|linte|fasole)/.test(id)) return "legume-boabe";
  if (id === "i-tofu" || ing.category === "carne") return "protein";
  if (["i-paste"].includes(id)) return "pasta";
  if (["i-orez-alb", "i-orez-brun", "i-quinoa"].includes(id)) return "grain";
  if (id === "i-ovaz") return "oats";
  if (["l-cartof", "l-cartof-dulce"].includes(id)) return "potato";
  if (["i-iaurt-grecesc-2", "i-skyr"].includes(id)) return "yogurt";
  if (ing.category === "lactate") return "cheese";
  if (ing.category === "cereale") return "carb";
  if (ing.category === "fructe") return "fruit";
  if (ing.category === "legume") return "veg";
  if (ing.category === "grasimi") return "fat";
  return "other";
}

// gramaj pe porție, după rol și tipul preparatului
function gramsFor(ing, role, type) {
  const leafy = { "l-spanac": 60, "l-rucola": 30, "l-salata-verde": 60, "l-kale": 50, "l-ceapa": 40, "l-ceapa-verde": 20,
    "l-usturoi": 5, "l-patrunjel": 10, "l-marar": 10 };
  if (leafy[ing.id]) return leafy[ing.id];
  switch (role) {
    case "egg": return ing.id === "i-ou" ? 100 : 120;
    case "protein": return ing.id === "i-tofu" ? 120 : ing.id === "i-ton-conserva" ? 80 : 150;
    case "legume-boabe": return 120;
    case "pasta": return 80;
    case "grain": return 70;
    case "oats": return 50;
    case "potato": return 250;
    case "yogurt": return type === "sweet" ? 150 : 50;
    case "cheese": return ing.id === "i-parmezan" ? 15 : ing.id === "i-unt" ? 10 : ing.id === "i-branza-vaci" ? 100 : 40;
    case "fruit": return type === "sweet" ? 120 : 80;
    case "fat": return ing.id.startsWith("i-ulei") ? 10 : 20;
    case "carb": return 60;
    case "veg": return type === "salad" ? 120 : 100;
    default: return 20;
  }
}

const lower = (ing) => ing.name.replace(/\s*\(.*?\)/g, "").replace(/ \/ .*/, "").toLowerCase();
// numele scurte, pentru titlu și pașii de preparare
const SHORT = {
  "i-ou": "ouă", "i-albus": "albușuri", "i-ton-conserva": "ton", "i-naut-fiert": "năut", "i-linte-fiarta": "linte",
  "i-fasole-rosie-fiarta": "fasole roșie", "i-fasole-alba-fiarta": "fasole albă", "i-ovaz": "ovăz", "i-orez-alb": "orez",
  "i-orez-brun": "orez brun", "i-telemea": "telemea", "l-cartof": "cartofi", "l-cartof-dulce": "cartofi dulci",
  "l-ciuperci": "ciuperci", "i-iaurt-grecesc-2": "iaurt grecesc", "i-branza-vaci": "brânză de vaci", "f-pepene-rosu": "pepene roșu",
  "i-vita-tocata-5": "carne tocată de vită", "i-vita-tocata-15": "carne tocată de vită", "i-pulpa-pui": "pulpe de pui",
};
const short = (ing) => SHORT[ing.id] ?? lower(ing);
function listRo(words) {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} și ${words[words.length - 1]}`;
}

// tipul preparatului, după ce ingrediente sunt
function pickType(roles) {
  const has = (r) => roles.includes(r);
  const savory = has("protein") || has("veg") || has("egg") || has("legume-boabe") || has("potato") || has("pasta") || has("grain");
  if (!savory && (has("fruit") || has("oats") || has("yogurt"))) return "sweet";
  if (has("egg")) return "omelette";
  if (has("pasta")) return "pasta";
  if (has("grain")) return "bowl";
  if (has("potato")) return "oven";
  if (has("legume-boabe") && !has("protein")) return "stew";
  if (has("protein")) return "pan";
  return roles.filter((r) => r === "veg").length && !has("fat") ? "salad" : "oven";
}

const TYPES = {
  sweet: { name: (m) => (m.oats ? "Budincă de ovăz" : m.yogurt ? "Bol cu iaurt" : "Salată de fructe"), base: (m) => [m.oats ?? m.yogurt], time: 10, meal: "Mic dejun sau gustare" },
  omelette: { name: () => "Omletă", base: (m) => [m.egg], time: 15, meal: "Mic dejun" },
  pasta: { name: () => "Paste", base: (m) => [m.pasta], time: 25, meal: "Prânz sau cină" },
  bowl: { name: (m) => `Bol cu ${short(m.grain)}`, base: (m) => [m.grain], time: 30, meal: "Prânz" },
  oven: { name: (m) => (m.potato ? `${short(m.potato)[0].toUpperCase()}${short(m.potato).slice(1)} la cuptor` : "Legume la cuptor"), base: (m) => [m.potato], time: 40, meal: "Prânz sau cină" },
  stew: { name: (m) => `Tocăniță de ${short(m["legume-boabe"])}`, base: (m) => [m["legume-boabe"]], time: 30, meal: "Prânz" },
  pan: { name: (m) => `${short(m.protein)[0].toUpperCase()}${short(m.protein).slice(1)} la tigaie`, base: (m) => [m.protein], time: 25, meal: "Prânz sau cină" },
  salad: { name: () => "Salată", base: () => [], time: 10, meal: "Prânz sau cină" },
};

function stepsFor(type, by, all) {
  const names = (role) => listRo((by[role] ?? []).map(short));
  const veg = names("veg");
  const cheese = names("cheese");
  const steps = [];
  const add = (title, text) => steps.push({ title, text });

  if (type === "sweet") {
    if (by.oats) add("Combină baza.", `Amestecă ${names("oats")} cu ${by.yogurt ? names("yogurt") : "puțin lapte sau apă"} și lasă 10 minute (sau peste noapte, la frigider) să se înmoaie.`);
    else if (by.yogurt) add("Pregătește baza.", `Pune ${names("yogurt")} într-un bol și amestecă până devine cremos.`);
    if (by.fruit) add("Pregătește fructele.", `Spală și taie bucăți ${names("fruit")}.`);
    add("Asamblează.", `Pune fructele deasupra${by.fat ? `, presară ${names("fat")}` : ""} și îndulcește cu miere, după gust.`);
    add("Servește.", "Servește imediat sau păstrează la rece până la 1 zi.");
    return steps;
  }

  const prot = by.protein?.[0];
  if (veg) add("Pregătește legumele.", `Spală și taie bucăți potrivite ${veg}.`);
  const canned = prot?.id === "i-ton-conserva";
  if (canned) add("Pregătește tonul.", "Scurge bine tonul și desfă-l în bucăți cu o furculiță; îl adaugi la final, nu se gătește.");
  if (prot && !canned && type !== "pan") add(`Pregătește ${short(prot)}.`, `Taie ${short(prot)} cubulețe, asezonează cu sare și piper și rumenește-l 6–8 minute într-o tigaie cu jumătate din ulei, până e gătit complet.`);

  switch (type) {
    case "omelette":
      if (veg) add("Călește legumele.", `Încinge restul de ulei într-o tigaie antiaderentă și călește ${veg} 4–5 minute.`);
      add("Bate ouăle.", `Bate ${by.egg[0].id === "i-ou" ? "ouăle" : names("egg")} cu un praf de sare și piper${cheese ? `, apoi adaugă ${cheese} sfărâmat(ă)` : ""}.`);
      add("Gătește omleta.", "Toarnă ouăle peste legume, dă focul mic și gătește 4–5 minute, până se închegă. Întoarce-o sau acoperă tigaia ultimul minut.");
      break;
    case "pasta":
      add("Fierbe pastele.", `Fierbe ${names("pasta")} în apă cu sare, după instrucțiunile de pe ambalaj (de obicei 8–10 minute). Păstrează o cană din apa de la fiert.`);
      if (veg) add("Gătește sosul.", `Călește ${veg} în ulei 6–8 minute${by["legume-boabe"] ? ` cu ${names("legume-boabe")}` : ""}. Adaugă câteva linguri din apa pastelor.`);
      add("Amestecă.", `Pune pastele în tigaie${prot ? ` împreună cu ${short(prot)}` : ""}, amestecă 1–2 minute${cheese ? ` și presară ${cheese}` : ""}.`);
      break;
    case "bowl":
      add("Fierbe cerealele.", `Clătește ${names("grain")} și fierbe-l(o) în dublul cantității de apă cu sare, la foc mic, 15–18 minute, acoperit.`);
      if (veg) add("Gătește legumele.", `Călește ${veg} în ulei 5–7 minute (sau lasă legumele crude, pentru crocant).`);
      add("Asamblează bolul.", `Pune în boluri ${names("grain")}${prot ? `, ${short(prot)}` : ""}${veg ? " și legumele" : ""}${by["legume-boabe"] ? `, plus ${names("legume-boabe")}` : ""}${cheese ? `, apoi ${cheese}` : ""}. Stropește cu zeamă de lămâie.`);
      break;
    case "oven":
      add("Preîncălzește cuptorul.", "Pornește cuptorul la 200°C.");
      add("Pregătește tava.", `Pune în tavă ${listRo([by.potato ? names("potato") + " tăiați felii sau cuburi" : "", veg].filter(Boolean))}, stropește cu ulei, sare, piper și boia dulce și amestecă.`);
      add("Coace.", `Coace 30–35 de minute, amestecând la jumătate, până se rumenesc${prot ? `. Adaugă ${short(prot)} rumenit(ă) în ultimele 5 minute` : ""}.`);
      if (cheese) add("Gratinează.", `Presară ${cheese} și mai lasă 3–4 minute la cuptor.`);
      break;
    case "stew":
      add("Călește legumele.", `Călește ${veg || "o ceapă tocată"} în ulei 5 minute, la foc mediu.`);
      add("Fierbe tocănița.", `Adaugă ${names("legume-boabe")}, 2 linguri de pastă de roșii, 200 ml apă, sare, piper și cimbru. Lasă la foc mic 15 minute, până se îngroașă sosul.`);
      if (cheese) add("Finalizează.", `Servește cu ${cheese} deasupra.`);
      break;
    case "pan":
      if (!canned) add(`Gătește ${short(prot)}.`, `Taie ${short(prot)} fâșii sau cuburi, asezonează cu sare, piper și usturoi și rumenește-l(o) în ulei 6–8 minute, până e gătit(ă) complet.`);
      if (veg) add("Adaugă legumele.", `Pune în aceeași tigaie ${veg} și gătește 5–7 minute, amestecând, până se înmoaie ușor.`);
      if (by["legume-boabe"]) add("Adaugă leguminoasele.", `Adaugă ${names("legume-boabe")} și mai gătește 2–3 minute.`);
      break;
    case "salad":
      add("Amestecă salata.", `Pune ${veg} într-un bol mare${cheese ? ` și adaugă ${cheese}` : ""}.`);
      add("Dressing.", "Amestecă uleiul cu zeamă de lămâie, sare și piper și toarnă peste salată chiar înainte de servire.");
      break;
    default:
  }
  if (by.fruit && type !== "sweet") add("Adaugă fructele.", `Taie bucăți ${names("fruit")} și adaugă-le la final, pentru prospețime.`);
  add("Servește.", type === "salad"
    ? "Gustă, potrivește de sare și piper și servește imediat, cât legumele sunt crocante."
    : "Gustă, potrivește de sare și piper și servește cald, presărat cu verdeață, dacă ai.");
  return steps;
}

function allergensOf(items) {
  const ids = items.map((i) => i.ing.id);
  const out = [];
  if (items.some((i) => i.ing.category === "lactate" && !/ou|albus/.test(i.ing.id))) out.push("lactoză");
  if (ids.some((id) => /i-(ou|albus)/.test(id))) out.push("ouă");
  if (ids.some((id) => /i-(somon|cod|ton)/.test(id))) out.push("pește");
  if (ids.includes("i-creveti")) out.push("crustacee");
  if (ids.some((id) => /i-(paste|faina|paine|ovaz)/.test(id))) out.push("gluten");
  if (ids.includes("i-tofu")) out.push("soia");
  if (ids.some((id) => /i-(nuci|migdale|unt-arahide)/.test(id))) out.push("nuci / arahide");
  return out.length ? out.join(", ") + "." : "nu conține alergeni majori în forma de bază.";
}

// selected: [{ label }] din „Ce ai în frigider?” → rețeta, în formatul paginii de rețetă
export function generateRecipe(selected, servings = 2) {
  const matched = [];
  const unknown = [];
  for (const { label } of selected) {
    const ing = matchIngredient(label);
    if (ing && !matched.some((m) => m.id === ing.id)) matched.push(ing);
    else if (!ing) unknown.push(label);
  }
  if (!matched.length) return null;

  const roles = matched.map(roleOf);
  const type = pickType(roles);
  const by = {};
  matched.forEach((ing, k) => (by[roles[k]] ??= []).push(ing));
  const main = Object.fromEntries(Object.entries(by).map(([r, list]) => [r, list[0]]));

  // ingredientele cu gramaje (totale, pentru toate porțiile) + uleiul / mierea care completează rețeta
  const items = matched.map((ing, k) => ({ ing, grams: gramsFor(ing, roles[k], type) * servings }));
  if (type === "sweet") {
    if (!by.fat) items.push({ ing: ingredientById["i-miere"], grams: 10 * servings, extra: true });
  } else if (!items.some((i) => i.ing.id.startsWith("i-ulei"))) {
    items.push({ ing: ingredientById["i-ulei-masline"], grams: 10 * servings, extra: true });
  }

  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const { ing, grams } of items) for (const k of Object.keys(totals)) totals[k] += (ing.per100g[k] || 0) * grams / 100;
  const per = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round((v / servings) * 10) / 10]));

  const t = TYPES[type];
  const base = t.name(main);
  const baseIngs = t.base(main);
  const rest = matched.filter((ing) => !baseIngs.includes(ing));
  const title = type === "bowl"
    ? `Bol cu ${listRo([main.grain, ...rest].slice(0, 4).map(short))}`
    : rest.length ? `${base} cu ${listRo(rest.slice(0, 3).map(short))}` : base;
  const fmtG = (g, ing) => (ing.id === "i-ou" ? `${Math.round(g / 50)} ouă (≈ ${g} g)` : `${Math.round(g)} g`);

  return {
    title,
    servings,
    time: `${t.time} minute`,
    generated: true,
    intro: `Rețetă creată din ingredientele tale: ${listRo(matched.map(short))}. ${t.meal}, cu aproximativ ${Math.round(per.kcal)} kcal pe porție.`,
    ingredients: [
      { group: "Ingredientele tale", items: items.filter((i) => !i.extra).map((i) => `${fmtG(i.grams, i.ing)} ${lower(i.ing)}`) },
      { group: "Din cămară", items: [...items.filter((i) => i.extra).map((i) => `${fmtG(i.grams, i.ing)} ${lower(i.ing)}`), "sare, piper, condimente după gust", ...unknown.map((u) => `${u} (după gust — fără valori nutriționale în listă)`)] },
    ],
    steps: stepsFor(type, by, matched),
    tips: [
      "Cântărește carnea, peștele, orezul și pastele crude — așa sunt calculate caloriile.",
      type === "sweet" ? "Pentru mai multe proteine, adaugă o lingură de unt de arahide sau mai mult iaurt." : "Pentru o porție mai sățioasă, adaugă încă o legumă sau o salată verde alături.",
    ],
    notes: [{ label: "Alergeni", text: allergensOf(items) }],
    nutrition: { portion: `~${Math.round(items.reduce((s, i) => s + i.grams, 0) / servings)} g`, groups: [{ name: null, ...per }] },
    // pentru „Salvează în Rețetele mele” (Creează-ți rețeta)
    builderItems: items.map((i) => ({ id: i.ing.id, grams: Math.round(i.grams) })),
    photoIngredients: matched.map((i) => i.id),
  };
}

// poza de prezentare: pozele ingredientelor (sau emoji pe fundal colorat) într-un colaj 763×436
export async function drawCover(ids, title) {
  const W = 763, H = 436;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1c3a2a"); grad.addColorStop(1, "#4f9d3a");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  const list = ids.slice(0, 4).map((id) => ingredientById[id]).filter(Boolean);
  const cells = list.length === 1 ? [[0, 0, W, H]]
    : list.length === 2 ? [[0, 0, W / 2, H], [W / 2, 0, W / 2, H]]
    : list.length === 3 ? [[0, 0, W / 2, H], [W / 2, 0, W / 2, H / 2], [W / 2, H / 2, W / 2, H / 2]]
    : [[0, 0, W / 2, H / 2], [W / 2, 0, W / 2, H / 2], [0, H / 2, W / 2, H / 2], [W / 2, H / 2, W / 2, H / 2]];
  const colors = ["#f5a524", "#ef6f5e", "#2bb3a3", "#7b6cf6"];

  const load = (src) => new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = src; });
  for (let k = 0; k < list.length; k++) {
    const [x, y, w, h] = cells[k];
    const img = list[k].image ? await load(list[k].image) : null;
    if (img) {
      const s = Math.max(w / img.width, h / img.height);
      const sw = w / s, sh = h / s;
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
    } else {
      ctx.fillStyle = colors[k % colors.length];
      ctx.fillRect(x, y, w, h);
      ctx.font = `${Math.min(w, h) * 0.45}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(list[k].emoji, x + w / 2, y + h / 2);
    }
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
  }
  // bandă cu titlul jos
  const band = ctx.createLinearGradient(0, H - 120, 0, H);
  band.addColorStop(0, "rgba(0,0,0,0)"); band.addColorStop(1, "rgba(0,0,0,.65)");
  ctx.fillStyle = band; ctx.fillRect(0, H - 120, W, 120);
  ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = '700 15px "DM Sans", sans-serif';
  ctx.fillText("REȚETA MEA · BE FIT FROM HOME", 24, H - 52);
  ctx.font = '700 26px "Playfair Display", Georgia, serif';
  const t = title.length > 52 ? title.slice(0, 50) + "…" : title;
  ctx.fillText(t, 24, H - 20);
  return canvas.toDataURL("image/jpeg", 0.85);
}
