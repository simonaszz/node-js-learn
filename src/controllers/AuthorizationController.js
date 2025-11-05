// JWT tokenų generavimui (dedame į HttpOnly cookie) ir išsaugojimui DB
const { generateToken } = require('../services/JWTTokenService');
// Mongoose modelis – naudojamas tokeno išsaugojimui prie vartotojo
const User = require('../models/user');

// Autorizacijos kontroleris – atsakingas už login, register ir logout srautus
// Pagrindinis auth mechanizmas: EXPRESS SESIJOS (req.session.user)
// Papildomai: sugeneruojame JWT ir padedame į HttpOnly cookie (naudinga API/ateičiai)
class AuthorizationController {
  constructor(authService) {
    this.authService = authService;
  }

  static fromDependencies(authService) {
    return new AuthorizationController(authService);
  }

  // GET /login – grąžina prisijungimo formą
  loginPage(req, res) {
    res.render('pages/login', { title: 'Prisijungimas', activePage: 'login', errors: [], values: {} });
  }

  // POST /login – validuoja duomenis, nustato sesiją ir (pasirinktinai) sukuria JWT cookie
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
    // Vartotoją laikome serverio sesijoje (SSR puslapiams)
    req.session.user = result.user; // { id, email }

    // Papildomas žingsnis: JWT tokeno generavimas, išsaugojimas DB ir padėjimas į HttpOnly cookie
    try {
      const token = generateToken(result.user.id);
      const userDoc = await User.findById(result.user.id);
      if (userDoc) {
        userDoc.token = token;
        await userDoc.save();
      }
      res.cookie('token', token, {
        maxAge: 1 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (e) {
      // Jei token'o nepavyko sugeneruoti – ignoruojame (sesija vis tiek veikia SSR puslapiams)
    }
    res.redirect('/');
  }

  // GET /register – grąžina registracijos formą
  registerPage(req, res) {
    res.render('pages/register', { title: 'Registracija', activePage: 'register', errors: [], values: {} });
  }

  // POST /register – sukuria vartotoją, nustato sesiją ir (pasirinktinai) sukuria JWT cookie
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

    // JWT token generavimas ir išsaugojimas DB + HttpOnly cookie
    try {
      const token = generateToken(result.user.id);
      const userDoc = await User.findById(result.user.id);
      if (userDoc) {
        userDoc.token = token;
        await userDoc.save();
      }
      res.cookie('token', token, {
        maxAge: 1 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (e) {
      // jei token'o nepavyko sugeneruoti – ignoruojame, sesija vis tiek veikia
    }
    res.redirect('/');
  }

  // GET /logout – sunaikina sesiją ir išvalo susijusius cookies (connect.sid + token)
  logout(req, res) {
    if (req.session && typeof req.session.destroy === 'function') {
      req.session.destroy(() => {
        // Išvalome JWT tokeną, jei buvo nustatytas
        res.clearCookie('token', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    } else {
      res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      res.redirect('/');
    }
  }
}

module.exports = AuthorizationController;
