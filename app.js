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
const PagesRoutes = require('./src/routes/PagesRouter');

// ============================================
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
app.use('/', PagesRoutes);
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