# Be Fit From Home — Specificația aplicației

> **Rețete Sănătoase** · „Gătește smart, trăiește fit.”
> Site publicat: https://carte-cu-retete.vercel.app · Cod: https://github.com/Aurika999/carte-cu-retete

Document de referință pentru ce face aplicația, cum e construită și unde se află fiecare parte. Starea descrisă este cea din octombrie 2026.

---

## 1. Pe scurt

Be Fit From Home este o aplicație web (în limba română) pentru alimentație sănătoasă și mișcare acasă. Reunește într-un singur loc:

- **436 de rețete** din 4 cărți (tradiționale, gata în 10 minute, internaționale, de post), fiecare cu pagină proprie: ingrediente, mod de preparare, sfaturi, alergeni și valori nutriționale per porție;
- **36 de fructe și 36 de legume crude**, cu valori nutriționale recalculabile pe gramaj;
- un **calculator de calorii** (în „Contul meu”) și un **planificator de meniuri** care propune mesele zilei după caloriile utilizatorului;
- un **calendar de meniuri**, un **jurnal de apă**, **exerciții zilnice** cu cronometru și calorii arse;
- **rețete proprii**: construite din ingrediente (cu calcul de calorii) sau create automat din „ce ai în frigider”;
- **conturi** (email + parolă) prin Firebase, cu datele sincronizate între dispozitive.

---

## 2. Utilizatori

| Tip | Ce poate face | Unde se salvează datele |
| --- | --- | --- |
| **Vizitator** (fără cont) | Tot ce oferă aplicația | În browser (localStorage) — doar pe acel dispozitiv |
| **Utilizator cu cont** | Tot ce poate vizitatorul, plus profil (nume, poză), sincronizare | În cont (Firestore), pe orice dispozitiv |

La autentificare, datele salvate anterior în browser (meniuri, favorite, rețete create, datele calculatorului) **se mută automat în cont**.

---

## 3. Funcționalități

### 3.1 Pagina de start — `/`
- Salut personalizat: „Bine ai venit, *prenume*! Ce gătim sănătos astăzi?” și căutare de rețete.
- **Panou personal:**
  - *Apă azi* — bară de progres, butoane „+250 ml” / „−250 ml” (scriu direct în Jurnalul de apă);
  - *Calorii azi* — caloriile din meniul de azi din calendar față de ținta din calculator.
- **Rețeta zilei** (altă masă principală în fiecare zi): poză, calorii, proteine, minute; butoane *Gătește acum*, ❤️ *Favorite*, 📅 *Adaugă în calendar* (cu alegerea mesei).
- **Filtre rapide** → deschid rețetele filtrate (vezi 3.2).
- **Rețete recomandate** (carusel) — alese după obiectivul din calculator (slăbire → sățioase sub 400 kcal; masă musculară → bogate în proteine).
- **Favoritele mele** (carusel).
- **„Ce ai în frigider?”** — 24 de ingrediente rapide + ingrediente scrise liber:
  - *Caută rețete* → rețetele din cărți care conțin toate ingredientele (cele mai simple primele);
  - *Creează rețeta mea* → rețetă nouă generată din ingrediente (vezi 3.10).

### 3.2 Rețete pentru Fit From Home — `/retete-fit-from-home`
- Carduri pentru cele 4 cărți + Fructe crude + Legume crude.
- Fiecare carte are adresa ei: `/retete-traditionale`, `/retete-gata-in-10-minute`, `/retete-internationale`, `/retete-de-post` — cu secțiunile cărții (scurtături) și rețetele pe secțiuni (poză, calorii/porție, minute, ❤️).
- **Căutare** după nume sau secțiune (`?q=` în adresă) și **filtre rapide** (`?f=` în adresă):

| Filtru | Regulă (per porție) | Rețete |
| --- | --- | --- |
| 🥗 Sub 400 kcal | ≤ 400 kcal și ≥ 15 g proteine | 185 |
| 💪 Bogat în proteine | ≥ 25 g proteine | 115 |
| ⏱️ Gata în 15 minute | timp ≤ 15 min | 160 |
| 🥑 Keto / Low-carb | ≤ 15 g carbohidrați și ≥ 120 kcal | 62 |
| 🌱 De post | cartea „Rețete de post” | 114 |

