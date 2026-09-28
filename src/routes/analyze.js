/**
 * Proposal Analysis Endpoint
 *
 * POST /api/analyze - Analyze a new technical proposal against memory
 */

import express from 'express';
const router = express.Router();
import orchestrator from '../services/orchestrator.js';
import { validateAnalyze } from '../middleware/validation.js';

router.post('/analyze', validateAnalyze, async (req, res, next) => {
  try {
    const analysis = await orchestrator.analyzeProposal({ ...req.body, collectionId: req.collectionId });
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
});

export default router;
