// Supabase Edge Function: invite-patient
// Receives { email } in the request body (JSON).
// Verifies requester is a coach, invites the email using the Admin API,
// then links the invited user to the coach in `coach_patients`.

import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req) => {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // Validate requester token and get user id
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const requester = userData.user;

    // Ensure requester is a coach in our profiles table
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', requester.id)
      .maybeSingle();

    if (profileErr) return new Response(JSON.stringify({ error: 'Failed to verify requester' }), { status: 500 });
    if (!profile || profile.role !== 'coach') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    const payload = await req.json();
    const email = (payload && payload.email) || '';
    if (!email || typeof email !== 'string') return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400 });

    // Invite the user (admin API)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) {
      console.error('invite error', inviteError);
      return new Response(JSON.stringify({ error: 'Invite failed' }), { status: 500 });
    }

    // inviteData may include the created user; link the returned user id if available
    const invitedUserId = (inviteData as any)?.user?.id || (inviteData as any)?.id || null;

    if (invitedUserId) {
      const { error: insertErr } = await supabaseAdmin.from('coach_patients').insert([{ coach_id: requester.id, patient_id: invitedUserId }]);
      if (insertErr) {
        console.error('link error', insertErr);
        return new Response(JSON.stringify({ error: 'Failed to link patient' }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('invite-patient function error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