Sosurile și băuturile nu intră în filtre.

### 3.3 Pagina unei rețete — `/<Nume-reteta>` (ex. `/Salata-cu-piept-de-pui`)
- Poza mâncării, cartea și secțiunea, titlu, introducere, porții, timp.
- Ingrediente pe grupe, mod de preparare numerotat (variantele multiple au numerotare separată), sfaturi practice, alergeni, variante/alternative, valori nutriționale per porție (pe variante, unde e cazul).
- Buton **Înapoi**: revine la pagina și poziția de derulare de unde a fost deschisă rețeta; deschisă direct dintr-un link → la cartea ei.
- Titlurile care apar în două cărți au adresa cu sufixul cărții (ex. `/Snickers-light-rapide`, `/Snickers-light-internationale`).

### 3.4 Fructe crude — `/fructe-crude` · Legume crude — `/legume-crude`
- Grilă cu poză, calorii și P · C · G · F la 100 g.
- Pagina unui produs: poză mare, cantitate (100/150/200/300 g sau liberă), calorii, macronutrienți cu % din calorii; dedesubt grila completă.
- Sursa valorilor: USDA FoodData Central. Pozele: Wikimedia Commons, cu autor și licență afișate.

### 3.5 Planificator de meniuri — `/planificator-meniuri`
- Rezumatul țintei zilnice (din datele din „Contul meu”) și butonul *Modifică datele*.
- **Rețetele mele create** (din „Ce ai în frigider?”) — listă cu poză, calorii, deschidere și ștergere.
- **Meniul recomandat pentru azi**, pe 4 mese:

| Masă | Pondere din țintă | Ce conține |
| --- | --- | --- |
| Mic dejun | 25% | fel de mic dejun + eventual al doilea fel (budincă, smoothie, desert sau fruct) |
| Prânz | 35% | supă/ciorbă (dacă ținta ≥ 450 kcal) + fel principal + eventual garnitură/salată + **legumă crudă** |
| Gustare | 10% | **fruct crud** + eventual o gustare din rețete |
| Cină | 30% | fel principal + eventual garnitură/salată + **legumă crudă** |

  - Porțiile (1 / 1,5 / 2) se aleg per fel, combinația cea mai apropiată de țintă (abatere medie ~2%).
  - *Alt meniu* (toată ziua), 🔄 per masă și 🔄 per fel; filtru pe carte (toate / tradiționale / 10 minute / internaționale / de post).
  - Fructe în meniu: 30 (fără lămâie, lime, merișoare, gutui, avocado, cocos). Legume crude în meniu: castravete, roșii, ardei roșu și verde, ceapă verde, ciuperci, ridichi.
  - *Salvează în calendar* pentru orice zi.

### 3.6 Calendarul meu — `/calendarul-meu`
- Calendar lunar: zilele cu meniu au culoare, 4 puncte (mesele) și totalul de calorii.
- Detaliul zilei: calorii față de țintă, macronutrienți, mesele cu rețetele (deschidere), ștergere meniu, *Creează un meniu* pentru o zi goală.
- Statistici lunare: zile planificate, media de calorii pe zi.

### 3.7 Jurnal de apă — `/jurnal-de-apa`
- Ținta zilnică = 35 ml/kg (greutatea din calculator), ajustabilă.
- Pahar animat, butoane *1 pahar (250 ml)*, *1 sticlă (500 ml)*, *−1 pahar*, rând de pahare bifabile.
- Calendar lunar cu procentul atins pe zi, serie de zile cu ținta atinsă, zile reușite în lună.

