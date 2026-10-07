import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dumbbell, Flame, Info, Pause, Play, SkipForward, Square, Timer, UserRound } from "lucide-react";
import { useCalcData } from "./calcData";
import MuscleMap, { MUSCLES as MUSCLE_NAMES } from "./MuscleMap";

// Caloriile arse: kcal = MET × 3,5 × greutate (kg) ÷ 200 × minute (valori MET din
// Compendium of Physical Activities). Estimative: depind de intensitate și de persoană.
const kcalFor = (met, kg, minutes) => (met * 3.5 * kg / 200) * minutes;
const REST_MET = 2.0;   // pauzele dintre exerciții (în picioare, respirație)

const WARMUP = [
  { name: "Rotiri de brațe și trunchi", muscles: ["shoulders", "traps", "obliques"], seconds: 30, met: 3.0, emoji: "🔄" },
  { name: "Aplecări ușoare și fandări pe loc", muscles: ["quads", "glutes", "hamstrings", "lowerback"], seconds: 30, met: 3.5, emoji: "🧘" },
  { name: "Jumping Jacks", muscles: ["calves", "quads", "glutes", "shoulders"], seconds: 60, met: 8.0, emoji: "⭐", how: "Sari depărtând brațele și picioarele, apoi revino." },
];

const CIRCUIT = [
  {
    name: "Genuflexiuni (Squats)", muscles: ["quads", "glutes", "hamstrings", "calves"], target: "Picioare și fesieri", met: 5.0, emoji: "🦵", color: "#ef6f5e",
    how: "Picioarele depărtate la lățimea umerilor, coboară ca și cum te-ai așeza pe un scaun, cu spatele drept și greutatea pe călcâie.",
  },
  {
    name: "Flotări din genunchi (sau clasice)", muscles: ["chest", "shoulders", "triceps", "abs"], target: "Piept, umeri și brațe", met: 3.8, emoji: "💪", color: "#f5a524",
    how: "Sprijină-te pe palme și genunchi, coboară pieptul spre podea menținând abdomenul încordat.",
  },
  {
    name: "Fandări alternative în spate", muscles: ["quads", "glutes", "hamstrings", "calves"], target: "Coapse și echilibru", met: 4.0, emoji: "🏃", color: "#2bb3a3",
    how: "Fă un pas mare în spate cu piciorul drept și coboară genunchiul spre sol, apoi revino și schimbă piciorul.",
  },
  {
    name: "Planșă (Plank)", muscles: ["abs", "obliques", "shoulders", "lowerback"], target: "Abdomen și core", met: 3.0, emoji: "🧱", color: "#7b6cf6",
    how: "Sprijină-te pe antebrațe și pe vârfurile picioarelor. Corpul în linie dreaptă, fără să lași bazinul să cadă.",
  },
  {
    name: "Mountain Climbers (Alpinistul)", muscles: ["abs", "obliques", "shoulders", "quads"], target: "Cardio și ardere de calorii", met: 8.0, emoji: "⛰️", color: "#3a8fd9",
    how: "Din poziția de flotare, adu genunchii pe rând spre piept, într-un ritm alert.",
  },
];

const COOLDOWN = [
  { name: "Aplecare înainte (femurali și spate)", muscles: ["hamstrings", "lowerback", "calves"], seconds: 40, met: 2.3, emoji: "🙇" },
  { name: "Întinderea cvadricepsului", muscles: ["quads"], seconds: 40, met: 2.3, emoji: "🦩", how: "Prinde glezna la spate, câte 20 de secunde pe fiecare picior." },
  { name: "Respirații adânci", muscles: ["abs", "chest"], seconds: 40, met: 1.5, emoji: "🌬️" },
];

const WORK = 40;
const REST = 20;

