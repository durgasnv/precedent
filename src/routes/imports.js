import { createHash, randomUUID } from 'node:crypto';
import express from 'express';
import { aiMemoryService } from '../services/aiMemoryService.js';
import orchestrator from '../services/orchestrator.js';
import decisionModel from '../models/decision.js';

const router = express.Router();
const fields = ['title', 'problem', 'approach', 'outcome', 'failure_reason', 'decision'];
const hash = (text) => createHash('sha256').update(text).digest('hex');

function sourceInput(body) {
  if (!body || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 20000) {
    throw new TypeError('Source text must contain 1–20,000 characters.');
  }
  const filename = typeof body.filename === 'string'
    ? body.filename.replace(/^.*[\\/]/, '').trim().slice(0, 200) : '';
  let sourceUrl = '';
  if (body.sourceUrl) {
    const parsed = new URL(body.sourceUrl);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new TypeError('Source URL must use HTTP or HTTPS.');
    sourceUrl = parsed.href;
  }
  return { text: body.text, filename, sourceUrl, sha256: hash(body.text) };
}

router.post('/imports/preview', async (req, res, next) => {
  try {
    const source = sourceInput(req.body);
    const result = await aiMemoryService.draftFromDocument(source.text, req.collectionId);
    res.json({ success: true, data: { ...result, source: {
      filename: source.filename, source_url: source.sourceUrl, sha256: source.sha256,
    } } });
  } catch (error) { next(error); }
});

router.post('/imports', async (req, res, next) => {
  try {
    const source = sourceInput(req.body);
    if (req.body.sourceHash !== source.sha256) throw new TypeError('Source text changed after preview. Preview it again.');
    if (!req.body.draft || typeof req.body.draft !== 'object' || Array.isArray(req.body.draft) ||
        !req.body.passages || typeof req.body.passages !== 'object') {
      throw new TypeError('A reviewed draft and its source passages are required.');
    }
    const passages = {};
    for (const field of fields) {
      const passage = req.body.passages[field];
      if (passage == null) { passages[field] = null; continue; }
      if (typeof passage.text !== 'string' || !passage.text || !Number.isInteger(passage.start) ||
          passage.start < 0 || passage.start + passage.text.length > source.text.length ||
          source.text.slice(passage.start, passage.start + passage.text.length) !== passage.text) {
        throw new TypeError('Source passage for ' + field + ' does not match the submitted text.');
      }
      passages[field] = { text: passage.text, start: passage.start };
    }
    const draft = { ...req.body.draft,
      evidence: [source.sourceUrl || source.filename || 'Reviewed imported note',
        ...(Array.isArray(req.body.draft.evidence) ? req.body.draft.evidence : [])] };
    const sourceRecord = { id: randomUUID(), filename: source.filename, source_url: source.sourceUrl,
      sha256: source.sha256, content: source.text, passages, reviewer_id: req.user.id };
    const result = await orchestrator.recordDecision(draft, req.collectionId, sourceRecord);
    res.status(result.retentionStatus?.state === 'ready' ? 201 : 202).json({ success: true,
      data: { ...result.decision, retention_status: result.retentionStatus?.state || 'pending' },
      retentionStatus: result.retentionStatus });
  } catch (error) { next(error); }
});

router.get('/decisions/:id/source', (req, res, next) => {
  try {
    const source = decisionModel.getSource(req.params.id, req.collectionId);
    if (!source) return res.status(404).json({ error: {
      code: 'NOT_FOUND', message: 'Source document not found in this collection.',
    } });
    res.json({ success: true, data: source });
  } catch (error) { next(error); }
});

export default router;