### 3.8 Exerciții zilnice — `/exercitii-zilnice`
- **Rutina „Be Fit From Home”:** încălzire (2 min) → circuit de 5 exerciții (genuflexiuni, flotări din genunchi, fandări în spate, planșă, mountain climbers), 40 s lucru / 20 s pauză, **2 sau 3 runde** → stretching (2 min). Durată și calorii totale estimate.
- **Cronometru ghidat:** exercițiul curent, secunde rămase, progres, calorii arse, ce urmează, semnal sonor, pauză / sari peste / oprește, ecran final.
- **12 activități zilnice** (mers, alergare, bicicletă, coardă, scări, înot, dans, HIIT, greutăți, pilates, yoga, treburi casnice) cu minute alese (5–90) și calorii arse.
- **Harta mușchilor** (față/spate) la fiecare exercițiu și activitate, cu grupele lucrate colorate.
- Calorii: `kcal = MET × 3,5 × greutate (kg) ÷ 200 × minute` (MET din Compendium of Physical Activities).

### 3.9 Creează-ți rețeta — `/creeaza-ti-reteta`
- Nume, număr de porții, căutare și categorii de ingrediente (123: 51 de bază + 36 legume + 36 fructe).
- Gramaj per ingredient (± 10 g sau scris), calorii totale și pe porție, macronutrienți și fibre pe porție.
- *Rețetele mele*: salvare, redeschidere, ștergere.

### 3.10 Rețete create din frigider — `/reteta-mea/<id>`
- Generate **fără AI**, prin reguli și șabloane: tipul preparatului se alege din ingrediente (salată, omletă, paste, bol cu cereale, la cuptor, tocăniță, la tigaie, budincă/bol cu iaurt).
- Gramaje pentru 2 porții + ulei/miere „din cămară”, pași de preparare cu timpi, sfaturi, alergeni, valori nutriționale exacte.
- Poză de prezentare: colaj generat din pozele ingredientelor, cu titlul pe imagine.
- **Salvare automată** (cont sau browser) și listare în Planificator; se pot copia în „Creează-ți rețeta” pentru ajustarea gramajelor.

### 3.11 Contul meu — `/contul-meu`
- Autentificare / cont nou (nume, email, parolă) / resetare parolă prin email; mesaje de eroare în română.
- Poză de profil (decupată pătrat, 256×256 px) — apare și în bara de sus.
- Date cont: nume (editabil), email, data creării, ultima autentificare, număr de meniuri.
- Schimbare parolă și ștergere cont (cu parola actuală); ștergerea elimină și meniurile, poza și favoritele.
- **Calculatorul meu de calorii:** sex, vârstă (15–80), greutate (40–180 kg), înălțime (140–210 cm) — cu glisor sau valoare scrisă; nivel de activitate (5) și obiectiv (slăbire −20%, slăbire lentă −10%, menținere, masă +10%). Rezultate: țintă zilnică, metabolism bazal, TDEE, macronutrienți, calorii pe nivel de activitate, IMC, apă pe zi.

---

## 4. Calcule

| Ce | Formulă |
| --- | --- |
| Metabolism bazal (Mifflin-St Jeor) | `10 × kg + 6,25 × cm − 5 × ani + 5` (bărbat) / `− 161` (femeie) |
| Menținere (TDEE) | metabolism bazal × factor activitate (1,2 · 1,375 · 1,55 · 1,725 · 1,9) |
| Ținta zilnică | TDEE × factor obiectiv (0,8 · 0,9 · 1,0 · 1,1) |
| Proteine | 2 g/kg (slăbire) · 1,8 g/kg (masă) · 1,6 g/kg (menținere) |
| Grăsimi / carbohidrați | grăsimi = 25% din calorii; carbohidrați = restul |
| Apă | 35 ml/kg (ținta implicită în jurnal: rotunjit la 50 ml) |
| IMC | kg ÷ (m)² |
| Calorii arse | MET × 3,5 × kg ÷ 200 × minute |

Toate valorile sunt estimative; paginile afișează o notă în acest sens.

---

## 5. Arhitectură tehnică

