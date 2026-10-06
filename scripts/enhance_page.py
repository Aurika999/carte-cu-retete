"""Reașază o pagină de rețetă: poza mai mică în colțul din stânga sus,
instrucțiunile în dreapta, de sus. Bara cu porții / minute / calorii /
stele și spațiul gol de jos sunt scoase.

Pagina e recompusă din bucăți decupate din PDF (coordonate în puncte PDF).

Rulare (o rulează și extract_pages.py la final):
    python scripts/enhance_page.py
"""
import io
import re
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
FONTS = Path(__file__).resolve().parent / "fonts"   # Poppins, de la Google Fonts (OFL)
TEXT = (0, 0, 0)

DPI = 300            # compunem la rezoluție mare, apoi micșorăm
OUT_DPI = 150        # la fel ca extract_pages.py
S = DPI / 72         # pixeli per punct PDF

PAGES = [
    {
        "pdf": "RETETE-INTERNATIONALE.pdf",
        "page": 26,
        "out": "pages/internationale/page-26.jpg",
        "photo_xref": 1232,
        "photo_focus": 0.53,                 # centrul pe orizontală al decupajului
        "left": [                            # coloana din stânga, sub poză
            (10, 224, 158, 256),             # titlu
            (10, 256, 158, 416),             # ingrediente
        ],                                   # valorile nutriționale merg jos, pe toată lățimea
        "right": [                           # coloana din dreapta, de sus
            "instructions",                  # rescrise mai jos, mai detaliat
            (158, 428, 374, 526),            # sfaturi practice
        ],
        "title": "SALATĂ CU PIEPT DE PUI",
        "instructions_title": "MOD DE PREPARARE",
        "intro": (
            "O reinterpretare ușoară și echilibrată a celebrei salate tradiționale, "
            "cu maioneză light din iaurt grecesc. Gust autentic, dar mult mai ușoară "
            "și potrivită pentru un stil de viață sănătos."
        ),
        "steps": [
            ("Fierbe carnea.",
             "Pune pieptul de pui într-o oală cu apă rece și puțină sare. Când începe "
             "să fiarbă, dă focul mai mic și lasă-l 20–25 de minute, până nu mai este "
             "roz în interior. Scoate-l și lasă-l să se răcească."),
            ("Fierbe legumele.",
             "Fierbe cartofii în coajă și morcovii întregi, în apă cu sare, 20–25 de "
             "minute, până intră ușor furculița în ei. Mazărea are nevoie doar de "
             "3–5 minute. Scurge totul și lasă la răcit complet."),
            ("Taie ingredientele.",
             "Curăță cartofii și morcovii, apoi taie-i cubulețe mici, cam cât un bob "
             "de mazăre. Taie la fel pieptul de pui și castraveții murați. Stoarce "
             "ușor castraveții de zeamă, ca salata să nu se înmoaie."),
            ("Pregătește maioneza light.",
             "Într-un bol, amestecă iaurtul grecesc cu muștarul și zeama de lămâie "
             "până obții o cremă fină. Gustă și potrivește de sare și piper."),
            ("Amestecă salata.",
             "Pune într-un vas mare carnea, legumele și castraveții. Adaugă maioneza "
             "treptat și amestecă ușor cu o spatulă, ca să nu strivești cartofii. "
             "Gustă și mai adaugă sare sau piper, dacă e nevoie."),
            ("Lasă la rece și servește.",
             "Acoperă vasul și ține salata la frigider cel puțin 1 oră, ca gusturile "
             "să se îmbine. Înainte de servire, o poți așeza pe un platou și decora "
             "cu ou fiert și pătrunjel (opțional)."),
        ],
    },
]

MARGIN = 14
COL_SPLIT = 158
GAP = 10
PHOTO = (MARGIN, MARGIN, 152, 136)           # poza în colțul din stânga sus
TITLE_RULE_END = 152                         # linia de sub titlu, doar pe coloana stângă


def px(v):
    return round(v * S)


def box_px(box):
    return tuple(px(v) for v in box)


def photo(doc, cfg):
    raw = Image.open(io.BytesIO(doc.extract_image(cfg["photo_xref"])["image"])).convert("RGB")
    w, h = box_px(PHOTO)[2] - px(PHOTO[0]), px(PHOTO[3]) - px(PHOTO[1])
    pic = ImageOps.fit(raw, (w, h), Image.LANCZOS, centering=(cfg["photo_focus"], 0.5))
    mask = Image.new("L", pic.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), px(7), fill=255)
    return pic, mask


