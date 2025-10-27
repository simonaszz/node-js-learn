/**
 * API maršrutų kompozicija.
 * Montuojama per `app.use('/api', apiRoutes)` ir toliau prijungiami domeno lygio API keliai.
 */
const express = require('express');
const router = express.Router();

// Prijungiame komentarų API maršrutų klasės pagrindu paruoštą routerį
const commentRouter = require('./CommentRouter');

// Naudojame be papildomo prefikso; keliai bus po `/api`
router.use(commentRouter);

module.exports = router;
