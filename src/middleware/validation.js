/**
 * Request Validation Middleware
 */

const validateRecordDecision = (req, res, next) => {
  const body = req.body;
  
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Request body must be a valid JSON object.'
      }
    });
  }

  const requiredFields = [
    'title',
    'problem',
    'approach',
    'outcome',
    'failure_reason',
    'decision'
  ];

  const missingFields = requiredFields.filter(field => {
    const val = body[field];
    return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        details: missingFields.map(field => ({
          field,
          issue: `Field '${field}' is required and cannot be empty.`
        }))
      }
    });
  }

  next();
};

const validateAnalyze = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Request body must be a valid JSON object.'
      }
    });
  }

  if (!body.proposal || typeof body.proposal !== 'string' || body.proposal.trim() === '') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: "Field 'proposal' is required and must be a non-empty string.",
        details: [
          {
            field: 'proposal',
            issue: "Field 'proposal' is required."
          }
        ]
      }
    });
  }

  next();
};

const validateReassess = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Request body must be a valid JSON object.'
      }
    });
  }

  if (!body.changedCircumstances || typeof body.changedCircumstances !== 'string' || body.changedCircumstances.trim() === '') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: "Field 'changedCircumstances' is required and must be a non-empty string.",
        details: [
          {
            field: 'changedCircumstances',
            issue: "Field 'changedCircumstances' is required."
          }
        ]
      }
    });
  }

  next();
};

module.exports = {
  validateRecordDecision,
  validateAnalyze,
  validateReassess
};
