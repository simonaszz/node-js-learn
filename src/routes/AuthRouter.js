const express = require('express');
const { AuthService } = require('../services/AuthService');
const AuthorizationController = require('../controllers/AuthorizationController');

class AuthRouter {
  constructor() {
    const service = new AuthService();
    this.controller = AuthorizationController.fromDependencies(service);
    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/login', this.controller.loginPage.bind(this.controller));
    this.router.post('/login', this.controller.login.bind(this.controller));

    this.router.get('/register', this.controller.registerPage.bind(this.controller));
    this.router.post('/register', this.controller.register.bind(this.controller));

    if (typeof this.controller.logout === 'function') {
      this.router.post('/logout', this.controller.logout.bind(this.controller));
      this.router.get('/logout', this.controller.logout.bind(this.controller));
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new AuthRouter().getRouter();
