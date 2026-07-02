import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from './auth';

export type PublicHost = {
  user_id: string;
  host_type: string;
  name: string | null;
  city: string | null;
};

/**
 * Priests directory + the current user's follows, with follow/unfollow.
 * Reads the PII-free `hosts_public` view; writes to `follows`.
 */
export function useMyPriests() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [priests, setPriests] = useState<PublicHost[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data: ps } = await supabase
      .from('hosts_public')
      .select('user_id,host_type,name,city')
      .eq('host_type', 'priest')
      .limit(20);
    setPriests((ps as PublicHost[]) ?? []);
    if (uid) {
      const { data: fs } = await supabase
        .from('follows')
        .select('host_id')
        .eq('follower_id', uid);
      setFollowed(new Set((fs ?? []).map((f: { host_id: string }) => f.host_id)));
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const follow = async (hostId: string) => {
    if (!uid) return;
    await supabase.from('follows').upsert({ follower_id: uid, host_id: hostId });
    setFollowed((s) => new Set(s).add(hostId));
  };
  const unfollow = async (hostId: string) => {
    if (!uid) return;
    await supabase.from('follows').delete().eq('follower_id', uid).eq('host_id', hostId);
    setFollowed((s) => {
      const n = new Set(s);
      n.delete(hostId);
      return n;
    });
  };

  return { priests, followed, follow, unfollow };
}
