# Node.js Žaislų Parduotuvės Projekto Dokumentacija

## 📂 Projekto Struktūra (Site Map)

```
nodeJS/
├── src/                          # Šaltinio kodas
│   ├── controllers/              # Kontroleriai (MVC logika)
│   │   ├── blogController.js     # Tinklaraščio puslapių logika
│   │   └── blogCommentController.js  # Komentarų API logika
│   ├── models/                   # Duomenų modeliai
│   │   ├── blogModel.js          # Straipsnių duomenys
│   │   └── blogCommentModel.js   # Komentarų duomenys ir CRUD operacijos
│   ├── routes/                   # Maršrutai
│   │   ├── blogRoutes.js         # Blog puslapių maršrutai
│   │   └── api/                  # API endpoints
│   │       ├── index.js          # API maršrutų agregatorius
│   │       └── commentRoutes.js  # Komentarų API endpoints
│   ├── utils/                    # Pagalbinės funkcijos
│   │   ├── slugify.js            # URL slug generavimas
│   │   └── generateUUID.js       # UUID generavimas komentarams
│   └── config/                   # Konfigūracija (tuščias)
├── public/                       # Statiniai failai
│   ├── css/
│   │   └── style.css             # Stiliai
│   ├── js/                       # JavaScript failai (tuščias)
│   ├── images/                   # Nuotraukos
│   └── assets/                   # Kiti statiniai failai
├── views/                        # EJS šablonai
│   ├── pages/                    # Pilni puslapiai
│   │   ├── index.ejs             # Pagrindinis puslapis
│   │   ├── blog.ejs              # Straipsnių sąrašas
│   │   ├── blog-detail.ejs       # Detalus straipsnis + komentarai
│   │   ├── toys.ejs              # Žaislų puslapis
│   │   ├── toy-rent.ejs          # Žaislų nuomos puslapis
│   │   ├── contact.ejs           # Kontaktų puslapis
│   │   └── services.ejs          # Paslaugų puslapis
│   ├── partials/                 # Pakartojami komponentai
│   │   ├── head.ejs              # HTML head su meta tags
│   │   ├── nav.ejs               # Navigacijos meniu
│   │   ├── footer.ejs            # Footer sekcija
│   │   └── main.ejs              # Pagrindinis layout
│   └── errors/                   # Klaidų puslapiai
│       └── 404.ejs               # 404 klaidos puslapis
├── app.js                        # Pagrindinis serverio failas
├── package.json                  # NPM priklausomybės
├── package-lock.json             # Priklausomybių versijų lock
└── md.md                         # Projekto dokumentacija (šis failas)
```

---

## 🎯 Technologijos

- **Express.js 5.1.0** - Node.js web framework
- **EJS 3.1.10** - Embedded JavaScript šablonų variklis
- **UUID 13.0.0** - Unikalių identifikatorių generavimas
- **Vanilla JavaScript** - Frontend interaktyvumas (be React/Vue)

---

## 🏗️ Architektūra

Projektas naudoja **MVC (Model-View-Controller)** architektūrą:

- **Models** (`src/models/`) - Duomenų struktūra ir CRUD operacijos
- **Views** (`views/`) - EJS šablonai UI renderinimui
- **Controllers** (`src/controllers/`) - Verslo logika ir užklausų valdymas

---

## 📝 Pagrindiniai Failai

### `app.js` - Serverio Konfigūracija

**Funkcionalumas:**
- Express serverio iniciacija
- EJS šablonų variklio konfigūracija
- Statinių failų aptarnavimas iš `public/`
- Globalaus navigacijos meniu apibrėžimas
- Maršrutų prijungimas:
  - `/blog/*` → tinklaraščio puslapiai
  - `/api/*` → RESTful API endpoints
  - `/`, `/toys`, `/toy-rent`, `/contact`, `/services` → pagrindiniai puslapiai
- 404 klaidų apdorojimas
- Serverio paleidimas port 3000

**Serveris veikia:** `http://localhost:3000`

---

## 📦 Models (Duomenų Sluoksnis)

