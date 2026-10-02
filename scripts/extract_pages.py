"""Extrage paginile rețetelor din PDF-uri ca imagini, conform câmpurilor
pdf / pdfPage / image din src/recipes.js.

Rulare: python scripts/extract_pages.py
"""
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
RECIPES = ROOT / "src" / "recipes.js"

entries = re.findall(
    r'"pdf":\s*"([^"]+)",\s*"pdfPage":\s*(\d+),\s*"image":\s*"([^"]+)"',
    RECIPES.read_text(encoding="utf-8"),
)

docs = {}
for pdf_name, page, image in entries:
    doc = docs.setdefault(pdf_name, pymupdf.open(PUBLIC / pdf_name))
    out = PUBLIC / image.lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    doc[int(page) - 1].get_pixmap(dpi=150).save(out, jpg_quality=85)

print(f"{len(entries)} pagini extrase din {len(docs)} PDF-uri")
