import express from 'express';
import orchestrator from '../services/orchestrator.js';

const router = express.Router();
router.get('/timeline', async (req, res, next) => {
  try {
    res.json({ success: true, data: await orchestrator.listTimeline(req.collectionId) });
  } catch (error) { next(error); }
});
export default router;
