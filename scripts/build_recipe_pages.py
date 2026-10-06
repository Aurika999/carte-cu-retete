"""Transformă fiecare pagină de rețetă din PDF-uri într-un fișier de date (text, nu imagine):
src/retete/<Nume-reteta>.js, plus poza mâncării în public/recipes/<Nume-reteta>.jpg.
Aplicația le deschide ca pagini întregi, la adresa /<Nume-reteta> (vezi src/recipeDetails.js).

Rețetele din KEEP (scrise / rescrise de mână) nu sunt suprascrise.

Rulare: python scripts/build_recipe_pages.py            (toate)
        python scripts/build_recipe_pages.py i-2 t-5    (doar câteva, afișate pe ecran)
"""
import io
import json
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf
from PIL import Image

from enhance_page import PDF_DIR, parse_macro

ROOT = Path(__file__).resolve().parent.parent
RECIPES = ROOT / "src" / "recipes.js"
OUT_DIR = ROOT / "src" / "retete"
PHOTO_DIR = ROOT / "public" / "recipes"
KEEP = {"i-1"}
BOOK_SUFFIX = {
    "Rețete tradiționale": "traditionale", "Rețete gata în 10 minute": "rapide",
    "Rețete internaționale": "internationale", "Rețete de post": "post",
}
NUM_STEP = re.compile(r"^\s*(\d{1,2})\s*[.)]\s*")
LABEL = re.compile(r"^(Alergeni|Variante|Variantă|Alternative|Alternativă|Alternativ|Sugestie|Sugestii|Notă|Nota)\b\s*:?\s*", re.I)


def slugify(text):
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"[^A-Za-z0-9]+", "-", text).strip("-")


def clean(text):
    text = text.replace(" ", " ").replace("ş", "ș").replace("ţ", "ț").replace("Ş", "Ș").replace("Ţ", "Ț")
    return re.sub(r"\s+", " ", text).strip()


def sentence_case(text):
    """Titlurile din PDF sunt cu majuscule: „CIORBĂ DE BURTĂ” → „Ciorbă de burtă”."""
    return text[:1].upper() + text[1:].lower() if text.isupper() else text


class Line:
    def __init__(self, bbox, spans):
        self.x0, self.y0, self.x1, self.y1 = bbox
        self.spans = spans
        self.text = clean("".join(s["text"] for s in spans))
        self.bold = bool(spans) and "Bold" in spans[0]["font"]
        self.heading = any("Poppins" in s["font"] and "Bold" in s["font"] and s["size"] >= 9 for s in spans)
        self.bullet = False

    def bold_prefix(self):
        """Textul îngroșat de la începutul rândului (ex. „Fierbe carnea.” sau „Alergeni:”)."""
        out = []
        for s in self.spans:
            if "Bold" not in s["font"]:
                break
            out.append(s["text"])
        return clean("".join(out))


def page_lines(page):
    lines = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            spans = [s for s in l["spans"] if s["text"].strip()]
            if spans:
                lines.append(Line(l["bbox"], spans))
    bullets = [d["rect"] for d in page.get_drawings()
               if d.get("fill") is not None and d["rect"].width < 4 and d["rect"].height < 4 and d["rect"].width > 1]
    for ln in lines:
        ln.bullet = any(ln.y0 - 1 <= (r.y0 + r.y1) / 2 <= ln.y1 + 1 and ln.x0 - 16 <= r.x0 <= ln.x0 + 2 for r in bullets) \
            or ln.text.startswith(("•", "●", "▪", "- ", "– "))
        if ln.bullet:
            ln.text = ln.text.lstrip("•●▪-– ").strip()
    return sorted(lines, key=lambda l: (round(l.y0, 0), l.x0))


def merge_items(lines, start_new):
    """Rânduri → elemente: un element nou începe unde start_new(rând) e adevărat, restul continuă textul."""
    items = []
    for ln in lines:
        if start_new(ln) or not items:
            items.append([ln])
        else:
            items[-1].append(ln)
    return items


