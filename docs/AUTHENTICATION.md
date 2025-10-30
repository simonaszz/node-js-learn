# Autentikacija projekte: Login, Register, Logout (OOP + DI)

Šiame dokumente paaiškinu visą įdiegtą autentikacijos sprendimą, pritaikytą prie projekto OOP/DI architektūros (kaip Blog moduliai). Čia rasi, kur yra kodas, ką kiekviena eilutė daro ir kodėl pasirinktas būtent toks sprendimas.

- OOP/DI sluoksniai: Router (klasė) → Controller (klasė) → Service (verslo logika)
- Saugumas: bcrypt hash/compare, sesijos `express-session` + `connect-mongo`, jokio plaintext slaptažodžio saugojimo
- EJS: login/register formos, klaidų rodymas
- UI: prisijungusio vartotojo rodymas meniu

---

## Struktūra

- `src/models/user.js` – Mongoose modelis.
- `src/services/AuthService.js` – verslo logika (hash, paieška DB, validacijos). 
- `src/controllers/AutorizationController.js` – HTTP sluoksnis (render, redirect, sesijos nustatymas).
- `src/routes/AuthRouter.js` – maršrutai (klasė, kaip `BlogRouter`).
- `app.js` – sesijų middleware, EJS `currentUser`, router registracija.
- `views/pages/login.ejs`, `views/pages/register.ejs` – formos.
- `views/partials/nav.ejs` – prisijungimo/log out nuorodos ir prisijungusio vartotojo rodymas.
- `public/css/style.css` – auth ir user chip stiliai.

---

## Sesijos ir Aplinkos kintamieji (`app.js`)

```js
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');

// 1) Body parseriai – privaloma, kad POST formų duomenys atkeliautų į req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2) Fail-fast – be šių kintamųjų stabdom paleidimą, kad klaida būtų aiški
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set. Please define it in your .env file.');
}
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not set. Please define it in your .env file.');
}

// 3) Sesijų middleware – cookie-based sesijos su MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET,    // Slaptas raktas sesijų pasirašymui
  resave: false,                         // Nerašome sesijos jei nepasikeitė
  saveUninitialized: false,              // Nerašome tuščios sesijos
  store: MongoStore.create({             // Sesijų išsaugojimas MongoDB
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 } // Apsauga nuo XSS
}));

// 4) currentUser į EJS – kad šablonai žinotų prisijungimo būseną
app.use((req, res, next) => {
  res.locals.currentUser = (req.session && req.session.user) || null;
  next();
});

// 5) Auth maršrutai – registruoti prieš 404 ir po sesijų
const authRouter = require('./src/routes/AuthRouter');
app.use('/', authRouter);
```

Kodėl taip:
- Sesijų middleware turi būti prieš router’ius, kad `req.session` būtų prieinamas controller’iuose.
- `httpOnly` cookie apsaugo nuo prieigos per JS (XSS).
- `res.locals.currentUser` leidžia EJS šablonuose lengvai rodyti prisijungusio vartotojo informaciją (pvz., nav).

`.env` (būtina):
```
MONGO_URI=...
SESSION_SECRET=...
```

---

## Modelis: `src/models/user.js`

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true }, // unikalus el. paštas
  passwordHash: { type: String, required: true }                                     // bcrypt hash, ne plaintext
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

Kodėl taip:
- `unique: true` – DB lygiu saugo nuo dublikatų.
- `passwordHash` – niekada nesaugome slaptažodžio grynuoju tekstu.

---

## Service: `src/services/AuthService.js`

