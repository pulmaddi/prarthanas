import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase, adminCreateHostUser } from '../lib/supabase';

const TYPE_LABEL: Record<string, string> = {
  priest: 'Priest',
  guru: 'Spiritual Guru',
  temple_exec: 'Temple Executive',
  numerologist: 'Numerologist',
  astrologer: 'Astrologer',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ONBOARD_TITLE: Record<string, string> = {
  priest: 'Onboard Priest',
  guru: 'Onboard Spiritual Guru',
  temple_exec: 'Onboard Temple',
  astrologer: 'Onboard Astrologer',
  numerologist: 'Onboard Numerologist',
};

export default function AdminHostsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AdminHosts'>>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const filterType = (route.params as any)?.filterType as string | undefined;
  const { isAdmin } = useAuth();
  const [types] = useState<string[]>(filterType ? [filterType] : ['priest']);

  // Set header title to match the role being onboarded
  useEffect(() => {
    const title = filterType ? (ONBOARD_TITLE[filterType] ?? `Onboard ${filterType}`) : 'Onboard Host';
    nav.setOptions({ title });
  }, [filterType]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string | null } | null>(null);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setCity('');
  };

  const onCreate = async () => {
    setErr('');
    setCreated(null);
    if (name.trim().length < 2) return setErr('Please enter the full name.');
    if (!EMAIL_RE.test(email)) return setErr('Please enter a valid email (username).');
    const emailLc = email.trim().toLowerCase();
    try {
      setBusy(true);
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailLc)
        .maybeSingle();

      let userId = (existing?.id as string | undefined) ?? undefined;
      let isNew = false;
      if (!userId) {
        if (password.length < 6) {
          setBusy(false);
          return setErr('New account: set a password (min 6 characters).');
        }
        userId = await adminCreateHostUser({ email: emailLc, password, name: name.trim() });
        isNew = true;
      }

      const { error } = await supabase.from('host_accounts').upsert({
        user_id: userId,
        host_types: types,
        name: name.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        org_name: null,
      });
      if (error) throw error;
      setCreated({ email: emailLc, password: isNew ? password : null });
      reset();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not onboard this account.');
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deny}>🔒 {t('admin.notAdmin')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h2}>
        {filterType ? (ONBOARD_TITLE[filterType] ?? `Onboard ${filterType}`) : t('hosts.onboardTitle')}
      </Text>
      <Text style={styles.hint}>{t('hosts.hint')}</Text>

      <Text style={styles.label}>{t('hosts.type')}</Text>
      <View style={styles.roleReadOnly}>
        <Text style={styles.roleReadOnlyText}>
          ✓ {TYPE_LABEL[types[0]] ?? types[0]}
        </Text>
      </View>

      {[
        { label: t('hosts.name'), v: name, set: setName, ph: 'Full name', cap: 'words' as const },
        { label: t('hosts.email'), v: email, set: setEmail, ph: 'login@example.com', cap: 'none' as const, kb: 'email-address' as const },
        { label: t('hosts.password'), v: password, set: setPassword, ph: 'Set a password', secure: true },
        { label: t('hosts.phone'), v: phone, set: setPhone, ph: '+91 …', kb: 'phone-pad' as const },
        { label: t('hosts.city'), v: city, set: setCity, ph: 'City' },
      ].map((f) => (
        <View key={f.label} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={f.v}
            onChangeText={f.set}
            placeholder={f.ph}
            placeholderTextColor={colors.muted}
            secureTextEntry={f.secure}
            keyboardType={f.kb}
            autoCapitalize={f.cap ?? 'sentences'}
          />
        </View>
      ))}

      {!!err && <Text style={styles.err}>{err}</Text>}

      {created && (
        <View style={styles.created}>
          <Text style={styles.createdTitle}>✓ {t('hosts.createdTitle')}</Text>
          <Text style={styles.createdText}>
            {created.password ? t('hosts.share') : t('hosts.roleAdded')}
          </Text>
          <Text style={styles.cred}>👤 {created.email}</Text>
          {!!created.password && <Text style={styles.cred}>🔑 {created.password}</Text>}
        </View>
      )}

      <View style={styles.btnRow}>
        <View style={{ flex: 1 }}>
          <Button label={busy ? '…' : t('hosts.create')} onPress={onCreate} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('admin.cancel')} variant="outline" onPress={() => nav.goBack()} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  deny: { color: colors.muted, fontSize: 15 },
  h2: { fontSize: 16, fontWeight: '700', color: colors.maroon },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 12, marginBottom: 5 },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
  },
  field: {},
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleReadOnly: {
    alignSelf: 'flex-start',
    backgroundColor: colors.maroon,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 2,
    marginBottom: 4,
  },
  roleReadOnlyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectText: { fontSize: 15, color: colors.ink },
  selectChevron: { fontSize: 16, color: colors.muted },
  ddBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  ddSheet: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  ddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ddOptionText: { fontSize: 15, color: colors.ink },
  ddOptionOn: { color: colors.maroon, fontWeight: '700' },
  ddCheck: { color: colors.maroon, fontWeight: '800', fontSize: 16 },
  err: { color: colors.live, fontSize: 13, marginTop: 12 },
  created: {
    backgroundColor: '#EAF7EE',
    borderColor: colors.green,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 14,
  },
  createdTitle: { color: colors.green, fontWeight: '800', marginBottom: 4 },
  createdText: { color: colors.ink, fontSize: 13, marginBottom: 6 },
  cred: { fontSize: 14, color: colors.ink, fontWeight: '600' },
});
