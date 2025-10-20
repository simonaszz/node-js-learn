const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//schema - dokumento struktura
const blogSchema = new Schema({
    title: { type: String, required: true, trim: true },
    snippet: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    author: { type: String, default: 'Anonimas', trim: true },
    image: { type: String, default: '/images/default-blog.png', trim: true }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Blog', blogSchema);