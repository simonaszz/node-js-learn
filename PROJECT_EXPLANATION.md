# Projekto paaiškinimas (kaip vaikui)

Šitas projektas yra mažas tinklaraštis (blog) su komentarais. Jis veikia taip:
- Serveris parašytas su Node.js ir Express.
- Duomenys (blog įrašai ir komentarai) saugomi MongoDB duomenų bazėje per Mongoose.
- Puslapiai (HTML) sugeneruojami su EJS šablonais.
- Yra „frontendas“ (naršyklėje esantis JavaScript) komentarams užkrauti ir siųsti.

Žemiau – paprastas, bet labai detalus paaiškinimas, kaip viskas susiję ir ką kuris failas daro.

---

## Greita projekto struktūra

- `app.js` – pagrindinis serverio failas (paleidžia Express, sujungia viską į vieną).
- `src/models/` – Mongoose modeliai (duomenų struktūros):
  - `blog.js` – blog įrašas.
  - `blogComment.js` – blog komentaro įrašas (su „replies“ sąrašu).
- `src/controllers/` – „smegenys“, kurios priima užklausas ir grąžina atsakymus:
  - `blogController.js` – logika blog sąrašui, detalei, kūrimui, trynimui.
  - `blogCommentController.js` – logika komentarų gavimui/kūrimui/atsakymams.
- `src/routes/` – URL keliai (kas į kurį kontrolerį nuveda):
  - `blogRoutes.js` – puslapiai po `/blog`.
  - `api/` – API keliai (pvz., komentarai po `/api/...`).
- `src/middleware/logger.js` – tarpinė programa, kuri kiekvieną užklausą išspausdina į konsolę.
- `views/` – EJS šablonai (HTML puslapiai):
  - `pages/blog.ejs` – visų įrašų sąrašas.
  - `pages/blog-detail.ejs` – vieno įrašo puslapis + komentarų UI.
  - `pages/create.ejs` – forma naujam įrašui sukurti.
  - `pages/404.ejs`, `pages/index.ejs`, ir pan.

---

## Pagrindinis serveris: `app.js`

Ką daro:
- Užkrauna bibliotekas: `express`, `path`, `mongoose`, `dotenv`.
- Užregistruoja middleware (pvz., `logger`, `express.json()` ir pan.).
- Nustato EJS kaip šablonų variklį.
- Prijungia routes (kelius): `/blog`, `/create`, `/api`.
- Prijungia prie MongoDB per `mongoose.connect(...)` ir tik tada paleidžia serverį.

Pavyzdys (trumpai):
```js
const logger = require('./src/middleware/logger');
app.use(logger); // visų užklausų logai

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const blogRoutes = require('./src/routes/blogRoutes');
app.use('/blog', blogRoutes);

const { showCreateForm, createNewBlog } = require('./src/controllers/blogController');
app.get('/create', showCreateForm);
app.post('/create', createNewBlog);

const apiRoutes = require('./src/routes/api');
app.use('/api', apiRoutes);
```

Idėja paprasta: kai ateina užklausa, Express suranda atitinkamą route, kviečia kontrolerį, o šis – modelį (DB), tada gražina HTML arba JSON.

---

## Duomenų modeliai (DB struktūra) su Mongoose: `src/models/`

### `Blog` modelis: `src/models/blog.js`

- Tai aprašo, kokius laukus turi kiekvienas blog įrašas.
- `title`, `snippet`, `body` yra privalomi, `author` ir `image` – neprivalomi (turi „default“).
- `timestamps` automatiškai pildo `createdAt` ir `updatedAt`.

Trumpas vaizdas:
```js
const blogSchema = new Schema({
  title: { type: String, required: true, trim: true },
  snippet: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  author: { type: String, default: 'Anonimas', trim: true },
  image: { type: String, default: '/images/default-blog.png', trim: true }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});
```

### `BlogComment` modelis: `src/models/blogComment.js`

- Komentaras priklauso kokiam nors blog įrašui per `blogPostId` (tai `Blog` dokumento `_id`).
- Komentare yra autoriaus vardas, tekstas, data ir sąrašas `replies` (atsakymai). Kiekvienas `reply` turi savo `authorName`, `replyContent`, `createdAtDate` ir sugeneruotą `replyId`.

Trumpas vaizdas:
```js
const blogCommentSchema = new Schema({
  blogPostId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  authorName: { type: String, required: true, trim: true },
  commentContent: { type: String, required: true, trim: true },
  createdAtDate: { type: Date, default: Date.now },
  replies: { type: [replySchema], default: [] }
});
```

---

## Keliai (Routes): `src/routes/`

### `blogRoutes.js`

