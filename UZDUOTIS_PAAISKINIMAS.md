# Mini Blog (Node.js + Express + EJS) – Pilnas paaiškinimas

Šis projektas – tai mini „Blog“ sistema. Idėja paprasta: turime serverį (Node.js + Express), kuris priima užklausas, perskaito/įrašo duomenis į JSON failą, ir grąžina sugeneruotus HTML puslapius (EJS šablonai). Viskas suorganizuota pagal MVC (Model–View–Controller) logiką.

Žemiau – pilnas paaiškinimas „kaip ir kodėl“. Skaityk nuosekliai – tai kaip kelionės žemėlapis.

---

## 1) Projekto struktūra – kur kas gyvena

```
nodeJS/
├── app.js                           # Pagrindinis Express serveris
├── data/
│   └── blogs.json                   # „Duombazė“ (JSON failas)
├── public/
│   └── css/
│       └── blog.css                 # Bendras projektui CSS (be inline)
├── src/
│   ├── middleware/
│   │   └── logger.js                # Middleware – logina visas HTTP užklausas
│   ├── models/
│   │   └── blogModel.js             # Modelis – dirba su blogs.json (CRUD)
│   ├── controllers/
│   │   └── blogController.js        # Kontroleris – logika tarp Route ir Model
│   └── routes/
│       └── blogRoutes.js            # Maršrutai – URL keliai /blog, /blog/:id, DELETE
└── views/
    ├── pages/
    │   ├── blog.ejs                 # Visų įrašų sąrašas
    │   ├── blog-detail.ejs          # Vieno įrašo puslapis + Ištrinti
    │   ├── create.ejs               # Naujo įrašo forma
    │   └── 404.ejs                  # 404 „Nerasta“ puslapis
    └── partials/
        ├── head.ejs                 # <head>, CSS linkai, <title>
        ├── nav.ejs                  # Navigacija (meniu)
        └── footer.ejs               # Puslapio apačia
```

Kodėl taip padalinta?
- **Lengviau rasti** atsakingą failą.
- **Aiškus vaidmenų pasiskirstymas**: Model – duomenys, View – HTML, Controller – logika.
- **Skalėjimas**: lengva pridėti naujų funkcijų (pvz., „Edit“), nekeisdami visko vienoje vietoje.

---

## 2) Kaip teka užklausa? (super svarbu)

Pavyzdys: vartotojas atidaro „Tinklaraštį“ – `GET /blog`

1. Naršyklė siunčia užklausą į serverį: `GET /blog`.
2. `app.js` gauna užklausą ir perduoda į `blogRoutes` (nes `app.use('/blog', blogRoutes)`).
3. `src/routes/blogRoutes.js` mato, kad `GET /` turi kviesti `getBlogList` iš `blogController.js`.
4. `src/controllers/blogController.js` (`getBlogList`) kviečia `getAllBlogs()` iš `blogModel.js`.
5. `src/models/blogModel.js` perskaito `data/blogs.json` ir grąžina masyvą `blogs`.
6. Kontroleris `renderina` EJS šabloną `views/pages/blog.ejs` su gautais duomenimis.
7. Į naršyklę keliauja paruoštas HTML su sąrašu.

Tas pats principas taikomas ir detalei (`GET /blog/:id`), kūrimui (`POST /create`), trynimui (`DELETE /blog/:id`).

---

## 3) app.js – serverio „smegenys“

Failas: `app.js`

Ką daro:
- **Registruoja middleware** tvarka (svarbu):
  - `logger` (pats pirmas) – kad kiekviena užklausa būtų užloginta.
  - `express.static('public')` – kad `/css/blog.css` ir kiti statiniai failai būtų pasiekiami.
  - `express.json()` ir `express.urlencoded({ extended: true })` – kad `req.body` veiktų su JSON ir HTML formomis.
