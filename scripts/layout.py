"""Reașază automat orice pagină de rețetă din cărți (toate au același șablon):

- poza mai mică, în colțul din stânga sus (fără bara cu porții / minute /
  calorii / stele și fără „* SUGESTIE DE PREZENTARE”, care stau peste ea);
- sub poză: titlul și coloana din stânga (ingrediente, macro);
- coloana din dreapta urcă sus, lângă poză, iar „INSTRUCȚIUNI” devine
  „MOD DE PREPARARE”;
- săgeata de întoarcere și spațiul gol de jos sunt scoase.

Fiecare rând de text / desen e mutat cu tot cu coloana lui, decupat din
pagina randată, deci textul original rămâne neatins.
"""
import io

import pymupdf
from PIL import Image, ImageDraw, ImageFont, ImageOps

from enhance_page import FONTS, TEXT, heading, nutrition, parse_macro

DPI = 300
OUT_DPI = 150
S = DPI / 72

MARGIN = 14
GAP = 10
PHOTO_W, PHOTO_H = 138, 122
TITLE_W = 142            # titlul + linia lui, de la x=10 până la x=152
PAD = 0.8                # margine în jurul fiecărui rând decupat


def px(v):
    return round(v * S)


def _photo(doc, page):
    info = max(page.get_image_info(xrefs=True),
               key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
    raw = Image.open(io.BytesIO(doc.extract_image(info["xref"])["image"]))
    if raw.mode == "CMYK":
        raw = ImageOps.invert(raw.convert("RGB")) if "Adobe" in raw.info.get("adobe", "") else raw.convert("RGB")
    raw = raw.convert("RGB")

    # păstrează doar partea din poză care se vede pe pagină
    x0, y0, x1, y1 = info["bbox"]
    W, H = page.rect.width, page.rect.height
    fx = lambda v: (min(max(v, 0), W) - x0) / (x1 - x0) * raw.width
    fy = lambda v: (min(max(v, 0), H) - y0) / (y1 - y0) * raw.height
    raw = raw.crop((round(fx(x0)), round(fy(y0)), round(fx(x1)), round(fy(y1))))

    pic = ImageOps.fit(raw, (px(PHOTO_W), px(PHOTO_H)), Image.LANCZOS)
    mask = Image.new("L", pic.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *pic.size), px(7), fill=255)
    return pic, mask, y1


def relayout(doc, page_index):
    page = doc[page_index]
    pic, mask, photo_bottom = _photo(doc, page)

    spans = [s for b in page.get_text("dict")["blocks"] for l in b.get("lines", [])
             for s in l["spans"] if s["text"].strip()]
    ins = next(s for s in spans if s["text"].strip().startswith("INSTRUC"))

    # randăm pagina fără cuvântul „INSTRUCȚIUNI” (doar banda din mijloc a lui,
    # ca să nu atingem rândul de dedesubt); în locul lui scriem „MOD DE PREPARARE”
    ix0, iy0, ix1, iy1 = ins["bbox"]
    page.add_redact_annot(pymupdf.Rect(ix0, iy0 + 3, ix1, iy1 - 3), fill=False)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
    pix = page.get_pixmap(dpi=DPI)
    src = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

    # șterge linia lată de sub titlul vechi: poate atinge titlurile de dedesubt
    erase = ImageDraw.Draw(src)
    for dr in page.get_drawings():
        r = dr["rect"]
        if r.y0 > photo_bottom and r.width >= 300 and dr.get("color") is not None:
            half = (dr.get("width") or 1) / 2 + 0.3
            erase.rectangle((px(r.x0 - half), px(r.y0 - half), px(r.x1 + half), px(r.y1 + half)), fill="white")
    ing = next(s for s in spans if s["text"].strip().startswith("INGREDIENTE"))
    top = min(ins["bbox"][1], ing["bbox"][1]) - 2
    right_x = min(s["bbox"][0] for s in spans if s["text"].strip().startswith(("INSTRUC", "SFATURI"))) - 10

    title_spans = sorted((s for s in spans if s["bbox"][1] > photo_bottom - 2 and s["bbox"][3] < top + 2
                          and "Bold" in s["font"]), key=lambda s: (round(s["bbox"][1]), s["bbox"][0]))
    title = " ".join(" ".join(s["text"] for s in title_spans).split())
    title_size = max((s["size"] for s in title_spans), default=17)

    # rândurile de sub titlu: text + desene mici (buline etc.), fără săgeata de jos
    elements = [s["bbox"] for s in spans if s["bbox"][1] >= top and s is not ins]
    for dr in page.get_drawings():
        r = dr["rect"]
        is_arrow = r.y0 > 555 and r.x1 < 45 and r.width >= 10
        is_rule = r.height < 1.5 and r.width > 60      # bucăți din linia de sub titlul vechi
        if r.y0 < top or r.width >= 300 or is_arrow or is_rule:
            continue
        elements.append(tuple(r))
    # secțiunea MACRO/PORȚIE din stânga nu se mută: e redesenată jos, pe toată lățimea
    macro_top, weight, groups, macro_size = parse_macro(page, right_x)
    left = [e for e in elements if e[0] < right_x and e[1] < macro_top - 1]
    right = [e for e in elements if e[0] >= right_x]

    out = Image.new("RGB", (src.width, src.height * 2), "white")
    out.paste(pic, (px(MARGIN), px(MARGIN)), mask)

    def move(boxes, dy):
        bottom = 0
        for x0, y0, x1, y1 in boxes:
            box = (px(x0 - PAD), px(y0 - PAD), px(x1 + PAD), px(y1 + PAD))
            out.paste(src.crop(box), (box[0], box[1] + px(dy)))
            bottom = max(bottom, y1 + dy)
        return bottom

    # coloana dreaptă: „MOD DE PREPARARE” sus, lângă poză
    dy_right = 13.5 - ins["bbox"][1]
    right_bottom = move(right + [ins["bbox"]], dy_right)
    font = ImageFont.truetype(str(FONTS / "Poppins-Bold.ttf"), px(ins["size"]))
    ImageDraw.Draw(out).text((px(ix0), px(ins["origin"][1] + dy_right)), "MOD DE PREPARARE",
                             font=font, fill=TEXT, anchor="ls")

    # coloana stângă: titlul sub poză, apoi restul
    y = MARGIN + PHOTO_H + GAP
    t = heading(title, title_size, TITLE_W, 4.1, title_size * 1.31, title_size * 1.12, rule_gap=6.2)
    out.paste(t, (px(10), px(y)))
    y += t.height / S + GAP
    left_bottom = move(left, y + 3 - top)

    # „Valori nutriționale per porție”, jos pe toată lățimea
    y = max(left_bottom, right_bottom) + GAP
    n = nutrition(weight, groups, macro_size, page.rect.width - 2 * 10)
    out.paste(n, (px(10), px(y)))
    y += n.height / S

    out = out.crop((0, 0, out.width, px(y + MARGIN)))
    scale = OUT_DPI / DPI
    return out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