const ACTIVITIES = [
  { name: "Mers alert", muscles: ["quads", "glutes", "hamstrings", "calves"], detail: "~5,5 km/h", met: 4.3, emoji: "🚶", color: "#2bb3a3" },
  { name: "Alergare ușoară", muscles: ["quads", "hamstrings", "glutes", "calves", "abs"], detail: "~8 km/h", met: 8.3, emoji: "🏃", color: "#ef6f5e" },
  { name: "Bicicletă", muscles: ["quads", "glutes", "calves", "hamstrings"], detail: "ritm moderat", met: 6.8, emoji: "🚴", color: "#3a8fd9" },
  { name: "Sărit coarda", muscles: ["calves", "quads", "shoulders", "forearms"], detail: "ritm moderat", met: 11.0, emoji: "🪢", color: "#f5a524" },
  { name: "Urcat scări", muscles: ["glutes", "quads", "hamstrings", "calves"], detail: "ritm constant", met: 8.0, emoji: "🪜", color: "#7b6cf6" },
  { name: "Înot", muscles: ["shoulders", "lats", "chest", "triceps", "quads"], detail: "efort moderat", met: 5.8, emoji: "🏊", color: "#5ec8e5" },
  { name: "Dans / Zumba", muscles: ["quads", "glutes", "calves", "abs", "obliques"], detail: "aerobic", met: 6.0, emoji: "💃", color: "#ef6f8a" },
  { name: "HIIT", muscles: ["quads", "glutes", "abs", "shoulders", "chest"], detail: "intervale intense", met: 8.0, emoji: "🔥", color: "#e2574c" },
  { name: "Antrenament cu greutăți", muscles: ["chest", "lats", "shoulders", "biceps", "triceps", "quads"], detail: "general", met: 5.0, emoji: "🏋️", color: "#405045" },
  { name: "Pilates", muscles: ["abs", "obliques", "glutes", "lowerback"], detail: "nivel mediu", met: 3.0, emoji: "🤸", color: "#b8860b" },
  { name: "Yoga", muscles: ["abs", "lats", "hamstrings", "shoulders", "lowerback"], detail: "Hatha", met: 2.5, emoji: "🧘", color: "#4f9d3a" },
  { name: "Treburi casnice", muscles: ["shoulders", "biceps", "lats", "quads"], detail: "curățenie activă", met: 3.3, emoji: "🧹", color: "#8a6d3b" },
];

const fmt = (n) => Math.round(n).toLocaleString("ro-RO");
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// toți pașii antrenamentului, pentru cronometru
function buildSteps(rounds) {
  const steps = WARMUP.map((w) => ({ ...w, phase: "Încălzire", kind: "work" }));
  for (let r = 1; r <= rounds; r++) {
    CIRCUIT.forEach((c, i) => {
      steps.push({ ...c, seconds: WORK, phase: `Circuit · runda ${r} din ${rounds}`, kind: "work" });
      const last = r === rounds && i === CIRCUIT.length - 1;
      if (!last) steps.push({ name: "Pauză", seconds: REST, met: REST_MET, emoji: "⏸️", phase: `Circuit · runda ${r} din ${rounds}`, kind: "rest" });
    });
  }
  COOLDOWN.forEach((c) => steps.push({ ...c, phase: "Revenire și stretching", kind: "work" }));
  return steps;
}

// beep scurt la schimbarea exercițiului
function beep(freq = 880) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* fără sunet */
  }
}

