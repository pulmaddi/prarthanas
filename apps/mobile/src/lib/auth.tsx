import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { setLocale } from '../i18n';

export type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  ishta_daiva: string | null;
  language: string | null;
  city: string | null;
  state: string | null;
} | null;

export type HostType =
  | 'priest'
  | 'guru'
  | 'temple_exec'
  | 'numerologist'
  | 'astrologer';

type AuthState = {
  session: Session | null;
  email: string | null;
  profile: Profile;
  isAdmin: boolean;
  hostTypes: HostType[];
  isHost: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    phone?: string;
    ishta_daiva?: string;
    city?: string;
    state?: string;
    language?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  email: null,
  profile: null,
  isAdmin: false,
  hostTypes: [],
  isHost: false,
  loading: true,
  refresh: async () => {},
  updateProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hostTypes, setHostTypes] = useState<HostType[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string | undefined) => {
    if (!userId || !isSupabaseConfigured) return setIsAdmin(false);
    const { data } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const checkHost = async (userId: string | undefined) => {
    if (!userId || !isSupabaseConfigured) return setHostTypes([]);
    const { data } = await supabase
      .from('host_accounts')
      .select('host_types')
      .eq('user_id', userId)
      .maybeSingle();
    setHostTypes(((data as { host_types: HostType[] } | null)?.host_types) ?? []);
  };

  const fetchProfile = async (userId: string | undefined) => {
    if (!userId || !isSupabaseConfigured) return setProfile(null);
    const { data } = await supabase
      .from('profiles')
      .select('id,name,phone,ishta_daiva,language,city,state')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
    // Apply the user's saved language to the app.
    const lang = (data as Profile)?.language;
    if (lang === 'en' || lang === 'hi' || lang === 'te') setLocale(lang);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await fetchProfile(data.session?.user.id);
      await checkAdmin(data.session?.user.id);
      await checkHost(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void fetchProfile(s?.user.id);
      void checkAdmin(s?.user.id);
      void checkHost(s?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      email: session?.user.email ?? null,
      profile,
      isAdmin,
      hostTypes,
      isHost: hostTypes.length > 0,
      loading,
      refresh: () => fetchProfile(session?.user.id),
      updateProfile: async (patch) => {
        const uid = session?.user.id;
        if (!uid || !isSupabaseConfigured) return;
        const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
        if (error) throw error;
        await fetchProfile(uid);
      },
      signOut: async () => {
        if (isSupabaseConfigured) await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
        setHostTypes([]);
      },
    }),
    [session, profile, isAdmin, hostTypes, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
