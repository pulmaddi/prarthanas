import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const isWeb = Platform.OS === 'web';

// Public (anon) credentials — safe to ship in the client. Row-Level Security
// in Supabase is what actually protects the data. Set these via env:
//   apps/mobile/.env  ->  EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — ' +
      'auth & data calls will fail. See supabase/README.md.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web we must parse the OAuth tokens from the redirect URL (Google login).
    detectSessionInUrl: isWeb,
  },
});

/**
 * Google OAuth sign-in. Fully supported on web (redirects the page to Google
 * and back). On native it needs an in-app browser flow (follow-up).
 */
export async function signInWithGoogle() {
  const redirectTo =
    isWeb && typeof window !== 'undefined' ? window.location.origin : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

/**
 * Admin-only: create an auth user for a host (Priest/Guru/Temple Exec) without
 * disturbing the admin's own session. Uses a throwaway client (no persisted
 * session, no privileged key). Returns the new user's id. The caller then
 * records the host role in `host_accounts` (admin-gated by RLS).
 */
export async function adminCreateHostUser(params: {
  email: string;
  password: string;
  name: string;
}): Promise<string> {
  const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await tmp.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { name: params.name } },
  });
  if (error) throw error;
  const id = data.user?.id;
  if (!id) throw new Error('Could not create the account.');
  return id;
}

/** Sign up with email/password; name & language go into user metadata + profile. */
export async function signUpWithProfile(params: {
  email: string;
  password: string;
  name: string;
  language: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { name: params.name, language: params.language } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
