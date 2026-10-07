// Calculul caloriilor zilnice, comun pentru Calculatorul de calorii și pagina de start.
// Formula Mifflin-St Jeor pentru metabolismul bazal (BMR), înmulțită cu factorul de
// activitate (TDEE), apoi ajustată după obiectiv.

export const ACTIVITY = [
  { id: "sedentar", label: "Sedentar", desc: "Birou, fără sport", factor: 1.2, emoji: "🛋️" },
  { id: "usor", label: "Ușor activ", desc: "Sport 1–3 zile/săpt.", factor: 1.375, emoji: "🚶" },
  { id: "moderat", label: "Moderat activ", desc: "Sport 3–5 zile/săpt.", factor: 1.55, emoji: "🏃" },
  { id: "activ", label: "Foarte activ", desc: "Sport 6–7 zile/săpt.", factor: 1.725, emoji: "🏋️" },
  { id: "extrem", label: "Extrem de activ", desc: "Muncă fizică + antrenamente", factor: 1.9, emoji: "🔥" },
];

export const GOALS = [
  { id: "slabire", label: "Slăbire", desc: "−20%", factor: 0.8, color: "#ef6f5e" },
  { id: "slabire-lenta", label: "Slăbire lentă", desc: "−10%", factor: 0.9, color: "#f5a524" },
  { id: "mentinere", label: "Menținere", desc: "0%", factor: 1, color: "#2bb3a3" },
  { id: "masa", label: "Masă musculară", desc: "+10%", factor: 1.1, color: "#7b6cf6" },
];

export const DEFAULTS = { sex: "femeie", age: 30, weight: 70, height: 165, activity: "usor", goal: "slabire-lenta" };
export const STORAGE_KEY = "calculator-calorii";

// datele introduse în calculator; null dacă utilizatorul nu l-a folosit încă
export function savedCalcForm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function calcTargets(form) {
  const { sex, age, weight, height } = form;
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === "barbat" ? 5 : -161);
  const activity = ACTIVITY.find((a) => a.id === form.activity) ?? ACTIVITY[1];
  const goal = GOALS.find((g) => g.id === form.goal) ?? GOALS[1];
  const tdee = bmr * activity.factor;
  return { bmr, tdee, target: tdee * goal.factor, activity, goal };
}
