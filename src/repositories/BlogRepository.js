/**
 * Repository sluoksnis: apgaubia Mongoose Blog modelį.
 */
const Blog = require('../models/blog');

class BlogRepository {
  async findAllSorted() {
    return Blog.find().sort({ createdAt: -1 });
  }

  async findById(id) {
    return Blog.findById(id);
  }

  async create(doc) {
    return Blog.create(doc);
  }

  async updateById(id, updates) {
    return Blog.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  async deleteById(id) {
    return Blog.findByIdAndDelete(id);
  }

  async existsById(id) {
    return Blog.exists({ _id: id });
  }
}

module.exports = { BlogRepository };
