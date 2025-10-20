/**
 * Blog Controller
 * 
 * Šis failas atsakingas už HTTP užklausų valdymą.
 * 
 * Kas yra Controller?
 * - Controller gauna HTTP užklausą (request)
 * - Iškviečia Model funkcijas (gauti duomenis)
 * - Render'ina view (EJS šabloną) arba grąžina JSON
 * - Siunčia atsakymą (response) vartotojui
 * 
 * Controller yra tarpininkas tarp Model ir View!
 */

const Blog = require('../models/blog');

/**
 * GET /blog - Rodyti visus blog įrašus
 * 
 * Kaip veikia:
 * 1. Vartotojas atidaro /blog
 * 2. Controller iškviečia getAllBlogs()
 * 3. Model perskaito blogs.json ir grąžina masyvą
 * 4. Controller render'ina blog.ejs su tais duomenimis
 */
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

/**
 * GET /blog/:id - Rodyti vieną blog įrašą
 * 
 * Dabar naudojame ID vietoj slug!
 * Kodėl? Nes ID unikalus ir paprastesnis.
 */
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

/**
 * GET /create - Rodyti blog kūrimo formą
 * 
 * Tai paprasta - tiesiog render'iname formą.
 */
const showCreateForm = (request, response) => {
  response.render('pages/create', {
    title: 'Sukurti Naują Įrašą'
  });
};

/**
 * POST /create - Sukurti naują blog įrašą
 * 
 * Kaip veikia:
 * 1. Vartotojas užpildo formą
 * 2. Formos duomenys ateina per request.body
 * 3. Validuojame (ar yra title, snippet, body?)
 * 4. Iškviečiame Model.createBlog()
 * 5. Redirect'iname į naują blog puslapį
 */
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

/**
 * DELETE /blog/:id - Ištrinti blog įrašą
 * 
 * Kaip veikia:
 * 1. Vartotojas paspaudžia "Ištrinti" mygtuką
 * 2. JavaScript frontend'e išsiunčia DELETE užklausą
 * 3. Controller iškviečia Model.deleteBlog()
 * 4. Grąžina JSON atsakymą (success: true/false)
 */
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

// Eksportuoti funkcijas
module.exports = {
  getBlogList,
  getBlogDetail,
  showCreateForm,
  createNewBlog,
  deleteBlogPost
};