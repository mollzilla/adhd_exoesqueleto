-- Coach-facing tables

CREATE TABLE IF NOT EXISTS coach_patients (
  id          SERIAL PRIMARY KEY,
  coach_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coach_id, patient_id)
);

-- Per-item triage tags on postponed backlog rows (keyed by normalized task text)
CREATE TABLE IF NOT EXISTS backlog_triage (
  id          SERIAL PRIMARY KEY,
  coach_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key    TEXT    NOT NULL,
  tag         VARCHAR(20) NOT NULL CHECK (tag IN ('urgent','park','drop','delegate')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coach_id, patient_id, item_key)
);

-- Coach-only notes per patient (never exposed to patients)
CREATE TABLE IF NOT EXISTS coach_notes (
  id          SERIAL PRIMARY KEY,
  coach_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag         VARCHAR(30) NOT NULL CHECK (tag IN ('observation','question','pattern','action_item')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_patients_coach    ON coach_patients (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_patients_patient  ON coach_patients (patient_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_lookup      ON coach_notes (coach_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backlog_triage_lookup   ON backlog_triage (coach_id, patient_id);
