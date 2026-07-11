import 'react-native-url-polyfill/auto';
import { Platform, Linking } from 'react-native';
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

// Deep link the OAuth callback back into the native app. Must match the
// `scheme` in app.json and be allow-listed in Supabase → Auth → URL config.
export const NATIVE_AUTH_REDIRECT = 'ishta://auth-callback';

/**
 * Google OAuth sign-in.
 * - Web: redirects the page to Google and back (tokens parsed from the URL).
 * - Native: opens the system browser; Google → Supabase → deep-links back to
 *   NATIVE_AUTH_REDIRECT with the session, completed by setSessionFromUrl()
 *   (wired to a Linking listener in App.tsx).
 */
export async function signInWithGoogle() {
  const redirectTo =
    isWeb && typeof window !== 'undefined'
      ? window.location.origin
      : NATIVE_AUTH_REDIRECT;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: !isWeb },
  });
  if (error) throw error;
  if (!isWeb) {
    if (!data?.url) throw new Error('Could not start Google sign-in.');
    await Linking.openURL(data.url); // hand off to the browser for consent
  }
  return data;
}

/**
 * Complete a native OAuth sign-in from the deep-link callback URL. Handles both
 * the implicit flow (tokens in the URL fragment) and PKCE (an auth code in the
 * query). Returns the new session, or null if the URL carried no auth payload.
 */
export async function setSessionFromUrl(url: string) {
  const [beforeHash, afterHash] = url.split('#');
  const queryStr = beforeHash.includes('?')
    ? beforeHash.slice(beforeHash.indexOf('?') + 1)
    : '';
  const params = new URLSearchParams(queryStr);
  if (afterHash) {
    new URLSearchParams(afterHash).forEach((v, k) => params.set(k, v));
  }

  const errorDescription = params.get('error_description');
  if (errorDescription) throw new Error(errorDescription);

  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  const code = params.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  return null;
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
