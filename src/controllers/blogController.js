/**
 * Blog controller: valdo tinklaraščio puslapius ir CRUD.
 * Handleriai renderina EJS arba grąžina JSON.
 */

const Blog = require('../models/blog');

// GET /blog — sąrašas (rikiuojama pagal sukūrimo datą, naujausi viršuje)
const getBlogList = async (request, response) => {
  try {
    // Gauti visus blogus iš MongoDB ir išlaikyti suderinamumą su EJS (id)
    const blogDocs = await Blog.find().sort({ createdAt: -1 });
    const blogs = blogDocs.map(doc => ({ ...doc.toObject(), id: doc._id.toString() }));

    // Render'inti view su duomenimis
    response.render('pages/blog', {
      title: 'Tinklaraštis',
      blogs: blogs
    });

  } catch (error) {
    console.error('❌ Klaida rodant blogų sąrašą:', error);
    response.status(500).send('Serverio klaida');
  }
};

// GET /blog/:id — detalės pagal MongoDB ObjectId; 404 jei nerasta
const getBlogDetail = async (request, response) => {
  try {
    // Gauti ID iš URL (pvz., /blog/<ObjectId>)
    const blogId = request.params.id;

    // Gauti blog iš MongoDB
    const blogDoc = await Blog.findById(blogId);

    // Jei nerastas - rodyti 404
    if (!blogDoc) {
      return response.status(404).render('pages/404', {
        title: '404 - Puslapis Nerastas',
        message: 'Blog įrašas nerastas',
        url: request.url
      });
    }

    // Paruošti duomenis view'ui su id lauku
    const blog = { ...blogDoc.toObject(), id: blogDoc._id.toString() };

    // Render'inti blog-detail view
    response.render('pages/blog-detail', {
      title: blog.title,
      blog: blog,
      blogId: blog.id
    });

  } catch (error) {
    console.error('❌ Klaida rodant blog detales:', error);
    response.status(500).send('Serverio klaida');
  }
};

// GET /blog/create — kūrimo forma
const showCreateForm = (request, response) => {
  response.render('pages/create', {
    title: 'Sukurti Naują Įrašą'
  });
};

// POST /blog/create — sukuria įrašą; paprasta validacija; redirect į detalę
const createNewBlog = async (request, response) => {
  try {
    // Gauti duomenis iš formos
    const { title, snippet, body, author, image } = request.body;
    
    // VALIDACIJA - ar yra privalomi laukai?
    if (!title || !snippet || !body) {
      return response.status(400).render('pages/create', {
        title: 'Sukurti Naują Įrašą',
        error: 'Pavadinimas, santrauka ir turinys yra privalomi!',
        formData: request.body // Grąžinti formos duomenis, kad vartotojas nepraran
      });
    }
    
    // Papildoma validacija - ar title bent 5 simboliai?
    if (title.trim().length < 5) {
      return response.status(400).render('pages/create', {
        title: 'Sukurti Naują Įrašą',
        error: 'Pavadinimas turi būti bent 5 simbolių ilgio!',
        formData: request.body
      });
    }
    
    // Sukurti naują blog per MongoDB
    const newBlog = await Blog.create({
      title: title.trim(),
      snippet: snippet.trim(),
      body: body.trim(),
      author: author?.trim(),
      image: image?.trim()
    });

    console.log('✅ Naujas blog sukurtas:', newBlog._id.toString());

    // Redirect'inti į naujo blog puslapį
    response.redirect(`/blog/${newBlog._id.toString()}`);
    
  } catch (error) {
    console.error('❌ Klaida kuriant blog:', error);
    response.status(500).render('pages/create', {
      title: 'Sukurti Naują Įrašą',
      error: 'Nepavyko sukurti įrašo. Bandykite dar kartą.',
      formData: request.body
    });
  }
};

// DELETE /blog/:id — pašalina įrašą; grąžina JSON (success/message)
const deleteBlogPost = async (request, response) => {
  try {
    const blogId = request.params.id;
    
    // Ištrinti blog per MongoDB
    const deletedBlog = await Blog.findByIdAndDelete(blogId);
    
    // Jei nerastas
    if (!deletedBlog) {
      return response.status(404).json({
        success: false,
        message: 'Blog įrašas nerastas'
      });
    }
    
    console.log('🗑️ Blog ištrintas:', blogId);
    
    // Grąžinti sėkmės atsakymą
    response.json({
      success: true,
      message: 'Blog sėkmingai ištrintas',
      redirectUrl: '/blog'
    });
    
  } catch (error) {
    console.error('❌ Klaida trinant blog:', error);
    response.status(500).json({
      success: false,
      message: 'Nepavyko ištrinti įrašo'
    });
  }
};

class BlogController {
  constructor(blogService) {
    this.blogService = blogService;
  }

  static fromDependencies(blogService) {
    return new BlogController(blogService);
  }

  // GET /blog — sąrašas (rikiuojama pagal sukūrimo datą, naujausi viršuje)
  async getBlogList(request, response) {
    try {
      const blogs = await this.blogService.listBlogs();
      // Render'inti view su duomenimis
      response.render('pages/blog', {
        title: 'Tinklaraštis',
        blogs: blogs
      });
    } catch (error) {
      console.error('❌ Klaida rodant blogų sąrašą:', error);
      response.status(500).send('Serverio klaida');
    }
  }

