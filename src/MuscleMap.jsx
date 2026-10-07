import React from "react";

// Harta mușchilor: corpul din față și din spate (SVG desenat în aplicație), cu grupele
// lucrate colorate în roșu. muscles: chei din MUSCLES (ex. ["quads", "glutes"]).
export const MUSCLES = {
  shoulders: "Umeri", chest: "Piept", biceps: "Bicepși", triceps: "Tricepși", forearms: "Antebrațe",
  abs: "Abdomen", obliques: "Oblici", traps: "Trapez", lats: "Spate (dorsali)", lowerback: "Zona lombară",
  glutes: "Fesieri", quads: "Cvadricepși", hamstrings: "Femurali", calves: "Gambe",
};

const ON = "#e8453c";
const OFF = "#dcd5c8";
const SKIN = "#efe8dc";

function Part({ id, on, children }) {
  return <g fill={on.has(id) ? ON : OFF} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round">{children}</g>;
}

// silueta comună (cap, gât, mâini, articulații, picioare)
function Base() {
  return (
    <g fill={SKIN}>
      <circle cx="50" cy="15" r="10.5" />
      <rect x="45" y="24" width="10" height="9" rx="3" />
      <path d="M33 34 Q50 29 67 34 L70 98 Q50 106 30 98 Z" />
      <path d="M32 96 Q50 104 68 96 L66 112 Q50 118 34 112 Z" />
      <circle cx="19" cy="102" r="4.5" />
      <circle cx="81" cy="102" r="4.5" />
      <circle cx="42" cy="152" r="5" />
      <circle cx="58" cy="152" r="5" />
      <ellipse cx="41" cy="195" rx="6.5" ry="3.2" />
      <ellipse cx="59" cy="195" rx="6.5" ry="3.2" />
    </g>
  );
}

function Front({ on }) {
  return (
    <svg viewBox="0 0 100 200" className="mmView" aria-hidden="true">
      <Base />
      <Part id="shoulders" on={on}><ellipse cx="30.5" cy="41" rx="8" ry="7" /><ellipse cx="69.5" cy="41" rx="8" ry="7" /></Part>
      <Part id="chest" on={on}><path d="M50 40 L50 58 Q41 61 35 55 Q34 44 40 41 Z" /><path d="M50 40 L50 58 Q59 61 65 55 Q66 44 60 41 Z" /></Part>
      <Part id="biceps" on={on}><ellipse cx="25" cy="62" rx="5" ry="10.5" /><ellipse cx="75" cy="62" rx="5" ry="10.5" /></Part>
      <Part id="forearms" on={on}><ellipse cx="21" cy="85" rx="4.5" ry="12" /><ellipse cx="79" cy="85" rx="4.5" ry="12" /></Part>
      <Part id="obliques" on={on}><path d="M36 60 Q40 62 42 66 L42 92 Q37 90 35 86 Z" /><path d="M64 60 Q60 62 58 66 L58 92 Q63 90 65 86 Z" /></Part>
      <Part id="abs" on={on}>
        <rect x="43.5" y="61" width="6" height="8" rx="2" /><rect x="50.5" y="61" width="6" height="8" rx="2" />
        <rect x="43.5" y="70" width="6" height="8" rx="2" /><rect x="50.5" y="70" width="6" height="8" rx="2" />
        <rect x="43.5" y="79" width="6" height="8" rx="2" /><rect x="50.5" y="79" width="6" height="8" rx="2" />
        <path d="M44 88 L56 88 L53 98 L47 98 Z" />
      </Part>
      <Part id="quads" on={on}><path d="M35 112 Q42 108 48 113 L47 146 Q42 149 37 145 Q33 128 35 112 Z" /><path d="M65 112 Q58 108 52 113 L53 146 Q58 149 63 145 Q67 128 65 112 Z" /></Part>
      <Part id="calves" on={on}><ellipse cx="41.5" cy="172" rx="5" ry="16" /><ellipse cx="58.5" cy="172" rx="5" ry="16" /></Part>
    </svg>
  );
}

function Back({ on }) {
  return (
    <svg viewBox="0 0 100 200" className="mmView" aria-hidden="true">
      <Base />
      <Part id="traps" on={on}><path d="M50 27 L62 35 L57 50 L50 54 L43 50 L38 35 Z" /></Part>
      <Part id="shoulders" on={on}><ellipse cx="30.5" cy="41" rx="8" ry="7" /><ellipse cx="69.5" cy="41" rx="8" ry="7" /></Part>
      <Part id="lats" on={on}><path d="M43 52 L49 56 L49 72 Q41 74 36 66 Q34 54 38 46 Z" /><path d="M57 52 L51 56 L51 72 Q59 74 64 66 Q66 54 62 46 Z" /></Part>
      <Part id="triceps" on={on}><ellipse cx="25" cy="62" rx="5" ry="10.5" /><ellipse cx="75" cy="62" rx="5" ry="10.5" /></Part>
      <Part id="forearms" on={on}><ellipse cx="21" cy="85" rx="4.5" ry="12" /><ellipse cx="79" cy="85" rx="4.5" ry="12" /></Part>
      <Part id="lowerback" on={on}><path d="M41 76 L59 76 L58 94 Q50 97 42 94 Z" /></Part>
      <Part id="glutes" on={on}><ellipse cx="43" cy="104" rx="8.5" ry="8.5" /><ellipse cx="57" cy="104" rx="8.5" ry="8.5" /></Part>
      <Part id="hamstrings" on={on}><path d="M35 114 Q42 111 48 115 L47 146 Q42 149 37 145 Q34 130 35 114 Z" /><path d="M65 114 Q58 111 52 115 L53 146 Q58 149 63 145 Q66 130 65 114 Z" /></Part>
      <Part id="calves" on={on}><ellipse cx="41.5" cy="170" rx="6" ry="15" /><ellipse cx="58.5" cy="170" rx="6" ry="15" /></Part>
    </svg>
  );
}

export default function MuscleMap({ muscles = [], size = "md", labels = false }) {
  const on = new Set(muscles);
  return (
    <div className={`muscleMap mm-${size}`}>
      <div className="mmViews">
        <Front on={on} />
        <Back on={on} />
      </div>
      {labels && muscles.length > 0 && (
        <div className="mmLabels">{muscles.map((m) => <span key={m}>{MUSCLES[m]}</span>)}</div>
      )}
    </div>
  );
}
