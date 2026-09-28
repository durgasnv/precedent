/**
 * Express Application Configuration
 */

import express from 'express';
import cors from 'cors';

import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Error Handling Middleware
app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;
