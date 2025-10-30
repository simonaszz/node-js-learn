# Node.js + Express + MongoDB + EJS + OOP/DI: Mokomoji medžiaga

Skirta pradedančiajam (nuo ~14 m.) – aiškiai, paprastai ir su praktinėmis užduotimis.

Tikslas: nuo 0 iki veikiamos aplikacijos su:
- Express maršrutais
- OOP/DI architektūra (Router → Controller → Service → Model)
- EJS šablonais
- MongoDB (Mongoose)
- Sesijomis ir autentikacija (login/register/logout)
- UI smulkmenomis (CSS, navigacija, flash pranešimai)

---

## 1. Kas yra serveris ir kas yra Express?

- Serveris – programa, kuri laukia užklausų (requests) ir grąžina atsakymus (responses).
- Express – Node.js biblioteka, padedanti kurti serverį labai paprastai.

Pagrindinė idėja: „Jei ateina GET /, grąžink HTML“. Turime „maršrutų“ sąrašą, kur kiekvienas nurodo, ką daryti.

Pavyzdys:
```js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Labas, pasauli!');
});

app.listen(3000);
```

---

## 2. Failų struktūra ir OOP/DI idėja

- Model – darbas su DB (Mongoose).
- Service – verslo logika (hash, tikrinimai, skaičiavimai).
- Controller – HTTP sluoksnis: skaito `req`, kviečia Service, renderina atsakymą.
- Router – maršrutų žemėlapis (kuriai užklausai kurį Controller metodą kviesti).
- View – EJS šablonai, kaip atrodys puslapis.

Kodėl taip?
- „Vienos atsakomybės“ principas – lengviau suprasti ir prižiūrėti.
- Galima testuoti atskiras dalis.
- Dideli projektai taip skalės geriau.

---

## 3. EJS: kaip sugeneruoti HTML

EJS leidžia rašyti HTML su dinaminiais kintamaisiais ir sąlygomis.

Pavyzdys:
```ejs
<ul>
  <% items.forEach(it => { %>
    <li><%= it %></li>
  <% }) %>
</ul>
```
- `<% ... %>` – JS logika (be atvaizdavimo)
- `<%= ... %>` – įterpia reikšmę į HTML saugiu būdu

---

## 4. MongoDB ir Mongoose

- MongoDB – dokumentų (JSON) DB.
- Mongoose – schema + metodai darbui su Mongo.

Modelio pavyzdys (User):
```js
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
```

---

## 5. Sesijos: kaip atsiminti, kad aš prisijungęs?

- Sesija – serverio „užrašų knygutė“, kurioje galime įrašyti `req.session.user`.
- Express-session užkoduoja tik sesijos id slapuke (`connect.sid`).
- `connect-mongo` – išsaugo sesijas MongoDB.

Pagrindiniai nustatymai `app.js`:
```js
const session = require('express-session');
const MongoStore = require('connect-mongo');
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: 'sessions' }),
  cookie: { httpOnly: true, maxAge: 1000*60*60*24 }
}));
```

---

## 6. Autentikacija (login/register/logout) – kaip tai veikia?

1) Registracija:
- Patikriname laukus (ar email yra, slaptažodžio ilgis, ar sutampa `password2`).
- Pažiūrime, ar toks email jau DB.
- Su `bcrypt.hash` sukuriame `passwordHash`.
- Įrašome naudotoją į DB.
- Į `req.session.user` įrašome `{ id, email }` ir darome redirect.

2) Prisijungimas:
- Randame naudotoją pagal email.
- Su `bcrypt.compare` patikriname slaptažodį.
- Jei ok – įrašome `req.session.user` ir redirect.

3) Atsijungimas:
- `req.session.destroy(...)` + `res.clearCookie('connect.sid')` + `redirect('/')`.

---

## 7. Router → Controller → Service (praktinis pavyzdys)

Router (AuthRouter):
```js
class AuthRouter {
  constructor() {
    const service = new AuthService();
    this.controller = AutorizationController.fromDependencies(service);
    this.router = express.Router();
    this.initRoutes();
  }
  initRoutes() {
    this.router.get('/login', this.controller.loginPage.bind(this.controller));
    this.router.post('/login', this.controller.login.bind(this.controller));
    this.router.get('/register', this.controller.registerPage.bind(this.controller));
    this.router.post('/register', this.controller.register.bind(this.controller));
    // Palaikome abu variantus (pritaikyta projekte):
    this.router.get('/logout', this.controller.logout.bind(this.controller));
  }
  getRouter() { return this.router; }
}
```

