import React from "react";
import Model from "react-body-highlighter";

// Harta mușchilor: corpul din față și din spate, cu siluetă anatomică (react-body-highlighter,
// licență MIT) și grupele lucrate colorate în roșu. muscles: chei din MUSCLES (ex. ["quads", "glutes"]).
export const MUSCLES = {
  shoulders: "Umeri", chest: "Piept", biceps: "Bicepși", triceps: "Tricepși", forearms: "Antebrațe",
  abs: "Abdomen", obliques: "Oblici", traps: "Trapez", lats: "Spate (dorsali)", lowerback: "Zona lombară",
  glutes: "Fesieri", quads: "Cvadricepși", hamstrings: "Femurali", calves: "Gambe",
};

// numele noastre → zonele din model
const TO_MODEL = {
  shoulders: ["front-deltoids", "back-deltoids"], chest: ["chest"], biceps: ["biceps"], triceps: ["triceps"],
  forearms: ["forearm"], abs: ["abs"], obliques: ["obliques"], traps: ["trapezius"], lats: ["upper-back"],
  lowerback: ["lower-back"], glutes: ["gluteal"], quads: ["quadriceps", "adductor", "abductors"],
  hamstrings: ["hamstring"], calves: ["calves", "left-soleus", "right-soleus"],
};

const BODY = "#d8d2c8";
const ON = ["#e8453c"];

export default function MuscleMap({ muscles = [], size = "md", labels = false }) {
  const data = [{ name: "exercițiu", muscles: muscles.flatMap((m) => TO_MODEL[m] ?? []) }];
  return (
    <div className={`muscleMap mm-${size}`}>
      <div className="mmViews">
        <Model type="anterior" data={data} bodyColor={BODY} highlightedColors={ON} style={{ height: "100%", width: "auto" }} svgStyle={{ height: "100%", width: "auto" }} />
        <Model type="posterior" data={data} bodyColor={BODY} highlightedColors={ON} style={{ height: "100%", width: "auto" }} svgStyle={{ height: "100%", width: "auto" }} />
      </div>
      {labels && muscles.length > 0 && (
        <div className="mmLabels">{muscles.map((m) => <span key={m}>{MUSCLES[m]}</span>)}</div>
      )}
    </div>
  );
}
