class AutorizationController {
  constructor(authService) {
    this.authService = authService;
  }

  static fromDependencies(authService) {
    return new AutorizationController(authService);
  }

  loginPage(req, res) {
    res.render('pages/login', { title: 'Prisijungimas', activePage: 'login', errors: [], values: {} });
  }

  async login(req, res) {
    const result = await this.authService.login(req.body);
    if (!result.ok) {
      return res.status(400).render('pages/login', {
        title: 'Prisijungimas',
        activePage: 'login',
        errors: result.errors,
        values: { email: req.body.email }
      });
    }
    req.session.user = result.user; // { id, email }
    res.redirect('/');
  }

  registerPage(req, res) {
    res.render('pages/register', { title: 'Registracija', activePage: 'register', errors: [], values: {} });
  }

  async register(req, res) {
    const result = await this.authService.register(req.body);
    if (!result.ok) {
      return res.status(400).render('pages/register', {
        title: 'Registracija',
        activePage: 'register',
        errors: result.errors,
        values: { email: req.body.email }
      });
    }
    req.session.user = result.user; // { id, email }
    res.redirect('/');
  }

  logout(req, res) {
    if (req.session && typeof req.session.destroy === 'function') {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  }
}

module.exports = AutorizationController;
