import express from 'express';
import decisionModel from '../models/decision.js';

const router = express.Router();
router.get('/collections', (_req, res) => {
  res.json({ success: true, data: decisionModel.listCollections() });
});
router.post('/collections', (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: decisionModel.createCollection(req.body?.name) });
  } catch (error) { next(error); }
});
export default router;
