const { blogs } = require('../models/blogModel');
const slugify = require('../utils/slugify');

const getBlogList = (req, res) => {
    res.render('pages/blog', { title: 'Tinklaraštis', blogs });
};

const getBlogDetail = (req, res) => {
    const { slug } = req.params;
    const post = blogs.find(blog => slugify(blog.title) === slug);
    if (!post) {
        return res.status(404).render('errors/404');
    }
    res.render('pages/blog-detail', { title: post.title, blog: post });
};

module.exports = { getBlogList, getBlogDetail };