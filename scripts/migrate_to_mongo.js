/*
 * Migration script: Import blogs and comments from local sources into MongoDB.
 * - Blogs source: data/blogs.json (id, title, snippet, body, author, image, createdAt)
 * - Comments source: src/models/blogCommentModel.js (in-memory array with numeric blogPostId)
 *
 * Usage:
 *   node scripts/migrate_to_mongo.js
 *
 * Note: This script connects directly using the same dbURI as in app.js.
 * Make sure Atlas user/IP have access.
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// ====== DB CONNECTION ======
const dbURI = 'mongodb+srv://simonas:Herkus08080512@cluster0.kpkgza3.mongodb.net/blogdb?retryWrites=true&w=majority&appName=Cluster0';

// Models (use existing Mongoose models)
const Blog = require('../src/models/blog');
const BlogComment = require('../src/models/blogComment');

async function readBlogsJson() {
  const jsonPath = path.join(__dirname, '../data/blogs.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('data/blogs.json nerastas. Praleidžiam blog importą iš JSON.');
    return { blogs: [], nextId: 1 };
  }
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(raw);
}

function loadLegacyComments() {
  try {
    const legacy = require('../src/models/blogCommentModel');
    return legacy.blogComments || [];
  } catch (e) {
    console.log('Nepavyko užkrauti legacy komentarų (blogCommentModel.js). Praleidžiame komentarų migraciją.');
    return [];
  }
}

async function migrate() {
  await mongoose.connect(dbURI);
  console.log('✅ Prisijungta prie DB (migracija)');

  try {
    // 1) Read existing blogs in DB
    const existingBlogs = await Blog.find({}).lean();
    const existingByTitle = new Map(existingBlogs.map(b => [b.title, b]));

    // 2) Read blogs from JSON
    const jsonData = await readBlogsJson();
    const blogsFromJson = jsonData.blogs || [];

    // 3) Build/ensure map from old numeric id -> new ObjectId
    const idMap = new Map();

    // If DB is empty, insert all JSON blogs
    if (existingBlogs.length === 0 && blogsFromJson.length > 0) {
      console.log(`Rasta ${blogsFromJson.length} JSON blogų. Keliame į DB...`);
      const docs = await Blog.insertMany(
        blogsFromJson.map(b => ({
          title: b.title,
          snippet: b.snippet,
          body: b.body,
          author: b.author || 'Anonimas',
          image: b.image || '/images/default-blog.png',
          createdAt: b.createdAt ? new Date(b.createdAt) : undefined
        }))
      );
      // Map by order/title
      for (let i = 0; i < blogsFromJson.length; i++) {
        const oldId = blogsFromJson[i].id; // numeric
        idMap.set(oldId, docs[i]._id);
      }
      console.log('✅ Blogai sėkmingai importuoti iš JSON.');
    } else {
      // DB already has blogs. Map by title (best-effort)
      for (const b of blogsFromJson) {
        const match = existingByTitle.get(b.title);
        if (match) idMap.set(b.id, match._id);
      }
      console.log(`DB jau turi ${existingBlogs.length} blogų. JSON susiejimas pagal pavadinimą atliktas (${idMap.size} susieti).`);
    }

    // 4) Migrate legacy comments if available
    const legacyComments = loadLegacyComments();
    if (legacyComments.length === 0) {
      console.log('Nerasta legacy komentarų arba praleista. Migracijos komentarams nėra.');
    } else {
      console.log(`Rasta ${legacyComments.length} legacy komentarų. Keliame į DB...`);

      // Optional: Avoid duplicates by checking if any comments exist
      const existingCommentCount = await BlogComment.countDocuments();
      if (existingCommentCount > 0) {
        console.log(`Komentarų kolekcijoje jau yra ${existingCommentCount} įrašų. Praleidžiam, kad nedublikavus.`);
      } else {
        const payload = [];
        for (const c of legacyComments) {
          const targetBlogId = idMap.get(c.blogPostId);
          if (!targetBlogId) {
            // If we failed to map by old id, try to skip
            console.log(`⚠️ Nepavyko susieti komentaro su blog ID=${c.blogPostId}. Praleidžiam.`);
            continue;
          }
          payload.push({
            blogPostId: targetBlogId,
            authorName: c.authorName,
            commentContent: c.commentContent,
            createdAtDate: c.createdAtDate ? new Date(c.createdAtDate) : new Date(),
            replies: Array.isArray(c.replies) ? c.replies.map(r => ({
              replyId: r.replyId,
              authorName: r.authorName,
              replyContent: r.replyContent,
              createdAtDate: r.createdAtDate ? new Date(r.createdAtDate) : new Date()
            })) : []
          });
        }

        if (payload.length > 0) {
          await BlogComment.insertMany(payload);
          console.log(`✅ Sėkmingai importuota ${payload.length} komentarų.`);
        } else {
          console.log('⚠️ Nerasta komentarų, kuriuos būtų galima susieti su blog įrašais.');
        }
      }
    }

    console.log('🎉 Migracija baigta.');
  } catch (err) {
    console.error('❌ Migracijos klaida:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DB ryšys uždarytas.');
  }
}

migrate();
