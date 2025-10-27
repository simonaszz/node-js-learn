/**
 * Service sluoksnis: verslo logika Blog domenui.
 */
class BlogService {
  constructor(blogRepository) {
    this.blogRepository = blogRepository;
  }

  async listBlogs() {
    const blogDocs = await this.blogRepository.findAllSorted();
    return blogDocs.map((doc) => ({ ...doc.toObject(), id: doc._id.toString() }));
  }

  async getBlogById(id) {
    const blogDoc = await this.blogRepository.findById(id);
    return blogDoc ? { ...blogDoc.toObject(), id: blogDoc._id.toString() } : null;
  }

  async createBlog({ title, snippet, body, author, image }) {
    // Validacijos
    if (!title || !snippet || !body) {
      const error = new Error('Pavadinimas, santrauka ir turinys yra privalomi!');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (title.trim().length < 5) {
      const error = new Error('Pavadinimas turi būti bent 5 simbolių ilgio!');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const created = await this.blogRepository.create({
      title: title.trim(),
      snippet: snippet.trim(),
      body: body.trim(),
      author: author?.trim(),
      image: image?.trim(),
    });
    return { ...created.toObject(), id: created._id.toString() };
  }

  async deleteBlog(id) {
    return this.blogRepository.deleteById(id);
  }

  async updateBlog(id, { title, snippet, body, author, image }) {
    if (!title || !snippet || !body) {
      const error = new Error('Pavadinimas, santrauka ir turinys yra privalomi!');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (title.trim().length < 5) {
      const error = new Error('Pavadinimas turi būti bent 5 simbolių ilgio!');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const updates = {
      title: title.trim(),
      snippet: snippet.trim(),
      body: body.trim(),
      author: author?.trim(),
      image: image?.trim(),
    };
    const updated = await this.blogRepository.updateById(id, updates);
    return updated ? { ...updated.toObject(), id: updated._id.toString() } : null;
  }

  async exists(id) {
    return this.blogRepository.existsById(id);
  }
}

module.exports = { BlogService };
