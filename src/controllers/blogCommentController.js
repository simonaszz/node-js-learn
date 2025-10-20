const mongoose = require('mongoose');
const BlogComment = require('../models/blogComment');

// Gauti komentarus pagal blog įrašo ID (MongoDB)
const getBlogComments = async (request, response) => {
  try {
    const blogPostId = request.params.blogPostId;
    if (!mongoose.Types.ObjectId.isValid(blogPostId)) {
      return response.status(400).json({ success: false, message: 'Neteisingas blog ID' });
    }

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

// Sukurti naują komentarą (MongoDB)
const createNewBlogComment = async (request, response) => {
  try {
    const { blogPostId } = request.params;
    const { authorName, commentContent } = request.body;

    if (!mongoose.Types.ObjectId.isValid(blogPostId)) {
      return response.status(400).json({ success: false, message: 'Neteisingas blog ID' });
    }

    // Validacija
    if (!authorName || !commentContent) {
      return response.status(400).json({ success: false, message: 'Autoriaus vardas ir komentaro tekstas yra privalomi' });
    }
    if (authorName.trim().length < 2) {
      return response.status(400).json({ success: false, message: 'Autoriaus vardas turi būti bent 2 simbolių ilgio' });
    }
    if (commentContent.trim().length < 5) {
      return response.status(400).json({ success: false, message: 'Komentaras turi būti bent 5 simbolių ilgio' });
    }

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

// Pridėti atsakymą į konkretų komentarą (reply)
const addReplyToComment = async (request, response) => {
  try {
    const { blogPostId, commentId } = request.params;
    const { authorName, replyContent } = request.body;

    // Validacija ID
    if (!mongoose.Types.ObjectId.isValid(blogPostId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return response.status(400).json({ success: false, message: 'Neteisingi ID' });
    }

    // Validacija laukų
    if (!authorName || !replyContent) {
      return response.status(400).json({ success: false, message: 'Vardas ir atsakymo tekstas yra privalomi' });
    }
    if (authorName.trim().length < 2) {
      return response.status(400).json({ success: false, message: 'Vardas turi būti bent 2 simbolių' });
    }
    if (replyContent.trim().length < 2) {
      return response.status(400).json({ success: false, message: 'Atsakymas turi būti bent 2 simbolių' });
    }

    // Įrašyti atsakymą
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

module.exports = {
  getBlogComments,
  createNewBlogComment,
  addReplyToComment
};