def wrap(runs, width):
    """Împarte în rânduri o listă de (text, font), cuvânt cu cuvânt."""
    lines, line, line_w = [], [], 0
    for text, font in runs:
        for word in text.split():
            w = font.getlength(word + " ")
            if line and line_w + font.getlength(word) > width:
                lines.append(line)
                line, line_w = [], 0
            line.append((word + " ", font))
            line_w += w
    if line:
        lines.append(line)
    return lines


def heading(text, size, width, x, baseline, line_h, rule_gap=None):
    """Titlu în Poppins Bold (fontul titlurilor din carte), cu linie opțională dedesubt.
    Toate măsurile sunt în puncte PDF; x și baseline sunt relative la bucată."""
    font = ImageFont.truetype(str(FONTS / "Poppins-Bold.ttf"), px(size))
    lines = [" ".join(w.strip() for w, _ in line) for line in wrap([(text, font)], px(width - x))]
    height = baseline + (len(lines) - 1) * line_h + (rule_gap + 3 if rule_gap else 4.5)
    img = Image.new("RGB", (px(width), px(height)), "white")
    draw = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        draw.text((px(x), px(baseline + i * line_h)), line, font=font, fill=TEXT, anchor="ls")
    if rule_gap:
        y = px(baseline + (len(lines) - 1) * line_h + rule_gap)
        draw.line((px(x), y, img.width, y), fill=TEXT, width=px(0.8))
    return img


NUTRIENTS = ["Calorii", "Proteine", "Carbohidrați", "Grăsimi", "Fibre"]
NUTRIENT_RE = re.compile(r"^(" + "|".join(NUTRIENTS) + r")\s*:?\s*(.+)$", re.I)


def parse_macro(page, right_x):
    """Citește secțiunea MACRO/PORȚIE din coloana stângă.
    Întoarce (y-ul de sus al secțiunii, gramajul, grupuri de valori, mărimea titlului)."""
    lines = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if sp:
                lines.append((l["bbox"], sp))
    head = next(s for _, sp in lines for s in sp if s["text"].strip().upper().startswith("MACRO"))
    region = sorted(((bb, sp) for bb, sp in lines if bb[1] >= head["bbox"][1] - 1 and bb[0] < right_x),
                    key=lambda x: (round(x[0][1]), x[0][0]))
    is_head = lambda sp: any("Bold" in s["font"] and s["size"] >= 9 for s in sp)

    weight = " ".join(s["text"] for bb, sp in region if is_head(sp) for s in sp)
    weight = re.sub(r"MACRO\s*/\s*PORȚIE", "", weight, flags=re.I).strip().lower()
    if weight and not weight.startswith("("):
        weight = f"({weight})"

    groups = [[None, {}]]
    for bb, sp in region:
        if is_head(sp):
            continue
        text = " ".join(" ".join(s["text"] for s in sp).split()).lstrip("•· ")
        m = NUTRIENT_RE.match(text)
        if m:
            label = next(n for n in NUTRIENTS if n.lower() == m.group(1).lower())
            groups[-1][1][label] = m.group(2)
        else:  # de ex. „v1 (4 jumatati)”: o variantă separată, pe rândul ei
            groups.append([text, {}])
    groups = [(name, [(n, vals[n]) for n in NUTRIENTS if n in vals]) for name, vals in groups if vals]
    return head["bbox"][1], weight, groups, head["size"]


def nutrition(weight, groups, size, width):
    """„Valori nutriționale per porție” + valorile pe un rând (pe mai multe doar dacă nu încap)."""
    title = heading(f"Valori nutriționale per porție {weight}".strip(), size, width, 4.1, size * 1.31, size * 1.12)
    regular = ImageFont.truetype(str(FONTS / "Poppins-Regular.ttf"), px(7))
    bold = ImageFont.truetype(str(FONTS / "Poppins-SemiBold.ttf"), px(7))
    sep = "  •  "

    rows = []
    for name, values in groups:
        pieces = [[(f"{name}:  ", bold)]] if name else []
        for i, (label, value) in enumerate(values):
            pieces.append([(f"{label}: ", bold), (value + (sep if i < len(values) - 1 else ""), regular)])
        rows += wrap_pieces(pieces, px(width - 8))

    line_h = px(11)
    img = Image.new("RGB", (px(width), title.height + px(2) + len(rows) * line_h), "white")
    img.paste(title, (0, 0))
    draw = ImageDraw.Draw(img)
    y = title.height + px(2)
    for row in rows:
        x = px(4.1)
        for text, font in row:
            draw.text((x, y), text, font=font, fill=TEXT)
            x += round(font.getlength(text))
        y += line_h
    return img


