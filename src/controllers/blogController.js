const { blogs } = require('../models/blogModel');
const slugify = require('../utils/slugify');

const getBlogList = (request, response) => {
    response.render('pages/blog', { title: 'Tinklaraštis', blogs });
};

const getBlogDetail = (request, response) => {
    const { slug } = request.params;
    const blogPost = blogs.find(blog => slugify(blog.title) === slug);
    if (!blogPost) {
        return response.status(404).render('errors/404');
    }
    // Randame blog įrašo ID pagal jo poziciją masyve
    const blogIndex = blogs.findIndex(blog => blog.title === blogPost.title);
    const blogId = blogIndex + 1;

    response.render('pages/blog-detail', {
      title: blogPost.title,
      blog: blogPost,
      blogId: blogId
      
    });
};

module.exports = { getBlogList, getBlogDetail };