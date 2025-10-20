const express = require('express');
const router = express.Router();
const { getBlogComments, createNewBlogComment, addReplyToComment } = require('../../controllers/blogCommentController');

// Gauti visus komentarus pagal blog įrašo ID
router.get('/blog/:blogPostId/comments', getBlogComments);

// Sukurti naują komentarą
router.post('/blog/:blogPostId/comments', createNewBlogComment);

// Pridėti atsakymą į komentarą
router.post('/blog/:blogPostId/comments/:commentId/replies', addReplyToComment);

module.exports = router;