- `GET /blog` – rodo visų įrašų sąrašą (HTML puslapis).
- `GET /blog/:id` – rodo vieną įrašą pagal ID (HTML puslapis).
- `DELETE /blog/:id` – ištrina įrašą (grąžina JSON su `success` ir `redirectUrl`).

Kodas (sutrumpintas):
```js
router.get('/', getBlogList);
router.get('/:id', getBlogDetail);
router.delete('/:id', deleteBlogPost);
```

### API komentarams: `src/routes/api/index.js` ir `src/routes/api/commentRoutes.js`

- `GET /api/blog/:blogPostId/comments` – gražina komentaro masyvą JSON formatu.
- `POST /api/blog/:blogPostId/comments` – sukuria naują komentarą (JSON atsakymas).
- `POST /api/blog/:blogPostId/comments/:commentId/replies` – prideda atsakymą (reply) prie konkretaus komentaro (JSON atsakymas).

Kodas:
```js
// src/routes/api/commentRoutes.js
router.get('/blog/:blogPostId/comments', getBlogComments);
router.post('/blog/:blogPostId/comments', createNewBlogComment);
router.post('/blog/:blogPostId/comments/:commentId/replies', addReplyToComment);
```

---

## Kontroleriai (Controllers): `src/controllers/`

### `blogController.js`

- **`getBlogList`** – nuskaito visus įrašus iš MongoDB: `Blog.find().sort({ createdAt: -1 })`.
  - Pakeičia `_id` į patogesnį `id` ir perduoda į `views/pages/blog.ejs` kaip `blogs` masyvą.
- **`getBlogDetail`** – nuskaito vieną įrašą pagal ID: `Blog.findById(blogId)`.
  - Jei neranda – grąžina `404` puslapį.
  - Jei randa – renderina `views/pages/blog-detail.ejs` su `blog` ir `blogId`.
- **`showCreateForm`** – parodo formą naujam įrašui: `views/pages/create.ejs`.
- **`createNewBlog`** – priima formos duomenis (`POST /create`), validuoja, kuria per `Blog.create(...)` ir daro `redirect` į naujo įrašo puslapį.
- **`deleteBlogPost`** – ištrina įrašą per `Blog.findByIdAndDelete(blogId)`, grąžina JSON, kurį frontend’as naudoja redirect’ui į sąrašą.

Pavyzdys (sutrumpintas):
```js
const blogDocs = await Blog.find().sort({ createdAt: -1 });
const blogs = blogDocs.map(doc => ({ ...doc.toObject(), id: doc._id.toString() }));
response.render('pages/blog', { title: 'Tinklaraštis', blogs });
```

### `blogCommentController.js`

- **`getBlogComments`** – grąžina komentarų sąrašą JSON formatu pagal `blogPostId`:
  ```js
  const blogComments = await BlogComment
    .find({ blogPostId: new mongoose.Types.ObjectId(blogPostId) })
    .sort({ createdAtDate: -1 })
    .lean();
  response.json({ success: true, blogComments });
  ```
- **`createNewBlogComment`** – sukuria naują komentarą (validuoja, ar yra `authorName` ir `commentContent`).
- **`addReplyToComment`** – prideda atsakymą prie komentaro su `$push` į `replies` masyvą ir grąžina atnaujintą komentarą.

---

## Vaizdai (Views): `views/pages/`

### `blog.ejs` – visų įrašų sąrašas
- Parodo korteles su pavadinimu, santrauka, autoriumi, data, paveiksliuku.
- Mygtukas „Sukurti Naują Įrašą“ veda į `/create`.
- Paspaudus ant kortelės – atidaromas detalus puslapis `/blog/:id`.

### `blog-detail.ejs` – vieno įrašo puslapis + komentarai
- Parodo vieno įrašo turinį.
- Turi mygtuką „Ištrinti įrašą“, kuris kviečia `DELETE /blog/:id` per `fetch`.
- Turi komentarų formą ir komentarų sąrašo vietą.
- Viduje yra naršyklės JavaScript klasė `CommentSystem`, kuri:
  - Užkrauna komentarus: `GET /api/blog/:blogPostId/comments`.
  - Pateikia naują komentarą: `POST /api/blog/:blogPostId/comments`.
  - Leidžia atsakyti į konkretų komentarą: `POST /api/blog/:blogPostId/comments/:commentId/replies`.

Trumpas fragmentas:
```js
const response = await fetch(`/api/blog/${this.blogPostId}/comments`);
const data = await response.json();
if (data.success) {
  this.displayComments(data.blogComments);
}
```