def parse_ingredients(lines):
    """Titlurile de grupă (îngroșate sau terminate cu „:”, fără bulină) pot avea mai multe rânduri;
    fiecare bulină începe un ingredient, rândurile fără bulină continuă ingredientul anterior."""
    groups, current, prev_header = [], None, False
    for ln in lines:
        header = not ln.bullet and (ln.bold or ln.text.endswith(":"))
        if header:
            if prev_header and current is not None and not current["items"]:
                current["group"] = clean(current["group"] + " " + ln.text)
            else:
                current = {"group": ln.text, "items": []}
                groups.append(current)
        elif ln.bullet or current is None or not current["items"]:
            if current is None:
                current = {"group": None, "items": []}
                groups.append(current)
            current["items"].append(ln.text)
        else:
            current["items"][-1] = clean(current["items"][-1] + " " + ln.text)
        prev_header = header
    for g in groups:
        if g["group"]:
            g["group"] = g["group"].rstrip(":").strip()
    for g in groups:
        if g["group"]:
            g["group"] = sentence_case(g["group"])
    return [g for g in groups if g["items"] or g["group"]]


def parse_instructions(lines):
    intro, steps = [], []
    started = False

    def is_group(l):
        return l.bold and l.text.endswith(":") and not NUM_STEP.match(l.text) and not l.bullet

    for item in merge_items(lines, lambda l: bool(NUM_STEP.match(l.text)) or l.bullet or is_group(l)):
        first = item[0]
        text = clean(" ".join(l.text for l in item))
        if is_group(first) and len(item) == 1:
            steps.append({"group": sentence_case(text.rstrip(":"))})
            started = True
        elif NUM_STEP.match(first.text) or first.bullet or started:
            body = NUM_STEP.sub("", text)
            lead = NUM_STEP.sub("", first.bold_prefix()) if first.bold_prefix() else ""
            if lead and body.startswith(lead) and len(lead) < len(body):
                steps.append({"title": lead, "text": body[len(lead):].strip()})
            else:
                steps.append({"text": body})
            started = True
        else:
            intro.append(text)
    return clean(" ".join(intro)), steps


def parse_tips(lines):
    tips, notes = [], []
    current = None   # nota curentă (Alergeni / Variante / ...)

    for item in merge_items(lines, lambda l: l.bullet or bool(LABEL.match(l.text))):
        first = item[0]
        text = clean(" ".join(l.text for l in item))
        m = LABEL.match(text)
        if m and not first.bullet:
            label = m.group(1).capitalize()
            rest = text[m.end():].strip()
            current = {"label": label, "text": rest, "items": []}
            notes.append(current)
        elif current is not None and first.bullet:
            current["items"].append(text)
        elif current is not None and not first.bullet:
            current["text"] = clean(current["text"] + " " + text)
        else:
            tips.append(text)
    for n in notes:
        if not n["items"]:
            del n["items"]
        if not n["text"]:
            del n["text"]
    return tips, notes


