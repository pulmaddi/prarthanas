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
import { t, setLocale } from '../i18n';
import { signUpWithProfile, isSupabaseConfigured } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
const LANGS: { code: 'en' | 'hi' | 'te'; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (!EMAIL_RE.test(email)) return setError('Please enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setError('');

    if (!isSupabaseConfigured) {
      // No DB configured yet — let the demo proceed without saving.
      return navigation.replace('Main');
    }
    try {
      setBusy(true);
      await signUpWithProfile({
        email: email.trim(),
        password,
        name: name.trim(),
        language: lang,
      });
      navigation.replace('Main');
    } catch (e: any) {
      setError(e?.message ?? 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoWrap}>
        <Image
          source={require('../../assets/logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.h1}>{t('register.title')}</Text>
      <Text style={styles.sub}>{t('register.subtitle')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('register.fullName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('register.fullName')}
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('register.email')}</Text>
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
        <Text style={styles.label}>{t('register.password')}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('register.confirmPassword')}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('register.language')}</Text>
        <View style={styles.chips}>
          {LANGS.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.chip, lang === l.code && styles.chipOn]}
              onPress={() => {
                setLang(l.code);
                setLocale(l.code);
              }}
            >
              <Text style={[styles.chipText, lang === l.code && styles.chipTextOn]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button
        label={busy ? '…' : t('register.createAccount')}
        onPress={onCreate}
      />
      <Button
        label={t('register.haveAccount')}
        variant="outline"
        onPress={() => navigation.navigate('Login')}
      />
      <GoogleButton onError={setError} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.xl, paddingBottom: 40 },
  logoWrap: {
    alignSelf: 'center',
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  logo: { width: 140, height: 120 },
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
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { color: colors.ink, fontSize: 13 },
  chipTextOn: { color: colors.white },
  error: { color: colors.live, fontSize: 13, marginTop: 14 },
});
