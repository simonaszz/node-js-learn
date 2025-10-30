const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

class AdminRouter {
  constructor() {
    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes() {
    // Redirect admin entry to unified dashboard
    this.router.get('/admin', requireAuth, requireAdmin, (req, res) => {
      return res.redirect('/dashboard');
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new AdminRouter().getRouter();
