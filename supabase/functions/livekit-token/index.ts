// Supabase Edge Function — mint a short-lived LiveKit access token.
// Verifies the caller's Supabase JWT, checks meeting membership,
// then signs a LiveKit token with appropriate publish/subscribe grants.
//
// Deploy: supabase functions deploy livekit-token --project-ref <ref>
// Secrets: supabase secrets set LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... LIVEKIT_URL=wss://...

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from 'npm:livekit-server-sdk';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing Authorization header' }, 401);

    // Verify Supabase JWT — use anon key + user's bearer token.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const meetingId: string | undefined = body?.meetingId;
    if (!meetingId) return json({ error: 'meetingId is required' }, 400);

    // Load meeting — respects RLS (authenticated user can read public meetings).
    const { data: meeting, error: meetErr } = await supabase
      .from('host_meetings')
      .select('id, title, host_id')
      .eq('id', meetingId)
      .single();

    if (meetErr || !meeting) return json({ error: 'Meeting not found' }, 404);

    // Resolve display name from profile.
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();

    const displayName =
      (profile as any)?.name ||
      (user.user_metadata as any)?.full_name ||
      user.email ||
      user.id;

    const isHost = user.id === meeting.host_id;
    const roomName = `meeting-${meetingId}`;

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const livekitUrl = Deno.env.get('LIVEKIT_URL');

    if (!apiKey || !apiSecret || !livekitUrl) {
      return json({ error: 'LiveKit credentials not configured on server' }, 500);
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: displayName,
      ttl: 7200, // 2 hours
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,       // all participants can publish audio/video
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return json({ token, roomName, livekitUrl, isHost, displayName });
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
