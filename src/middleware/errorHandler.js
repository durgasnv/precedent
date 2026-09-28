/**
 * Centralized Express Error Handling Middleware
 */

import { ServiceNotConnectedError } from '../services/aiMemoryService.js';
import { MemoryAiError } from '../memory-ai.js';

// Handle 404 Not Found for unknown API routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route '${req.method} ${req.originalUrl}' not found.`
    }
  });
};

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  // Handle JSON parse errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload in request body.'
      }
    });
  }

  // Handle Person 1 Service Not Connected Error
  if (err instanceof ServiceNotConnectedError || err.name === 'ServiceNotConnectedError') {
    return res.status(err.statusCode || 503).json({
      error: {
        code: err.code || 'SERVICE_UNAVAILABLE',
        message: err.message
      }
    });
  }

  if (err instanceof MemoryAiError) {
    const status = err.code === 'HINDSIGHT_AUTH' ? 502 : err.code === 'HINDSIGHT_CREDITS' ? 503 : err.retryable ? 503 : 502;
    return res.status(status).json({ error: { code: err.code, message: err.message, retryable: err.retryable } });
  }

  if (err instanceof TypeError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
  }

  // Handle explicit status codes on error objects
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = statusCode === 500 ? 'An unexpected internal server error occurred.' : (err.message || 'Server error');

  // Log error details internally for debugging (without leaking to client)
  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      ...(err.details ? { details: err.details } : {})
    }
  });
};

export { notFoundHandler, errorHandler };