function Workout({ steps, kg, onStop }) {
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(steps[0].seconds);
  const [paused, setPaused] = useState(false);
  const burned = useRef(0);
  const done = index >= steps.length;

  useEffect(() => {
    if (paused || done) return undefined;
    const t = setInterval(() => {
      burned.current += kcalFor(steps[index].met, kg, 1 / 60);
      setLeft((l) => {
        if (l > 1) {
          if (l <= 4) beep(660);
          return l - 1;
        }
        beep(990);
        setIndex((i) => i + 1);
        return steps[index + 1]?.seconds ?? 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paused, index, done, steps, kg]);

  const skip = () => { setIndex((i) => i + 1); setLeft(steps[index + 1]?.seconds ?? 0); };
  const total = steps.reduce((s, x) => s + x.seconds, 0);
  const elapsed = steps.slice(0, index).reduce((s, x) => s + x.seconds, 0) + (done ? 0 : steps[index].seconds - left);

  if (done) {
    return (
      <div className="calcCard exWorkout exDone">
        <span className="exBigEmoji">🎉</span>
        <h2>Bravo! Ai terminat antrenamentul.</h2>
        <p>Ai ars aproximativ <strong>{fmt(burned.current)} kcal</strong> în {mmss(total)} minute.</p>
        <button className="mealSaveBtn" onClick={onStop}>Înapoi la rutină</button>
      </div>
    );
  }
  const step = steps[index];
  const next = steps[index + 1];
  return (
    <div className={`calcCard exWorkout ${step.kind === "rest" ? "rest" : ""}`} style={{ "--c": step.color ?? "#2bb3a3" }}>
      <span className="exPhase">{step.phase}</span>
      <div className="exNow">
        {step.muscles ? <MuscleMap muscles={step.muscles} size="lg" /> : <span className="exBigEmoji">{step.emoji}</span>}
        <div>
          <h2>{step.name}</h2>
          {step.how && <p>{step.how}</p>}
          {step.muscles && <div className="mmLabels left">{step.muscles.map((m) => <span key={m}>{MUSCLE_NAMES[m]}</span>)}</div>}
        </div>
      </div>
      <div className="exCountdown">{left}<small>s</small></div>
      <div className="exProgress"><span style={{ width: `${(elapsed / total) * 100}%` }} /></div>
      <div className="exMeta">
        <span><Timer size={14} /> {mmss(elapsed)} / {mmss(total)}</span>
        <span><Flame size={14} /> {fmt(burned.current)} kcal arse</span>
        {next && <span>Urmează: <strong>{next.name}</strong></span>}
      </div>
      <div className="exControls">
        <button className="mealSaveBtn" onClick={() => setPaused((p) => !p)}>
          {paused ? <><Play size={16} /> Continuă</> : <><Pause size={16} /> Pauză</>}
        </button>
        <button className="mealBook" onClick={skip}><SkipForward size={14} /> Sari peste</button>
        <button className="mealBook" onClick={onStop}><Square size={14} /> Oprește</button>
      </div>
    </div>
  );
}

function StepRow({ step, kg }) {
  return (
    <div className="exRow">
      {step.muscles ? <MuscleMap muscles={step.muscles} size="sm" /> : <span className="exEmoji">{step.emoji}</span>}
      <span className="exRowText">
        <strong>{step.name}</strong>
        {step.how && <small>{step.how}</small>}
      </span>
      <span className="exRowSide">{step.seconds} s<small>~{kcalFor(step.met, kg, step.seconds / 60).toFixed(1)} kcal</small></span>
    </div>
  );
}

export default function Exercises({ onEditData }) {
  const { form, hasData } = useCalcData();
  const kg = form.weight;
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);
  const [minutes, setMinutes] = useState(() => Object.fromEntries(ACTIVITIES.map((a) => [a.name, 30])));

  const steps = useMemo(() => buildSteps(rounds), [rounds]);
  const totalSec = steps.reduce((s, x) => s + x.seconds, 0);
  const totalKcal = steps.reduce((s, x) => s + kcalFor(x.met, kg, x.seconds / 60), 0);
  const circuitKcal = (c) => kcalFor(c.met, kg, (WORK * rounds) / 60);

  return (
    <div className="calcPage">
      <header className="calcHero exHero">
        <div className="calcHeroIcon"><Dumbbell size={26} /></div>
        <div>
          <h1>Exerciții zilnice</h1>
          <p>O rutină scurtă, fără echipament, plus activitățile de zi cu zi — cu caloriile pe care le arzi la fiecare.</p>
        </div>
      </header>

      <div className="exWeight">
        <span>Calculele folosesc greutatea ta: <strong>{kg} kg</strong>{hasData ? "" : " (valoare de exemplu)"}.</span>
        <button onClick={onEditData}><UserRound size={14} /> {hasData ? "Modifică" : "Completează"} în Contul meu</button>
      </div>

      {running ? (
        <Workout steps={steps} kg={kg} onStop={() => setRunning(false)} />
      ) : (
        <section className="calcCard exRoutine">
          <div className="mealHead">
            <div>
              <h2><Flame size={17} /> Rutina zilnică „Be Fit From Home”</h2>
              <p>
                Circuit HIIT ușor: fiecare exercițiu {WORK} de secunde, urmat de {REST} de secunde pauză. Repetă circuitul de 2 sau 3 ori.
              </p>
            </div>
            <div className="exStart">
              <div className="mealBooks">
                {[2, 3].map((n) => (
                  <button key={n} className={`mealBook ${rounds === n ? "active" : ""}`} onClick={() => setRounds(n)}>{n} runde</button>
                ))}
              </div>
              <button className="mealShuffle" onClick={() => setRunning(true)}><Play size={16} /> Pornește antrenamentul</button>
            </div>
          </div>

          <div className="exTotals">
            <div><small>Durată totală</small><strong>{Math.round(totalSec / 60)} min</strong></div>
            <div><small>Calorii arse (estimat)</small><strong>~{fmt(totalKcal)} kcal</strong></div>
            <div><small>Runde</small><strong>{rounds} × {CIRCUIT.length} exerciții</strong></div>
          </div>

          <h3 className="exStepTitle">1. Încălzire rapidă (2 minute)</h3>
          <div className="exList">{WARMUP.map((w) => <StepRow key={w.name} step={w} kg={kg} />)}</div>

          <h3 className="exStepTitle">2. Circuitul zilnic</h3>
          <div className="exCircuit">
            {CIRCUIT.map((c, i) => (
              <div key={c.name} className="exCard" style={{ "--c": c.color }}>
                <div className="exCardTop">
                  <MuscleMap muscles={c.muscles} size="md" />
                  <span className="exNum">{i + 1}</span>
                </div>
                <strong>{c.name}</strong>
                <span className="exTarget">{c.target}</span>
                <p>{c.how}</p>
                <div className="exCardFoot">
                  <span>{WORK}s lucru / {REST}s pauză</span>
                  <b>~{fmt(circuitKcal(c))} kcal</b>
                </div>
              </div>
            ))}
          </div>
          <p className="exHint">Caloriile din carduri sunt pentru {rounds} runde ({WORK * rounds} de secunde de lucru pe exercițiu).</p>

          <h3 className="exStepTitle">3. Revenire și stretching (2 minute)</h3>
          <div className="exList">{COOLDOWN.map((c) => <StepRow key={c.name} step={c} kg={kg} />)}</div>
        </section>
      )}

      <section className="calcCard exActivities">
        <h2><Timer size={17} /> Alte activități zilnice</h2>
        <p className="exHint">Alege câte minute faci fiecare activitate și vezi câte calorii arzi.</p>
        <div className="exActGrid">
          {ACTIVITIES.map((a) => {
            const m = minutes[a.name];
            return (
              <div key={a.name} className="exAct" style={{ "--c": a.color }}>
                <div className="exActTop">
                  <MuscleMap muscles={a.muscles} size="sm" />
                  <span>
                    <strong>{a.emoji} {a.name}</strong>
                    <small>{a.detail}</small>
                  </span>
                </div>
                <div className="exActKcal">{fmt(kcalFor(a.met, kg, m))} <small>kcal în {m} min</small></div>
                <input
                  type="range" min={5} max={90} step={5} value={m}
                  onChange={(e) => setMinutes({ ...minutes, [a.name]: Number(e.target.value) })}
                  style={{ "--pct": `${((m - 5) / 85) * 100}%`, "--accent": a.color }}
                  aria-label={`Minute de ${a.name}`}
                />
                <small className="exPerHour">≈ {fmt(kcalFor(a.met, kg, 60))} kcal / oră</small>
              </div>
            );
          })}
        </div>
      </section>

      <p className="calcNote">
        <Info size={14} /> Valori estimative, calculate cu formula MET × 3,5 × greutate ÷ 200 × minute. Caloriile reale depind de
        intensitate, vârstă și condiția fizică. Dacă ai probleme de sănătate, consultă medicul înainte de a începe.
      </p>
    </div>
  );
}