### `blogModel.js`

**Paskirtis:** Saugo tinklaraščio straipsnių duomenis

**Duomenų struktūra:**
```javascript
{
  title: "Straipsnio pavadinimas",
  content: "Pilnas straipsnio turinys (tekstas)",
  author: "Autoriaus vardas ir profesija",
  image: "Kelias iki nuotraukos (/images/xxx.png)"
}
```

**Dabartiniai duomenys:** 3 straipsniai apie vaikų lavinamuosius žaislus

### `blogCommentModel.js`

**Paskirtis:** Komentarų duomenų saugojimas ir valdymas

**Duomenų struktūra:**
```javascript
{
  commentId: "UUID",           // Unikalus identifikatorius
  blogPostId: 1,               // Straipsnio ID (index + 1)
  authorName: "Vardas",        // Komentaro autorius
  commentContent: "Tekstas",   // Komentaro turinys
  createdAtDate: Date          // Sukūrimo data/laikas
}
```

**Eksportuojamos funkcijos:**
- `createBlogComment(blogPostId, authorName, commentContent)` - Sukuria naują komentarą
- `getBlogCommentsByPostId(blogPostId)` - Grąžina straipsnio komentarus
- `deleteBlogComment(commentId)` - Ištrina komentarą

**Saugojimas:** In-memory masyvas (duomenys prarandami paleidus serverį iš naujo)

---

## 🎮 Controllers (Logikos Sluoksnis)

### `blogController.js`

**Eksportuojamos funkcijos:**

#### `getBlogList(request, response)`
- Apdoroja `GET /blog` užklausą
- Gauna visus straipsnius iš `blogModel`
- Renderina `pages/blog.ejs` su straipsnių sąrašu

#### `getBlogDetail(request, response)`
- Apdoroja `GET /blog/:slug` užklausą
- Suranda straipsnį pagal URL slug
- Apskaičiuoja straipsnio ID (array index + 1)
- Renderina `pages/blog-detail.ejs`
- Grąžina 404, jei straipsnis nerastas

### `blogCommentController.js`

**Eksportuojamos funkcijos:**

#### `getBlogComments(request, response)`
- API endpoint: `GET /api/blog/:blogPostId/comments`
- Gauna visus komentarus pagal straipsnio ID
- Rūšiuoja nuo naujausių (DESC)
- Grąžina JSON: `{ success: true, blogComments: [...] }`

#### `createNewBlogComment(request, response)`
- API endpoint: `POST /api/blog/:blogPostId/comments`
- Validacija:
  - `authorName` - min 2 simboliai
  - `commentContent` - min 5 simboliai
- Sukuria komentarą su UUID
- Grąžina JSON: `{ success: true, message: "...", comment: {...} }`
- Klaidos: 400 (validacija), 500 (serverio klaida)

---

## 🛣️ Routes (Maršrutų Sluoksnis)

### `blogRoutes.js`

**Prefix:** `/blog`

**Maršrutai:**
- `GET /blog` → `getBlogList()` - Straipsnių sąrašo puslapis
- `GET /blog/:slug` → `getBlogDetail()` - Konkretaus straipsnio puslapis

### `api/commentRoutes.js`

**Prefix:** `/api`

**Maršrutai:**
- `GET /api/blog/:blogPostId/comments` → `getBlogComments()` - Gauti komentarus
- `POST /api/blog/:blogPostId/comments` → `createNewBlogComment()` - Sukurti komentarą

### `api/index.js`

**Funkcija:** Agregatorius, jungiantis visus API maršrutus

---

## 🛠️ Utils (Pagalbinės Funkcijos)

### `slugify.js`

**Paskirtis:** Konvertuoja lietuvišką tekstą į URL-friendly formatą

**Veikimas:**
1. Paverčia į lowercase
2. Pašalina specialius simbolius (palieka lietuviškas raides: ėąčęįšųūž)
3. Tarpus pakeičia į `-`
4. Pašalina pasikartojančius `-`

