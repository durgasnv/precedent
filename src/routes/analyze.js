/**
 * Proposal Analysis Endpoint
 * 
 * POST /api/analyze - Analyze a new technical proposal against memory
 */

const express = require('express');
const router = express.Router();
const orchestrator = require('../services/orchestrator');
const { validateAnalyze } = require('../middleware/validation');

router.post('/analyze', validateAnalyze, async (req, res, next) => {
  try {
    const analysis = await orchestrator.analyzeProposal(req.body);
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
