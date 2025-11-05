// JWT paslaugos
// - generateToken: sukuria JWT su vartotojo ID (payload: { userId })
// - getUserIDFromToken: validuoja ir grąžina userId iš tokeno
// - verifyToken: papildomai patikrina DB, ar vartotojas egzistuoja
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // pas jus modelis: src/models/user.js

// Konfigūracija (rekomenduojama naudoti .env)
const SECRET_KEY = process.env.JWT_SECRET || 'labai slaptas raktas';
const expirationTime = process.env.JWT_EXPIRES_IN || '1h';

// Sukuria JWT su galiojimo trukme
const generateToken = (user_id) => {
  return jwt.sign({ userId: user_id }, SECRET_KEY, { expiresIn: expirationTime });
};

// Iš tokeno validuotai ištraukia userId (mėto klaidą jei token netinkamas)
const getUserIDFromToken = (token) => {
  const decodedToken = jwt.verify(token, SECRET_KEY);
  return decodedToken.userId;
};

// Patikrina ar tokenas priklauso egzistuojančiam vartotojui
const verifyToken = async (token) => {
  try {
    const userId = getUserIDFromToken(token);
    const user = await User.findById(userId);
    if (!user) return false;
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  getUserIDFromToken
};