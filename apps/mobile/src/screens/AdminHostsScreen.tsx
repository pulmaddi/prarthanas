import React, { useEffect, useState } from 'react';
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
import { supabase, adminCreateHostUser } from '../lib/supabase';

const TYPES: { key: string; label: string }[] = [
  { key: 'priest', label: 'Priest' },
  { key: 'guru', label: 'Spiritual Guru' },
  { key: 'temple_exec', label: 'Temple Executive' },
  { key: 'numerologist', label: 'Numerologist' },
  { key: 'astrologer', label: 'Astrologer' },
];
const TYPE_LABEL: Record<string, string> = {
  priest: 'Priest',
  guru: 'Spiritual Guru',
  temple_exec: 'Temple Executive',
  numerologist: 'Numerologist',
  astrologer: 'Astrologer',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type HostRow = {
  user_id: string;
  host_types: string[];
  name: string | null;
  org_name: string | null;
  city: string | null;
};

export default function AdminHostsScreen() {
  const { isAdmin } = useAuth();
  const [types, setTypes] = useState<string[]>(['priest']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleType = (k: string) =>
    setTypes((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string | null } | null>(null);
  const [rows, setRows] = useState<HostRow[]>([]);

  const loadRows = async () => {
    const { data } = await supabase
      .from('host_accounts')
      .select('user_id,host_types,name,org_name,city')
      .order('created_at', { ascending: false });
    if (data) setRows(data as HostRow[]);
  };
  useEffect(() => {
    loadRows();
  }, []);

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
    if (types.length === 0) return setErr('Select at least one role.');
    if (!EMAIL_RE.test(email)) return setErr('Please enter a valid email (username).');
    const emailLc = email.trim().toLowerCase();
    try {
      setBusy(true);
      // Everyone is a Devotee by default. Add the host role to the existing
      // account if the email is already registered; otherwise create one.
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

      // Grant/refresh the host role (admin-gated by RLS). Upsert so re-assigning is safe.
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
      loadRows();
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
      <Text style={styles.h2}>{t('hosts.onboardTitle')}</Text>
      <Text style={styles.hint}>{t('hosts.hint')}</Text>

      <Text style={styles.label}>{t('hosts.type')}</Text>
      <View style={styles.typeChips}>
        {TYPES.map((ty) => {
          const on = types.includes(ty.key);
          return (
            <TouchableOpacity
              key={ty.key}
              style={[styles.typeChip, on && styles.typeChipOn]}
              onPress={() => toggleType(ty.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeChipText, on && styles.typeChipTextOn]}>
                {on ? '✓ ' : ''}
                {ty.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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

      <Button label={busy ? '…' : t('hosts.create')} onPress={onCreate} />

      <Text style={[styles.h2, { marginTop: 26 }]}>{t('hosts.existing')}</Text>
      {rows.length === 0 && <Text style={styles.hint}>{t('hosts.none')}</Text>}
      {rows.map((r) => (
        <View key={r.user_id} style={styles.rowCard}>
          <Text style={styles.rowName}>{r.name || '—'}</Text>
          <Text style={styles.rowMeta}>
            {(r.host_types ?? []).map((x) => TYPE_LABEL[x] ?? x).join(' · ')}
            {r.org_name ? ` · ${r.org_name}` : ''}
            {r.city ? ` · ${r.city}` : ''}
          </Text>
        </View>
      ))}
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
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  typeChip: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.white,
  },
  typeChipOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  typeChipText: { color: colors.ink, fontSize: 13 },
  typeChipTextOn: { color: colors.white, fontWeight: '700' },
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
  rowCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