```js
const bcrypt = require('bcrypt');
const User = require('../models/user');

class AuthService {
  async register({ email, password, password2 }) {
    const errors = [];
    if (!email) errors.push('El. paštas privalomas');                  // privalomas el. paštas
    if (!password) errors.push('Slaptažodis privalomas');              // privalomas slaptažodis
    if (password && password.length < 6) errors.push('Slaptažodis per trumpas (>=6)'); // minimalus ilgis
    if (password !== password2) errors.push('Slaptažodžiai nesutampa');                // sutapimas
    if (errors.length) return { ok: false, errors };                   // ankstyvas grąžinimas klaidų

    const existing = await User.findOne({ email });                    // tikriname ar užimtas el. paštas
    if (existing) return { ok: false, errors: ['Toks el. paštas jau naudojamas'] };

    const passwordHash = await bcrypt.hash(password, 12);              // saugus hash su cost factor 12
    const userDoc = await User.create({ email, passwordHash });        // kuriame naudotoją DB
    return { ok: true, user: { id: userDoc._id.toString(), email: userDoc.email } }; // grąžiname saugius duomenis
  }

  async login({ email, password }) {
    const errors = [];
    if (!email) errors.push('El. paštas privalomas');
    if (!password) errors.push('Slaptažodis privalomas');
    if (errors.length) return { ok: false, errors };

    const userDoc = await User.findOne({ email });                     // randame naudotoją pagal email
    if (!userDoc) return { ok: false, errors: ['Neteisingi duomenys'] };

    const ok = await bcrypt.compare(password, userDoc.passwordHash);   // lyginame hash
    if (!ok) return { ok: false, errors: ['Neteisingi duomenys'] };

    return { ok: true, user: { id: userDoc._id.toString(), email: userDoc.email } }; // sėkmė
  }
}

module.exports = { AuthService };
```

Kodėl taip:
- Service grąžina struktūrą `{ ok, errors?, user? }`, o ne `throw`, kad Controller galėtų aiškiai valdyti klaidas (render formą su klaidomis) ir sėkmę (set session + redirect).

---

## Controller: `src/controllers/AutorizationController.js`

```js
class AutorizationController {
  constructor(authService) { this.authService = authService; }                     // DI – įleidžiame service
  static fromDependencies(authService) { return new AutorizationController(authService); }

  loginPage(req, res) {
    res.render('pages/login', { title: 'Prisijungimas', activePage: 'login', errors: [], values: {} }); // tuščia forma
  }

  async login(req, res) {
    const result = await this.authService.login(req.body);                         // kviečiame service
    if (!result.ok) {                                                             // jei klaida – grąžiname formą su klaidomis
      return res.status(400).render('pages/login', {
        title: 'Prisijungimas',
        activePage: 'login',
        errors: result.errors,
        values: { email: req.body.email }
      });
    }
    req.session.user = result.user;                                               // sėkmė – įrašome į sesiją
    res.redirect('/');                                                            // ir redirectinam į pradžią
  }

  registerPage(req, res) {
    res.render('pages/register', { title: 'Registracija', activePage: 'register', errors: [], values: {} });
  }

  async register(req, res) {
    const result = await this.authService.register(req.body);
    if (!result.ok) {
      return res.status(400).render('pages/register', {
        title: 'Registracija',
        activePage: 'register',
        errors: result.errors,
        values: { email: req.body.email }
      });
    }
    req.session.user = result.user;                                              // po sėkmingos registracijos – prisijungiame
    res.redirect('/');
  }

  logout(req, res) {
    req.session?.destroy(() => {                                                 // išvalome sesiją
      res.clearCookie('connect.sid');
      res.redirect('/');                                                         // grįžtame į pradžią
    });
  }
}

module.exports = AutorizationController;
```

Kodėl taip:
- Controller neturi hash/DB logikos – vienas atsakomybės principas.
- DI pattern – testuojama, nuoseklu su esamais moduliais.

---

## Router: `src/routes/AuthRouter.js`

```js
const express = require('express');
const { AuthService } = require('../services/AuthService');
const AutorizationController = require('../controllers/AutorizationController');

class AuthRouter {
  constructor() {
    const service = new AuthService();
    this.controller = AutorizationController.fromDependencies(service); // DI į Controller
    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/login', this.controller.loginPage.bind(this.controller));   // GET login forma
    this.router.post('/login', this.controller.login.bind(this.controller));      // POST login

    this.router.get('/register', this.controller.registerPage.bind(this.controller)); // GET register forma
    this.router.post('/register', this.controller.register.bind(this.controller));    // POST register

    this.router.post('/logout', this.controller.logout.bind(this.controller));    // POST logout
  }

  getRouter() { return this.router; }
}

module.exports = new AuthRouter().getRouter();
```

Kodėl taip:
- Router – tik maršrutų aprašymas, o ne logika.
- `.bind(this.controller)` – kad neprarasti `this` konteksto Controller metoduose.

---

## EJS vaizdai: login/register

