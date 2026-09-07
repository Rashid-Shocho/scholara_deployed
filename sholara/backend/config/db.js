const mongoose = require("mongoose");

// Serverless-safe connection: Vercel functions can spin up many parallel
// instances, and a fresh mongoose.connect() per invocation would quickly
// exhaust MongoDB Atlas's connection limit. Caching the connection promise
// on the module means a warm function instance reuses the same connection
// instead of opening a new one every request.
let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    cachedConnection = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    return cachedConnection;
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
    // Do NOT process.exit() here — in a serverless function that would
    // kill the whole function instance. Throwing lets the request that
    // triggered this fail with a normal 500 instead, and the next
    // invocation gets a fresh chance to connect.
    throw error;
  }
};

module.exports = connectDB;