def wrap_pieces(pieces, width):
    """Pune bucăți indivizibile (ex. „Calorii: 157.3 kcal  •  ”) pe rânduri de lățime dată."""
    lines, line, line_w = [], [], 0
    for piece in pieces:
        w = sum(f.getlength(t) for t, f in piece)
        if line and line_w + w > width:
            lines.append(line)
            line, line_w = [], 0
        line += piece
        line_w += w
    if line:
        lines.append(line)
    return lines


def instructions(src, cfg):
    """Titlul secțiunii + textul instrucțiunilor rescris, ca o singură bucată."""
    regular = ImageFont.truetype(str(FONTS / "Poppins-Regular.ttf"), px(6.4))
    bold = ImageFont.truetype(str(FONTS / "Poppins-SemiBold.ttf"), px(6.4))
    col_w = px(374 - COL_SPLIT)
    # la fel ca originalul: 13 pt, la 4.7 pt de margine, linia de bază la 17 pt
    title = heading(cfg["instructions_title"], 13, col_w / S, 4.7, 17, 15)
    line_h, num_x, right_pad = px(10.6), px(6), px(8)
    indent = num_x + round(bold.getlength("8. "))

    blocks = [(0, None, wrap([(cfg["intro"], regular)], col_w - px(6.6) - right_pad))]
    for i, (lead, text) in enumerate(cfg["steps"], 1):
        blocks.append((i, lead, wrap([(lead, bold), (text, regular)], col_w - indent - right_pad)))

    height = title.height + px(2) + sum(len(b[2]) * line_h + px(3) for b in blocks)
    img = Image.new("RGB", (col_w, height), "white")
    img.paste(title, (0, 0))
    draw = ImageDraw.Draw(img)

    y = title.height + px(2)
    for number, lead, lines in blocks:
        x0 = px(6.6) if number == 0 else indent
        if number:
            draw.text((num_x, y), f"{number}.", font=bold, fill=TEXT)
        for line in lines:
            x = x0
            for word, font in line:
                draw.text((x, y), word, font=font, fill=TEXT)
                x += round(font.getlength(word))
            y += line_h
        y += px(3)
    return img


def enhance(cfg):
    doc = pymupdf.open(PUBLIC / cfg["pdf"])
    page = doc[cfg["page"] - 1]
    pix = page.get_pixmap(dpi=DPI)
    src = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    out = Image.new("RGB", src.size, "white")

    pic, mask = photo(doc, cfg)
    out.paste(pic, box_px(PHOTO)[:2], mask)

    # coloana stângă: titlul (rescris, cu linia până la marginea coloanei), ingredientele, macro
    y = PHOTO[3] + GAP
    for i, box in enumerate(cfg["left"]):
        if i == 0:
            # ca originalul: 17 pt, linia de bază la 22.3 pt, linia la 6.2 pt sub ea
            piece = heading(cfg["title"], 17, TITLE_RULE_END - box[0], 4.1, 22.3, 19, rule_gap=6.2)
        else:
            piece = src.crop(box_px(box))
        out.paste(piece, (px(box[0]), px(y)))
        y += piece.height / S + GAP
    bottom = y

    # coloana dreaptă: instrucțiunile încep sus, lângă poză
    y = MARGIN - 4
    for box in cfg["right"]:
        if box == "instructions":
            piece = instructions(src, cfg)
            out.paste(piece, (px(COL_SPLIT), px(y)))
            y += piece.height / S + GAP
        else:
            out.paste(src.crop(box_px(box)), (px(box[0]), px(y)))
            y += box[3] - box[1] + GAP
    bottom = max(bottom, y)

    # valorile nutriționale, jos pe toată lățimea
    _, weight, groups, size = parse_macro(page, COL_SPLIT)
    piece = nutrition(weight, groups, size, 384 - 2 * 10)
    out.paste(piece, (px(10), px(bottom)))
    bottom += piece.height / S + GAP

    # pagina se termină după conținut: fără spațiul gol și săgeata de jos
    out = out.crop((0, 0, out.width, px(bottom - GAP + MARGIN)))

    scale = OUT_DPI / DPI
    out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS).save(
        PUBLIC / cfg["out"], quality=90
    )
    print("reașezată:", cfg["out"])


if __name__ == "__main__":
    for cfg in PAGES:
        enhance(cfg)