Controller (AutorizationController):
```js
class AutorizationController {
  constructor(authService) { this.authService = authService; }
  static fromDependencies(authService) { return new AutorizationController(authService); }

  async login(req, res) {
    const result = await this.authService.login(req.body);
    if (!result.ok) return res.status(400).render('pages/login', { errors: result.errors, values: { email: req.body.email }, title: 'Prisijungimas', activePage: 'login' });
    req.session.user = result.user; res.redirect('/');
  }
  async register(req, res) {
    const result = await this.authService.register(req.body);
    if (!result.ok) return res.status(400).render('pages/register', { errors: result.errors, values: { email: req.body.email }, title: 'Registracija', activePage: 'register' });
    req.session.user = result.user; res.redirect('/');
  }
  logout(req, res) {
    req.session?.destroy(() => { res.clearCookie('connect.sid'); res.redirect('/'); });
  }
}
```

Service (AuthService):
```js
class AuthService {
  async register({ email, password, password2 }) { /* ...bcrypt, DB... */ }
  async login({ email, password }) { /* ...bcrypt.compare... */ }
}
```

---

## 8. EJS formos, klaidos ir UX

- Formos turi `method="post"` ir `action="/login"` ar `/register`.
- Jei yra klaidų – atvaizduojame sąrašą viršuje.
- Naudojame `values.email`, kad grąžinant klaidą nepradingtų įvestas email.
- Pridedame nedidelį „fade“ perėjimą tarp formų (gražesnis UX).

---

## 9. Profilis (/account) ir skydelis (/dashboard)

- `requireAuth` vidutinis sluoksnis: jei ne prisijungęs – redirect į `/login`.
- AccountService – gauna/atnaujina `firstName`, `lastName`, `phone`.
- AccountController – GET/POST logika.
- `account.ejs` – forma su laukais ir sėkmės pranešimu (flash).
- `dashboard.ejs` – bendras skydelis visiems prisijungusiems; adminams rodomos papildomos kortelės/funkcijos.

Flash idėja:
```js
// set
req.session.flash = { type: 'success', message: 'Paskyros duomenys išsaugoti.' };
// read-once in app.js middleware
if (req.session.flash) { res.locals.flash = req.session.flash; delete req.session.flash; }
```

---

## 10. Užduotys (praktika)

1) Sukurk „Change Password“ puslapį:
- GET /account/password – forma: currentPassword, newPassword, newPassword2
- POST /account/password – tikrink current (bcrypt.compare), validuok new (>=8, sutapimas), atnaujink hash
- Flash pranešimas po sėkmės.

2) Pridėk „Remember Me“:
- Login formoje checkbox.
- Jei pažymėta – nustatyk ilgesnį cookie maxAge (pvz., 30 dienų), jei ne – 1 diena.

3) Pridėk role lauką (user/admin) ir `requireRole('admin')` middleware:
- Sukurk `/admin` puslapį, pasiekiamą tik admin.

4) Sukurk validatorius (pvz., Joi) Auth ir Account duomenims:
- Atitrauk validacijas iš Service į atskirą sluoksnį.

---

## 11. Testinė viktorina (trumpi klausimai)

- Kuo skiriasi Controller ir Service? Ką kiekvienas daro?
- Kodėl saugome `passwordHash`, o ne `password`?
- Kam reikalingas `httpOnly` cookie nustatymas?
- Ką daro `bcrypt.compare`?
- Kodėl sesijų middleware turi būti prieš router’ius?
- Kaip EJS atvaizduoti klaidų sąrašą?
- Kam naudingas `res.locals.currentUser`?

---

## 12. Gerosios praktikos

- `.env` su `MONGO_URI` ir `SESSION_SECRET`, `.gitignore` turėtų ignoruoti `.env`.
- Neskleisk slaptažodžių/URL kode ar repozitorijoje.
- Validuok įvestis, rašyk aiškias klaidų žinutes.
- Logika – Service; Controller – tik HTTP.
- Paprasti, aiškūs šablonai (EJS) ir nuoseklus CSS.

---

## 13. Ką mokėmės

- Kaip veikia Express serveris ir maršrutai.
- Kaip sukurti OOP/DI architektūrą (Router → Controller → Service → Model).
- Kaip dirbti su EJS šablonais.
- Kaip naudoti MongoDB/Mongoose.
- Kaip sukurti autentikaciją ir sesijas.
- Kaip sukurti profilį su apsauga (`requireAuth`) ir flash pranešimais.

Sėkmės – eksperimentuok, klausk „kodėl“ ir pamažu kursi vis sudėtingesnius sprendimus!

---

## 14. HTTP pagrindai: kaip naršyklė kalbasi su serveriu