### 5.1 Tehnologii
- **React 19** + **Vite 7** (aplicație de o singură pagină, fără server propriu).
- **Firebase 12**: Authentication (email + parolă) și Firestore.
- **lucide-react** (iconițe), **react-body-highlighter** (harta mușchilor, licență MIT).
- Stiluri: un singur fișier CSS (`src/styles.css`), fonturi DM Sans și Playfair Display (Google Fonts).
- Găzduire: **Vercel**, republicare automată la fiecare push pe `main`.

### 5.2 Rutare
Navigare fără reîncărcare (History API), în `src/routes.js` și `src/main.jsx`:
- paginile aplicației: tabelul `TOOL_PATHS` (+ adresele cărților);
- rețetele: `/<slug>` (din `src/recipeDetails.js`);
- rețetele create: `/reteta-mea/<id>`;
- adrese vechi păstrate: `/#calculator`, `/#apa` etc. și `/calculator-calorii` redirecționează la adresele noi.
- `vercel.json` trimite toate adresele la `index.html`.
- Poziția de derulare se memorează per intrare din istoric (sessionStorage), pentru „Înapoi”.

### 5.3 Stare globală (React Context)
| Context | Fișier | Conținut |
| --- | --- | --- |
| `AuthProvider` | `src/auth.jsx` | utilizatorul, numele afișat, poza de profil, fereastra de autentificare |
| `CalcDataProvider` | `src/calcData.jsx` | datele calculatorului și rezultatele |
| `FavoritesProvider` | `src/favorites.jsx` | rețetele favorite |

### 5.4 Date și persistență

**Firestore** (doar cu cont) — totul sub `users/<uid>/`:

| Cale | Conținut |
| --- | --- |
| `menus/<AAAA-LL-ZZ>` | meniul zilei: țintă, carte, mese cu `{ id, portions }` |
| `myRecipes/<id>` | rețetă creată din frigider (completă, cu poza ca data URL) |
| `data/profile` | `photo` (data URL), `calc` (datele calculatorului) |
| `data/favorites` | `ids` — lista rețetelor favorite |

Reguli de securitate (`firestore.rules`): fiecare utilizator citește și scrie **doar** sub `users/<propriul uid>`.

**Browser — localStorage:**

| Cheie | Conținut | Și în cont? |
| --- | --- | --- |
| `calculator-calorii` | datele calculatorului | da (`data/profile.calc`) |
| `calendar-meniuri` | meniurile pe zile (fără cont) | da (se mută la autentificare) |
| `favorite` | favoritele (fără cont) | da |
| `retete-create` | rețetele create (fără cont, max. 20) | da |
| `jurnal-apa` | apa pe zile | **nu** — doar în browser |
| `retetele-mele`, `reteta-in-lucru` | „Creează-ți rețeta” | **nu** — doar în browser |

**Browser — sessionStorage:** `frigider-selectie`, `reteta-generata`, `derulare:<adresă>`.

### 5.5 Date statice (în cod)
| Fișier | Conținut |
| --- | --- |
| `src/recipes.js` | lista celor 436 de rețete: id, titlu, carte, secțiune, slug, minute, valori/porție, poza paginii |
| `src/retete/*.js` | 436 de fișiere — textul complet al fiecărei rețete (încărcat la cerere) |
| `src/ingredientIndex.js` | ingredientele fiecărei rețete, pentru „Ce ai în frigider?” (încărcat la cerere) |
| `src/fruits.js`, `src/vegetables.js` | fructe și legume: valori la 100 g, poză, atribuire |
| `src/ingredients.js` | cele 123 de ingrediente pentru rețete proprii |
| `src/recipeFilters.js` | filtrele rapide |
| `src/calories.js` | formulele calculatorului |

### 5.6 Resurse (public/)
| Folder | Conținut | Mărime |
| --- | --- | --- |
| `public/recipes/` | pozele mâncărurilor (din PDF-uri), câte una pe rețetă | ~23 MB |
| `public/pages/` | imaginile paginilor de carte reașezate — folosite acum doar ca miniaturi în planificator și calendar | ~75 MB |
| `public/fruits/`, `public/vegetables/` | pozele produselor (Wikimedia Commons) | ~6 MB |
| `public/cover.png` | imaginea de copertă | 0,6 MB |

