/**
 * Assumption Reassessment Endpoint
 *
 * POST /api/reassess - Reassess a historical decision with changed context
 */

import express from 'express';
const router = express.Router();
import orchestrator from '../services/orchestrator.js';
import { validateReassess } from '../middleware/validation.js';

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

export default router;