- **Sukonfigūruoja EJS**: `view engine` ir `views` katalogą.
- **Registruoja maršrutus**: `/blog` (visa blog dalis), `/create` (forma ir pateikimas), `/api` (jei reikės komentarų API), namų puslapiai.
- **Paskutinė** – 404 „catch-all“ tvarkyklė. Jei niekas neatitiko – čia.

Kodėl 404 turi būti paskutinė? Nes Express tikrina iš eilės. Jei ją padėtume aukščiau – ji „pagautų“ viską ir kiti maršrutai nebūtų pasiekti.

---

## 4) Middleware: logger.js – kam jis?

Failas: `src/middleware/logger.js`

- Tai funkcija, kuri įvykdoma prieš bet kurį maršrutą.
- Ji paima informaciją (data/laikas, metodas, URL, IP) ir išspausdina konsolėje.
- Tada kviečia `next()`, kad perduotų valdymą toliau.

Kodėl naudinga? Nes gali akimirksniu matyti, kas vyksta serveryje („gyvas“ žurnalas).

---

## 5) Modelis: blogModel.js – darbas su JSON „duombaze“

Failas: `src/models/blogModel.js`

- Naudoja `fs.promises` skaitymui/rašymui.
- Laiko kelią iki failo: `data/blogs.json`.
- Pagrindinės funkcijos:
  - **`getAllBlogs()`** – perskaito failą, `JSON.parse`, grąžina `data.blogs` masyvą.
  - **`getBlogById(id)`** – gražina vieną objektą pagal `id` (numeris arba string konvertuojamas į numerį).
  - **`createBlog({ title, snippet, body, author, image })`** –
    - perskaito duomenis,
    - paima `nextId` kaip naują `id`,
    - sukuria naują objektą (pridėdamas `createdAt`),
    - įstumia į `blogs` masyvą,
    - padidina `nextId`,
    - įrašo atgal į JSON.
  - **`deleteBlog(id)`** – suranda įrašo indeksą, jei yra – `splice`, ir įrašo atgal į JSON. Jei neranda – grąžina `null`.

Kodėl JSON? Nes tai paprasta pradžiai. Vėliau galima pakeisti į realią DB (MongoDB, PostgreSQL). API (Controller) beveik nesikeis – tik Modelio vidus.

---

## 6) Kontroleris: blogController.js – logika tarp HTTP ir Modelio

Failas: `src/controllers/blogController.js`

- **`getBlogList(req, res)`** – paima visus įrašus per `getAllBlogs()` ir `renderina` `views/pages/blog.ejs` su `{ blogs }`.
- **`getBlogDetail(req, res)`** – paima `req.params.id`, suranda vieną blog'ą per `getBlogById()`, jei neranda – grąžina `404` (`views/pages/404.ejs`). Jei randa – `renderina` `blog-detail.ejs`.
- **`showCreateForm(req, res)`** – tiesiog renderina `create.ejs` su forma.
- **`createNewBlog(req, res)`** –
  - paima duomenis iš `req.body` (iš formos),
  - VALIDUOJA (tušti laukai? `title` per trumpas?),
  - kviečia `createBlog(...)` Modelyje,
  - sėkmės atveju `redirect` į `/blog/:id`.
- **`deleteBlogPost(req, res)`** –
  - paima `id` iš `req.params`,
  - kviečia `deleteBlog(id)`,
  - grąžina JSON `{ success: true, redirectUrl: '/blog' }` (front-end JS atliks redirect).

Kodėl `res.json` DELETE atveju? Nes „Ištrinti“ kviečiama per `fetch()` iš naršyklės – patogiau gauti JSON, o ne pilną puslapį.

---

## 7) Maršrutai: blogRoutes.js – URL „adresų knyga“

Failas: `src/routes/blogRoutes.js`

- `GET /blog` → `getBlogList` (sąrašas)
- `GET /blog/:id` → `getBlogDetail` (vienas įrašas pagal ID)
- `DELETE /blog/:id` → `deleteBlogPost` (ištrinti įrašą per `fetch`)

