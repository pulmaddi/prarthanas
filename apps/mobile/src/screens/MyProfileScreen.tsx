import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { useLocale, LANGUAGES, type Lang } from '../lib/locale';

export default function MyProfileScreen() {
  const { profile, email, updateProfile } = useAuth();
  const { lang, changeLang } = useLocale();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const onSave = async () => {
    setErr('');
    setMsg('');
    if (name.trim().length < 2) return setErr('Please enter your name.');
    if (phone && !/^\+?[0-9 ]{7,15}$/.test(phone)) {
      return setErr('Please enter a valid phone number.');
    }
    try {
      setBusy(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      setMsg('Profile updated ✓');
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.hint}>{t('myProfile.subtitle')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('myProfile.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('myProfile.name')}
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('myProfile.email')}</Text>
        <View style={[styles.input, styles.readonly]}>
          <Text style={styles.readonlyText}>{email || '—'}</Text>
        </View>
        <Text style={styles.note}>{t('myProfile.emailNote')}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('myProfile.phone')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98xxx xxxxx"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('myProfile.city')}</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder={t('myProfile.city')}
          placeholderTextColor={colors.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('myProfile.language')}</Text>
        <View style={styles.chips}>
          {LANGUAGES.map((l) => {
            const active = (profile?.language ?? lang) === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.chip, active && styles.chipOn]}
                onPress={async () => {
                  changeLang(l.code as Lang);
                  try {
                    await updateProfile({ language: l.code });
                    setMsg('Language updated ✓');
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {!!err && <Text style={styles.err}>{err}</Text>}
      {!!msg && <Text style={styles.ok}>{msg}</Text>}

      <Button label={busy ? '…' : t('myProfile.save')} onPress={onSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 40 },
  hint: { fontSize: 13, color: colors.muted, marginBottom: 8 },
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
  readonly: { backgroundColor: '#F4ECDF', justifyContent: 'center' },
  readonlyText: { fontSize: 15, color: colors.muted },
  chips: { flexDirection: 'row', gap: 8 },
  deities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
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
  note: { fontSize: 11, color: colors.muted, marginTop: 4 },
  err: { color: colors.live, fontSize: 13, marginTop: 14 },
  ok: { color: colors.green, fontSize: 13, marginTop: 14, fontWeight: '600' },
});
