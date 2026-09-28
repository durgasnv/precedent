/**
 * Health Check Endpoint
 * GET /api/health
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'precedent-backend',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
