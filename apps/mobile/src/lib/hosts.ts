import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from './auth';

export type PublicHost = {
  user_id: string;
  host_type: string; // 'priest' | 'guru' | 'temple_exec'
  name: string | null;
  city: string | null;
};

/**
 * Host directory (priests / gurus / temples) from the PII-free `hosts_public`
 * view, plus the current user's follows and follow/unfollow actions.
 */
export function useHostDirectory() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [hosts, setHosts] = useState<PublicHost[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from('hosts_public')
      .select('user_id,host_type,name,city')
      .limit(60);
    setHosts((data as PublicHost[]) ?? []);
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

  const byType = (ty: string) => hosts.filter((h) => h.host_type === ty);

  return {
    priests: byType('priest'),
    gurus: byType('guru'),
    temples: byType('temple_exec'),
    followed,
    follow,
    unfollow,
  };
}
