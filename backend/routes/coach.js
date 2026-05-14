const router       = require('express').Router();
const db           = require('../db');
const { requireCoach, requireAssigned } = require('../middleware/coachAuth');

router.use(requireCoach);

// ── Patient management ───────────────────────────────────────────────────────

// Assign patient to this coach by email
router.post('/patients/assign', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const { rows } = await db.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'patient'",
      [email.toLowerCase()]
    );
    if (!rows.length) return res.status(404).json({ error: 'Patient not found' });
    await db.query(
      'INSERT INTO coach_patients (coach_id, patient_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, rows[0].id]
    );
    res.json({ success: true, patient_id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign patient — POST /api/coach/patients  { email }
router.post('/patients', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { rows } = await db.query(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    );

    if (!rows.length)              return res.status(404).json({ error: 'No account found with that email' });
    if (rows[0].role !== 'patient') return res.status(422).json({ error: 'That account is not a patient' });
    if (rows[0].id === req.user.id) return res.status(422).json({ error: 'You cannot assign yourself' });

    const patientId = rows[0].id;

    // One active coach per patient — check without exposing who the other coach is
    const { rows: active } = await db.query(
      'SELECT 1 FROM coach_patients WHERE patient_id = $1 AND removed_at IS NULL',
      [patientId]
    );
    if (active.length) return res.status(409).json({ error: 'This patient is already assigned to a coach' });

    await db.query(
      'INSERT INTO coach_patients (coach_id, patient_id) VALUES ($1, $2)',
      [req.user.id, patientId]
    );
    res.status(201).json({ success: true, patient_id: patientId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List assigned patients with activity summary
router.get('/patients', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        u.id, u.name, u.email,
        GREATEST(
          (SELECT MAX(updated_at) FROM daily_reports            WHERE patient_id = u.id),
          (SELECT MAX(updated_at) FROM routine_backlog          WHERE patient_id = u.id),
          (SELECT MAX(updated_at) FROM postponed_backlog        WHERE patient_id = u.id),
          (SELECT MAX(updated_at) FROM goals_meeting            WHERE patient_id = u.id),
          (SELECT MAX(updated_at) FROM between_session_reflection WHERE patient_id = u.id),
          (SELECT MAX(updated_at) FROM week1_review             WHERE patient_id = u.id)
        ) AS last_activity,
        (
          (CASE WHEN EXISTS(SELECT 1 FROM daily_reports              WHERE patient_id=u.id AND status='submitted') THEN 1 ELSE 0 END) +
          (CASE WHEN EXISTS(SELECT 1 FROM routine_backlog            WHERE patient_id=u.id AND status='submitted') THEN 1 ELSE 0 END) +
          (CASE WHEN EXISTS(SELECT 1 FROM postponed_backlog          WHERE patient_id=u.id AND status='submitted') THEN 1 ELSE 0 END) +
          (CASE WHEN EXISTS(SELECT 1 FROM goals_meeting              WHERE patient_id=u.id AND status='submitted') THEN 1 ELSE 0 END) +
          (CASE WHEN EXISTS(SELECT 1 FROM between_session_reflection WHERE patient_id=u.id AND status='submitted') THEN 1 ELSE 0 END) +
          (CASE WHEN EXISTS(SELECT 1 FROM week1_review               WHERE patient_id=u.id AND status='submitted') THEN 1 ELSE 0 END)
        )::int AS forms_submitted,
        (SELECT COUNT(*)::int FROM coach_notes
           WHERE coach_id=$1 AND patient_id=u.id
             AND created_at > NOW() - INTERVAL '7 days') AS recent_notes_count
      FROM coach_patients cp
      JOIN users u ON u.id = cp.patient_id
      WHERE cp.coach_id = $1 AND cp.removed_at IS NULL
      ORDER BY last_activity DESC NULLS LAST
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Per-patient sub-router ───────────────────────────────────────────────────
const pr = require('express').Router({ mergeParams: true });
pr.use(requireAssigned);

// Soft-delete: remove patient from this coach's list
pr.delete('/', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      `UPDATE coach_patients
         SET removed_at = NOW()
       WHERE coach_id = $1 AND patient_id = $2 AND removed_at IS NULL`,
      [req.user.id, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Patient header info
pr.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Daily report date list (compact — no full content)
pr.get('/daily-reports', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT report_date, mood_score, intended_task_1, went_well, status
      FROM daily_reports
      WHERE patient_id = $1
      ORDER BY report_date DESC
      LIMIT 30
    `, [req.params.id]);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Full report for a specific date — fetched on demand
pr.get('/daily-reports/:date', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM daily_reports WHERE patient_id = $1 AND report_date = $2',
      [req.params.id, req.params.date]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Routine backlog (full items)
pr.get('/routine-backlog', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT items, status FROM routine_backlog WHERE patient_id = $1',
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Postponed backlog + this coach's triage map merged
pr.get('/postponed-backlog', async (req, res) => {
  try {
    const [bl, tr] = await Promise.all([
      db.query('SELECT items, status FROM postponed_backlog WHERE patient_id = $1', [req.params.id]),
      db.query('SELECT item_key, tag FROM backlog_triage WHERE coach_id = $1 AND patient_id = $2',
               [req.user.id, req.params.id]),
    ]);
    const items     = bl.rows[0]?.items || [];
    const triageMap = Object.fromEntries(tr.rows.map(r => [r.item_key, r.tag]));
    res.json({ items, triageMap, status: bl.rows[0]?.status || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Goals meeting
pr.get('/goals-meeting', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM goals_meeting WHERE patient_id = $1', [req.params.id]);
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reflection
pr.get('/reflection', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM between_session_reflection WHERE patient_id = $1', [req.params.id]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Week 1 review
pr.get('/week1-review', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM week1_review WHERE patient_id = $1', [req.params.id]);
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Triage upsert (null tag = remove)
pr.post('/triage', async (req, res) => {
  const { item_key, tag } = req.body;
  if (!item_key) return res.status(400).json({ error: 'item_key required' });
  const VALID = ['urgent', 'park', 'drop', 'delegate'];
  try {
    if (!tag || !VALID.includes(tag)) {
      await db.query(
        'DELETE FROM backlog_triage WHERE coach_id=$1 AND patient_id=$2 AND item_key=$3',
        [req.user.id, req.params.id, item_key]
      );
    } else {
      await db.query(`
        INSERT INTO backlog_triage (coach_id, patient_id, item_key, tag, updated_at)
        VALUES ($1,$2,$3,$4,NOW())
        ON CONFLICT (coach_id, patient_id, item_key) DO UPDATE SET tag=$4, updated_at=NOW()
      `, [req.user.id, req.params.id, item_key, tag]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Coach notes — list
pr.get('/notes', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, tag, content, created_at, updated_at
      FROM coach_notes
      WHERE coach_id=$1 AND patient_id=$2
      ORDER BY created_at DESC
      LIMIT 100
    `, [req.user.id, req.params.id]);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Coach notes — create
pr.post('/notes', async (req, res) => {
  const { tag, content } = req.body;
  const VALID = ['observation', 'question', 'pattern', 'action_item'];
  if (!VALID.includes(tag) || !content?.trim()) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO coach_notes (coach_id, patient_id, tag, content) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, req.params.id, tag, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.use('/patients/:id', pr);

// ── Note edit / delete (ownership verified by coach_id) ─────────────────────

router.put('/notes/:noteId', async (req, res) => {
  const { content, tag } = req.body;
  const VALID = ['observation', 'question', 'pattern', 'action_item'];
  if (!content?.trim() || (tag && !VALID.includes(tag))) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  try {
    const { rows } = await db.query(`
      UPDATE coach_notes
      SET content=$1, tag=COALESCE($2, tag), updated_at=NOW()
      WHERE id=$3 AND coach_id=$4
      RETURNING *
    `, [content, tag || null, req.params.noteId, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notes/:noteId', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM coach_notes WHERE id=$1 AND coach_id=$2',
      [req.params.noteId, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
