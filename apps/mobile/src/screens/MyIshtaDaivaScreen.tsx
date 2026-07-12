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
import { useDeities } from '../lib/deities';

/**
 * "My Ishta Daiva" — pick the deity you worship. Moved out of My Profile into
 * its own screen (reached from the user-icon menu).
 */
export default function MyIshtaDaivaScreen() {
  const { profile, updateProfile } = useAuth();
  const { deities } = useDeities();
  const [ishta, setIshta] = useState(profile?.ishta_daiva ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const onSave = async () => {
    setErr('');
    setMsg('');
    try {
      setBusy(true);
      await updateProfile({ ishta_daiva: ishta.trim() });
      setMsg('Ishta Daiva updated ✓');
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
      <Text style={styles.hint}>{t('profile.myIshtaDaivaHint')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('myProfile.ishtaDaiva')}</Text>
        <TextInput
          style={styles.input}
          value={ishta}
          onChangeText={setIshta}
          placeholder={t('myProfile.ishtaDaivaPlaceholder')}
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
        />
        <View style={styles.deities}>
          {deities.map((d) => {
            const active = ishta === d.display_name;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.chip, active && styles.chipOn]}
                onPress={() => setIshta(d.display_name)}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]}>
                  🙏 {d.display_name}
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
  err: { color: colors.live, fontSize: 13, marginTop: 14 },
  ok: { color: colors.green, fontSize: 13, marginTop: 14, fontWeight: '600' },
});
