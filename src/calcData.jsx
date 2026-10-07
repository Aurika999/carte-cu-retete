// Datele pentru calculatorul de calorii (sex, vârstă, greutate, înălțime, activitate, obiectiv),
// disponibile în toată aplicația prin useCalcData(): { form, setForm, results, hasData }.
// Se păstrează mereu în browser și, cu cont, în users/<uid>/data/profile (câmpul „calc”),
// ca să fie aceleași pe orice dispozitiv. Se editează din „Contul meu”.
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";
import { ACTIVITY, DEFAULTS, STORAGE_KEY, calcTargets, savedCalcForm } from "./calories";

const CalcContext = createContext(null);
export const useCalcData = () => useContext(CalcContext);

const writeLocal = (form) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    /* fără stocare */
  }
};

// toate rezultatele afișate de calculator, din datele introduse
export function computeResults(form) {
  const { weight, height } = form;
  const { bmr, tdee, target, activity, goal } = calcTargets(form);
  // proteine după greutate, grăsimi 25% din calorii, restul carbohidrați
  const proteinG = weight * (goal.id.startsWith("slabire") ? 2 : goal.id === "masa" ? 1.8 : 1.6);
  const fatG = (target * 0.25) / 9;
  const carbsG = Math.max(0, (target - proteinG * 4 - fatG * 9) / 4);
  return {
    bmr, tdee, target, goal, activity, proteinG, fatG, carbsG,
    bmi: weight / (height / 100) ** 2,
    water: (weight * 0.035).toFixed(1),
    perLevel: ACTIVITY.map((a) => ({ ...a, kcal: bmr * a.factor })),
  };
}

export function CalcDataProvider({ children }) {
  const { user, ready } = useAuth();
  const local = savedCalcForm();
  const [form, setFormState] = useState(local ?? DEFAULTS);
  const [hasData, setHasData] = useState(Boolean(local));
  const saveTimer = useRef(null);
  const ref = user && db ? doc(db, "users", user.uid, "data", "profile") : null;

  // la autentificare: datele din cont au prioritate; dacă nu există, se urcă cele din browser
  useEffect(() => {
    if (!ready || !ref) return;
    let alive = true;
    getDoc(ref)
      .then((snap) => {
        const cloud = snap.data()?.calc;
        if (!alive) return;
        if (cloud) {
          const next = { ...DEFAULTS, ...cloud };
          setFormState(next);
          setHasData(true);
          writeLocal(next);
        } else if (savedCalcForm()) {
          setDoc(ref, { calc: savedCalcForm() }, { merge: true }).catch(() => {});
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [user, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function setForm(update) {
    setFormState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      writeLocal(next);
      // în cont se salvează la o jumătate de secundă după ultima modificare (glisoarele trimit multe valori)
      if (ref) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setDoc(ref, { calc: next }, { merge: true }).catch(() => {}), 500);
      }
      return next;
    });
    setHasData(true);
  }

  const results = useMemo(() => computeResults(form), [form]);
  return <CalcContext.Provider value={{ form, setForm, results, hasData }}>{children}</CalcContext.Provider>;
}
