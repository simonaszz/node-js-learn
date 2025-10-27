/**
 * API maršrutai komentarams (Class-based Router).
 * Montuojama per `app.use('/api', apiRoutes)`.
 */
const express = require('express');
const BlogCommentController = require('../../controllers/BlogCommentController');
const { BlogCommentRepository } = require('../../repositories/BlogCommentRepository');
const { BlogCommentService } = require('../../services/BlogCommentService');

class CommentRouter {
  constructor() {
    const repo = new BlogCommentRepository();
    const service = new BlogCommentService(repo);
    this.controller = BlogCommentController.fromDependencies(service);

    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes() {
    // GET /api/blog/:blogPostId/comments — komentarų sąrašas
    this.router.get('/blog/:blogPostId/comments', this.controller.getBlogComments.bind(this.controller));

    // POST /api/blog/:blogPostId/comments — sukuria naują komentarą
    this.router.post('/blog/:blogPostId/comments', this.controller.createNewBlogComment.bind(this.controller));

    // POST /api/blog/:blogPostId/comments/:commentId/replies — prideda atsakymą
    this.router.post('/blog/:blogPostId/comments/:commentId/replies', this.controller.addReplyToComment.bind(this.controller));

    // PUT /api/blog/:blogPostId/comments/:commentId — atnaujina komentarą
    this.router.put('/blog/:blogPostId/comments/:commentId', this.controller.updateComment.bind(this.controller));

    // DELETE /api/blog/:blogPostId/comments/:commentId — ištrina komentarą
    this.router.delete('/blog/:blogPostId/comments/:commentId', this.controller.deleteComment.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new CommentRouter().getRouter();
