/**
 * BlogComment controller: valdo komentarų CRUD ir atsakymus (replies).
 * Visi atsakai grąžinami JSON formatu.
 */
const mongoose = require('mongoose');
const BlogComment = require('../models/blogComment');

// GET /api/blog/:blogPostId/comments — komentarų sąrašas pagal įrašą
const getBlogComments = async (request, response) => {
  try {
    const blogPostId = request.params.blogPostId;
    if (!mongoose.Types.ObjectId.isValid(blogPostId)) {
      return response.status(400).json({ success: false, message: 'Neteisingas blog ID' });
    }

    // Gauti komentarus pagal blog įrašo ID (MongoDB)
    const blogComments = await BlogComment
      .find({ blogPostId: new mongoose.Types.ObjectId(blogPostId) })
      .sort({ createdAtDate: -1 })
      .lean();

    response.json({
      success: true,
      blogComments
    });
  } catch (error) {
    console.error('Klaida gaunant komentarus:', error);
    response.status(500).json({ success: false, message: 'Klaida gaunant komentarus' });
  }
};

// POST /api/blog/:blogPostId/comments — sukuria naują komentarą
const createNewBlogComment = async (request, response) => {
  try {
    const { blogPostId } = request.params;
    const { authorName, commentContent } = request.body;

    if (!mongoose.Types.ObjectId.isValid(blogPostId)) {
      return response.status(400).json({ success: false, message: 'Neteisingas blog ID' });
    }

    // Paprasta validacija
    if (!authorName || !commentContent) {
      return response.status(400).json({ success: false, message: 'Autoriaus vardas ir komentaro tekstas yra privalomi' });
    }
    if (authorName.trim().length < 2) {
      return response.status(400).json({ success: false, message: 'Autoriaus vardas turi būti bent 2 simbolių ilgio' });
    }
    if (commentContent.trim().length < 5) {
      return response.status(400).json({ success: false, message: 'Komentaras turi būti bent 5 simbolių ilgio' });
    }

    // Sukurti naują komentarą
    const newBlogComment = await BlogComment.create({
      blogPostId: new mongoose.Types.ObjectId(blogPostId),
      authorName: authorName.trim(),
      commentContent: commentContent.trim()
    });

    response.status(201).json({
      success: true,
      message: 'Komentaras sėkmingai sukurtas',
      comment: newBlogComment
    });

  } catch (error) {
    console.error('Klaida kuriant komentarą:', error);
    response.status(500).json({ success: false, message: 'Klaida kuriant komentarą' });
  }
};