**Pavyzdys:**
```javascript
slugify("TOP lavinamieji žaislai kūdikiui iki 3 mėnesių")
// → "top-lavinamieji-žaislai-kūdikiui-iki-3-mėnesių"
```

### `generateUUID.js`

**Paskirtis:** Generuoja UUID v4 formato unikalų identifikatorių

**Naudojimas:** Komentarų `commentId` generavimui

**Formato pavyzdys:** `550e8400-e29b-41d4-a716-446655440000`

---

## 🎨 Views (Vaizdavimo Sluoksnis)

### Partials (Pakartojami Komponentai)

#### `head.ejs`
- HTML dokumento `<head>` sekcija
- Meta tags (charset, viewport)
- CSS stilių įtraukimas (`/css/style.css`)
- Dinaminis `<title>` iš kontrolerio

#### `nav.ejs`
- Navigacijos meniu
- Iteruoja per `app.locals.menu` masyvą
- Generuoja `<ul><li><a>` struktūrą

#### `footer.ejs`
- Footer sekcija
- Uždaro HTML struktūrą

#### `main.ejs`
- Pagrindinis layout wrapper (jei naudojamas)

### Pages (Pilni Puslapiai)

#### `blog.ejs` - Straipsnių Sąrašas

**Funkcionalumas:**
- Įtraukia `head` ir `nav` partials
- Iteruoja per `blogs` masyvą
- Kiekvienam straipsniui:
  - Generuoja slug inline (lines 7-11)
  - Rodo nuotrauką
  - Rodo pavadinimą su nuoroda
  - Trumpina tekstą iki 160 simbolių
  - Rodo autorių
  - Nuoroda "Perskaityti visą tekstą"

**Grid Layout:** `.blog_cards` klasė su kortomis

#### `blog-detail.ejs` - Detalus Straipsnis

**HTML struktūra:**
- Straipsnio nuotrauka (pilno dydžio)
- Pilnas pavadinimas
- Autorius
- Pilnas turinys
- Nuoroda atgal į sąrašą

**Komentarų sistema (lines 19-179):**

##### HTML dalis:
- Komentarų forma su laukais:
  - `authorName` (text input, min 2 simboliai)
  - `commentContent` (textarea, min 5 simboliai)
  - Submit mygtukas
- Komentarų sąrašo konteineris `#commentsList`

##### JavaScript dalis (`CommentSystem` klasė):

**`constructor(blogPostId)`**
- Inicializuoja su straipsnio ID
- Iškviečia `init()`

**`init()`**
- Įkelia esamus komentarus (`loadComments()`)
- Prijungia formos submit event listenerį

**`loadComments()`**
- Fetch API: `GET /api/blog/${blogPostId}/comments`
- Gauna JSON atsakymą
- Perduoda duomenis į `displayComments()`

**`handleSubmit(event)`**
- `preventDefault()` - sustabdo formos siuntimą
- Surenka FormData
- Fetch API: `POST /api/blog/${blogPostId}/comments`
- Headers: `Content-Type: application/json`
- Body: JSON su `authorName` ir `commentContent`
- Sėkmės atveju:
  - Išvalo formą (`reset()`)
  - Perkrauna komentarus
  - Rodo pranešimą
- Klaidos atveju: rodo klaidos pranešimą

**`displayComments(blogComments)`**
- Generuoja HTML iš komentarų masyvo
- Jei tuščias: rodo "Dar nėra komentarų"
- Kiekvienam komentarui:
  - Autorius (bold)
  - Data/laikas (formatuota)
  - Turinys
- Naudoja `escapeHtml()` XSS apsaugai

**`formatDate(dateString)`**
- Konvertuoja į lietuvišką formatą
- Pavyzdys: "2024-10-15 18:30"

**`escapeHtml(text)`**
- Apsauga nuo XSS atakų
- Konvertuoja HTML simbolius į tekstą

**`showMessage(message, type)`**
- Rodo sėkmės/klaidos pranešimus
- Klasės: `.message-success` arba `.message-error`
- Auto-remove po 5 sekundžių

