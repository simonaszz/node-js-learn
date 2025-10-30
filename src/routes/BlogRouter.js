/**
 * Blog maršrutai (Class-based Router).
 * Registruojama `app.use('/blog', blogRouter)` todėl visi keliai prasideda `/blog`.
 */
const express = require('express');
const { BlogRepository } = require('../repositories/BlogRepository');
const { BlogService } = require('../services/BlogService');
const BlogController = require('../controllers/BlogController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

class BlogRouter {
  constructor() {
    // DI: Repository → Service → Controller
    const repo = new BlogRepository();
    const service = new BlogService(repo);
    this.controller = BlogController.fromDependencies(service);

    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes() {
    // GET /blog — visų įrašų sąrašas
    this.router.get('/', this.controller.getBlogList.bind(this.controller));

    // GET /blog/create — kūrimo forma
    this.router.get('/create', requireAuth, requireAdmin, this.controller.showCreateForm.bind(this.controller));

    // POST /blog/create — sukurti naują įrašą
    this.router.post('/create', requireAuth, requireAdmin, this.controller.createNewBlog.bind(this.controller));

    // GET /blog/:id — vieno įrašo detalės pagal MongoDB ObjectId
    this.router.get('/:id', this.controller.getBlogDetail.bind(this.controller));

    // GET /blog/:id/edit — redagavimo forma
    this.router.get('/:id/edit', requireAuth, requireAdmin, this.controller.showEditForm.bind(this.controller));

    // POST /blog/:id/edit — atnaujinti įrašą
    this.router.post('/:id/edit', requireAuth, requireAdmin, this.controller.updateBlog.bind(this.controller));

    // GET /blog/:id/exists — egzistavimo patikra (JSON)
    this.router.get('/:id/exists', this.controller.checkExists.bind(this.controller));

    // DELETE /blog/:id — įrašo trynimas pagal ID (JSON atsakas)
    this.router.delete('/:id', requireAuth, requireAdmin, this.controller.deleteBlogPost.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}

// Eksportuojame jau paruoštą Router instanciją, kad app.js būtų paprastas
const blogRouter = new BlogRouter().getRouter();
module.exports = blogRouter;
