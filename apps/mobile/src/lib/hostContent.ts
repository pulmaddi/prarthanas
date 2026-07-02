import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from './auth';

export type MeetingType = 'meeting' | 'special_pooja';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type Meeting = {
  id: string;
  host_id: string;
  title: string;
  meeting_type: MeetingType;
  deity_name: string | null;
  start_date: string | null; // YYYY-MM-DD
  start_time: string | null; // HH:MM (24h)
  recurrence: Recurrence;
  weekdays: string | null; // CSV of 0-6 (Sun=0)
  status: string;
  when_text: string | null; // human-readable schedule summary
  description: string | null;
  join_url: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  host_id: string;
  title: string;
  body: string | null;
  created_at: string;
};

/**
 * A host's own meeting invites + notification broadcasts, with create/delete.
 * Reads are scoped to the current user (host_id = uid) — the same tables are
 * read openly by followers elsewhere.
 */
export function useHostContent() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const [{ data: m }, { data: n }] = await Promise.all([
      supabase
        .from('host_meetings')
        .select('*')
        .eq('host_id', uid)
        .order('created_at', { ascending: false }),
      supabase
        .from('host_notifications')
        .select('*')
        .eq('host_id', uid)
        .order('created_at', { ascending: false }),
    ]);
    setMeetings((m as Meeting[]) ?? []);
    setNotifications((n as Notification[]) ?? []);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const createMeeting = async (v: {
    title: string;
    meeting_type?: MeetingType;
    deity_name?: string;
    start_date?: string;
    start_time?: string;
    recurrence?: Recurrence;
    weekdays?: string;
    when_text?: string;
    description?: string;
    join_url?: string;
  }) => {
    if (!uid) return;
    const { error } = await supabase.from('host_meetings').insert({ host_id: uid, ...v });
    if (error) throw error;
    await load();
  };

  const deleteMeeting = async (id: string) => {
    await supabase.from('host_meetings').delete().eq('id', id);
    await load();
  };

  const createNotification = async (v: { title: string; body?: string }) => {
    if (!uid) return;
    const { error } = await supabase.from('host_notifications').insert({ host_id: uid, ...v });
    if (error) throw error;
    await load();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('host_notifications').delete().eq('id', id);
    await load();
  };

  return {
    meetings,
    notifications,
    loading,
    createMeeting,
    deleteMeeting,
    createNotification,
    deleteNotification,
    reload: load,
  };
}