  // GET /blog/:id — detalės pagal MongoDB ObjectId; 404 jei nerasta
  async getBlogDetail(request, response) {
    try {
      // Gauti ID iš URL (pvz., /blog/<ObjectId>)
      const blogId = request.params.id;
      const blog = await this.blogService.getBlogById(blogId);

      // Jei nerastas - rodyti 404
      if (!blog) {
        return response.status(404).render('pages/404', {
          title: '404 - Puslapis Nerastas',
          message: 'Blog įrašas nerastas',
          url: request.url
        });
      }

      // Render'inti blog-detail view
      response.render('pages/blog-detail', {
        title: blog.title,
        blog: blog,
        blogId: blog.id
      });
    } catch (error) {
      console.error('❌ Klaida rodant blog detales:', error);
      response.status(500).send('Serverio klaida');
    }
  }

  // GET /blog/create — kūrimo forma
  showCreateForm(request, response) {
    response.render('pages/create', {
      title: 'Sukurti Naują Įrašą'
    });
  }

  // POST /blog/create — sukuria įrašą; paprasta validacija; redirect į detalę
  async createNewBlog(request, response) {
    try {
      // Gauti duomenis iš formos
      const { title, snippet, body, author, image } = request.body;

      const newBlog = await this.blogService.createBlog({ title, snippet, body, author, image });

      console.log('✅ Naujas blog sukurtas:', newBlog.id);
      // Redirect'inti į naujo blog puslapį
      response.redirect(`/blog/${newBlog.id}`);
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        return response.status(400).render('pages/create', {
          title: 'Sukurti Naują Įrašą',
          error: error.message,
          formData: request.body
        });
      }
      console.error('❌ Klaida kuriant blog:', error);
      response.status(500).render('pages/create', {
        title: 'Sukurti Naują Įrašą',
        error: 'Nepavyko sukurti įrašo. Bandykite dar kartą.',
        formData: request.body
      });
    }
  }

  // DELETE /blog/:id — pašalina įrašą; grąžina JSON (success/message)
  async deleteBlogPost(request, response) {
    try {
      const blogId = request.params.id;
      const deletedBlog = await this.blogService.deleteBlog(blogId);

      // Jei nerastas
      if (!deletedBlog) {
        return response.status(404).json({
          success: false,
          message: 'Blog įrašas nerastas'
        });
      }

      console.log('🗑️ Blog ištrintas:', blogId);
      // Grąžinti sėkmės atsakymą
      response.json({
        success: true,
        message: 'Blog sėkmingai ištrintas',
        redirectUrl: '/blog'
      });
    } catch (error) {
      console.error('❌ Klaida trinant blog:', error);
      response.status(500).json({
        success: false,
        message: 'Nepavyko ištrinti įrašo'
      });
    }
  }

  // GET /blog/:id/edit — redagavimo forma
  async showEditForm(request, response) {
    try {
      const blogId = request.params.id;
      const blog = await this.blogService.getBlogById(blogId);
      if (!blog) {
        return response.status(404).render('pages/404', {
          title: '404 - Puslapis Nerastas',
          message: 'Blog įrašas nerastas',
          url: request.url
        });
      }
      response.render('pages/edit', { title: `Redaguoti: ${blog.title}`, blog });
    } catch (error) {
      console.error('❌ Klaida rodant redagavimo formą:', error);
      response.status(500).send('Serverio klaida');
    }
  }

  // POST /blog/:id/edit — atnaujina įrašą
  async updateBlog(request, response) {
    try {
      const blogId = request.params.id;
      const { title, snippet, body, author, image } = request.body;
      const updated = await this.blogService.updateBlog(blogId, { title, snippet, body, author, image });
      if (!updated) {
        return response.status(404).render('pages/404', {
          title: '404 - Puslapis Nerastas',
          message: 'Blog įrašas nerastas',
          url: request.url
        });
      }
      response.redirect(`/blog/${updated.id}`);
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        // Parodyti tą pačią redagavimo formą su klaida
        const blogId = request.params.id;
        return response.status(400).render('pages/edit', {
          title: 'Redaguoti Įrašą',
          blog: { id: blogId, ...request.body },
          error: error.message
        });
      }
      console.error('❌ Klaida atnaujinant blog:', error);
      response.status(500).render('pages/edit', {
        title: 'Redaguoti Įrašą',
        blog: { id: request.params.id, ...request.body },
        error: 'Nepavyko atnaujinti įrašo. Bandykite dar kartą.'
      });
    }
  }

  // GET /blog/:id/exists — patikrinti ar įrašas egzistuoja
  async checkExists(request, response) {
    try {
      const blogId = request.params.id;
      const exists = await this.blogService.exists(blogId);
      response.json({ success: true, exists: Boolean(exists) });
    } catch (error) {
      console.error('❌ Klaida tikrinant įrašo egzistavimą:', error);
      response.status(500).json({ success: false, message: 'Serverio klaida' });
    }
  }
}

module.exports = BlogController;