import { supabase } from '../lib/supabaseClient';

function currentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('user'));
    return u?.id || null;
  } catch {
    return null;
  }
}

async function handleAuthLogin(body) {
  const { email, password } = body;
  const res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) throw new Error('Invalid credentials');
  const user = res.data.user;
  const token = res.data.session?.access_token || null;
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify({ id: user.id, name: user.user_metadata?.full_name || user.email }));
  return { token, user: { id: user.id, name: user.user_metadata?.full_name || user.email } };
}

async function handleAuthRegister(body) {
  const { email, password, name } = body;
  const res = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (res.error) throw new Error(res.error.message || 'Register failed');
  return { user: res.data.user };
}

async function getDailyReport(date) {
  const patient_id = currentUserId();
  if (!patient_id) throw new Error('Unauthorized');
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('patient_id', patient_id)
    .eq('date', date)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Failed to load report');
  if (!data) return null;
  const merged = { ...data.part_a, mood_score: data.mood_score, report_date: data.date };
  return merged;
}

async function upsertDailyReport(body) {
  const patient_id = currentUserId();
  if (!patient_id) throw new Error('Unauthorized');
  const date = body.report_date || body.date;
  const payload = { part_a: body, mood_score: body.mood_score || null, date, patient_id };
  const { data: existing } = await supabase.from('daily_reports').select('id').eq('patient_id', patient_id).eq('date', date).maybeSingle();
  if (existing && existing.id) {
    const { error } = await supabase.from('daily_reports').update(payload).eq('id', existing.id);
    if (error) throw new Error('Failed to save report');
    return { ok: true };
  }
  const { error } = await supabase.from('daily_reports').insert(payload);
  if (error) throw new Error('Failed to save report');
  return { ok: true };
}

async function getSingleGeneric(table) {
  const patient_id = currentUserId();
  if (!patient_id) throw new Error('Unauthorized');
  const { data } = await supabase.from(table).select('*').eq('patient_id', patient_id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  if (data.items) return data.items;
  if (data.data) return data.data;
  return data;
}

async function upsertGeneric(table, body) {
  const patient_id = currentUserId();
  if (!patient_id) throw new Error('Unauthorized');
  const payload = {};
  if (table === 'routine_backlog' || table === 'postponed_backlog') payload.items = body.items || null;
  else payload.data = body;
  payload.patient_id = patient_id;
  const { data: existing } = await supabase.from(table).select('id').eq('patient_id', patient_id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (existing && existing.id) {
    const { error } = await supabase.from(table).update(payload).eq('id', existing.id);
    if (error) throw new Error('Failed to save');
    return { ok: true };
  }
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw new Error('Failed to save');
  return { ok: true };
}

async function getCoachPatients() {
  const coach_id = currentUserId();
  if (!coach_id) throw new Error('Unauthorized');
  const { data, error } = await supabase
    .from('coach_patients')
    .select('patient_id, assigned_at, removed_at, profiles ( id, full_name )')
    .eq('coach_id', coach_id)
    .is('removed_at', null);
  if (error) throw new Error('Failed to load patients');
  return data.map((r) => ({ id: r.patient_id, name: r.profiles?.full_name || 'Patient', email: '', last_activity: null, forms_submitted: 0, recent_notes_count: 0 }));
}

async function removeCoachPatient(id) {
  const coach_id = currentUserId();
  if (!coach_id) throw new Error('Unauthorized');
  const { error } = await supabase.from('coach_patients').update({ removed_at: new Date().toISOString() }).match({ coach_id, patient_id: id });
  if (error) throw new Error('Failed to remove patient');
  return { ok: true };
}

async function invitePatient(body) {
  throw new Error('Use supabase.functions.invoke("invite-patient") from components instead');
}

const api = {
  get: async (path) => {
    if (path.startsWith('/forms/daily-report')) {
      const m = path.match(/date=([^&]+)/);
      const date = m ? decodeURIComponent(m[1]) : new Date().toISOString().slice(0, 10);
      return getDailyReport(date);
    }
    if (path === '/forms/routine-backlog') return getSingleGeneric('routine_backlog');
    if (path === '/forms/postponed-backlog') return getSingleGeneric('postponed_backlog');
    if (path === '/forms/reflection') return getSingleGeneric('reflection');
    if (path === '/forms/goals-meeting') return getSingleGeneric('goals_meeting');
    if (path === '/forms/week1-review') return getSingleGeneric('week1_review');
    if (path === '/coach/patients') return getCoachPatients();
    if (path.startsWith('/coach/patients/')) {
      return null;
    }
    throw new Error('Unknown GET path ' + path);
  },
  post: async (path, body) => {
    if (path === '/auth/login') return handleAuthLogin(body);
    if (path === '/auth/register') return handleAuthRegister(body);
    if (path === '/forms/daily-report') return upsertDailyReport(body);
    if (path === '/forms/routine-backlog') return upsertGeneric('routine_backlog', body);
    if (path === '/forms/postponed-backlog') return upsertGeneric('postponed_backlog', body);
    if (path === '/forms/reflection') return upsertGeneric('reflection', body);
    if (path === '/forms/goals-meeting') return upsertGeneric('goals_meeting', body);
    if (path === '/forms/week1-review') return upsertGeneric('week1_review', body);
    if (path === '/forms/postponed-backlog') return upsertGeneric('postponed_backlog', body);
    if (path === '/coach/patients') return invitePatient(body);
    throw new Error('Unknown POST path ' + path);
  },
  put: async (path, body) => { throw new Error('Not implemented'); },
  delete: async (path) => {
    if (path.startsWith('/coach/patients/')) {
      const id = path.split('/').pop();
      return removeCoachPatient(id);
    }
    throw new Error('Unknown DELETE path ' + path);
  },
};

export default api;