def parse_page(doc, page_index):
    page = doc[page_index]
    info = max(page.get_image_info(xrefs=True), key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
    photo_bottom = info["bbox"][3]
    lines = page_lines(page)

    def head(prefix):
        return next((l for l in lines if l.heading and l.text.upper().startswith(prefix)), None)

    ing, ins, mac, sfa = head("INGREDIENTE"), head("INSTRUC"), head("MACRO"), head("SFATURI")
    right_x = min(l.x0 for l in (ins, sfa) if l) - 10
    top = min(ing.y0, ins.y0) - 2

    # bara de sus (peste poză): porții / minute
    bar = " ".join(l.text for l in lines if l.y1 < 40)
    minutes = re.search(r"(\d+(?:\s*[-–]\s*\d+)?)\s*min", bar)
    servings_text = " ".join(l.text for l in lines if l.heading and "PORȚ" in l.text.upper())
    servings = re.search(r"(\d+)\s*PORȚ", servings_text.upper()) or re.search(r"(\d+)\s*porț", bar)

    title_lines = [l for l in lines if photo_bottom - 2 < l.y0 and l.y1 < top + 2 and l.heading]
    title = sentence_case(clean(" ".join(l.text for l in title_lines)))

    def region(col, y_from, y_to):
        return [l for l in lines if (l.x0 < right_x) == (col == "left") and y_from < l.y0 < y_to
                and not l.heading and l.y0 < 590]

    mac_y = mac.y0 if mac and mac.x0 < right_x else 10_000
    # secțiunile încep de la titlul lor (titlurile mari sunt excluse din region)
    ingredients = parse_ingredients(region("left", ing.y0, mac_y - 1))
    sfa_y = sfa.y0 if sfa else 10_000
    intro, steps = parse_instructions(region("right", ins.y0, sfa_y - 1))
    tips, notes = parse_tips(region("right", sfa_y, 10_000)) if sfa else ([], [])

    _, weight, groups, _ = parse_macro(page, right_x)
    keys = {"Calorii": "kcal", "Proteine": "protein", "Carbohidrați": "carbs", "Grăsimi": "fat", "Fibre": "fiber"}
    nutrition = {"portion": weight.strip("()") or None, "groups": []}
    for name, values in groups:
        g = {"name": name}
        for label, value in values:
            m = re.search(r"\d+(?:[.,]\d+)?", value)
            if m:
                g[keys[label]] = float(m.group().replace(",", "."))
        nutrition["groups"].append(g)

    return {
        "title": title,
        "servings": int(servings.group(1)) if servings else None,
        "time": f"{minutes.group(1)} minute" if minutes else None,
        "intro": intro,
        "ingredients": ingredients,
        "steps": steps,
        "tips": tips,
        "notes": notes,
        "nutrition": nutrition,
    }, info["xref"]


def js_module(data):
    return ("// Generat din PDF de scripts/build_recipe_pages.py — poate fi editat de mână.\n"
            "export default " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")


def main(only):
    text = RECIPES.read_text(encoding="utf-8")
    recipes = json.loads(text[text.index("["):text.rindex("]") + 1])

    # adresa fiecărei rețete; titlurile care se repetă în mai multe cărți primesc numele cărții
    slugs = {}
    counts = {}
    for r in recipes:
        counts[slugify(r["title"]).lower()] = counts.get(slugify(r["title"]).lower(), 0) + 1
    for r in recipes:
        s = slugify(r["title"])
        slugs[r["id"]] = s if counts[s.lower()] == 1 else f"{s}-{BOOK_SUFFIX[r['book']]}"

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    docs, problems = {}, []
    for r in recipes:
        if only and r["id"] not in only:
            continue
        if r["id"] in KEEP and not only:
            continue
        doc = docs.setdefault(r["pdf"], pymupdf.open(PDF_DIR / r["pdf"]))
        try:
            data, xref = parse_page(doc, r["pdfPage"] - 1)
        except Exception as err:
            problems.append(f"{r['id']} {r['title']}: {err}")
            continue
        slug = slugs[r["id"]]
        data = {"id": r["id"], "slug": slug, "book": r["book"], "section": r["section"],
                **data, "title": r["title"], "photo": f"/recipes/{slug}.jpg"}
        if only:
            print(json.dumps(data, ensure_ascii=False, indent=1))
            continue
        img = Image.open(io.BytesIO(doc.extract_image(xref)["image"])).convert("RGB")
        img.thumbnail((900, 900))
        img.save(PHOTO_DIR / f"{slug}.jpg", quality=85)
        (OUT_DIR / f"{slug}.js").write_text(js_module(data), encoding="utf-8")
        if not data["steps"] or not data["ingredients"] or not data["nutrition"]["groups"]:
            problems.append(f"{r['id']} {r['title']}: pași {len(data['steps'])}, "
                            f"ingrediente {sum(len(g['items']) for g in data['ingredients'])}")
    if not only:
        # adresa fiecărei rețete trece și în src/recipes.js (meniul o folosește fără să încarce textul rețetei)
        for r in recipes:
            r["slug"] = slugs[r["id"]]
        RECIPES.write_text("export const recipes = " + json.dumps(recipes, ensure_ascii=False, indent=2) + ";\n",
                           encoding="utf-8")
    print(f"gata; probleme: {len(problems)}")
    for p in problems:
        print("  ", p)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
