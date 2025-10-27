/**
 * Pages controller: renderina statinius puslapius per EJS.
 */


class PagesController {
  getHome(req, res) {
    res.render("pages/index", { title: "Žaislų Pasaulis" });
  }
  getToys(req, res) {
    res.render("pages/toys", { title: "Žaislai" });
  }
  getToyRent(req, res) {
    res.render("pages/toy-rent", { title: "Žaislų nuoma" });
  }
  getContact(req, res) {
    res.render("pages/contact", { title: "Kontaktai" });
  }
  getServices(req, res) {
    res.render("pages/services", { title: "Paslaugos" });
  }
}
module.exports = PagesController;