Kodėl `:id` o ne `:slug`? Nes `id` unikalus, trumpas, lengviau su juo dirbti (mažiau klaidų). Jei prireiks „gražių“ URL – galima vėliau pridėti `slug`.

---

## 8) Vaizdai: EJS šablonai (HTML iš serverio)

### `views/partials/head.ejs`
- Įdeda `<meta>` tagus, `<title>`, ir **CSS linkus**: `/css/style.css` ir `/css/blog.css`.
- Dėl `app.use(express.static(...))` CSS pasiekiamas adresu `/css/...`.

### `views/pages/blog.ejs` – sąrašas
- Rodo visus įrašus su pavadinimu, snippet, data, nuoroda „Plačiau“.
- Nuorodos forma: `/blog/<%= blog.id %>`.
- Viršuje – mygtukas „Sukurti Naują Įrašą“ (`/create`).
- Visas stilius – **iš `public/css/blog.css`** (nenaudojame inline CSS).

### `views/pages/blog-detail.ejs` – vienas įrašas
- Rodo pavadinimą, autorių, datą, nuotrauką (jei yra) ir turinį.
- Turinys rodomas kaip **HTML** (naudojamas `<%- ... %>`), o ne kaip tekstas. Naujos eilutės paverčiamos `<br>`. 
  - Pastaba: tai saugu, kol turinį valdai tu. Jei leisite vartotojams rašyti HTML – prieš įrašant SANITIZUOKITE (pvz., `sanitize-html`).
- Mygtukas „Ištrinti“ kviečia JS funkciją `deleteBlog('<%= blogId %>')`, kuri su `fetch()` siunčia `DELETE` į `/blog/:id`. Jei pavyksta – redirect į sąrašą.

### `views/pages/create.ejs` – forma
- `form method="POST" action="/create"` – siunčia duomenis į serverį.
- Laukai: `title`, `snippet`, `body`, `author`, `image` (paskutiniai du – nebūtini).
- Jei serverio validacija randa klaidą – grąžina tą pačią formą su klaidos pranešimu ir palieka įvestus duomenis (kad netektų vėl rašyti).

### `views/pages/404.ejs` – 404 „Nerasta“
- Rodo didelį „404“, paaiškinimą ir kelis naudingus linkus.
- Parodomas, kai **joks** maršrutas neatitinka užklausos (nes `app.js` gale yra 404 handler).

---

## 9) Stiliai: public/css/blog.css – kodėl viename faile?

- Visas projektui skirtas CSS yra **vienoje vietoje** – paprasčiau tvarkyti ir nekeisti EJS failų.
- Klasės pvz.: `.btn`, `.btn-primary`, `.btn-delete`, `.page-title`, `.blog-form`, `.error-page` ir t.t.
- `views/partials/head.ejs` įtraukia šį CSS per `<link rel="stylesheet" href="/css/blog.css">`.

Kodėl negalima inline CSS? Nes:
- Sunku prižiūrėti, pasikartojantis stilius įklijuotas visur.
- Nemodularu – pakeitus dizainą, tektų redaguoti daug EJS failų.

---

## 10) Duomenys: data/blogs.json – mūsų „DB“

- Struktūra:
```json
{
  "blogs": [ { "id": 1, "title": "...", "snippet": "...", "body": "...", "author": "...", "image": "/images/x.png", "createdAt": "2024-01-01T10:00:00Z" } ],
  "nextId": 4
}
```
- `nextId` – automatinis ID priskyrimas naujiems įrašams.
- Modelis **visada** perskaito failą, atnaujina objektą, ir **visada** įrašo atgal su `JSON.stringify`.

---

## 11) Pilni srautai: kaip tai veikia „nuo iki“

