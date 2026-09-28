/**
 * PRECEDENT Backend API Server Entry Point
 */

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[PRECEDENT Backend API] Running on http://localhost:${PORT}`);
  console.log(`[PRECEDENT Backend API] Health check at http://localhost:${PORT}/api/health`);
});

module.exports = server;
