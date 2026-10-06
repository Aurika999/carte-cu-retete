"""Generează src/fruits.js: fructe crude cu valori nutriționale la 100 g și poze.

Valorile nutriționale: USDA FoodData Central (SR Legacy), fruct crud, 100 g parte comestibilă.
Pozele: Wikimedia Commons (licențe libere), descărcate în public/fruits/, cu autorul și licența
păstrate pentru atribuire.

Rulare: python scripts/fruits.py
"""
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "fruits"
OUT_JS = ROOT / "src" / "fruits.js"
UA = {"User-Agent": "BeFitFromHome-recipes/1.0 (educational app; contact via GitHub Aurika999)"}

# slug, nume, kcal, proteine, carbohidrați, grăsimi, fibre, sursa pozei
# sursa pozei: "wiki:Titlu articol" (poza principală a articolului de Wikipedia)
#              sau "file:Nume fișier" (un fișier anume de pe Commons)
FRUITS = [
    ("mar", "Măr", 52, 0.3, 13.8, 0.2, 2.4, "wiki:Apple"),
    ("para", "Pară", 57, 0.4, 15.2, 0.1, 3.1, "wiki:Pear"),
    ("banana", "Banană", 89, 1.1, 22.8, 0.3, 2.6, "wiki:Banana"),
    ("portocala", "Portocală", 47, 0.9, 11.8, 0.1, 2.4, "wiki:Orange (fruit)"),
    ("mandarina", "Mandarină", 53, 0.8, 13.3, 0.3, 1.8, "file:Mandarins - whole and halved.jpg"),
    ("grapefruit", "Grapefruit", 42, 0.8, 10.7, 0.1, 1.6, "wiki:Grapefruit"),
    ("lamaie", "Lămâie", 29, 1.1, 9.3, 0.3, 2.8, "file:Lemon - whole and split.jpg"),
    ("lime", "Lime", 30, 0.7, 10.5, 0.2, 2.8, "wiki:Key lime"),
    ("kiwi", "Kiwi", 61, 1.1, 14.7, 0.5, 3.0, "file:Kiwifruit halved.jpg"),
    ("capsuni", "Căpșuni", 32, 0.7, 7.7, 0.3, 2.0, "wiki:Strawberry"),
    ("zmeura", "Zmeură", 52, 1.2, 11.9, 0.7, 6.5, "wiki:Raspberry"),
    ("mure", "Mure", 43, 1.4, 9.6, 0.5, 5.3, "wiki:Blackberry"),
    ("afine", "Afine", 57, 0.7, 14.5, 0.3, 2.4, "wiki:Blueberry"),
    ("merisoare", "Merișoare", 46, 0.5, 12.2, 0.1, 3.6, "file:Cranberries20101210.jpg"),
    ("coacaze-rosii", "Coacăze roșii", 56, 1.4, 13.8, 0.2, 4.3, "file:Redcurrant (Ribes rubrum) fruits.jpg"),
    ("agrise", "Agrișe", 44, 0.9, 10.2, 0.6, 4.3, "file:Gooseberries.jpg"),
    ("cirese", "Cireșe", 63, 1.1, 16.0, 0.2, 2.1, "wiki:Cherry"),
    ("visine", "Vișine", 50, 1.0, 12.2, 0.3, 1.6, "file:Montmorency, one of Three best cherries (cropped).jpg"),
    ("caise", "Caise", 48, 1.4, 11.1, 0.4, 2.0, "wiki:Apricot"),
    ("piersici", "Piersici", 39, 0.9, 9.5, 0.3, 1.5, "file:Autumn Red peaches.jpg"),
    ("nectarine", "Nectarine", 44, 1.1, 10.6, 0.3, 1.7, "file:Nectarines 1.jpg"),
    ("prune", "Prune", 46, 0.7, 11.4, 0.3, 1.4, "wiki:Plum"),
    ("struguri", "Struguri", 69, 0.7, 18.1, 0.2, 0.9, "wiki:Grape"),
    ("pepene-rosu", "Pepene roșu", 30, 0.6, 7.6, 0.2, 0.4, "file:Slice of Watermelon from Wilson Farm, Lexington MA.jpg"),
    ("pepene-galben", "Pepene galben", 34, 0.8, 8.2, 0.2, 0.9, "file:Cantaloupes.jpg"),
    ("ananas", "Ananas", 50, 0.5, 13.1, 0.1, 1.4, "file:Pineapple and cross section.jpg"),
    ("mango", "Mango", 60, 0.8, 15.0, 0.4, 1.6, "wiki:Mango"),
    ("papaya", "Papaya", 43, 0.5, 10.8, 0.3, 1.7, "file:Papaya half.jpg"),
    ("rodie", "Rodie", 83, 1.7, 18.7, 1.2, 4.0, "wiki:Pomegranate"),
    ("smochine", "Smochine proaspete", 74, 0.8, 19.2, 0.3, 2.9, "file:Fig (Ficus carica) fruit halved.jpg"),
    ("gutui", "Gutui", 57, 0.4, 15.3, 0.1, 1.9, "file:Quince (10895s).jpg"),
    ("kaki", "Kaki", 70, 0.6, 18.6, 0.2, 3.6, "wiki:Diospyros kaki"),
    ("litchi", "Litchi", 66, 0.8, 16.5, 0.4, 1.3, "file:ARS Litchi chinensis.jpg"),
    ("fructul-pasiunii", "Fructul pasiunii", 97, 2.2, 23.4, 0.7, 10.4, "file:Passion fruits - whole and halved.jpg"),
    ("avocado", "Avocado", 160, 2.0, 8.5, 14.7, 6.7, "file:Avocado Hass - single and halved.jpg"),
    ("cocos", "Nucă de cocos (pulpă)", 354, 3.3, 15.2, 33.5, 9.0, "file:Coconut (halved) (3330701660).jpg"),
]


