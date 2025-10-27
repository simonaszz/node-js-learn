/**
 * Service sluoksnis: verslo logika Blog komentarams.
 */
const mongoose = require('mongoose');

class BlogCommentService {
  constructor(blogCommentRepository) {
    this.blogCommentRepository = blogCommentRepository;
  }

  async listByBlogPostId(blogPostId) {
    if (!mongoose.Types.ObjectId.isValid(blogPostId)) {
      const error = new Error('Neteisingas blog ID');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    return this.blogCommentRepository.findByBlogPostId(blogPostId);
  }

  async createComment({ blogPostId, authorName, commentContent }) {
    if (!mongoose.Types.ObjectId.isValid(blogPostId)) {
      const error = new Error('Neteisingas blog ID');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (!authorName || !commentContent) {
      const error = new Error('Autoriaus vardas ir komentaro tekstas yra privalomi');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (authorName.trim().length < 2) {
      const error = new Error('Autoriaus vardas turi būti bent 2 simbolių ilgio');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (commentContent.trim().length < 5) {
      const error = new Error('Komentaras turi būti bent 5 simbolių ilgio');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const created = await this.blogCommentRepository.createComment({
      blogPostId,
      authorName: authorName.trim(),
      commentContent: commentContent.trim(),
    });
    return created.toObject();
  }

  async addReply({ blogPostId, commentId, authorName, replyContent }) {
    if (!mongoose.Types.ObjectId.isValid(blogPostId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      const error = new Error('Neteisingi ID');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (!authorName || !replyContent) {
      const error = new Error('Vardas ir atsakymo tekstas yra privalomi');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (authorName.trim().length < 2) {
      const error = new Error('Vardas turi būti bent 2 simbolių');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (replyContent.trim().length < 2) {
      const error = new Error('Atsakymas turi būti bent 2 simbolių');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    return this.blogCommentRepository.addReply({ blogPostId, commentId, authorName: authorName.trim(), replyContent: replyContent.trim() });
  }

  async updateComment({ blogPostId, commentId, authorName, commentContent }) {
    if (!mongoose.Types.ObjectId.isValid(blogPostId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      const error = new Error('Neteisingi ID');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (!authorName || !commentContent) {
      const error = new Error('Vardas ir komentaro tekstas yra privalomi');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (authorName.trim().length < 2) {
      const error = new Error('Vardas turi būti bent 2 simbolių');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (commentContent.trim().length < 5) {
      const error = new Error('Komentaras turi būti bent 5 simbolių ilgio');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    return this.blogCommentRepository.updateComment({ blogPostId, commentId, authorName: authorName.trim(), commentContent: commentContent.trim() });
  }

  async deleteComment({ blogPostId, commentId }) {
    if (!mongoose.Types.ObjectId.isValid(blogPostId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      const error = new Error('Neteisingi ID');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    return this.blogCommentRepository.deleteComment({ blogPostId, commentId });
  }
}

module.exports = { BlogCommentService };
