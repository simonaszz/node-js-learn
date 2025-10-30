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
    this.router.get('/dashboard', requireAuth, this.controller.getDashboardPage.bind(this.controller));
    this.router.get('/account', requireAuth, this.controller.getProfilePage.bind(this.controller));
    this.router.post('/account', requireAuth, this.controller.postProfileUpdate.bind(this.controller));
  }

  getRouter() { return this.router; }
}

module.exports = new AccountRouter().getRouter();
