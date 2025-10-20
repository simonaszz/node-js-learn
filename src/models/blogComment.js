const mongoose = require('mongoose');
const { Schema } = mongoose;

// Komentaro atsakymo (reply) poschema
const replySchema = new Schema({
  replyId: { type: String },
  authorName: { type: String, trim: true },
  replyContent: { type: String, trim: true },
  createdAtDate: { type: Date, default: Date.now }
}, { _id: false });

// Pagrindinė komentaro schema
const blogCommentSchema = new Schema({
  blogPostId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  authorName: { type: String, required: true, trim: true },
  commentContent: { type: String, required: true, trim: true },
  createdAtDate: { type: Date, default: Date.now },
  replies: { type: [replySchema], default: [] }
}, {
  collection: 'blogComments'
});

module.exports = mongoose.model('BlogComment', blogCommentSchema);
