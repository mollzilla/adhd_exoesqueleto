const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM goals_meeting WHERE patient_id = $1',
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const {
    life_work, life_home, life_health, life_relationships, life_finance, life_personal_growth,
    most_alive_focused, peak_time, hyperfocus_triggers, ef_challenges, strategies_tried,
    goal_3months, goal_1month, goal_this_week,
    session_frequency, feedback_style, accountability_format, coach_not_to_do,
    status,
  } = req.body;
  const st = status === 'submitted' ? 'submitted' : 'draft';
  try {
    const { rows } = await db.query(
      `INSERT INTO goals_meeting (
         patient_id,
         life_work, life_home, life_health, life_relationships, life_finance, life_personal_growth,
         most_alive_focused, peak_time, hyperfocus_triggers, ef_challenges, strategies_tried,
         goal_3months, goal_1month, goal_this_week,
         session_frequency, feedback_style, accountability_format, coach_not_to_do,
         status, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW()
       )
       ON CONFLICT (patient_id) DO UPDATE SET
         life_work=$2, life_home=$3, life_health=$4, life_relationships=$5,
         life_finance=$6, life_personal_growth=$7,
         most_alive_focused=$8, peak_time=$9, hyperfocus_triggers=$10,
         ef_challenges=$11, strategies_tried=$12,
         goal_3months=$13, goal_1month=$14, goal_this_week=$15,
         session_frequency=$16, feedback_style=$17, accountability_format=$18,
         coach_not_to_do=$19, status=$20, updated_at=NOW()
       RETURNING id, status, updated_at`,
      [
        req.user.id,
        life_work, life_home, life_health, life_relationships, life_finance, life_personal_growth,
        most_alive_focused, peak_time, hyperfocus_triggers,
        ef_challenges || [],
        strategies_tried,
        goal_3months, goal_1month, goal_this_week,
        session_frequency, feedback_style || null, accountability_format, coach_not_to_do,
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
    await db.query('DELETE FROM goals_meeting WHERE patient_id = $1', [patient_id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
