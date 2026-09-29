const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const connUri = process.env.MONGODB_URI || process.env.MONGO_URL;

  if (!connUri) {
    const errorMsg = 'MongoDB Atlas connection string (MONGODB_URI) is not configured in Vercel. Please add MONGODB_URI in your Vercel Project Settings -> Environment Variables.';
    console.error(`[MongoDB Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  cachedPromise = mongoose.connect(connUri, {
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false, // Prevents 10s buffering timeout
  }).then((conn) => {
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return conn;
  }).catch((error) => {
    cachedPromise = null;
    console.error(`[MongoDB Connection Error] ${error.message}`);
    throw error;
  });

  return cachedPromise;
};

module.exports = connectDB;
