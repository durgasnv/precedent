/**
 * Assumption Reassessment Endpoint
 * 
 * POST /api/reassess - Reassess a historical decision with changed context
 */

const express = require('express');
const router = express.Router();
const orchestrator = require('../services/orchestrator');
const { validateReassess } = require('../middleware/validation');

router.post('/reassess', validateReassess, async (req, res, next) => {
  try {
    const reassessment = await orchestrator.reassessDecision(req.body);
    res.status(200).json({
      success: true,
      data: reassessment
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
