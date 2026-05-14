const jwt = require('jsonwebtoken');
const db  = require('../db');

function requireCoach(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (req.user.role !== 'coach') return res.status(403).json({ error: 'Forbidden' });
  next();
}

async function requireAssigned(req, res, next) {
  const patientId = req.params.id;
  if (!patientId || isNaN(patientId)) return res.status(400).json({ error: 'Invalid patient ID' });
  try {
    const { rows } = await db.query(
      'SELECT 1 FROM coach_patients WHERE coach_id = $1 AND patient_id = $2 AND removed_at IS NULL',
      [req.user.id, patientId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { requireCoach, requireAssigned };
