"""Extrage paginile rețetelor din PDF-uri ca imagini, conform câmpurilor
pdf / pdfPage / image din src/recipes.js.

Fiecare pagină e reașezată automat (vezi layout.py): poza în stânga sus,
„MOD DE PREPARARE” în loc de „INSTRUCȚIUNI”, fără bara cu porții / minute /
calorii / stele și fără săgeata de jos. Paginile din enhance_page.PAGES
(cu text rescris) sunt refăcute la final.

Rulare: python scripts/extract_pages.py
"""
import re
from pathlib import Path

import pymupdf

import enhance_page
import layout

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
RECIPES = ROOT / "src" / "recipes.js"

entries = re.findall(
    r'"pdf":\s*"([^"]+)",\s*"pdfPage":\s*(\d+),\s*"image":\s*"([^"]+)"',
    RECIPES.read_text(encoding="utf-8"),
)

docs = {}
failed = []
for pdf_name, page, image in entries:
    # fiecare PDF e redeschis curat pentru fiecare pagină, fiindcă layout modifică pagina în memorie
    doc = pymupdf.open(enhance_page.PDF_DIR / pdf_name)
    docs[pdf_name] = True
    out = PUBLIC / image.lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        layout.relayout(doc, int(page) - 1).save(out, quality=90)
    except Exception as err:  # pagina rămâne așa cum e în PDF
        failed.append(f"{pdf_name} p.{page}: {err}")
        doc[int(page) - 1].get_pixmap(dpi=150).save(out, jpg_quality=85)

print(f"{len(entries)} pagini din {len(docs)} PDF-uri, {len(failed)} lăsate neschimbate")
for f in failed:
    print("  ", f)

# reaplică paginile cu text rescris, ca să nu fie suprascrise
for cfg in enhance_page.PAGES:
    enhance_page.enhance(cfg)
