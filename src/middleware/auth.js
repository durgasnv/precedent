import decisionModel from '../models/decision.js';

export function requireAuth(req, res, next) {
  const match = /^Bearer ([A-Za-z0-9_-]+)$/.exec(req.get('Authorization') || '');
  const user = match ? decisionModel.getUserByToken(match[1]) : null;
  if (!user) return res.status(401).json({ error: {
    code: 'UNAUTHORIZED', message: 'A valid PRECEDENT access token is required.',
  } });
  req.user = user;
  next();
}
