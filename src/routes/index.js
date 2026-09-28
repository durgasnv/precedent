/**
 * Central API Router Index
 */

const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');
const decisionsRoutes = require('./decisions');
const analyzeRoutes = require('./analyze');
const reassessRoutes = require('./reassess');

router.use(healthRoutes);
router.use(decisionsRoutes);
router.use(analyzeRoutes);
router.use(reassessRoutes);

module.exports = router;
