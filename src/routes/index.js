/**
 * Central API Router Index
 */

import express from 'express';
const router = express.Router();

import healthRoutes from './health.js';
import decisionsRoutes from './decisions.js';
import analyzeRoutes from './analyze.js';
import reassessRoutes from './reassess.js';
import collectionRoutes from './collections.js';
import timelineRoutes from './timeline.js';
import decisionModel from '../models/decision.js';

router.use(healthRoutes);
router.use(collectionRoutes);
router.use((req, res, next) => {
  req.collectionId = req.get('X-Precedent-Collection') || 'demo';
  if (!decisionModel.getCollection(req.collectionId)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Decision collection not found.' } });
  }
  next();
});
router.use(decisionsRoutes);
router.use(timelineRoutes);
router.use(analyzeRoutes);
router.use(reassessRoutes);

export default router;