Login (trumpinta):
```ejs
<main class="container auth-page page-fade">
  <section class="auth-card">
    <h1 class="auth-title">Prisijungimas</h1>
    <% if (errors && errors.length) { %>
      <ul class="auth-errors"><% errors.forEach(e => { %><li><%= e %></li><% }) %></ul>
    <% } %>
    <form class="auth-form" method="post" action="/login">
      <label class="auth-label">El. paštas</label>
      <input class="auth-input" type="email" name="email" value="<%= (values && values.email) || '' %>" required />
      <label class="auth-label">Slaptažodis</label>
      <input class="auth-input" type="password" name="password" required />
      <button class="auth-button" type="submit">Prisijungti</button>
    </form>
    <div class="auth-switch">Neturi paskyros? <a href="/register">Registruokis</a></div>
  </section>
</main>
```

Register – analogiška, tik `action="/register"` ir papildomas `password2` laukas.

Kodėl taip:
- `values.email` – kad grąžinus klaidas, formoje išliktų įvestas el. paštas.
- `auth-errors` – aiškus klaidų sąrašas virš formos.

---

## Nav ir prisijungusio vartotojo rodymas

`views/partials/nav.ejs` (trumpinta):
```ejs
<% if (currentUser) { %>
  <li class="nav-user">
    <span class="user-chip">
      <span class="user-avatar"><%= (currentUser.email && currentUser.email[0] || '?').toUpperCase() %></span>
      <span class="user-email"><%= currentUser.email %></span>
    </span>
    <form method="post" action="/logout" style="display:inline">
      <button type="submit" class="logout-button">Atsijungti</button>
    </form>
  </li>
<% } else { %>
  <li><a href="/login">Prisijungti</a></li>
  <li><a href="/register">Registruotis</a></li>
<% } %>
```

Kodėl taip:
- Patogus vizualinis indikatorius, kad naudotojas prisijungęs.
- „Logout“ kaip POST forma (geroji praktika išvengti atsitiktinių GET logout).

---

## CSS – auth formos ir user chip (`public/css/style.css`)

Naudojamos klasės (ištraukos):
- `.auth-page`, `.auth-card`, `.auth-title`, `.auth-errors`, `.auth-form`, `.auth-label`, `.auth-input`, `.auth-button`
- `.auth-switch` (nuoroda tarp login/register)
- `.page-fade` (fade-in/out perėjimai tarp puslapių)
- `.nav-user`, `.user-chip`, `.user-avatar`, `.user-email`, `.logout-button`

Kodėl taip:
- Nuoseklus dizainas su esamu CSS, UI paprastas ir aiškus.

---

## Testavimas (CLI)

Registracija:
```bash
curl -i -X POST http://localhost:3000/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "email=test123@example.com&password=abcdef&password2=abcdef"
```

Prisijungimas:
```bash
curl -i -X POST http://localhost:3000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "email=test123@example.com&password=abcdef"
```

Jei klaidos – 400 ir EJS grąžins formą su klaidomis. Sėkmės atveju – 302 redirect į `/`.

---

## Dažnos klaidos ir sprendimai

- `Error: SESSION_SECRET is not set` → pridėk `SESSION_SECRET` į `.env`.
- `Error: MONGO_URI is not set` → pridėk `MONGO_URI` į `.env`.
- Registracija 400: „Toks el. paštas jau naudojamas“ – naudok naują el. paštą.
- Prisijungimas 400: „Neteisingi duomenys“ – patikrink el. paštą/slaptažodį.

---

## Kodėl OOP + DI yra geriausia šiame projekte

- Nuoseklu su esamais moduliais (`BlogController`, `BlogRouter`): mažiau kognityvinės apkrovos.
- Vienos atsakomybės principas: Controller – HTTP, Service – verslas, Model – DB.
- Testuojamumas ir plečiamumas: lengva prijungti roles, profilį, 2FA, ir pan.

---

# Toliau: Vartotojo profilis ir admin/account panelė

Norint, kad paspaudus ant vartotojo meniu atidarytų profilį / admin dalį:

## 1) Išplėsk User modelį (vardas, pavardė, tel.)

```js
// src/models/user.js
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String }
}, { timestamps: true });
```

## 2) Sukurk Account modulį (OOP/DI)

- `src/services/AccountService.js` – gauti/atnaujinti profilį pagal `req.session.user.id`.
- `src/controllers/AccountController.js` – `getProfilePage`, `postProfileUpdate`.
- `src/routes/AccountRouter.js` – `/account` (GET forma), `/account` (POST update), su `requireAuth`.

