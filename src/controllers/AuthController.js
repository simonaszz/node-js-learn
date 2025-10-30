class AuthController {
  login(req, res) {
    res.render('pages/login', { title: 'Prisijungimas', errors: [], values: {} });
  }

  loginPost(req, res) {
    res.redirect('/');
  }

  register(req, res) {
    res.render('pages/register', { title: 'Registracija', errors: [], values: {} });
  }

  registerPost(req, res) {
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

module.exports = AuthController;