### A) Peržiūrėti visus (GET /blog)
- Route: `GET /blog` → Controller: `getBlogList()` → Model: `getAllBlogs()`
- Controller: `res.render('pages/blog', { blogs })`
- View: `blog.ejs` sugeneruoja HTML.

### B) Peržiūrėti vieną (GET /blog/:id)
- Route: `GET /blog/:id` → Controller: `getBlogDetail()` → Model: `getBlogById(id)`
- Jei neranda – 404.
- Jei randa – render `blog-detail.ejs`.

### C) Sukurti naują (GET /create → POST /create)
- `GET /create` rodo formą.
- `POST /create` –
  - Controller tikrina `req.body` (ar laukai neužmiršti, ar `title` pakankamai ilgas).
  - Jei klaida – `render('create', { error, formData })`.
  - Jei gerai – `createBlog(data)` ir `redirect('/blog/:id')`.

### D) Ištrinti (DELETE /blog/:id)
- Mygtukas detalės puslapyje kviečia `deleteBlog(id)` JS funkciją.
- `fetch('/blog/:id', { method: 'DELETE' })` → Controller: `deleteBlogPost()` → Model: `deleteBlog(id)` → JSON `{ success: true, redirectUrl: '/blog' }` → naršyklė per JS daro `window.location.href = '/blog'`.

### E) 404 – visiems neatpažintiems URL
- Jei niekas nesutapo – `app.js` gale `res.status(404).render('pages/404', { url: req.url })`.

---

## 12) Svarbūs „kodėl?“

- **Kodėl MVC?** Aiškus atskyrimas: duomenys (Model), logika (Controller), HTML (View). Lengviau prižiūrėti ir testuoti.
- **Kodėl JSON vietoje DB?** Pradedančiajam paprasčiau suprasti srautą. Pakeisti į tikrą DB bus nesunku – palies tik Modelį.
- **Kodėl logger pirmas?** Kad logintų kiekvieną užklausą (diagnostika).
- **Kodėl 404 paskutinis?** Kad „pagautų“ tik tai, ko neatpažino jokie kiti maršrutai.
- **Kodėl `:id` vietoj `:slug`?** Paprasčiau, unikalu, mažiau klaidų su pavadinimų keitimais.
- **Kodėl `<%- ... %>` turiniui?** Kad HTML turinys būtų rodomas kaip HTML, o ne kaip tekstas. Bet – saugoti nuo XSS, jei turinį įveda vartotojai (sanitizacija!).
- **Kodėl CSS atskirame faile?** Centralizuotas dizainas, paprastesnė priežiūra, jokių inline stilių.

---

## 13) Kaip paleisti ir testuoti

```bash
npm start
# arba
nodemon app.js
```
Atidaryk:
- Sąrašas: http://localhost:3000/blog
- Forma: http://localhost:3000/create
- Detalė: http://localhost:3000/blog/1 (ar kitas ID)
- 404 testas: http://localhost:3000/nieko-nera

Konsolėje matysi logger įrašus, pvz.:
```
[2025-10-16T18:32:15.437Z] GET /blog - IP: ::1
[2025-10-16T18:32:25.891Z] POST /create - IP: ::1
[2025-10-16T18:32:35.678Z] DELETE /blog/4 - IP: ::1
```

---

## 14) Kas toliau? (jei norėsi plėsti)

- **Edit** funkcija: `GET /blog/:id/edit`, `POST/PUT /blog/:id`, Modelyje `updateBlog()`.
- **Komentarai**: atskiras JSON ir API maršrutai, arba DB.
- **Sanitizacija**: `sanitize-html` prieš išsaugant turinį.
- **Testai**: Jest/Mocha – vienetų ir integraciniai.
- **CI/CD**: automatinis deploy.

---

Šis dokumentas paaiškina ne tik „ką rašėm“, bet **kodėl** taip darėm. Jei nori, galiu papildyti su konkrečių funkcijų kodo iškarpomis ir detaliais komentarais – pasakyk, kurias dalis nori nagrinėti giliau.
