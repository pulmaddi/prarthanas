import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

export type Participant = { user_id: string; name: string; role: string };

/**
 * Live participant list for a room via Supabase Realtime **presence**.
 * Each client tracks its own {user_id, name, role}; everyone sees the synced
 * set. No database table needed (presence is ephemeral).
 */
export function useRoomPresence(roomId: string, me: Participant | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured || !me) return;
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: me.user_id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<Partial<Participant>>>;
      const list: Participant[] = [];
      Object.values(state).forEach((metas) => {
        const p = metas[0];
        if (p?.user_id) list.push({ user_id: p.user_id, name: p.name ?? '', role: p.role ?? '' });
      });
      setParticipants(list);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') void channel.track(me);
    });

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, me?.user_id, me?.name, me?.role]);

  return participants;
}
