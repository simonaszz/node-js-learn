# Projekto dokumentacija (mokymuisi)

## Apžvalga

- **Technologijos**: Express (serveris, EJS vaizdai), Mongoose (MongoDB ODM), EJS (šablonai).
- **Duomenų bazė**: MongoDB Atlas (DB: `blogdb`).
- **Srautas**: Naršyklės užklausos → Routes → Controllers → Models (MongoDB) → EJS Views.

---

## Failų / katalogų struktūra

- **`app.js`** – Aplikacijos konfigūracija, DB prisijungimas, maršrutų registracija, serverio startas.
- **`src/models/`** – Mongoose modeliai:
  - `blog.js` – Blog įrašų schema ir modelis `Blog`.
  - `blogComment.js` – Komentarų schema ir modelis `BlogComment` su `replies`.
- **`src/controllers/`** – Verslo logika:
  - `blogController.js` – sąrašas, detalė, kūrimas, trynimas.
  - `blogCommentController.js` – komentarų gavimas/sukūrimas, atsakymų į komentarus kūrimas.
- **`src/routes/`** – Maršrutai:
  - `blogRoutes.js` – UI (EJS) maršrutai `/blog`, `/blog/:id`.
  - `routes/api/` → `index.js`, `commentRoutes.js` – API maršrutai komentarams.
- **`views/pages/`** – EJS vaizdai:
  - `blog.ejs` – visų įrašų sąrašas.
  - `blog-detail.ejs` – vieno įrašo detalė, komentarai, atsakymai, formos.
- **`src/middleware/logger.js`** – paprastas request logger.
- **`scripts/migrate_to_mongo.js`** – duomenų migracijos skriptas iš senų šaltinių į Mongo.

---

## DB prisijungimas (`app.js`)

- Vienas prisijungimo taškas ir serverio startas tik po sėkmės:
```js
const mongoose = require('mongoose');
const dbURI = 'mongodb+srv://simonas:***@cluster0.kpkgza3.mongodb.net/blogdb?...';

mongoose.connect(dbURI)
  .then(() => {
    console.log('prisijungta');
    app.listen(PORT, () => console.log(`Serveris veikia http://localhost:${PORT}`));
  })
  .catch(err => console.log(err));
```
- Kodėl taip? Kad serveris neklausytų prievado be DB.

---

## Modeliai

### `src/models/blog.js`

- Schema (supaprastinta):
```js
const blogSchema = new Schema({
  title: { type: String, required: true, trim: true },
  snippet: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  author: { type: String, default: 'Anonimas', trim: true },
  image: { type: String, default: '/images/default-blog.png', trim: true }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }});
