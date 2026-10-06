import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Droplets, Scale, Activity, Target, Info, RotateCcw } from "lucide-react";

// Calculul folosește formula Mifflin-St Jeor pentru metabolismul bazal (BMR),
// înmulțită cu factorul de activitate (TDEE), apoi ajustată după obiectiv.

const ACTIVITY = [
  { id: "sedentar", label: "Sedentar", desc: "Birou, fără sport", factor: 1.2, emoji: "🛋️" },
  { id: "usor", label: "Ușor activ", desc: "Sport 1–3 zile/săpt.", factor: 1.375, emoji: "🚶" },
  { id: "moderat", label: "Moderat activ", desc: "Sport 3–5 zile/săpt.", factor: 1.55, emoji: "🏃" },
  { id: "activ", label: "Foarte activ", desc: "Sport 6–7 zile/săpt.", factor: 1.725, emoji: "🏋️" },
  { id: "extrem", label: "Extrem de activ", desc: "Muncă fizică + antrenamente", factor: 1.9, emoji: "🔥" },
];

const GOALS = [
  { id: "slabire", label: "Slăbire", desc: "−20%", factor: 0.8, color: "#ef6f5e" },
  { id: "slabire-lenta", label: "Slăbire lentă", desc: "−10%", factor: 0.9, color: "#f5a524" },
  { id: "mentinere", label: "Menținere", desc: "0%", factor: 1, color: "#2bb3a3" },
  { id: "masa", label: "Masă musculară", desc: "+10%", factor: 1.1, color: "#7b6cf6" },
];

const DEFAULTS = { sex: "femeie", age: 30, weight: 70, height: 165, activity: "usor", goal: "slabire-lenta" };
const STORAGE_KEY = "calculator-calorii";

function loadSaved() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

// Numărul „curge” spre valoarea nouă, ca rezultatul să se vadă schimbându-se
function useAnimatedNumber(target, duration = 450) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = initial + (target - initial) * eased;
      setValue(v);
      from.current = v;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return Math.round(value);
}

function Slider({ label, unit, value, min, max, step = 1, onChange, color }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="calcSlider">
      <div className="calcSliderTop">
        <span>{label}</span>
        <span className="calcSliderValue" style={{ color }}>
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
          />
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--pct": `${pct}%`, "--accent": color }}
      />
    </label>
  );
}

function Ring({ value, max, color, children }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div className="calcRing">
      <svg viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} className="calcRingTrack" />
        <circle
          cx="90"
          cy="90"
          r={r}
          className="calcRingBar"
          style={{ stroke: color, strokeDasharray: c, strokeDashoffset: c * (1 - pct) }}
        />
      </svg>
      <div className="calcRingInner">{children}</div>
    </div>
  );
}

function bmiInfo(bmi) {
  if (bmi < 18.5) return { label: "Subponderal", color: "#5aa9e6" };
  if (bmi < 25) return { label: "Greutate normală", color: "#2bb3a3" };
  if (bmi < 30) return { label: "Supraponderal", color: "#f5a524" };
  return { label: "Obezitate", color: "#ef6f5e" };
}

