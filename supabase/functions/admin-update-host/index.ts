// Supabase Edge Function — admin update a host account (email, password, profile).
// Uses the service-role key server-side so auth.admin.updateUserById is safe.
// Verifies the caller is an admin before making any changes.
//
// Deploy: supabase functions deploy admin-update-host --project-ref <ref>

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing Authorization header' }, 401);

    // Verify caller JWT via anon client (respects RLS).
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // Gate on is_admin() — same RPC used by the app.
    const { data: isAdmin } = await anonClient.rpc('is_admin');
    if (!isAdmin) return json({ error: 'Forbidden: admins only' }, 403);

    // Service-role client — can call auth.admin.* and bypass RLS.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const body = await req.json();
    const { user_id, email, password, name, phone, city, location, org_name, host_types } = body;
    if (!user_id) return json({ error: 'user_id is required' }, 400);

    // Update auth credentials when provided.
    if (email || (password && password.length >= 6)) {
      const updates: Record<string, string> = {};
      if (email) updates.email = email.trim().toLowerCase();
      if (password && password.length >= 6) updates.password = password;
      const { error: authUpErr } = await adminClient.auth.admin.updateUserById(user_id, updates);
      if (authUpErr) throw authUpErr;
    }

    // Update host_accounts.
    const { error: haErr } = await adminClient
      .from('host_accounts')
      .update({
        name: name ?? null,
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        location: location?.trim() || null,
        org_name: org_name?.trim() || null,
        host_types: host_types ?? [],
      })
      .eq('user_id', user_id);
    if (haErr) throw haErr;

    // Keep profiles.email in sync if email was changed.
    if (email) {
      await adminClient
        .from('profiles')
        .update({ email: email.trim().toLowerCase() })
        .eq('id', user_id);
    }

    return json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