```
- Modelis: `module.exports = mongoose.model('Blog', blogSchema)`
- Paskirtis: CRUD operacijos su kolekcija `blogs`.

### `src/models/blogComment.js`

- `blogPostId: ObjectId` (ref: `Blog`), `authorName`, `commentContent`, `createdAtDate`.
- `replies`: masyvas su `replyId`, `authorName`, `replyContent`, `createdAtDate`.
- Modelis: `module.exports = mongoose.model('BlogComment', blogCommentSchema)`
- Paskirtis: komentarų ir jų atsakymų saugojimas kolekcijoje `blogComments`.

---

## Kontroleriai

### `src/controllers/blogController.js`

- **`getBlogList(req, res)`**
  - `const blogDocs = await Blog.find().sort({ createdAt: -1 })`
  - Map’ina `_id` → `id` suderinamumui su EJS ir renderina `views/pages/blog.ejs`.
- **`getBlogDetail(req, res)`**
  - `const blogDoc = await Blog.findById(req.params.id)`; 404 jei neranda.
  - Paduoda `blog` ir `blogId` į `views/pages/blog-detail.ejs`.
- **`showCreateForm(req, res)`** – rodo `views/pages/create` (forma).
- **`createNewBlog(req, res)`**
  - Validuoja `title`, `snippet`, `body`.
  - `await Blog.create({...})`; redirect į `/blog/<_id>`.
- **`deleteBlogPost(req, res)`**
  - `await Blog.findByIdAndDelete(id)`; grąžina JSON su `redirectUrl`.

### `src/controllers/blogCommentController.js`

- **`getBlogComments(req, res)`**
  - Tikrina `blogPostId` (`ObjectId`).
  - `BlogComment.find({ blogPostId }).sort({ createdAtDate: -1 })` → JSON.
- **`createNewBlogComment(req, res)`**
  - Validuoja `authorName`, `commentContent`.
  - `BlogComment.create({ blogPostId, authorName, commentContent })` → JSON 201.
- **`addReplyToComment(req, res)`**
  - Validuoja `blogPostId`, `commentId`, laukus.
  - `findOneAndUpdate({ _id: commentId, blogPostId }, { $push: { replies: {...} } }, { new: true })` → JSON 201.

---

## Maršrutai

### `src/routes/blogRoutes.js`

- `GET /blog` → `getBlogList`
- `GET /blog/:id` → `getBlogDetail`
- `DELETE /blog/:id` → `deleteBlogPost`

### `src/routes/api/commentRoutes.js`

- `GET /api/blog/:blogPostId/comments` → komentarų sąrašas.
- `POST /api/blog/:blogPostId/comments` → sukurti komentarą.
- `POST /api/blog/:blogPostId/comments/:commentId/replies` → sukurti atsakymą komentarui.

---

## Vaizdai (EJS)

### `views/pages/blog.ejs`

- Rodo korteles su `image`, `title`, `snippet`, `author`, `createdAt`.
- Nuorodos į detalę: `/blog/<%= blog.id %>`.

### `views/pages/blog-detail.ejs`

- Rodo vieną blog įrašą (`title`, `author`, `createdAt`, `body`).
- **Komentarų forma** (komentaro kūrimui) → POST `/api/blog/<blogId>/comments`.
- **Komentarų sąrašas**:
  - Kraunamas per JS: `GET /api/blog/<blogId>/comments`.
  - Rodo kiekvieną komentarą ir jo **atsakymus (replies)**.
  - Po kiekvienu komentaru – mygtukas „Atsakyti į šį komentarą“, kuris atveria mini formą → POST `/api/blog/<blogId>/comments/<commentId>/replies`.
- Po sėkmingo siuntimo – formos reset, paslepiama, komentarai persikrauna, rodoma žinutė.

---

## Middleware

- **`src/middleware/logger.js`**
  - Logina metodą/kelią/IP. Naudinga diagnostikai.

---

## Migracija (`scripts/migrate_to_mongo.js`)

- Tikslas: importuoti senus blogus ir komentarus į MongoDB.
- **Šaltiniai**:
  - Blogai – `data/blogs.json` (jei DB tuščia, sukelia į `blogs`).
  - Komentarai – `src/models/blogCommentModel.js` (jei kolekcija `blogComments` tuščia, perkelia ir susieja per blog ID map’ą).
- **Naudojimas**:
```bash
node scripts/migrate_to_mongo.js
```
- Saugikliai nuo dublikatų: jei DB/komentarų kolekcija jau turi įrašų – praleidžia importą.

---

## Tipiniai scenarijai

- **Rodyti sąrašą**: `/blog` → `getBlogList()` → `Blog.find()` → `blog.ejs`.
- **Rodyti detalę**: `/blog/:id` → `getBlogDetail()` → `Blog.findById()` → `blog-detail.ejs`.
- **Sukurti įrašą**: `/create` (POST) → `createNewBlog()` → `Blog.create()` → redirect.
- **Trinti įrašą**: JS fetch DELETE → `deleteBlogPost()` → `Blog.findByIdAndDelete()` → JSON + redirect.
- **Gauti komentarus**: `GET /api/blog/:id/comments` → `getBlogComments()`.
- **Sukurti komentarą**: `POST /api/blog/:id/comments` → `createNewBlogComment()`.
- **Atsakyti į komentarą**: `POST /api/blog/:id/comments/:commentId/replies` → `addReplyToComment()`.

---

## Naudingi patarimai

- **ObjectId vs skaičius**: dabar naudojami Mongo `ObjectId` (string reprezentacija). EJS suderinamumui `_id` map’inamas į `id`.
- **Saugumas**: DB URI laikyti `.env` (`MONGODB_URI=...`) ir kodo faile naudoti `process.env.MONGODB_URI`.
- **UI tobulinimas**: jei reikia, papildykite CSS `public/css/blog.css` (`.reply-box`, `.replies-title`, `.toggle-reply`, `.reply-form`).

---

## Ką galima pašalinti (po migracijos)

- `src/models/blogModel.js` – senas JSON modelis.
- `src/models/blogCommentModel.js` – senas in-memory komentarų modelis.
- `src/utils/generateUUID.js` – jei daugiau nenaudojamas.
- `data/blogs.json` – jau pašalintas (nebenaudojamas po perėjimo į Mongo).

---

## Greitos komandos

- Startas (su nodemon):
```bash
nodemon app
```
- Migracija:
```bash
node scripts/migrate_to_mongo.js
```
- Priklausomybės (jei trūksta):
```bash
npm i mongoose dotenv
```

---

## Klausimai / tobulinimas

- Pridėti JSON API blogams (`GET /api/blogs`, `GET /api/blogs/:id`)?
- Pridėti puslapiavimą sąraše (`Blog.find().limit().skip()`).
- Patobulinti komentarų/atsakymų UI (collapse/expand, geresni laikai ir pan.).
