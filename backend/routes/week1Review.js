const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM week1_review WHERE patient_id = $1',
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const {
    most_valuable_learning, hardest_part, strategy_realistic, week2_focus,
    environmental_change, micro_habit, first_backlog_step, progress_reporting,
    status,
  } = req.body;
  const st = status === 'submitted' ? 'submitted' : 'draft';
  try {
    const { rows } = await db.query(
      `INSERT INTO week1_review (
         patient_id,
         most_valuable_learning, hardest_part, strategy_realistic, week2_focus,
         environmental_change, micro_habit, first_backlog_step, progress_reporting,
         status, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (patient_id) DO UPDATE SET
         most_valuable_learning=$2, hardest_part=$3, strategy_realistic=$4, week2_focus=$5,
         environmental_change=$6, micro_habit=$7, first_backlog_step=$8, progress_reporting=$9,
         status=$10, updated_at=NOW()
       RETURNING id, status, updated_at`,
      [
        req.user.id,
        most_valuable_learning, hardest_part, strategy_realistic, week2_focus,
        environmental_change, micro_habit, first_backlog_step, progress_reporting,
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
    await db.query('DELETE FROM week1_review WHERE patient_id = $1', [patient_id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