- Metodai: GET (gauti), POST (sukurti/siųsti), PUT (pakeisti), PATCH (dalinai pakeisti), DELETE (ištrinti).
- URL dalys: schema (http/https) + domenas + kelias (path) + užklausos parametrai (query `?a=1&b=2`).
- Būseno kodai (status):
  - 2xx – sėkmė (200 OK, 201 Created)
  - 3xx – peradresavimai (302 Found)
  - 4xx – kliento klaidos (400 Bad Request, 401 Unauthorized, 404 Not Found)
  - 5xx – serverio klaidos (500 Internal Server Error)
- Antraštės (headers):
  - `Content-Type` (pvz., `application/json`, `text/html`, `application/x-www-form-urlencoded`)
  - `Set-Cookie` ir `Cookie` – sesijų slapukai
- Kūnas (body): siunčiamas su POST/PUT/PATCH (forma ar JSON).

Patarimas: Chrome DevTools → Network – stebėk requests/response, status, headers, cookies ir timing.

## 15. Express middleware gyliau

- Middleware parašas: `(req, res, next) => { ...; next(); }`.
- Tvarka svarbi: kas užregistruota anksčiau, tas vykdoma anksčiau.
- Tipai:
  - Globalus `app.use(mw)`
  - Route lygmens `router.get('/x', mw, handler)`
  - Klaidos `app.use((err, req, res, next) => { ... })` – su 4 argumentais
- Keli middleware vienam route: `router.post('/login', validate, rateLimit, controller.login)`

Pavyzdys:
```js
function requireAuth(req, res, next) {
  if (!req.session?.user) return res.redirect('/login');
  next();
}
```

## 16. Routing gyliau

- Kelio parametrai: `/blog/:id` → `req.params.id`
- Užklausos parametrai: `/blog?page=2` → `req.query.page`
- Kelio eilė svarbi: specifiškesni maršrutai aukščiau, 404 – paskutinis.
- Tas pats kelias, skirtingas metodas: `GET /login` (forma), `POST /login` (pateikimas).

## 17. Body parsers ir formatai

- `application/x-www-form-urlencoded` – HTML formos numatytasis formatas.
- `application/json` – JSON API (naudok `express.json()`).
- Failų įkėlimui reikia multipart parserio (pvz., `multer`).

## 18. EJS gyliau

- Įtraukos: `partials` (head, nav, footer) – pakartotinai naudojamos dalys.
- Escaping: `<%= value %>` – saugus; `<%- html %>` – nebeescape'ina (atsargiai dėl XSS!).
- Sąlygos ir ciklai:
```ejs
<% if (items.length === 0) { %>
  <p>Tuščia</p>
<% } else { %>
  <ul>
    <% items.forEach(i => { %><li><%= i %></li><% }) %>
  </ul>
<% } %>
```

## 19. Mongoose gyliau

- Built-in validacijos: `required`, `minlength`, `maxlength`, `match`, custom validatoriai.
- Indeksai: `unique: true` + realus MongoDB indeksas – padeda greičiau ieškoti ir saugo nuo dublikatų.
- `lean()` – grąžina paprastus objektus (ne Mongoose dokumentus) greitesniam skaitymui.
- Atnaujinimas:
  - `findByIdAndUpdate(id, data, { new: true, runValidators: true })` – kad grąžintų atnaujintą ir tikrintų schemas.
- Transformacijos:
  - `toJSON`/`toObject` – paslėpti laukus (pvz., `passwordHash`) iš output (jei kurtum API).

## 20. Autentifikacija: teorija

- Slaptažodžiai – visada hash'inami (bcrypt). „Salt“ įterpiamas automatiškai, cost factor (pvz., 12) lėtina brute-force.
- Sesijos vs JWT:
  - Sesijos (šis projektas): paprasta, serveris saugo būseną (store), cookie turi tik id.
  - JWT: stateless, patogu microservisuose, bet sudėtingiau saugiai invaliduoti.
- Slapukų vėliavos:
  - `httpOnly` (nepasiekiamas JS), `secure` (tik per HTTPS), `sameSite` (apsauga nuo CSRF).

## 21. Saugumas

- XSS – nenaudok neescape'into HTML; naudok `<%= %>`.
- CSRF – kritinėms POST/PUT/DELETE naudok CSRF tokenus (pvz., `csurf`).
- Rate limiting – apribok bandymus (pvz., login): `express-rate-limit`.
- `helmet` – nustato saugias HTTP antraštes.

## 22. Klaidos ir logai

- Centralizuotas klaidų handleris (paskutinis middleware) – grąžina draugišką puslapį/log'ina klaidas.
- Loggeris (jau turi) – laikas, metodas, kelias, IP.

## 23. Rekomenduojamos užduotys (išplėsta)

- 1) Change Password
  - GET `/account/password`: forma `currentPassword`, `newPassword`, `newPassword2`.
  - POST: tikrink `currentPassword` (`bcrypt.compare`), naują (≥8, sutapimas), atnaujink `passwordHash`.
  - Flash „Slaptažodis atnaujintas“.

