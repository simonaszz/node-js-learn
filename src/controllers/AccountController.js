class AccountController {
  constructor(accountService) {
    this.accountService = accountService;
  }

  static fromDependencies(accountService) {
    return new AccountController(accountService);
  }

  async getProfilePage(req, res) {
    const profile = await this.accountService.getProfile(req.session.user.id);
    if (!profile) return res.redirect('/login');
    res.render('pages/account', { title: 'Paskyra', profile, errors: [] });
  }

  async postProfileUpdate(req, res) {
    const updated = await this.accountService.updateProfile(req.session.user.id, req.body);
    if (!updated) {
      return res.status(400).render('pages/account', { title: 'Paskyra', profile: req.body, errors: ['Nepavyko atnaujinti'] });
    }
    req.session.flash = { type: 'success', message: 'Paskyros duomenys išsaugoti.' };
    res.redirect('/account');
  }
}

module.exports = AccountController;
