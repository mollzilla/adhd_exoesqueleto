const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM between_session_reflection WHERE patient_id = $1',
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const {
    patterns_q1, patterns_q2, patterns_q3, patterns_q4,
    backlog_q1, backlog_q2, backlog_q3, backlog_q4,
    goals_q1, goals_q2, goals_q3, goals_q4,
    status,
  } = req.body;
  const st = status === 'submitted' ? 'submitted' : 'draft';
  try {
    const { rows } = await db.query(
      `INSERT INTO between_session_reflection (
         patient_id,
         patterns_q1, patterns_q2, patterns_q3, patterns_q4,
         backlog_q1, backlog_q2, backlog_q3, backlog_q4,
         goals_q1, goals_q2, goals_q3, goals_q4,
         status, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       ON CONFLICT (patient_id) DO UPDATE SET
         patterns_q1=$2, patterns_q2=$3, patterns_q3=$4, patterns_q4=$5,
         backlog_q1=$6, backlog_q2=$7, backlog_q3=$8, backlog_q4=$9,
         goals_q1=$10, goals_q2=$11, goals_q3=$12, goals_q4=$13,
         status=$14, updated_at=NOW()
       RETURNING id, status, updated_at`,
      [
        req.user.id,
        patterns_q1, patterns_q2, patterns_q3, patterns_q4,
        backlog_q1, backlog_q2, backlog_q3, backlog_q4,
        goals_q1, goals_q2, goals_q3, goals_q4,
        st,
      ]
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
    await db.query('DELETE FROM between_session_reflection WHERE patient_id = $1', [patient_id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
