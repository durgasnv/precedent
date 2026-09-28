/**
 * Express Application Configuration
 */

const express = require('express');
const cors = require('cors');

const apiRouter = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Error Handling Middleware
app.use('/api', notFoundHandler);
app.use(errorHandler);

module.exports = app;