### `create.ejs` – naujo įrašo kūrimo forma
- Siunčia formą `POST /create`.
- Serveris validuoja ir sukuria naują įrašą, po to nukreipia į `/blog/:id`.

---

## Middleware: `src/middleware/logger.js`

- Kiekvieną užklausą atspausdina į konsolę, pvz.:
```
[2025-10-22T16:00:00.000Z] GET /blog - IP: ::1
```
- Padeda debug’inti – matosi, kas atėjo į serverį.

---

## Kaip vyksta visas kelias (duomenų srautas)

Pavyzdys: atidarai blog sąrašą (`GET /blog`)
1. Naršyklė prašo `/blog`.
2. `app.js` perduoda į `blogRoutes.js`, ten `router.get('/', getBlogList)`.
3. `blogController.getBlogList()` kviečia DB: `Blog.find().sort(...)`.
4. Gauti duomenys (masyvas) paduodami į `views/pages/blog.ejs`.
5. EJS sugeneruoja HTML ir naršyklė jį parodo.

Pavyzdys: atidarai įrašą (`GET /blog/:id`)
1. Naršyklė prašo `/blog/656...`.
2. `blogController.getBlogDetail()` kviečia DB: `Blog.findById(id)`.
3. Jei randa – renderina `blog-detail.ejs`.
4. Tas puslapis turi JS, kuris paprašo komentarų iš `/api/blog/:id/comments`.

Pavyzdys: parašai komentarą
1. Užpildai formą puslapyje `blog-detail.ejs`.
2. JS išsiunčia `POST /api/blog/:id/comments` su `authorName` ir `commentContent`.
3. Serveris (`blogCommentController.createNewBlogComment`) validuoja ir `BlogComment.create(...)` įrašo DB.
4. Grąžina `{ success: true, comment: ... }` ir puslapis persikrauna komentarus.

Pavyzdys: ištrini įrašą
1. Paspaudi „Ištrinti Įrašą“.
2. JS iškviečia `DELETE /blog/:id`.
3. Serveris `Blog.findByIdAndDelete(id)` ištrina ir grąžina JSON su `redirectUrl`.
4. Frontendas peradresuoja atgal į `/blog`.

---

## Kaip nuskaitomi duomenys iš DB?

- Visų įrašų sąrašas – kaip masyvas:
  ```js
  const blogDocs = await Blog.find().sort({ createdAt: -1 });
  const blogs = blogDocs.map(doc => ({ ...doc.toObject(), id: doc._id.toString() }));
  ```
- Vienas įrašas – pagal ID:
  ```js
  const blogDoc = await Blog.findById(blogId);
  ```
- Komentarai – masyvas pagal blog įrašo ID:
  ```js
  const blogComments = await BlogComment
    .find({ blogPostId: new mongoose.Types.ObjectId(blogPostId) })
    .sort({ createdAtDate: -1 })
    .lean();
  ```

---

## Kaip paleisti projektą

1. Įsidiek priklausomybes:
   ```bash
   npm install
   ```
2. Paleisk serverį:
   ```bash
   npm start
   # arba
   node app.js
   ```
3. Atverk naršyklę:
   - Pagrindinis: `http://localhost:3000/`
   - Tinklaraštis: `http://localhost:3000/blog`
   - Kurti naują: `http://localhost:3000/create`

Pastaba: DB prisijungimas vyksta `app.js` faile su `mongoose.connect(...)`. Rekomenduojama realiam projekte laikyti DB prisijungimo URL `.env` faile.

---

## Naudingi patarimai mokantis

- Jei nerodo puslapio – žiūrėk terminalo konsolę (logger middleware padės pamatyti, kokia užklausa atėjo ir ar buvo klaidų).
- Jei API grąžina klaidą – atsidaryk naršyklės „Network“ skiltį (DevTools) ir žiūrėk atsakymus.
- Jei DB neatpažįsta ID – patikrink, ar `:id` yra teisingas MongoDB `ObjectId`.
- Jei puslapis „tuščias“ – patikrink, ar kontroleris tikrai paduoda duomenis į `res.render(...)`.

---

## Santrauka

- **Routes** nurodo, kuris URL kviečia kurį **Controller**.
- **Controllers** paima užklausą, kreipiasi į **Models** (DB), ir grąžina **Views** (HTML) arba JSON.
- **Models** aprašo, kaip atrodo duomenys ir kaip su jais dirbti MongoDB.
- **Views (EJS)** sugeneruoja HTML iš duomenų.
- **Frontend JS** (pvz., `blog-detail.ejs`) kalbasi su **API** komentarams krauti ir siųsti.

Viskas tarpusavyje sujungta paprastai, kad būtų lengva suprasti ir toliau plėsti.
