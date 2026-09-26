import { supabase } from './supabase';

export type RoomAccess = {
  token: string;
  roomName: string;
  livekitUrl: string;
  isHost: boolean;
  displayName: string;
};

export async function getLivekitToken(meetingId: string): Promise<RoomAccess> {
  const { data, error } = await supabase.functions.invoke<RoomAccess>('livekit-token', {
    body: { meetingId },
  });
  if (error) throw new Error(`Token fetch failed: ${error.message}`);
  if (!data) throw new Error('Empty response from livekit-token function');
  return data;
}