**Inicijavimas:**
- `DOMContentLoaded` event
- Gauna `blogId` iš EJS: `<%= blogId %>`
- Sukuria `new CommentSystem(blogPostId)`

---

## 🔄 Duomenų Srautai

### 1. Straipsnių Sąrašo Rodymas

```
GET /blog
    ↓
app.js (line 22) → blogRoutes
    ↓
blogRoutes.js (line 6) → getBlogList()
    ↓
blogController.js → gauna blogs iš blogModel
    ↓
res.render('pages/blog', { title, blogs })
    ↓
blog.ejs → iteruoja ir rodo korteles
    ↓
HTML → Naršyklė
```

### 2. Konkretaus Straipsnio Rodymas

```
GET /blog/top-lavinamieji-zaislai
    ↓
blogRoutes.js (line 7) → getBlogDetail(slug)
    ↓
blogController.js:
  - Suranda straipsnį pagal slug
  - Apskaičiuoja blogId (index + 1)
    ↓
res.render('blog-detail', { title, blog, blogId })
    ↓
blog-detail.ejs → rodo straipsnį
    ↓
HTML + JavaScript → Naršyklė
    ↓
DOMContentLoaded → new CommentSystem(blogId)
    ↓
Automatiškai fetch GET /api/blog/1/comments
```

### 3. Komentarų Įkėlimas

```
JavaScript: fetch GET /api/blog/1/comments
    ↓
app.js (line 26) → /api prefix
    ↓
api/index.js (line 8) → commentRoutes
    ↓
commentRoutes.js (line 6) → getBlogComments()
    ↓
blogCommentController.js:
  - Gauna komentarus iš blogCommentModel
  - Filtruoja pagal blogPostId
  - Rūšiuoja DESC pagal createdAtDate
    ↓
JSON: { success: true, blogComments: [...] }
    ↓
JavaScript → displayComments()
    ↓
Generuoja HTML ir įterpia į #commentsList
```

### 4. Naujo Komentaro Kūrimas

```
Vartotojas užpildo formą + submit
    ↓
JavaScript: event.preventDefault()
    ↓
Surenka FormData → JSON object
    ↓
fetch POST /api/blog/1/comments
  Headers: { 'Content-Type': 'application/json' }
  Body: { authorName: "...", commentContent: "..." }
    ↓
commentRoutes.js (line 9) → createNewBlogComment()
    ↓
blogCommentController.js:
  - Validuoja duomenis (min ilgiai)
  - Klaidos atveju: 400 su klaidos pranešimu
    ↓
blogCommentModel.createBlogComment():
  - Generuoja UUID (generateUUID())
  - parseInt(blogPostId)
  - trim() vardui ir turiniui
  - new Date() sukūrimo laikui
  - push į blogComments[]
    ↓
JSON: { success: true, message: "...", comment: {...} }
    ↓
JavaScript:
  - form.reset()
  - loadComments() → perkrauna sąrašą
  - showMessage('Sėkmingai!', 'success')
```

---

## 🚀 Serverio Paleidimas

```bash
# Paleisti serverį
node app.js

# Arba su nodemon (auto-restart)
nodemon app.js
```

**URL:** http://localhost:3000

---

## 📌 Pagrindiniai URL Endpoints

### Puslapiai (SSR - Server Side Rendering)
- `GET /` - Pagrindinis puslapis (index.ejs)
- `GET /blog` - Straipsnių sąrašas
- `GET /blog/:slug` - Konkretus straipsnis
- `GET /toys` - Žaislų puslapis
- `GET /toy-rent` - Žaislų nuoma
- `GET /contact` - Kontaktai
- `GET /services` - Paslaugos

### API Endpoints (JSON responses)
- `GET /api/blog/:blogPostId/comments` - Gauti komentarus
- `POST /api/blog/:blogPostId/comments` - Sukurti komentarą

### Statiniai failai
- `/css/*` - Stilių failai
- `/images/*` - Nuotraukos
- `/js/*` - JavaScript failai
- `/assets/*` - Kiti statiniai failai

---

## ✅ Implementuotos Funkcijos

