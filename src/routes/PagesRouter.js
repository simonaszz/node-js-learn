/**
 * Statinių puslapių maršrutai (Class-based Router).
 * Registruojama `app.use('/', pagesRouter)`.
 */
const express = require('express');
const PagesController = require('../controllers/PagesController');

class PagesRouter {
  constructor() {
    this.controller = new PagesController();
    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/', this.controller.getHome.bind(this.controller));
    this.router.get('/toys', this.controller.getToys.bind(this.controller));
    this.router.get('/toy-rent', this.controller.getToyRent.bind(this.controller));
    this.router.get('/contact', this.controller.getContact.bind(this.controller));
    this.router.get('/services', this.controller.getServices.bind(this.controller));
  }

  getRouter() { return this.router; }
}

module.exports = new PagesRouter().getRouter();