- 2) Remember Me (ilgesnė sesija)
  - Checkbox prie login formos.
  - Jei pažymėta – `cookie.maxAge = 30 dienų`, kitaip – 1 diena.

- 3) Roles/permissions
  - Į `User` pridėk `role: 'user' | 'admin'` (projete jau įgyvendinta).
  - `requireRole('admin')` middleware ir admin-only veiksmai.
  - Vienas įėjimo taškas: `/dashboard` (admin mato daugiau galimybių).

- 4) Email verifikacija
  - Laukas `emailVerified: Boolean`.
  - Sukurti verifikacijos tokeną ir siųsti el. paštu (pvz., `nodemailer`).

- 5) Password reset (pamestas slaptažodis)
  - „Pamiršai slaptažodį?“ → įrašai email → išsiunčia laikiną tokeną → puslapis slaptažodžiui atkurti.

- 6) Rate limit ir paskyros užrakinimas
  - Po 5 nesėkmingų login – 10 min laukimo.

- 7) Validacijos su Joi/Zod
  - Auth ir Account įvestims su aiškiomis žinutėmis.

- 8) Vienetiniai testai su Jest
  - `AuthService.register` ir `AuthService.login` – falsy/ok scenarijai.
```js
test('login – neteisingas slaptažodis', async () => {
  // sukurk fake user doc su hash; tikrink, kad grąžina { ok:false }
});
```

- 9) UI/UX
  - Toast pranešimai (auto-hide 3s), `.auth-success` CSS klasė vietoje inline stiliaus.
  - Geresnė navigacija/mobilus meniu.

## 24. Testinė viktorina (MCQ)

1) Kuris HTTP metodas dažniausiai naudojamas formos pateikimui?  
   A) GET  B) POST  C) PUT  D) DELETE

2) Kokia `Content-Type` reikšmė būdinga HTML formoms (be failų)?  
   A) application/json  B) text/html  C) application/x-www-form-urlencoded  D) multipart/form-data

3) Ką daro `httpOnly` vėliava slapuke?  
   A) Leidžia skaityti JS  B) Uždraudžia pasiekti iš JS  C) Tik HTTPS  D) Tik kitoms svetainėms

4) Kuo skiriasi `<%= %>` ir `<%- %>` EJS?  
   A) Abu vienodi  B) `<%=` escape'ina, `<%-` – ne  C) Atvirkščiai  D) Nei vienas neteisingas

5) Kur saugomas `passwordHash`?  
   A) Naršyklėje  B) `.env`  C) DB  D) Slapuke

6) Ką grąžina `bcrypt.compare`?  
   A) Naują hash  B) Boolean ar atitinka  C) Statuso kodą  D) Klaidos tekstą

7) Kur dėti sesijų middleware Express?  
   A) Po 404  B) Prieš router’ius  C) Tarp 404 ir router’ių  D) Nesvarbu

8) Kam reikalingas `runValidators: true` Mongoose update'uose?  
   A) Greitesniam užkrovimui  B) Kad tikrintų schema validacijas  C) Kad darytų lean  D) Kad išsaugotų istoriją

9) Kas yra `res.locals.currentUser`?  
   A) Globalus JS kintamasis  B) EJS pasiekiamas kintamasis  C) DB kolekcija  D) Sesijos id

10) Kam `helmet` biblioteka?  
    A) Slaptažodžių hashinimui  B) HTTP antraštėms saugiai nustatyti  C) Vaizdams aptarnauti  D) Routeriui

ATS: 1-B, 2-C, 3-B, 4-B, 5-C, 6-B, 7-B, 8-B, 9-B, 10-B

## 25. Cheat sheet (greita atmintinė)

- Express eilė: logger → static → body parsers → sessions → locals → routeriai → 404 → error handler.
- EJS: `<%= %>` (saugus), `<%- %>` (neescape'inta – tik patikimam HTML!).
- Mongoose: `lean()` skaitymui, `runValidators: true` update metu.
- Auth: `bcrypt.hash(password, 12)`, `bcrypt.compare(plain, hash)`.
- Sesijos: `httpOnly` slapukas, store – Mongo, `req.session.user`.

## 26. Mini projektas (iššūkis)

Sukurk „Pastabų“ (Notes) modulį:
- Model: `title`, `content`, `ownerId` (user id)
- Route: `/notes` (list), `/notes/create`, `/notes/:id/edit`, `/notes/:id/delete`
- Tik prisijungus (requireAuth); rodyk tik savo pastabas.
- Pridėk flash pranešimus po sukurti/atnaujinti/ištrinti.