Pavyzdys:
```js
// src/middleware/requireAuth.js
module.exports = function requireAuth(req, res, next) {
  if (!req.session?.user) return res.redirect('/login');
  next();
}
```

```js
// src/services/AccountService.js
const User = require('../models/user');
class AccountService {
  async getProfile(userId) {
    const u = await User.findById(userId).lean();
    if (!u) return null;
    return { id: u._id.toString(), email: u.email, firstName: u.firstName, lastName: u.lastName, phone: u.phone };
  }
  async updateProfile(userId, { firstName, lastName, phone }) {
    const u = await User.findByIdAndUpdate(userId, { firstName, lastName, phone }, { new: true });
    if (!u) return null;
    return { id: u._id.toString(), email: u.email, firstName: u.firstName, lastName: u.lastName, phone: u.phone };
  }
}
module.exports = { AccountService };
```

```js
// src/controllers/AccountController.js
class AccountController {
  constructor(accountService) { this.accountService = accountService; }
  static fromDependencies(accountService) { return new AccountController(accountService); }

  async getProfilePage(req, res) {
    const profile = await this.accountService.getProfile(req.session.user.id);
    if (!profile) return res.redirect('/login');
    res.render('pages/account', { title: 'Paskyra', profile, errors: [] });
  }
  async postProfileUpdate(req, res) {
    const updated = await this.accountService.updateProfile(req.session.user.id, req.body);
    if (!updated) return res.status(400).render('pages/account', { title: 'Paskyra', profile: req.body, errors: ['Nepavyko atnaujinti'] });
    res.redirect('/account');
  }
}
module.exports = AccountController;
```

```js
// src/routes/AccountRouter.js
const express = require('express');
const { AccountService } = require('../services/AccountService');
const AccountController = require('../controllers/AccountController');
const requireAuth = require('../middleware/requireAuth');

class AccountRouter {
  constructor() {
    const service = new AccountService();
    this.controller = AccountController.fromDependencies(service);
    this.router = express.Router();
    this.initRoutes();
  }
  initRoutes() {
    this.router.get('/account', requireAuth, this.controller.getProfilePage.bind(this.controller));
    this.router.post('/account', requireAuth, this.controller.postProfileUpdate.bind(this.controller));
  }
  getRouter() { return this.router; }
}
module.exports = new AccountRouter().getRouter();
```

```ejs
<!-- views/pages/account.ejs (trumpinta) -->
<%- include('../partials/head', { title }) %>
<%- include('../partials/nav') %>
<main class="container auth-page">
  <section class="auth-card">
    <h1 class="auth-title">Paskyra</h1>
    <form class="auth-form" method="post" action="/account">
      <label class="auth-label">El. paštas</label>
      <input class="auth-input" type="email" value="<%= profile.email %>" disabled />
      <label class="auth-label">Vardas</label>
      <input class="auth-input" name="firstName" value="<%= profile.firstName || '' %>" />
      <label class="auth-label">Pavardė</label>
      <input class="auth-input" name="lastName" value="<%= profile.lastName || '' %>" />
      <label class="auth-label">Telefonas</label>
      <input class="auth-input" name="phone" value="<%= profile.phone || '' %>" />
      <button class="auth-button" type="submit">Išsaugoti</button>
    </form>
  </section>
</main>
<%- include('../partials/footer') %>
```

## 3) Navigacija iš user chip į /account

`views/partials/nav.ejs` – apgaubk `user-chip` nuoroda į `/account`:
```ejs
<a href="/account" class="user-chip">
  <span class="user-avatar"><%= (currentUser.email && currentUser.email[0] || '?').toUpperCase() %></span>
  <span class="user-email"><%= currentUser.email %></span>
</a>
```

Kodėl taip:
- Nuoseklus OOP/DI kaip visame projekte.
- `requireAuth` saugo profilį tik prisijungusiems.
- Intuityvi navigacija per user chip.

---

## Santrauka

- Autentikacija įdiegta pilnai OOP/DI stiliumi: Model → Service → Controller → Router.
- Saugumas: bcrypt, sesijos su Mongo store, `SESSION_SECRET` iš `.env`.
- EJS formos su klaidų rodymu ir patogia UX (fade perėjimas, user chip nav’e).
- Kitam žingsniui paruoštas planas „Paskyra“ (/account) su profilio peržiūra/keitimu.

Jei nori – galiu automatiškai sukurti Account modulį ir pridėti linką iš user chip į `/account`.
