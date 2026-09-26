import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../theme';
import { Button } from '../components/ui';
import GoogleButton from '../components/GoogleButton';
import { useBreakpoint } from '../lib/useBreakpoint';
import { t } from '../i18n';
import { signIn, isSupabaseConfigured } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { isDesktop } = useBreakpoint();

  const onSignIn = async () => {
    if (!EMAIL_RE.test(email)) return setError('Please enter a valid email address.');
    if (password.length < 6) return setError('Please enter your password.');
    setError('');

    if (!isSupabaseConfigured) {
      return navigation.replace('Main');
    }
    try {
      setBusy(true);
      await signIn(email.trim(), password);
      navigation.replace('Main');
    } catch (e: any) {
      setError(e?.message ?? 'Could not sign in. Check your email and password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, isDesktop && styles.cardDesktop]}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/logo-web.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.h1}>{t('login.title')}</Text>
        <Text style={styles.sub}>{t('login.subtitle')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('login.email')}</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('login.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button label={busy ? '…' : t('login.signIn')} onPress={onSignIn} />
        <GoogleButton onError={setError} />
        <TouchableOpacity onPress={() => navigation.replace('Register')}>
          <Text style={styles.alt}>{t('login.noAccount')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.xl, paddingBottom: 40 },
  containerDesktop: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  card: { width: '100%' },
  cardDesktop: {
    maxWidth: 460,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 36,
    ...shadow.card,
  },
  logoWrap: {
    alignSelf: 'center',
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...shadow.card,
  },
  logo: { width: 200, height: 130 },
  h1: { fontSize: 22, fontWeight: '700', color: colors.maroon, marginTop: 18 },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 8 },
  field: { marginTop: 14 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
  },
  error: { color: colors.live, fontSize: 13, marginTop: 14 },
  alt: {
    textAlign: 'center',
    color: colors.maroon,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 18,
  },
});
