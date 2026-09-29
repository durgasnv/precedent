/**
 * Express Application Configuration
 */

import express from 'express';
import cors from 'cors';

import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Global Middleware
const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')
  .split(',').map(item => item.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Error Handling Middleware
app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;
