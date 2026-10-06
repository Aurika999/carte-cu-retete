"""Generează src/vegetables.js: legume crude cu valori nutriționale la 100 g și poze.

Valorile nutriționale: USDA FoodData Central (SR Legacy), legumă crudă, 100 g parte comestibilă.
Pozele: Wikimedia Commons (licențe libere), în public/vegetables/, cu autorul și licența păstrate.

Rulare: python scripts/vegetables.py
"""
from pathlib import Path

from fruits import ROOT, build

# slug, nume, kcal, proteine, carbohidrați, grăsimi, fibre, sursa pozei ("wiki:Articol" sau "file:Fișier")
VEGETABLES = [
    ("rosii", "Roșii", 18, 0.9, 3.9, 0.2, 1.2, "wiki:Tomato"),
    ("castravete", "Castravete", 15, 0.7, 3.6, 0.1, 0.5, "wiki:Cucumber"),
    ("ardei-rosu", "Ardei gras roșu", 31, 1.0, 6.0, 0.3, 2.1, "file:Red bell pepper.jpg"),
    ("ardei-verde", "Ardei gras verde", 20, 0.9, 4.6, 0.2, 1.7, "file:Green Bell Pepper.jpg"),
    ("morcov", "Morcov", 41, 0.9, 9.6, 0.2, 2.8, "wiki:Carrot"),
    ("ceapa", "Ceapă", 40, 1.1, 9.3, 0.1, 1.7, "wiki:Onion"),
    ("ceapa-verde", "Ceapă verde", 32, 1.8, 7.3, 0.2, 2.6, "wiki:Scallion"),
    ("usturoi", "Usturoi", 149, 6.4, 33.1, 0.5, 2.1, "file:Garlic bulbs and cloves.jpg"),
    ("praz", "Praz", 61, 1.5, 14.2, 0.3, 1.8, "wiki:Leek"),
    ("varza-alba", "Varză albă", 25, 1.3, 5.8, 0.1, 2.5, "wiki:Cabbage"),
    ("varza-rosie", "Varză roșie", 31, 1.4, 7.4, 0.2, 2.1, "wiki:Red cabbage"),
    ("varza-bruxelles", "Varză de Bruxelles", 43, 3.4, 9.0, 0.3, 3.8, "wiki:Brussels sprout"),
    ("kale", "Kale", 49, 4.3, 8.8, 0.9, 3.6, "wiki:Kale"),
    ("conopida", "Conopidă", 25, 1.9, 5.0, 0.3, 2.0, "wiki:Cauliflower"),
    ("broccoli", "Broccoli", 34, 2.8, 6.6, 0.4, 2.6, "wiki:Broccoli"),
    ("spanac", "Spanac", 23, 2.9, 3.6, 0.4, 2.2, "file:Red soil spinach.jpg"),
    ("salata-verde", "Salată verde", 15, 1.4, 2.9, 0.2, 1.3, "file:Head of lettuce (3010140038).jpg"),
    ("rucola", "Rucola", 25, 2.6, 3.7, 0.7, 1.6, "file:Rucola Bestand erntefertig - 15-05-2023.jpg"),
    ("telina-tulpina", "Țelină (tulpină)", 16, 0.7, 3.0, 0.2, 1.6, "wiki:Celery"),
    ("telina-radacina", "Țelină (rădăcină)", 42, 1.5, 9.2, 0.3, 1.8, "wiki:Celeriac"),
    ("dovlecel", "Dovlecel", 17, 1.2, 3.1, 0.3, 1.0, "wiki:Zucchini"),
    ("vinete", "Vinete", 25, 1.0, 5.9, 0.2, 3.0, "wiki:Eggplant"),
    ("dovleac", "Dovleac", 26, 1.0, 6.5, 0.1, 0.5, "wiki:Pumpkin"),
    ("sfecla-rosie", "Sfeclă roșie", 43, 1.6, 9.6, 0.2, 2.8, "wiki:Beetroot"),
    ("ridichi", "Ridichi", 16, 0.7, 3.4, 0.1, 1.6, "wiki:Radish"),
    ("gulie", "Gulie", 27, 1.7, 6.2, 0.1, 3.6, "wiki:Kohlrabi"),
    ("pastarnac", "Păstârnac", 75, 1.2, 18.0, 0.3, 4.9, "file:Parsnips on a shelf.jpg"),
    ("cartof", "Cartof", 77, 2.0, 17.5, 0.1, 2.1, "wiki:Potato"),
    ("cartof-dulce", "Cartof dulce", 86, 1.6, 20.1, 0.1, 3.0, "wiki:Sweet potato"),
    ("mazare-verde", "Mazăre verde", 81, 5.4, 14.5, 0.4, 5.7, "wiki:Pea"),
    ("fasole-verde", "Fasole verde (păstăi)", 31, 1.8, 7.0, 0.2, 2.7, "wiki:Green bean"),
    ("porumb-dulce", "Porumb dulce", 86, 3.3, 18.7, 1.4, 2.0, "wiki:Sweet corn"),
    ("sparanghel", "Sparanghel", 20, 2.2, 3.9, 0.1, 2.1, "file:Asparagus-Bundle.jpg"),
    ("ciuperci", "Ciuperci champignon", 22, 3.1, 3.3, 0.3, 1.0, "wiki:Agaricus bisporus"),
    ("patrunjel", "Pătrunjel (frunze)", 36, 3.0, 6.3, 0.8, 3.3, "file:Parsley leaves (89358).jpg"),
    ("marar", "Mărar", 43, 3.5, 7.0, 1.1, 2.1, "file:Fresh Dill Leaves.JPG"),
]

if __name__ == "__main__":
    build(VEGETABLES, "vegetables", ROOT / "src" / "vegetables.js", "vegetables", "l",
          Path(__file__).resolve().parent / "vegetable_credits.json")
