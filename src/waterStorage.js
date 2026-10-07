// Jurnalul de apă, păstrat în browser: { "2026-10-06": { ml: 1500, goal: 2450 } }.
// Folosit de Jurnalul de apă și de panoul de pe pagina de start.
import { dateKey } from "./menuStorage";

const KEY = "jurnal-apa";
export const GLASS = 250;

export function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function storeLog(log) {
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    /* stocarea poate fi blocată; jurnalul merge până închizi pagina */
  }
}

// ținta implicită: 35 ml pe kg, după greutatea din calculatorul de calorii
export function defaultGoal() {
  try {
    const weight = JSON.parse(localStorage.getItem("calculator-calorii") || "{}").weight;
    if (weight) return Math.round((weight * 35) / 50) * 50;
  } catch {
    /* fără date din calculator */
  }
  return 2000;
}

// ziua de azi din jurnal (cu ținta implicită dacă nu există încă)
export function todayEntry(log = loadLog()) {
  return log[dateKey(new Date())] ?? { ml: 0, goal: defaultGoal() };
}

// adaugă / scade apă pentru azi și întoarce intrarea actualizată
export function addWaterToday(delta) {
  const log = loadLog();
  const day = dateKey(new Date());
  const entry = log[day] ?? { ml: 0, goal: defaultGoal() };
  const next = { ...entry, ml: Math.max(0, entry.ml + delta) };
  storeLog({ ...log, [day]: next });
  return next;
}
