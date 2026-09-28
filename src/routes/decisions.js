/**
 * Decision Memory Endpoints
 * 
 * GET  /api/decisions      - List all decision memories
 * GET  /api/decisions/:id  - Inspect one decision record
 * POST /api/decisions      - Record a new decision/experiment
 */

const express = require('express');
const router = express.Router();
const orchestrator = require('../services/orchestrator');
const { validateRecordDecision } = require('../middleware/validation');

// GET /api/decisions - List all decision records
router.get('/decisions', async (req, res, next) => {
  try {
    const decisions = await orchestrator.listDecisions();
    res.status(200).json({
      success: true,
      count: decisions.length,
      data: decisions
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/decisions/:id - Get a single decision record by ID
router.get('/decisions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const decision = await orchestrator.getDecisionById(id);

    if (!decision) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Decision record with ID '${id}' not found.`
        }
      });
    }

    res.status(200).json({
      success: true,
      data: decision
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/decisions - Record a technical decision
router.post('/decisions', validateRecordDecision, async (req, res, next) => {
  try {
    const result = await orchestrator.recordDecision(req.body);
    res.status(201).json({
      success: true,
      data: result.decision,
      retentionStatus: result.retentionStatus
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
