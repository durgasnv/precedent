/**
 * Central API Router Index
 */

import express from 'express';
const router = express.Router();

import healthRoutes from './health.js';
import decisionsRoutes from './decisions.js';
import analyzeRoutes from './analyze.js';
import reassessRoutes from './reassess.js';

router.use(healthRoutes);
router.use(decisionsRoutes);
router.use(analyzeRoutes);
router.use(reassessRoutes);

export default router;
