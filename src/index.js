/**
 * PRECEDENT Backend API Server Entry Point
 */

import 'dotenv/config';
import app from './app.js';
import { retentionService } from './services/retentionService.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[PRECEDENT Backend API] Running on http://localhost:${PORT}`);
  console.log(`[PRECEDENT Backend API] Health check at http://localhost:${PORT}/api/health`);
});

retentionService.start();

export default server;
