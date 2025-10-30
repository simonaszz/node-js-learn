const bcrypt = require('bcrypt');
const User = require('../models/user');

class AuthService {
  async register({ email, password, password2 }) {
    const errors = [];
    if (!email) errors.push('El. paštas privalomas');
    if (!password) errors.push('Slaptažodis privalomas');
    if (password && password.length < 6) errors.push('Slaptažodis per trumpas (>=6)');
    if (password !== password2) errors.push('Slaptažodžiai nesutampa');
    if (errors.length) return { ok: false, errors };

    const existing = await User.findOne({ email });
    if (existing) return { ok: false, errors: ['Toks el. paštas jau naudojamas'] };

    const passwordHash = await bcrypt.hash(password, 12);
    const userDoc = await User.create({ email, passwordHash });
    const user = { id: userDoc._id.toString(), email: userDoc.email, role: userDoc.role };
    return { ok: true, user };
  }

  async login({ email, password }) {
    const errors = [];
    if (!email) errors.push('El. paštas privalomas');
    if (!password) errors.push('Slaptažodis privalomas');
    if (errors.length) return { ok: false, errors };

    const userDoc = await User.findOne({ email });
    if (!userDoc) return { ok: false, errors: ['Neteisingi duomenys'] };

    const ok = await bcrypt.compare(password, userDoc.passwordHash);
    if (!ok) return { ok: false, errors: ['Neteisingi duomenys'] };

    const user = { id: userDoc._id.toString(), email: userDoc.email, role: userDoc.role };
    return { ok: true, user };
  }
}

module.exports = { AuthService };
