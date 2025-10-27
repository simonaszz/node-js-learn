/**
 * Statinių puslapių maršrutai.
 * Registruojama `app.use('/', PagesRoutes)`, todėl keliai prasideda nuo šaknies.
 * Kiekvienas kelias renderina atitinkamą EJS puslapį per `PagesController`.
 */
const express = require('express');
const PagesController = require('../controllers/PagesController');
const router = express.Router();

router.get('/', PagesController.getHome);
router.get('/toys', PagesController.getToys);
router.get('/toy-rent', PagesController.getToyRent);
router.get('/contact', PagesController.getContact);
router.get('/services', PagesController.getServices);

module.exports = router;
