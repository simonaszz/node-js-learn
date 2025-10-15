const express = require('express');
const router = express.Router();

// Importuoti API maršrutus
const commentRoutes = require('./commentRoutes');

// Naudoti komentaro maršrutus be '/' prefiksą
router.use(commentRoutes);

module.exports = router;
