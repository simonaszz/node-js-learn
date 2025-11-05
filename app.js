/**
 * App.js - Pagrindinis Serverio Failas
 * 
 * Čia vyksta visa Express aplikacijos konfigūracija:
 * 1. Middleware registracija
 * 2. Routes registracija
 * 3. Error handling
 * 4. Serverio paleidimas
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { connectToDatabase } = require('./src/config/database');
const app = express();
const PORT = 3000;
const PagesRouter = require('./src/routes/PagesRouter');
const authRouter = require('./src/routes/AuthRouter');
const accountRouter = require('./src/routes/AccountRouter');
const adminRouter = require('./src/routes/AdminRouter');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');

// ============================================


app.use(cookieParser());

// MIDDLEWARE (tvarka SVARBI!)
// ============================================

/**
 * 1. LOGGER MIDDLEWARE (PIRMAS!)
 * 
 * Kodėl pirmas?
 * - Norime užloginti VISAS užklausas
 * - Net jei vėliau įvyks klaida, vis tiek pamatysime log
 */
const logger = require('./src/middleware/logger');
app.use(logger);

/**
 * 2. STATIC FILES
 * 
 * Leidžia servinti failus iš public/ folderio
 * Pvz: /css/style.css → public/css/style.css
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 3. BODY PARSERS
 * 
 * express.json() - parsina JSON duomenis (pvz., iš fetch())
 * express.urlencoded() - parsina formos duomenis (iš <form>)
 * 
 * Be šių, request.body būtų undefined!
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fail-fast: required env vars
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set. Please define it in your .env file.');
}
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not set. Please define it in your .env file.');
}

// Sessions (Mongo store)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

// Expose currentUser to EJS (safe even if sessions are not configured yet)
app.use((req, res, next) => {
  res.locals.currentUser = (req.session && req.session.user) || null;
  // Flash messages
  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  } else {
    res.locals.flash = null;
  }
  next();
});

/**
 * 4. VIEW ENGINE
 * 
 * EJS šablonų variklis
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * 5. GLOBALŪS KINTAMIEJI
 * 
 * app.locals - pasiekiamas visuose EJS failuose
 * Nereikia perduoti per kiekvieną res.render()
 */
app.locals.menu = [
    { title: 'Pradžia', link: '/' },
    { title: 'Žaislai', link: '/toys' },
    { title: 'Žaislų nuoma', link: '/toy-rent' },
    { title: 'Tinklaraštis', link: '/blog' },
    { title: 'Kontaktai', link: '/contact' },
];

// ============================================
// ROUTES
// ============================================

/**
 * Blog Routes
 * Visos routes pradeda su /blog
 */
const blogRouter = require('./src/routes/BlogRouter');
app.use('/blog', blogRouter);



/**
 * API Routes (komentarams)
 */
const apiRoutes = require('./src/routes/api');
app.use('/api', apiRoutes);

/**
 * Pagrindiniai statiniai puslapiai
 */
app.use('/', authRouter);
app.use('/', accountRouter);
app.use('/', adminRouter);
app.use('/', PagesRouter);
// ============================================
// 404 ERROR HANDLER (PASKUTINIS!)
// ============================================

/**
 * Kodėl paskutinis?
 * - Express tikrina routes iš eilės
 * - Jei jokia route nesuveikė, ateina čia
 * - Tai "catch-all" route
 */
app.use((req, res) => {
    res.status(404).render('pages/404', { 
        title: '404 - Puslapis Nerastas',
        url: req.url
    });
});

// ============================================
// DB CONNECTION + SERVER START
// ============================================

// Vienas DB prisijungimas su MONGO_URI iš .env ir serverio startas po sėkmės
connectToDatabase()
  .then(() => {
    console.log('prisijungta');
    app.listen(PORT, () => {
      console.log(`✅ Serveris veikia: http://localhost:${PORT}`);
      console.log(`📁 Tinklaraštis: http://localhost:${PORT}/blog`);
      console.log(`➕ Sukurti įrašą: http://localhost:${PORT}/blog/create`);
    });
  })
  .catch(err => console.log(err));