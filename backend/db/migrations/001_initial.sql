-- ADHD Exoskeleton — Initial Schema

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  role            VARCHAR(20)  NOT NULL CHECK (role IN ('patient','coach')),
  coach_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id                      SERIAL PRIMARY KEY,
  patient_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_date             DATE    NOT NULL DEFAULT CURRENT_DATE,
  day_name                VARCHAR(100),
  mood_score              SMALLINT CHECK (mood_score BETWEEN 1 AND 10),
  -- Part A
  wake_up_time            TIME,
  first_30min             TEXT,
  intended_task_1         TEXT,
  intended_task_2         TEXT,
  intended_task_3         TEXT,
  done_task_1             TEXT,
  done_task_2             TEXT,
  done_task_3             TEXT,
  task_difference_reason  TEXT,
  -- Part B  [{block, energy, focus, activity}]
  energy_focus_map        JSONB DEFAULT '[]',
  -- Part C
  easiest_thing           TEXT,
  easiest_conditions      TEXT,
  hardest_thing           TEXT,
  hyperfocus_moment       TEXT,
  hyperfocus_trigger      TEXT,
  avoidance_moment        TEXT,
  -- Part D
  work_location           TEXT,
  location_helpful        TEXT,
  sleep_hours             NUMERIC(4,1),
  ate_regularly           BOOLEAN,
  moved_body              BOOLEAN,
  lifestyle_notes         TEXT,
  medication_taken        BOOLEAN,
  medication_notes        TEXT,
  -- Part E
  went_well               TEXT,
  to_change               TEXT,
  carried_task            TEXT,
  internal_experience     TEXT,
  -- Meta
  status                  VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id, report_date)
);

CREATE TABLE IF NOT EXISTS routine_backlog (
  id          SERIAL PRIMARY KEY,
  patient_id  INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- [{activity, category, duration, reliability, notes}]
  items       JSONB   NOT NULL DEFAULT '[]',
  status      VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS postponed_backlog (
  id          SERIAL PRIMARY KEY,
  patient_id  INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- [{task, category, how_long, emotional_weight, what_it_takes}]
  items       JSONB   NOT NULL DEFAULT '[]',
  status      VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals_meeting (
  id                    SERIAL PRIMARY KEY,
  patient_id            INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Life areas
  life_work             TEXT,
  life_home             TEXT,
  life_health           TEXT,
  life_relationships    TEXT,
  life_finance          TEXT,
  life_personal_growth  TEXT,
  -- ADHD profile
  most_alive_focused    TEXT,
  peak_time             TEXT,
  hyperfocus_triggers   TEXT,
  ef_challenges         TEXT[]  DEFAULT '{}',
  strategies_tried      TEXT,
  -- Goal setting
  goal_3months          TEXT,
  goal_1month           TEXT,
  goal_this_week        TEXT,
  -- Coaching framework
  session_frequency     TEXT,
  feedback_style        VARCHAR(20) CHECK (feedback_style IN ('direct','exploratory')),
  accountability_format TEXT,
  coach_not_to_do       TEXT,
  -- Meta
  status                VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS between_session_reflection (
  id          SERIAL PRIMARY KEY,
  patient_id  INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Your Patterns (4)
  patterns_q1 TEXT,
  patterns_q2 TEXT,
  patterns_q3 TEXT,
  patterns_q4 TEXT,
  -- The Backlog (4)
  backlog_q1  TEXT,
  backlog_q2  TEXT,
  backlog_q3  TEXT,
  backlog_q4  TEXT,
  -- Your Goals (4)
  goals_q1    TEXT,
  goals_q2    TEXT,
  goals_q3    TEXT,
  goals_q4    TEXT,
  -- Meta
  status      VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS week1_review (
  id                    SERIAL PRIMARY KEY,
  patient_id            INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  most_valuable_learning TEXT,
  hardest_part          TEXT,
  strategy_realistic    TEXT,
  week2_focus           TEXT,
  environmental_change  TEXT,
  micro_habit           TEXT,
  first_backlog_step    TEXT,
  progress_reporting    TEXT,
  status                VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_patient_date ON daily_reports (patient_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