### 5.7 Scripturi de generare (`scripts/`, Python 3 + PyMuPDF + Pillow)
PDF-urile originale **nu** sunt în proiect; scripturile le caută în folderul părinte (sau în `PDF_DIR`).

| Script | Rol |
| --- | --- |
| `build_recipe_pages.py` | extrage din PDF-uri textul și pozele rețetelor → `src/retete/`, `public/recipes/`, slug-uri în `recipes.js` |
| `build_indexes.py` | adaugă timpul de preparare în `recipes.js` și generează `ingredientIndex.js` |
| `add_nutrition.py` | valorile nutriționale per porție în `recipes.js` |
| `extract_pages.py`, `layout.py`, `enhance_page.py` | imaginile paginilor reașezate (`public/pages/`) |
| `fruits.py`, `vegetables.py` | descarcă pozele de pe Wikimedia Commons și generează datele fructelor / legumelor |

### 5.8 Structura fișierelor sursă
```
src/
  main.jsx            pornire, rutare, meniul din stânga, butonul de cont
  Home.jsx            pagina de start
  RecipesHub.jsx      cărțile, căutare, filtre
  RecipePage.jsx      pagina unei rețete (și a rețetelor create)
  ProduceGrid.jsx     fructe / legume crude
  CalorieCalculator.jsx  formularul calculatorului + Planificatorul de meniuri
  MealPlan.jsx        meniul recomandat (algoritmul)
  MyRecipesList.jsx   rețetele create, în planificator
  MenuCalendar.jsx    calendarul de meniuri
  WaterTracker.jsx    jurnalul de apă
  Exercises.jsx       exerciții zilnice și cronometru
  MuscleMap.jsx       harta mușchilor
  RecipeBuilder.jsx   creează-ți rețeta
  AccountPage.jsx     contul meu
  recipeGenerator.js  rețete din ingrediente + poza colaj
  auth.jsx · calcData.jsx · favorites.jsx         contexte
  firebase.js · menuStorage.js · myRecipes.js · waterStorage.js   persistență
  routes.js · recipeDetails.js · planItems.js     rutare și date derivate
```

---

## 6. Configurare și rulare

**Cerințe:** Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # producție, în dist/
npm run preview
```

**Firebase:** configurația web a proiectului `be-fit-from-home` e inclusă în `src/firebase.js` (este publică prin natura ei; datele sunt protejate de regulile Firestore). Variabilele `VITE_FIREBASE_*` din `.env.local` (model în `.env.example`) sau din setările Vercel au prioritate. În consola Firebase trebuie să fie active: Authentication → Email/Password și Firestore Database, cu regulile din `firestore.rules`. Domeniul publicat se adaugă la Authentication → Settings → Authorized domains.

**Publicare:** push pe `main` → Vercel compilează și publică automat.

---

## 7. Limitări cunoscute și pași posibili

- **Jurnalul de apă și „Creează-ți rețeta” nu se salvează în cont** — rămân pe dispozitiv.
- **Fără teste automate și fără linter**; verificarea s-a făcut manual și prin simulări (meniuri, filtre).
- **Pachetul JavaScript principal are ~1 MB** (în mare parte `recipes.js`); textele rețetelor și indexul de ingrediente se încarcă deja la cerere.
- **`public/pages/` (~75 MB)** e folosit doar pentru miniaturi; miniaturile ar putea trece pe `public/recipes/`, iar folderul ar putea fi șters.
- **PDF-urile originale** au fost șterse din proiect, dar rămân în **istoricul** Git al repo-ului public (cărțile au mențiunea că distribuirea fără acordul autorului este interzisă).
- **Rețetele create din frigider** sunt generate din șabloane: caloriile sunt exacte, dar combinațiile neobișnuite nu garantează gustul.
- **Harta mușchilor** este o ilustrație vectorială, nu o imagine anatomică 3D.
- **Caloriile** (calculator, exerciții) sunt estimări bazate pe formule standard.
- `README.md` descrie încă prima versiune a proiectului și ar trebui actualizat.
