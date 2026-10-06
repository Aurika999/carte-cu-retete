// Meniurile salvate în calendar, păstrate în browser (localStorage), pe zile:
// { "2026-10-06": { target, book, savedAt, meals: [{ key, items: [{ id, portions }] }] } }
const KEY = "calendar-meniuri";

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadMenus() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function store(menus) {
  try {
    localStorage.setItem(KEY, JSON.stringify(menus));
    return true;
  } catch {
    return false;   // stocarea poate fi blocată (ex. fereastră privată)
  }
}

export function saveMenu(day, menu) {
  return store({ ...loadMenus(), [day]: { ...menu, savedAt: new Date().toISOString() } });
}

export function deleteMenu(day) {
  const menus = loadMenus();
  delete menus[day];
  return store(menus);
}

export function formatDay(key, options = { weekday: "long", day: "numeric", month: "long" }) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ro-RO", options);
}
