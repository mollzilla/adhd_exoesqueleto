-- Soft-delete support for coach_patients + one-active-coach-per-patient constraint

ALTER TABLE coach_patients
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ NULL;

-- The original (coach_id, patient_id) unique pair no longer applies once
-- re-assignment after removal is allowed. Drop it and replace with a
-- partial index that enforces uniqueness only on active rows.
ALTER TABLE coach_patients
  DROP CONSTRAINT IF EXISTS coach_patients_coach_id_patient_id_key;

-- Enforce: a patient may have at most one active coach at any time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_patients_one_active
  ON coach_patients (patient_id)
  WHERE removed_at IS NULL;
