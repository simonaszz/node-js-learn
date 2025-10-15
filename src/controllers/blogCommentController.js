const { createBlogComment, getBlogCommentsByPostId } = require('../models/blogCommentModel');

// Gauti komentarus pagal blog įrašo ID
const getBlogComments = (request, response) => {
  try {
    const blogPostId = request.params.blogPostId;
    const blogComments = getBlogCommentsByPostId(blogPostId);

    // Rūšiuoti komentarus pagal sukūrimo datą (naujausi viršuje)
    blogComments.sort((firstComment, secondComment) => 
      new Date(secondComment.createdAtDate) - new Date(firstComment.createdAtDate)
    );

    response.json({
      success: true,
      blogComments: blogComments
    });
  } catch (error) {
    console.error('Klaida gaunant komentarus:', error);
    response.status(500).json({
      success: false,
      message: 'Klaida gaunant komentarus'
    });
  }
};

// Sukurti naują komentarą
const createNewBlogComment = (request, response) => {
  try {
    const { blogPostId } = request.params;
    const { authorName, commentContent } = request.body;

    // Validacija
    if (!authorName || !commentContent) {
      return response.status(400).json({
        success: false,
        message: 'Autoriaus vardas ir komentaro tekstas yra privalomi'
      });
    }

    if (authorName.trim().length < 2) {
      return response.status(400).json({
        success: false,
        message: 'Autoriaus vardas turi būti bent 2 simbolių ilgio'
      });
    }

    if (commentContent.trim().length < 5) {
      return response.status(400).json({
        success: false,
        message: 'Komentaras turi būti bent 5 simbolių ilgio'
      });
    }

    // Sukurti komentarą
    const newBlogComment = createBlogComment(blogPostId, authorName.trim(), commentContent.trim());

    response.status(201).json({
      success: true,
      message: 'Komentaras sėkmingai sukurtas',
      comment: newBlogComment
    });

  } catch (error) {
    console.error('Klaida kuriant komentarą:', error);
    response.status(500).json({
      success: false,
      message: 'Klaida kuriant komentarą'
    });
  }
};

module.exports = {
  getBlogComments,
  createNewBlogComment
};