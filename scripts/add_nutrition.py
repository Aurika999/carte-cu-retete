"""Adaugă în src/recipes.js valorile nutriționale per porție (kcal, proteine,
carbohidrați, grăsimi, fibre), citite din secțiunea MACRO/PORȚIE a fiecărei pagini.
Le folosește meniul recomandat din calculatorul de calorii.

Rulare: python scripts/add_nutrition.py
"""
import json
import re
from pathlib import Path

import pymupdf

from enhance_page import PDF_DIR, parse_macro

ROOT = Path(__file__).resolve().parent.parent
RECIPES = ROOT / "src" / "recipes.js"
KEYS = {"Calorii": "kcal", "Proteine": "protein", "Carbohidrați": "carbs", "Grăsimi": "fat", "Fibre": "fiber"}

text = RECIPES.read_text(encoding="utf-8")
recipes = json.loads(text[text.index("["):text.rindex("]") + 1])

docs, missing = {}, []
for r in recipes:
    doc = docs.setdefault(r["pdf"], pymupdf.open(PDF_DIR / r["pdf"]))
    page = doc[r["pdfPage"] - 1]
    spans = [s for b in page.get_text("dict")["blocks"] for l in b.get("lines", []) for s in l["spans"]
             if s["text"].strip()]
    right_x = min(s["bbox"][0] for s in spans if s["text"].strip().startswith(("INSTRUC", "SFATURI"))) - 10
    _, _, groups, _ = parse_macro(page, right_x)
    values = dict(groups[0][1]) if groups else {}   # la rețetele cu variante, prima variantă
    nutrition = {}
    for label, key in KEYS.items():
        m = re.search(r"\d+(?:[.,]\d+)?", values.get(label, ""))
        if m:
            nutrition[key] = round(float(m.group().replace(",", ".")), 1)
    if "kcal" not in nutrition:
        missing.append(r["id"])
    r["nutrition"] = nutrition

RECIPES.write_text("export const recipes = " + json.dumps(recipes, ensure_ascii=False, indent=2) + ";\n",
                   encoding="utf-8")
print(f"{len(recipes)} rețete, fără calorii: {missing or 'niciuna'}")
