-- Supabase schema: tables, trigger, and RLS policies
-- Run this file in the Supabase SQL editor

-- Enable uuid generator
create extension if not exists "pgcrypto";

-----------------------------
-- Tables
-----------------------------

-- profiles: one row per user, linked to Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  role text not null check (role in ('coach', 'patient')),
  full_name text,
  created_at timestamptz not null default now()
);

-- coach_patients: assignment relationship
create table if not exists public.coach_patients (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id),
  patient_id uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  removed_at timestamptz
);

-- daily_reports
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  date date,
  mood_score int,
  part_a jsonb,
  part_b jsonb,
  part_c jsonb,
  part_d jsonb,
  part_e jsonb,
  created_at timestamptz not null default now()
);

-- routine_backlog
create table if not exists public.routine_backlog (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  items jsonb,
  updated_at timestamptz not null default now()
);

-- postponed_backlog
create table if not exists public.postponed_backlog (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  items jsonb,
  updated_at timestamptz not null default now()
);

-- backlog_triage
create table if not exists public.backlog_triage (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id),
  patient_id uuid not null references public.profiles(id),
  item_id text,
  tag text not null check (tag in ('urgent', 'park', 'drop', 'delegate')),
  created_at timestamptz not null default now()
);

-- goals_meeting
create table if not exists public.goals_meeting (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  data jsonb,
  created_at timestamptz not null default now()
);

-- reflection
create table if not exists public.reflection (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  data jsonb,
  created_at timestamptz not null default now()
);

-- week1_review
create table if not exists public.week1_review (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  data jsonb,
  created_at timestamptz not null default now()
);

-- coach_notes
create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id),
  patient_id uuid not null references public.profiles(id),
  tag text not null check (tag in ('observation', 'question', 'pattern', 'action_item')),
  content text,
  created_at timestamptz not null default now()
);

-----------------------------
-- Trigger: create profile row when auth.users is created
-----------------------------

-- NOTE: Coach email should be stored as a project-level config/secret
-- and exposed to Postgres via a setting named 'supabase.coach_email'.
-- To set it (one-time in SQL editor or psql):
-- SELECT set_config('supabase.coach_email', 'coach@example.com', false);

create or replace function public.handle_auth_user_created()
returns trigger language plpgsql security definer as $$
declare
  coach_email text := current_setting('supabase.coach_email', true);
  assigned_role text := 'patient';
begin
  if coach_email is not null and new.email = coach_email then
    assigned_role := 'coach';
  end if;

  insert into public.profiles (id, role, full_name, created_at)
  values (new.id, assigned_role, coalesce(new.raw_user_meta_data ->> 'full_name', null), now())
  on conflict (id) do nothing;

  return new;
end; $$;

-- Trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_auth_user_created();

-----------------------------
-- Row Level Security (RLS) policies
-----------------------------

-- profiles: enable RLS
alter table public.profiles enable row level security;

-- allow users to select their own profile
create policy profiles_select_self on public.profiles
  for select using ( auth.uid() = id );

-- allow coach to read assigned patients
create policy profiles_select_assigned_by_coach on public.profiles
  for select using (
    exists(
      select 1 from public.coach_patients cp
      where cp.coach_id = auth.uid() and cp.patient_id = public.profiles.id and cp.removed_at is null
    )
  );

-- disallow client inserts into profiles; only trusted server-side processes (Edge Function / auth trigger)
-- Edge Function may set a session var 'edge.invite' = '1' for trusted writes if needed.
create policy profiles_insert_only_trusted on public.profiles
  for insert using ( current_setting('edge.invite', true) = '1' );

-- allow users to update their own profile
create policy profiles_update_self on public.profiles
  for update using ( auth.uid() = id );

-- coach has no write access to other profiles by default

-- coach_patients: enable RLS
alter table public.coach_patients enable row level security;

-- coach can read and write rows where coach_id = auth.uid();
create policy coach_patients_coach_manage on public.coach_patients
  for all using ( coach_id = auth.uid() ) with check ( coach_id = auth.uid() );

-- patients have no access by policy (implicitly denied)

-- daily_reports: enable RLS
alter table public.daily_reports enable row level security;

-- patients can read and write their own rows
create policy daily_reports_patient_manage on public.daily_reports
  for all using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );

-- coaches can read reports for their assigned patients
create policy daily_reports_coach_read on public.daily_reports
  for select using (
    exists(
      select 1 from public.coach_patients cp
      where cp.coach_id = auth.uid() and cp.patient_id = public.daily_reports.patient_id and cp.removed_at is null
    )
  );

-- routine_backlog: enable RLS
alter table public.routine_backlog enable row level security;
create policy routine_backlog_patient_manage on public.routine_backlog
  for all using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );
create policy routine_backlog_coach_read on public.routine_backlog
  for select using (
    exists(select 1 from public.coach_patients cp where cp.coach_id = auth.uid() and cp.patient_id = public.routine_backlog.patient_id and cp.removed_at is null)
  );

-- postponed_backlog: enable RLS
alter table public.postponed_backlog enable row level security;
create policy postponed_backlog_patient_manage on public.postponed_backlog
  for all using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );
create policy postponed_backlog_coach_read on public.postponed_backlog
  for select using (
    exists(select 1 from public.coach_patients cp where cp.coach_id = auth.uid() and cp.patient_id = public.postponed_backlog.patient_id and cp.removed_at is null)
  );

-- backlog_triage: enable RLS (coach only)
alter table public.backlog_triage enable row level security;
create policy backlog_triage_coach_manage on public.backlog_triage
  for all using ( coach_id = auth.uid() ) with check ( coach_id = auth.uid() );

-- goals_meeting: enable RLS
alter table public.goals_meeting enable row level security;
create policy goals_meeting_patient_manage on public.goals_meeting
  for all using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );
create policy goals_meeting_coach_read on public.goals_meeting
  for select using (
    exists(select 1 from public.coach_patients cp where cp.coach_id = auth.uid() and cp.patient_id = public.goals_meeting.patient_id and cp.removed_at is null)
  );

-- reflection: enable RLS
alter table public.reflection enable row level security;
create policy reflection_patient_manage on public.reflection
  for all using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );
create policy reflection_coach_read on public.reflection
  for select using (
    exists(select 1 from public.coach_patients cp where cp.coach_id = auth.uid() and cp.patient_id = public.reflection.patient_id and cp.removed_at is null)
  );

-- week1_review: enable RLS
alter table public.week1_review enable row level security;
create policy week1_review_patient_manage on public.week1_review
  for all using ( patient_id = auth.uid() ) with check ( patient_id = auth.uid() );
create policy week1_review_coach_read on public.week1_review
  for select using (
    exists(select 1 from public.coach_patients cp where cp.coach_id = auth.uid() and cp.patient_id = public.week1_review.patient_id and cp.removed_at is null)
  );

-- coach_notes: enable RLS (coach only)
alter table public.coach_notes enable row level security;
create policy coach_notes_coach_manage on public.coach_notes
  for all using ( coach_id = auth.uid() ) with check ( coach_id = auth.uid() );

-- Finally, make sure no permissive policies exist; RLS denies by default for other roles
