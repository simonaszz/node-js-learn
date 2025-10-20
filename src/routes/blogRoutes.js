/**
 * Blog Routes
 * 
 * Šis failas apibrėžia visus blog URL kelius (routes).
 * 
 * Kas yra Route?
 * - Route sujungia URL su Controller funkcija
 * - Pvz: GET /blog → getBlogList funkcija
 * 
 * Visos šios routes pradeda su /blog (nes app.js jas registruoja kaip app.use('/blog', blogRoutes))
 */

const express = require('express');
const { 
  getBlogList, 
  getBlogDetail,
  showCreateForm,
  createNewBlog,
  deleteBlogPost
} = require('../controllers/blogController');

const router = express.Router();

// ============================================
// BLOG ROUTES
// ============================================

/**
 * GET /blog
 * Rodo visų blog įrašų sąrašą
 */
router.get('/', getBlogList);

/**
 * GET /blog/:id
 * Rodo vieną blog įrašą (pagal ID)
 * 
 * Pavyzdys: GET /blog/1 → rodo blog su ID=1
 * 
 * PASTABA: Dabar naudojame :id vietoj :slug
 * Kodėl? Nes ID paprastesnis ir unikalus
 */
router.get('/:id', getBlogDetail);

/**
 * DELETE /blog/:id
 * Ištrina blog įrašą
 * 
 * Pavyzdys: DELETE /blog/1 → ištrina blog su ID=1
 * 
 * SVARBU: Ši route turi būti PRIEŠ GET /:id
 * Kodėl? Nes Express tikrina routes iš eilės.
 * Jei GET /:id būtų pirmas, tai /blog/delete būtų 
 * interpretuojamas kaip id="delete"
 * 
 * Bet mūsų atveju DELETE metodas skiriasi nuo GET,
 * tai nėra problemos.
 */
router.delete('/:id', deleteBlogPost);

// ============================================
// CREATE ROUTES (turi būti atskirai registruoti app.js)
// ============================================

module.exports = router;