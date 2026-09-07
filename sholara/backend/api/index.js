// Vercel entry point. Vercel looks for files under /api and treats each
// as a serverless function. This one just re-exports the fully-configured
// Express app from server.js, so every existing route file works
// unchanged — Express still does all the internal routing itself.
const app = require("../server");

module.exports = app;