1. ✅ **Navigacijos sistema** - Dinaminis meniu iš `app.locals.menu`
2. ✅ **Tinklaraštis** - Straipsnių sąrašas ir detalūs puslapiai
3. ✅ **URL slugs** - SEO-friendly URL su lietuviškomis raidėmis
4. ✅ **Komentarų sistema:**
   - Komentarų rodymas
   - Komentarų pridėjimas (real-time)
   - Rūšiavimas pagal datą
   - Validacija (frontend + backend)
   - XSS apsauga
5. ✅ **RESTful API** - JSON endpoints komentarams
6. ✅ **404 error handling** - Custom 404 puslapis
7. ✅ **MVC architektūra** - Aiški struktūra
8. ✅ **EJS partials** - Pakartojamų komponentų sistema

---

## 🔒 Saugumo Aspektai

### XSS Apsauga
- `escapeHtml()` funkcija blog-detail.ejs
- Konvertuoja HTML simbolius prieš renderinant komentarus

### Duomenų Validacija
- Backend: Minimum ilgiai (authorName >= 2, commentContent >= 5)
- Frontend: HTML5 validacija (required, minlength)
- trim() funkcijos - pašalina tarpus

### UUID Generavimas
- Unikalūs ID komentarams
- UUID v4 standartas
- Apsaugo nuo ID atspėjimo

---

## 📊 Duomenų Saugojimas

**Dabartinis sprendimas:** In-memory masyvas

**Privalumai:**
- Greitas
- Paprastas development'ui
- Nereikalauja DB setup

**Trūkumai:**
- Duomenys prarandami restart'inant serverį
- Negalima horizontal scaling
- Ribotas duomenų kiekis

**Ateityje:** MongoDB, PostgreSQL arba MySQL

---

## 🎨 Frontend Technologijos

- **HTML5** - Semantinė struktūra
- **CSS3** - Stilizacija (`/public/css/style.css`)
- **Vanilla JavaScript** - Komentarų sistema
- **Fetch API** - Asynchronous HTTP užklausos
- **EJS** - Template rendering
- **No frameworks** - Nėra React, Vue, Angular

---

## 🔧 Galimi Patobulinimai

1. **Duomenų bazė** - MongoDB/PostgreSQL integravimas
2. **Autentifikacija** - Vartotojų registracija/prisijungimas
3. **Admin panel** - Straipsnių valdymas
4. **Komentarų trynimas** - DELETE endpoint
5. **Komentarų redagavimas** - PUT endpoint
6. **Pagination** - Straipsniams ir komentarams
7. **Search funkcija** - Paieška straipsniuose
8. **Kategorijos** - Straipsnių grupavimas
9. **Likes/Dislikes** - Komentarų vertinimas
10. **File upload** - Nuotraukų įkėlimas
11. **SEO optimizacija** - Meta tags, sitemap.xml
12. **Responsive design** - Mobile-first approach
13. **Loading states** - Skeleton screens
14. **Error boundaries** - Geresnė klaidų apdorojimas
15. **Rate limiting** - API apsauga nuo spam
16. **CSRF protection** - Cross-site request forgery apsauga
17. **Environment variables** - .env failas konfigūracijai
18. **Logging** - Winston/Morgan integracija
19. **Testing** - Jest/Mocha unit ir integration testai
20. **CI/CD** - Automated deployment

---

## 📚 Mokymosi Temos Projekte

1. **Express.js fundamentals** - Routing, middleware
2. **EJS templating** - Server-side rendering
3. **RESTful API design** - GET, POST endpoints
4. **MVC pattern** - Separation of concerns
5. **Fetch API** - Async/await
6. **DOM manipulation** - JavaScript classes
7. **Form handling** - Client & server validation
8. **Data modeling** - In-memory storage
9. **Error handling** - Try/catch, HTTP status codes
10. **URL routing** - Dynamic parameters, slugs

---

## 📞 Kontaktai

**Projekto autorius:** Simonas  
**Projekto paskirtis:** Node.js mokymasis ir praktika

---

*Dokumentacija atnaujinta: 2024-10-15*