export default function CalorieCalculator() {
  const [form, setForm] = useState(loadSaved);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* stocarea poate fi blocată; calculatorul merge și fără ea */
    }
  }, [form]);

  const r = useMemo(() => {
    const { sex, age, weight, height } = form;
    const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === "barbat" ? 5 : -161);
    const activity = ACTIVITY.find((a) => a.id === form.activity);
    const goal = GOALS.find((g) => g.id === form.goal);
    const tdee = bmr * activity.factor;
    const target = tdee * goal.factor;

    // proteine după greutate, grăsimi 25% din calorii, restul carbohidrați
    const proteinG = weight * (goal.id.startsWith("slabire") ? 2 : goal.id === "masa" ? 1.8 : 1.6);
    const fatG = (target * 0.25) / 9;
    const carbsG = Math.max(0, (target - proteinG * 4 - fatG * 9) / 4);
    const bmi = weight / (height / 100) ** 2;

    return {
      bmr, tdee, target, goal, activity, proteinG, fatG, carbsG, bmi,
      water: (weight * 0.035).toFixed(1),
      perLevel: ACTIVITY.map((a) => ({ ...a, kcal: bmr * a.factor })),
    };
  }, [form]);

  const target = useAnimatedNumber(r.target);
  const tdee = useAnimatedNumber(r.tdee);
  const bmr = useAnimatedNumber(r.bmr);
  const bmi = bmiInfo(r.bmi);
  const bmiPos = Math.min(100, Math.max(0, ((r.bmi - 15) / (40 - 15)) * 100));
  const macroKcal = r.proteinG * 4 + r.fatG * 9 + r.carbsG * 4 || 1;
  const macros = [
    { label: "Proteine", g: r.proteinG, kcal: r.proteinG * 4, color: "#ef6f5e" },
    { label: "Carbohidrați", g: r.carbsG, kcal: r.carbsG * 4, color: "#f5a524" },
    { label: "Grăsimi", g: r.fatG, kcal: r.fatG * 9, color: "#7b6cf6" },
  ];
  const maxLevel = r.perLevel[r.perLevel.length - 1].kcal;

  return (
    <div className="calcPage">
      <header className="calcHero">
        <div className="calcHeroIcon"><Flame size={26} /></div>
        <div>
          <h1>Calculator de calorii zilnice</h1>
          <p>Află de câte calorii ai nevoie pe zi ca să slăbești, să-ți menții greutatea sau să crești în masă musculară.</p>
        </div>
      </header>

      <div className="calcGrid">
        {/* ---------- datele tale ---------- */}
        <section className="calcCard calcInputs">
          <div className="calcCardHead">
            <h2>Datele tale</h2>
            <button className="calcReset" onClick={() => setForm(DEFAULTS)} title="Resetează">
              <RotateCcw size={15} /> Resetează
            </button>
          </div>

          <div className="calcSex">
            {[
              { id: "femeie", label: "Femeie", emoji: "👩" },
              { id: "barbat", label: "Bărbat", emoji: "👨" },
            ].map((s) => (
              <button
                key={s.id}
                className={`calcSexBtn ${form.sex === s.id ? "active" : ""} ${s.id}`}
                onClick={() => set("sex")(s.id)}
              >
                <span className="calcEmoji">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>

          <Slider label="Vârstă" unit="ani" value={form.age} min={15} max={80} onChange={set("age")} color="#7b6cf6" />
          <Slider label="Greutate" unit="kg" value={form.weight} min={40} max={180} onChange={set("weight")} color="#ef6f5e" />
          <Slider label="Înălțime" unit="cm" value={form.height} min={140} max={210} onChange={set("height")} color="#2bb3a3" />

          <h3><Activity size={16} /> Nivel de activitate</h3>
          <div className="calcActivity">
            {ACTIVITY.map((a) => (
              <button
                key={a.id}
                className={`calcChoice ${form.activity === a.id ? "active" : ""}`}
                onClick={() => set("activity")(a.id)}
              >
                <span className="calcEmoji">{a.emoji}</span>
                <span className="calcChoiceText">
                  <strong>{a.label}</strong>
                  <small>{a.desc}</small>
                </span>
              </button>
            ))}
          </div>

          <h3><Target size={16} /> Obiectivul tău</h3>
          <div className="calcGoals">
            {GOALS.map((g) => (
              <button
                key={g.id}
                className={`calcGoal ${form.goal === g.id ? "active" : ""}`}
                style={{ "--goal": g.color }}
                onClick={() => set("goal")(g.id)}
              >
                <strong>{g.label}</strong>
                <small>{g.desc}</small>
              </button>
            ))}
          </div>
        </section>

        {/* ---------- rezultate ---------- */}
        <section className="calcResults">
          <div className="calcCard calcMain" style={{ "--goal": r.goal.color }}>
            <Ring value={r.target} max={r.perLevel[r.perLevel.length - 1].kcal * 1.1} color={r.goal.color}>
              <span className="calcBig">{target.toLocaleString("ro-RO")}</span>
              <span className="calcBigUnit">kcal / zi</span>
            </Ring>
            <div className="calcMainText">
              <span className="calcPill" style={{ background: r.goal.color }}>{r.goal.label}</span>
              <p>
                Ca să ajungi la obiectiv, mănâncă în jur de <strong>{target.toLocaleString("ro-RO")} kcal</strong> pe zi.
              </p>
              <div className="calcMini">
                <div>
                  <small>Metabolism bazal</small>
                  <strong>{bmr.toLocaleString("ro-RO")}</strong>
                </div>
                <div>
                  <small>Menținere (TDEE)</small>
                  <strong>{tdee.toLocaleString("ro-RO")}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="calcCard">
            <h2>Macronutrienți recomandați</h2>
            <div className="calcStack">
              {macros.map((m) => (
                <span key={m.label} style={{ width: `${(m.kcal / macroKcal) * 100}%`, background: m.color }} />
              ))}
            </div>
            <div className="calcMacros">
              {macros.map((m) => (
                <div key={m.label} className="calcMacro" style={{ "--c": m.color }}>
                  <span className="calcDot" />
                  <div>
                    <strong>{Math.round(m.g)} g</strong>
                    <small>{m.label} · {Math.round(m.kcal)} kcal</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="calcCard">
            <h2>Calorii după nivelul de activitate</h2>
            <div className="calcLevels">
              {r.perLevel.map((l) => (
                <button
                  key={l.id}
                  className={`calcLevel ${l.id === form.activity ? "active" : ""}`}
                  onClick={() => set("activity")(l.id)}
                >
                  <span className="calcLevelName">{l.emoji} {l.label}</span>
                  <span className="calcLevelBar">
                    <span style={{ width: `${(l.kcal / maxLevel) * 100}%` }} />
                  </span>
                  <span className="calcLevelKcal">{Math.round(l.kcal).toLocaleString("ro-RO")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="calcTwo">
            <div className="calcCard">
              <h2><Scale size={16} /> Indice de masă corporală</h2>
              <div className="calcBmi">
                <strong style={{ color: bmi.color }}>{r.bmi.toFixed(1)}</strong>
                <span>{bmi.label}</span>
              </div>
              <div className="calcBmiScale">
                <span className="calcBmiMarker" style={{ left: `${bmiPos}%`, borderColor: bmi.color }} />
              </div>
              <div className="calcBmiLabels"><span>15</span><span>18,5</span><span>25</span><span>30</span><span>40</span></div>
            </div>
            <div className="calcCard calcWater">
              <h2><Droplets size={16} /> Apă pe zi</h2>
              <div className="calcBmi">
                <strong style={{ color: "#3a8fd9" }}>{r.water.replace(".", ",")} L</strong>
                <span>aprox. {Math.round(r.water / 0.25)} pahare</span>
              </div>
              <div className="calcGlasses">
                {Array.from({ length: Math.min(14, Math.round(r.water / 0.25)) }, (_, i) => (
                  <span key={i} style={{ animationDelay: `${i * 40}ms` }}>💧</span>
                ))}
              </div>
            </div>
          </div>

          <p className="calcNote">
            <Info size={14} /> Valorile sunt estimative și se bazează pe formula Mifflin-St Jeor. Pentru un plan
            personalizat, consultă un nutriționist.
          </p>
        </section>
      </div>
    </div>
  );
}