// POST /api/blog/:blogPostId/comments/:commentId/replies — prideda atsakymą
const addReplyToComment = async (request, response) => {
  try {
    const { blogPostId, commentId } = request.params;
    const { authorName, replyContent } = request.body;

    // ID validacija
    if (!mongoose.Types.ObjectId.isValid(blogPostId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return response.status(400).json({ success: false, message: 'Neteisingi ID' });
    }

    // Laukų validacija
    if (!authorName || !replyContent) {
      return response.status(400).json({ success: false, message: 'Vardas ir atsakymo tekstas yra privalomi' });
    }
    if (authorName.trim().length < 2) {
      return response.status(400).json({ success: false, message: 'Vardas turi būti bent 2 simbolių' });
    }
    if (replyContent.trim().length < 2) {
      return response.status(400).json({ success: false, message: 'Atsakymas turi būti bent 2 simbolių' });
    }

    // Pridėti atsakymą į masyvą `replies`
    const update = {
      $push: {
        replies: {
          replyId: new mongoose.Types.ObjectId().toString(),
          authorName: authorName.trim(),
          replyContent: replyContent.trim(),
          createdAtDate: new Date()
        }
      }
    };

    const updated = await BlogComment.findOneAndUpdate(
      { _id: commentId, blogPostId: new mongoose.Types.ObjectId(blogPostId) },
      update,
      { new: true }
    ).lean();

    if (!updated) {
      return response.status(404).json({ success: false, message: 'Komentaras nerastas' });
    }

    response.status(201).json({ success: true, message: 'Atsakymas pridėtas', comment: updated });
  } catch (error) {
    console.error('Klaida pridedant atsakymą:', error);
    response.status(500).json({ success: false, message: 'Klaida pridedant atsakymą' });
  }
};

class BlogCommentController {
  constructor(blogCommentService) {
    this.blogCommentService = blogCommentService;
  }

  static fromDependencies(blogCommentService) {
    return new BlogCommentController(blogCommentService);
  }

  // GET /api/blog/:blogPostId/comments — komentarų sąrašas pagal įrašą
  async getBlogComments(request, response) {
    try {
      const blogPostId = request.params.blogPostId;
      const blogComments = await this.blogCommentService.listByBlogPostId(blogPostId);
      response.json({ success: true, blogComments });
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        return response.status(400).json({ success: false, message: error.message });
      }
      console.error('Klaida gaunant komentarus:', error);
      response.status(500).json({ success: false, message: 'Klaida gaunant komentarus' });
    }
  }

  // POST /api/blog/:blogPostId/comments — sukuria naują komentarą
  async createNewBlogComment(request, response) {
    try {
      const { blogPostId } = request.params;
      const { authorName, commentContent } = request.body;
      const created = await this.blogCommentService.createComment({ blogPostId, authorName, commentContent });
      response.status(201).json({ success: true, message: 'Komentaras sėkmingai sukurtas', comment: created });
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        return response.status(400).json({ success: false, message: error.message });
      }
      console.error('Klaida kuriant komentarą:', error);
      response.status(500).json({ success: false, message: 'Klaida kuriant komentarą' });
    }
  }

  // POST /api/blog/:blogPostId/comments/:commentId/replies — prideda atsakymą
  async addReplyToComment(request, response) {
    try {
      const { blogPostId, commentId } = request.params;
      const { authorName, replyContent } = request.body;
      const updated = await this.blogCommentService.addReply({ blogPostId, commentId, authorName, replyContent });
      if (!updated) {
        return response.status(404).json({ success: false, message: 'Komentaras nerastas' });
      }
      response.status(201).json({ success: true, message: 'Atsakymas pridėtas', comment: updated });
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        return response.status(400).json({ success: false, message: error.message });
      }
      console.error('Klaida pridedant atsakymą:', error);
      response.status(500).json({ success: false, message: 'Klaida pridedant atsakymą' });
    }
  }

  // PUT /api/blog/:blogPostId/comments/:commentId — atnaujina komentarą
  async updateComment(request, response) {
    try {
      const { blogPostId, commentId } = request.params;
      const { authorName, commentContent } = request.body;
      const updated = await this.blogCommentService.updateComment({ blogPostId, commentId, authorName, commentContent });
      if (!updated) {
        return response.status(404).json({ success: false, message: 'Komentaras nerastas' });
      }
      response.json({ success: true, comment: updated });
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        return response.status(400).json({ success: false, message: error.message });
      }
      console.error('Klaida atnaujinant komentarą:', error);
      response.status(500).json({ success: false, message: 'Klaida atnaujinant komentarą' });
    }
  }

  // DELETE /api/blog/:blogPostId/comments/:commentId — ištrina komentarą
  async deleteComment(request, response) {
    try {
      const { blogPostId, commentId } = request.params;
      const deleted = await this.blogCommentService.deleteComment({ blogPostId, commentId });
      if (!deleted) {
        return response.status(404).json({ success: false, message: 'Komentaras nerastas' });
      }
      response.json({ success: true, message: 'Komentaras ištrintas' });
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        return response.status(400).json({ success: false, message: error.message });
      }
      console.error('Klaida trinant komentarą:', error);
      response.status(500).json({ success: false, message: 'Klaida trinant komentarą' });
    }
  }
}

module.exports = BlogCommentController;