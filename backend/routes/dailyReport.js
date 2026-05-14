const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/history', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, report_date, mood_score, status, updated_at
       FROM daily_reports WHERE patient_id = $1
       ORDER BY report_date DESC LIMIT 30`,
      [req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  try {
    const { rows } = await db.query(
      'SELECT * FROM daily_reports WHERE patient_id = $1 AND report_date = $2',
      [req.user.id, date]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const p = req.user.id;
  const {
    report_date, day_name, mood_score,
    wake_up_time, first_30min,
    intended_task_1, intended_task_2, intended_task_3,
    done_task_1, done_task_2, done_task_3, task_difference_reason,
    energy_focus_map,
    easiest_thing, easiest_conditions, hardest_thing,
    hyperfocus_moment, hyperfocus_trigger, avoidance_moment,
    work_location, location_helpful, sleep_hours,
    ate_regularly, moved_body, lifestyle_notes,
    medication_taken, medication_notes,
    went_well, to_change, carried_task, internal_experience,
    status,
  } = req.body;

  const date = report_date || new Date().toISOString().slice(0, 10);
  const st = status === 'submitted' ? 'submitted' : 'draft';

  try {
    const { rows } = await db.query(
      `INSERT INTO daily_reports (
         patient_id, report_date, day_name, mood_score,
         wake_up_time, first_30min,
         intended_task_1, intended_task_2, intended_task_3,
         done_task_1, done_task_2, done_task_3, task_difference_reason,
         energy_focus_map,
         easiest_thing, easiest_conditions, hardest_thing,
         hyperfocus_moment, hyperfocus_trigger, avoidance_moment,
         work_location, location_helpful, sleep_hours,
         ate_regularly, moved_body, lifestyle_notes,
         medication_taken, medication_notes,
         went_well, to_change, carried_task, internal_experience,
         status, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
         $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,NOW()
       )
       ON CONFLICT (patient_id, report_date) DO UPDATE SET
         day_name=$3, mood_score=$4, wake_up_time=$5, first_30min=$6,
         intended_task_1=$7, intended_task_2=$8, intended_task_3=$9,
         done_task_1=$10, done_task_2=$11, done_task_3=$12, task_difference_reason=$13,
         energy_focus_map=$14,
         easiest_thing=$15, easiest_conditions=$16, hardest_thing=$17,
         hyperfocus_moment=$18, hyperfocus_trigger=$19, avoidance_moment=$20,
         work_location=$21, location_helpful=$22, sleep_hours=$23,
         ate_regularly=$24, moved_body=$25, lifestyle_notes=$26,
         medication_taken=$27, medication_notes=$28,
         went_well=$29, to_change=$30, carried_task=$31, internal_experience=$32,
         status=$33, updated_at=NOW()
       RETURNING id, report_date, status, updated_at`,
      [
        p, date, day_name, mood_score,
        wake_up_time || null, first_30min,
        intended_task_1, intended_task_2, intended_task_3,
        done_task_1, done_task_2, done_task_3, task_difference_reason,
        JSON.stringify(energy_focus_map || []),
        easiest_thing, easiest_conditions, hardest_thing,
        hyperfocus_moment, hyperfocus_trigger, avoidance_moment,
        work_location, location_helpful, sleep_hours || null,
        ate_regularly ?? null, moved_body ?? null, lifestyle_notes,
        medication_taken ?? null, medication_notes,
        went_well, to_change, carried_task, internal_experience,
        st,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
