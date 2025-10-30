module.exports = function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('pages/404', { title: 'Prieiga draudžiama', url: req.url });
  }
  next();
}