CACHE = Path(__file__).resolve().parent / "fruit_credits.json"   # pozele deja descărcate + atribuirea lor


def get(url, timeout=60):
    """Cerere HTTP cu reîncercare când Wikimedia cere o pauză (429)."""
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as err:
            if err.code != 429 or attempt == 5:
                raise
            wait = int(err.headers.get("Retry-After") or 0) or 5 * (attempt + 1)
            print(f"   pauză {wait}s (prea multe cereri)…")
            time.sleep(wait)


def api(base, params):
    return json.loads(get(base + "?" + urllib.parse.urlencode({**params, "format": "json"}), timeout=30))


def file_for(source):
    kind, name = source.split(":", 1)
    if kind == "file":
        return name
    data = api("https://en.wikipedia.org/w/api.php",
               {"action": "query", "titles": name, "prop": "pageimages", "piprop": "name", "redirects": 1})
    page = next(iter(data["query"]["pages"].values()))
    return page["pageimage"]


def strip_html(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text or "")).strip()


def fetch(filename):
    data = api("https://commons.wikimedia.org/w/api.php", {
        "action": "query", "titles": f"File:{filename}", "prop": "imageinfo",
        "iiprop": "url|extmetadata", "iiurlwidth": 700,
    })
    page = next(iter(data["query"]["pages"].values()))
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    img = Image.open(io.BytesIO(get(info["thumburl"]))).convert("RGB")
    credit = {
        "author": strip_html(meta.get("Artist", {}).get("value")) or "necunoscut",
        "license": strip_html(meta.get("LicenseShortName", {}).get("value")) or "",
        "source": info["descriptionurl"],
    }
    return img, credit


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    fruits = []
    for slug, name, kcal, protein, carbs, fat, fiber, source in FRUITS:
        cached = cache.get(slug)
        if cached and cached.get("source_spec") == source and (OUT_DIR / f"{slug}.jpg").exists():
            credit = cached["credit"]
        else:
            filename = file_for(source)
            img, credit = fetch(filename)
            credit["file"] = filename
            ImageOps.fit(img, (600, 600), Image.LANCZOS).save(OUT_DIR / f"{slug}.jpg", quality=85)
            cache[slug] = {"source_spec": source, "credit": credit}
            CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
            time.sleep(2)   # politicos cu serverele Wikimedia
        fruits.append({
            "id": f"f-{slug}", "name": name, "image": f"/fruits/{slug}.jpg",
            "per100g": {"kcal": kcal, "protein": protein, "carbs": carbs, "fat": fat, "fiber": fiber},
            "credit": credit,
        })
        print(f"{name:24} {credit['file'][:60]:60} {credit['license']}")
    OUT_JS.write_text("export const fruits = " + json.dumps(fruits, ensure_ascii=False, indent=2) + ";\n",
                      encoding="utf-8")
    print(f"{len(fruits)} fructe salvate în {OUT_JS}")


if __name__ == "__main__":
    main()
