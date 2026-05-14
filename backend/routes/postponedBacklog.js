const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM postponed_backlog WHERE patient_id = $1',
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const { items, status } = req.body;
  const st = status === 'submitted' ? 'submitted' : 'draft';
  try {
    const { rows } = await db.query(
      `INSERT INTO postponed_backlog (patient_id, items, status, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (patient_id) DO UPDATE SET items=$2, status=$3, updated_at=NOW()
       RETURNING id, status, updated_at`,
      [req.user.id, JSON.stringify(items || []), st]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/', auth, async (req, res) => {
  if (req.user.role !== 'coach') return res.status(403).json({ error: 'Forbidden' });
  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
  try {
    await db.query('DELETE FROM postponed_backlog WHERE patient_id = $1', [patient_id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
