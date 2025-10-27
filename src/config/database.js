const mongoose = require('mongoose');

function getMongoUri() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Please define it in your .env file.');
  }
  return uri;
}

async function connectToDatabase() {
  const uri = getMongoUri();
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectToDatabase };
