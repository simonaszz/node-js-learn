// Pradinis duomenų masyvas su prasmingais pavadinimais
const generateUUID = require('../utils/generateUUID');


const blogComments = [
  // Blog Post 1 komentaras
  {
    commentId: "550e8400-e29b-41d4-a716-446655440000",
    blogPostId: 1,
    authorName: 'Jonas Petrauskas',
    commentContent: 'Labai naudingas straipsnis! Ačiū autorei už išsamią informaciją apie kūdikių lavinimą.',
    createdAtDate: new Date('2024-01-15T10:30:00Z'),
    replies: [
      {
        replyId: "reply-001",
        authorName: 'Petras Kazlauskas',
        replyContent: 'Visiškai sutinku! Man irgi labai padėjo.',
        createdAtDate: new Date('2024-01-16T14:20:00Z')
      },
      {
        replyId: "reply-002",
        authorName: 'Ana Jonaite',
        replyContent: 'Ar galėtumėte parekomenduoti daugiau medžiagos?',
        createdAtDate: new Date('2024-01-17T09:15:00Z')
      }
    ]
  },
  // Blog Post 2 komentaras
  {
    commentId: "550e8400-e29b-41d4-a716-446655440001",
    blogPostId: 2,
    authorName: 'Marius Jonaitis',
    commentContent: 'Puikus straipsnis!',
    createdAtDate: new Date('2024-01-18T11:00:00Z'),
    replies: [
      {
        replyId: "reply-003",
        authorName: 'Laura Petraitė',
        replyContent: 'Man labai patiko šios rekomendacijos.',
        createdAtDate: new Date('2024-01-19T09:30:00Z')
      },
      {
        replyId: "reply-004",
        authorName: 'Tomas Vasiliauskas',
        replyContent: 'Ar galima pridėti daugiau apie šunis?',
        createdAtDate: new Date('2024-01-20T15:45:00Z')
      }
    ]
  },
  // Blog Post 2 - dar vienas komentaras
  {
    commentId: "550e8400-e29b-41d4-a716-446655440002",
    blogPostId: 2,
    authorName: 'Ieva Kazlauskienė',
    commentContent: 'Ačiū už naudingus patarimus!',
    createdAtDate: new Date('2024-01-21T13:20:00Z'),
    replies: []
  },
  // Blog Post 3 komentaras
  {
    commentId: "550e8400-e29b-41d4-a716-446655440003",
    blogPostId: 3,
    authorName: 'Rūta Daukšaitė',
    commentContent: 'Labai naudinga informacija apie technologijas!',
    createdAtDate: new Date('2024-01-22T16:30:00Z'),
    replies: [
      {
        replyId: "reply-005",
        authorName: 'Greta Valaitė',
        replyContent: 'Sutinku, labai informatyvu!',
        createdAtDate: new Date('2024-01-23T09:00:00Z')
      }
    ]
  },
  // Blog Post 3 - dar vienas komentaras
  {
    commentId: "550e8400-e29b-41d4-a716-446655440004",
    blogPostId: 3,
    authorName: 'Andrius Paulauskas',
    commentContent: 'Puikus turinys, laukiu daugiau straipsnių!',
    createdAtDate: new Date('2024-01-24T11:45:00Z'),
    replies: []
  }
];
// Sekantis ID skaičiavimas
let nextCommentId = 1;

// Funkcija naujo komentaro kūrimui
const createBlogComment = (blogPostId, authorName, commentContent) => {
  const newBlogComment = {
    commentId: generateUUID(),
    blogPostId: parseInt(blogPostId),
    authorName: authorName.trim(),
    commentContent: commentContent.trim(),
    createdAtDate: new Date(),
    replies: []  // Naujas komentaras su tuščiu replies masyvu
  };
  blogComments.push(newBlogComment);
  return newBlogComment;
};

// Funkcija komentarų gavimui pagal blog įrašo ID
const getBlogCommentsByPostId = (blogPostId) => {
  return blogComments.filter(comment => comment.blogPostId === parseInt(blogPostId));
};

// Funkcija komentaro ištrinimui
const deleteBlogComment = (commentId) => {
  const commentIndex = blogComments.findIndex(comment => comment.commentId === commentId);
  if (commentIndex !== -1) {
    return blogComments.splice(commentIndex, 1)[0];
  }
  return null;
};

module.exports = { 
  blogComments,
  createBlogComment, 
  getBlogCommentsByPostId, 
  deleteBlogComment 
};