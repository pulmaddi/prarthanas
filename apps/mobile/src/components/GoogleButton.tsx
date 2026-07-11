import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
import { signInWithGoogle, isSupabaseConfigured } from '../lib/supabase';
import { t } from '../i18n';

/**
 * "Continue with Google" button. Works on web (page redirect) and native
 * (system browser → deep-link callback; see signInWithGoogle + App.tsx).
 */
export default function GoogleButton({
  onError,
  disabled,
}: {
  onError?: (m: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (disabled) return;
    if (!isSupabaseConfigured) {
      onError?.(
        "Google sign-in isn't configured yet — add the Supabase key and enable the Google provider.",
      );
      return;
    }
    try {
      setBusy(true);
      await signInWithGoogle(); // web: redirects; native: opens the browser
      setBusy(false);
    } catch (e: any) {
      setBusy(false);
      onError?.(e?.message ?? 'Google sign-in failed.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, (disabled || busy) && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || busy}
    >
      <Text style={styles.g}>G</Text>
      <Text style={styles.label}>{busy ? '…' : t('auth.google')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: 10,
  },
  disabled: { opacity: 0.45 },
  g: { color: '#4285F4', fontSize: 18, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
});
