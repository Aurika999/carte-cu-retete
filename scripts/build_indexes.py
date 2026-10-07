"""Din fișierele src/retete/*.js:
- adaugă în src/recipes.js timpul de preparare („minutes”), folosit de filtrul „Gata în 15 minute”;
- scrie src/ingredientIndex.js: ingredientele fiecărei rețete (text simplificat, fără diacritice),
  folosit de „Ce ai în frigider?” (se încarcă abia când e folosit).

Rulare: python scripts/build_indexes.py   (după build_recipe_pages.py)
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RECIPES = ROOT / "src" / "recipes.js"


def plain(text):
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


details = {}
for f in (ROOT / "src" / "retete").glob("*.js"):
    t = f.read_text(encoding="utf-8")
    d = json.loads(t[t.index("{"):t.rindex("}") + 1])
    details[d["id"]] = d

t = RECIPES.read_text(encoding="utf-8")
recipes = json.loads(t[t.index("["):t.rindex("]") + 1])
index = {}
for r in recipes:
    d = details.get(r["id"])
    if not d:
        continue
    m = re.search(r"\d+", d.get("time") or "")
    if m:
        r["minutes"] = int(m.group())
    else:
        r.pop("minutes", None)
    items = [it for g in d.get("ingredients", []) for it in g.get("items", [])]
    index[r["id"]] = {"n": len(items), "t": plain(" | ".join(items))}

RECIPES.write_text("export const recipes = " + json.dumps(recipes, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
(ROOT / "src" / "ingredientIndex.js").write_text(
    "// Generat de scripts/build_indexes.py: { id: { n: număr de ingrediente, t: ingredientele, text simplificat } }\n"
    "export default " + json.dumps(index, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
print(f"{len(index)} rețete; cu timp: {sum(1 for r in recipes if 'minutes' in r)}")
