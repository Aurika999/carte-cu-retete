import React, { useEffect, useMemo, useState } from "react";
import { Droplets, ChevronLeft, ChevronRight, Minus, Plus, Trophy, Settings2 } from "lucide-react";
import { dateKey, formatDay } from "./menuStorage";
import { GLASS, defaultGoal, loadLog, storeLog } from "./waterStorage";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

const liters = (ml) => (ml / 1000).toLocaleString("ro-RO", { maximumFractionDigits: 2 });

export default function WaterTracker() {
  const today = dateKey(new Date());
  const [log, setLog] = useState(loadLog);
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editGoal, setEditGoal] = useState(false);

  useEffect(() => storeLog(log), [log]);

  const entry = log[day] || { ml: 0, goal: log[today]?.goal || defaultGoal() };
  const pct = Math.min(100, (entry.ml / entry.goal) * 100);
  const done = entry.ml >= entry.goal;

  const change = (delta) =>
    setLog((l) => {
      const e = l[day] || entry;
      return { ...l, [day]: { ...e, ml: Math.max(0, e.ml + delta) } };
    });
  const setGoal = (goal) => setLog((l) => ({ ...l, [day]: { ...(l[day] || entry), goal } }));

  const days = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(month.getFullYear(), month.getMonth(), 1 - offset + i);
      return { key: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === month.getMonth() };
    });
  }, [month]);

  // zile consecutive cu ținta atinsă, până azi (ziua de azi contează doar dacă e atinsă)
  const streak = useMemo(() => {
    let n = 0;
    const d = new Date();
    if (!(log[today] && log[today].ml >= log[today].goal)) d.setDate(d.getDate() - 1);
    for (;;) {
      const e = log[dateKey(d)];
      if (!e || e.ml < e.goal) return n;
      n += 1;
      d.setDate(d.getDate() - 1);
    }
  }, [log, today]);

  const monthKey = dateKey(month).slice(0, 7);
  const monthDays = Object.entries(log).filter(([k, e]) => k.startsWith(monthKey) && e.ml > 0);
  const reached = monthDays.filter(([, e]) => e.ml >= e.goal).length;
  const glasses = Math.ceil(entry.goal / GLASS);
  const drunkGlasses = Math.floor(entry.ml / GLASS);

  return (
    <div className="calcPage">
      <header className="calcHero waterHero">
        <div className="calcHeroIcon"><Droplets size={26} /></div>
        <div>
          <h1>Jurnalul meu de apă</h1>
          <p>Câtă apă ai nevoie pe zi și cât ai băut. Apasă pe un pahar de fiecare dată când bei apă.</p>
        </div>
      </header>

      <div className="calGrid">
        <section className="calcCard waterToday">
          <div className="waterDayHead">
            <h2 className="calDetailTitle">{day === today ? "Azi, " : ""}{formatDay(day)}</h2>
            {day !== today && <button className="calToday" onClick={() => setDay(today)}>Înapoi la azi</button>}
          </div>

          <div className="waterMain">
            <div className={`waterGlass ${done ? "done" : ""}`}>
              <div className="waterFill" style={{ height: `${pct}%` }}>
                <span className="waterWave" />
              </div>
              <div className="waterGlassText">
                <strong>{Math.round(pct)}%</strong>
                <small>{liters(entry.ml)} / {liters(entry.goal)} L</small>
              </div>
            </div>

            <div className="waterSide">
              <p className="waterMsg">
                {done
                  ? "🎉 Bravo! Ți-ai atins ținta de apă."
                  : `Mai ai de băut ${liters(entry.goal - entry.ml)} L (aprox. ${Math.ceil((entry.goal - entry.ml) / GLASS)} pahare).`}
              </p>
              <div className="waterBtns">
                <button className="waterBtn main" onClick={() => change(GLASS)}><Plus size={18} /> 1 pahar <small>250 ml</small></button>
                <button className="waterBtn" onClick={() => change(500)}><Plus size={16} /> 1 sticlă <small>500 ml</small></button>
                <button className="waterBtn minus" onClick={() => change(-GLASS)} disabled={!entry.ml}><Minus size={16} /> 1 pahar</button>
              </div>

              <div className="waterGoal">
                <span>Ținta zilnică: <strong>{liters(entry.goal)} L</strong></span>
                <button onClick={() => setEditGoal((v) => !v)}><Settings2 size={14} /> Schimbă</button>
              </div>
              {editGoal && (
                <label className="calcSlider">
                  <input
                    type="range"
                    min={1000}
                    max={5000}
                    step={50}
                    value={entry.goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    style={{ "--pct": `${((entry.goal - 1000) / 4000) * 100}%`, "--accent": "#3a8fd9" }}
                  />
                  <small className="waterHint">Recomandat: 35 ml pe kg de greutate (din calculatorul de calorii), mai mult în zilele cu sport sau căldură.</small>
                </label>
              )}
            </div>
          </div>

          <div className="waterCups">
            {Array.from({ length: glasses }, (_, i) => (
              <button
                key={i}
                className={`waterCup ${i < drunkGlasses ? "full" : ""}`}
                onClick={() => change(i < drunkGlasses ? -GLASS : GLASS)}
                title={i < drunkGlasses ? "Scoate un pahar" : "Adaugă un pahar"}
              >
                {i < drunkGlasses ? "💧" : "🥛"}
              </button>
            ))}
          </div>
        </section>

        <section className="calcCard">
          <div className="calMonthHead">
            <button className="calNavBtn" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="Luna anterioară"><ChevronLeft size={18} /></button>
            <h2>{month.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}</h2>
            <button className="calNavBtn" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label="Luna următoare"><ChevronRight size={18} /></button>
          </div>

          <div className="calWeekdays" style={{ marginTop: 14 }}>{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="calDays">
            {days.map((d) => {
              const e = log[d.key];
              const p = e ? Math.min(100, (e.ml / e.goal) * 100) : 0;
              const future = d.key > today;
              return (
                <button
                  key={d.key}
                  className={["calDay waterDay", d.inMonth ? "" : "out", d.key === today ? "today" : "", d.key === day ? "selected" : "", p >= 100 ? "full" : ""].join(" ")}
                  onClick={() => !future && setDay(d.key)}
                  disabled={future}
                  style={{ "--p": `${p}%` }}
                >
                  <span className="calDayNum">{d.day}</span>
                  {e && e.ml > 0 && <span className="calDayKcal">{p >= 100 ? "✓" : `${Math.round(p)}%`}</span>}
                </button>
              );
            })}
          </div>

          <div className="calStats">
            <div><strong><Trophy size={18} color="#f5a524" /> {streak}</strong><small>{streak === 1 ? "zi la rând" : "zile la rând"} cu ținta atinsă</small></div>
            <div><strong>{reached} / {monthDays.length}</strong><small>zile cu ținta atinsă luna aceasta</small></div>
          </div>
        </section>
      </div>
    </div>
  );
}
