/**
 * Repository sluoksnis: apgaubia Mongoose BlogComment modelį.
 */
const mongoose = require('mongoose');
const BlogComment = require('../models/blogComment');

class BlogCommentRepository {
  async findByBlogPostId(blogPostId) {
    return BlogComment
      .find({ blogPostId: new mongoose.Types.ObjectId(blogPostId) })
      .sort({ createdAtDate: -1 })
      .lean();
  }

  async createComment({ blogPostId, authorName, commentContent }) {
    return BlogComment.create({
      blogPostId: new mongoose.Types.ObjectId(blogPostId),
      authorName,
      commentContent,
    });
  }

  async addReply({ blogPostId, commentId, authorName, replyContent }) {
    const update = {
      $push: {
        replies: {
          replyId: new mongoose.Types.ObjectId().toString(),
          authorName,
          replyContent,
          createdAtDate: new Date(),
        },
      },
    };

    return BlogComment.findOneAndUpdate(
      { _id: commentId, blogPostId: new mongoose.Types.ObjectId(blogPostId) },
      update,
      { new: true }
    ).lean();
  }

  async updateComment({ blogPostId, commentId, authorName, commentContent }) {
    return BlogComment.findOneAndUpdate(
      { _id: commentId, blogPostId: new mongoose.Types.ObjectId(blogPostId) },
      { $set: { authorName, commentContent } },
      { new: true }
    ).lean();
  }

  async deleteComment({ blogPostId, commentId }) {
    return BlogComment.findOneAndDelete({ _id: commentId, blogPostId: new mongoose.Types.ObjectId(blogPostId) }).lean();
  }
}

module.exports = { BlogCommentRepository };
