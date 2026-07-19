const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
  console.log('[db] connected successfully to:', env.MONGO_URI.split('@').pop());
  return mongoose.connection;
}

module.exports = { connectDb };
