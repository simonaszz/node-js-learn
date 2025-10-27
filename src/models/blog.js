/**
 * Mongoose modelis: Blog.
 * Laukai: title, snippet, body, author, image.
 * Įjungti timestamp'ai: `createdAt`, `updatedAt`.
 */
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

// Statinis metodas: rasti naujausius įrašus (lean atvaizdavimui)
blogSchema.statics.findRecent = function(limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit).lean();
};

blogSchema.methods.getExcerpt = function(len = 120) {
  const text = this.snippet || this.body || '';
  return text.slice(0, len);
};

module.exports = mongoose.model('Blog', blogSchema);